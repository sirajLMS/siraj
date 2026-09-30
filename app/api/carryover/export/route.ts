import { type NextRequest, NextResponse } from "next/server";
import { AppPermission } from "@/backend/enum";
import { ForbiddenError, getServerUserContext, logger, ValidationError } from "@/backend/lib";
import { checkRateLimit, exportRateLimiter } from "@/backend/lib/ratelimit";
import { CarryoverBalanceService, requirePermission } from "@/backend/services";
import type { CarryoverFilters, CarryoverPaidStatusFilter, CarryoverRow } from "@/backend/types";
import { CARRYOVER_PAID_STATUS_VALUES } from "@/shared/constants/billing/carryover.enum";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/** Server-side ceiling on one CSV export; larger filtered sets are truncated. */
const EXPORT_ROW_LIMIT = 10_000;
/** Free-text search bound, shared with the carryover filter input. */
const SEARCH_MAX_LENGTH = 200;
/** Spreadsheet formula starters — cells beginning with one of these are neutralized (OWASP CSV-injection guidance: =, +, -, @, tab, CR). */
const CSV_FORMULA_PREFIXES: readonly string[] = ["=", "+", "-", "@", "\t", "\r"];
const CSV_LINE_SEPARATOR = "\r\n";

const PAID_STATUS_VALUES: ReadonlySet<string> = new Set<string>(CARRYOVER_PAID_STATUS_VALUES);

interface CsvColumn {
  readonly header: string;
  readonly pick: (row: CarryoverRow) => string;
}

/** One CSV column per carryover row field, in the row-contract declaration order. */
const CSV_COLUMNS: readonly CsvColumn[] = [
  { header: "id", pick: row => row.id },
  { header: "teacherId", pick: row => row.teacherId },
  { header: "teacherName", pick: row => row.teacherName },
  { header: "teacherAvatarUrl", pick: row => row.teacherAvatarUrl ?? "" },
  { header: "studentsCount", pick: row => String(row.studentsCount ?? "") },
  { header: "studentsText", pick: row => row.studentsText ?? "" },
  { header: "totalDuration", pick: row => row.totalDuration ?? "" },
  { header: "payable", pick: row => row.payable },
  { header: "teacherCurrency", pick: row => row.teacherCurrency },
  { header: "paid", pick: row => row.paid },
  { header: "fromDate", pick: row => row.fromDate ?? "" },
  { header: "toDate", pick: row => row.toDate ?? "" },
  { header: "paymentDate", pick: row => row.paymentDate ?? "" },
  { header: "isDisabledTeacher", pick: row => String(row.isDisabledTeacher) },
  { header: "isPaid", pick: row => String(row.isPaid) },
  { header: "expenseId", pick: row => row.expenseId ?? "" },
  { header: "note", pick: row => row.note ?? "" },
  { header: "createdAt", pick: row => row.createdAt },
  { header: "paidAt", pick: row => row.paidAt ?? "" },
];

/** Reads a single query param, trimmed; absent or blank values mean "no filter". */
function readTrimmedParam(searchParams: URLSearchParams, name: string): string | null {
  const value = searchParams.get(name)?.trim() ?? null;
  return value === "" ? null : value;
}

/** Strict `YYYY-MM-DD` check that also rejects impossible calendar days (JS `Date` rolls them over). */
function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const constructed = new Date(Date.UTC(year, month - 1, day));
  return (
    constructed.getUTCFullYear() === year && constructed.getUTCMonth() === month - 1 && constructed.getUTCDate() === day
  );
}

/** Reads one query param and validates it: absent/blank → null, invalid value → localized 400 error. */
function readValidatedParam(
  searchParams: URLSearchParams,
  name: string,
  isValid: (value: string) => boolean,
  tErrors: ErrorsLabels
): string | null {
  const value = readTrimmedParam(searchParams, name);
  if (value === null) {
    return null;
  }
  if (!isValid(value)) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return value;
}

function isPaidStatus(value: string): value is CarryoverPaidStatusFilter {
  return PAID_STATUS_VALUES.has(value);
}

/** Reads the `paidStatus` filter; absent → null (both paid and unpaid), unknown value → localized 400 error. */
function parsePaidStatus(searchParams: URLSearchParams, tErrors: ErrorsLabels): CarryoverPaidStatusFilter | null {
  const value = readTrimmedParam(searchParams, "paidStatus");
  if (value === null) {
    return null;
  }
  if (!isPaidStatus(value)) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return value;
}

function isSearchWithinLimit(value: string): boolean {
  return value.length <= SEARCH_MAX_LENGTH;
}

/** Canonical hyphenated uuid shape; anything else cannot name a row in a uuid column. */
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuidShape(value: string): boolean {
  return UUID_SHAPE.test(value);
}

/** Reads the `includeDisabledTeachers` flag; absent → null (the service default applies), anything but `true` or `false` → 400. */
function parseIncludeDisabledTeachers(searchParams: URLSearchParams, tErrors: ErrorsLabels): boolean | null {
  const value = readTrimmedParam(searchParams, "includeDisabledTeachers");
  if (value === null) {
    return null;
  }
  if (value !== "true" && value !== "false") {
    throw new ValidationError(tErrors.invalidInput);
  }
  return value === "true";
}

/** Maps the export query string onto the carryover filter contract; malformed values reject with 400. */
function parseExportFilters(searchParams: URLSearchParams, tErrors: ErrorsLabels): CarryoverFilters {
  return {
    teacherId: readValidatedParam(searchParams, "teacherId", isUuidShape, tErrors),
    paidStatus: parsePaidStatus(searchParams, tErrors),
    dateFrom: readValidatedParam(searchParams, "dateFrom", isCalendarDate, tErrors),
    dateTo: readValidatedParam(searchParams, "dateTo", isCalendarDate, tErrors),
    includeDisabledTeachers: parseIncludeDisabledTeachers(searchParams, tErrors),
    search: readValidatedParam(searchParams, "search", isSearchWithinLimit, tErrors),
  };
}

/** RFC 4180 escaping plus formula neutralization: cells starting with `=`, `+`, `-`, `@`, a tab or a CR (including after leading whitespace) get a `'` prefix. */
function toCsvCell(value: string): string {
  const trimmed = value.trimStart();
  const startsFormula = trimmed.length > 0 && CSV_FORMULA_PREFIXES.some(prefix => trimmed.startsWith(prefix));
  const hardened = startsFormula ? `'${value}` : value;
  if (hardened.includes(",") || hardened.includes('"') || hardened.includes("\n") || hardened.includes("\r")) {
    return `"${hardened.replaceAll('"', '""')}"`;
  }
  return hardened;
}

/** Serializes carryover rows to UTF-8 CSV (header line, one line per row, CRLF separators). */
function serializeCarryoverCsv(rows: readonly CarryoverRow[]): string {
  const headerLine = CSV_COLUMNS.map(column => toCsvCell(column.header)).join(",");
  const dataLines = rows.map(row => CSV_COLUMNS.map(column => toCsvCell(column.pick(row))).join(","));
  return `${[headerLine, ...dataLines].join(CSV_LINE_SEPARATOR)}${CSV_LINE_SEPARATOR}`;
}

function buildCsvResponseHeaders(totalCount: number): Headers {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set("Content-Disposition", `attachment; filename="carryover-balances-${dateStamp}.csv"`);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  headers.set("X-Export-Truncated", totalCount > EXPORT_ROW_LIMIT ? "true" : "false");
  return headers;
}

/**
 * Carryover balance CSV export (GET /api/carryover/export).
 *
 * Auth: session cookie via `getServerUserContext` + the
 * `ACCOUNTING_CARRYOVER_VIEW` permission, both checked before any carryover
 * data is read. The export reads at most 10 000 rows of the filtered set;
 * when the full set is larger, the response carries `X-Export-Truncated:
 * true` so the UI can warn that the file is incomplete.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const locale = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
  const tErrors = getServerTranslations(locale).errorsTranslations;

  const { userId } = await getServerUserContext();
  if (!userId) {
    return NextResponse.json({ error: tErrors.unauthorized }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(`export:${userId}`, exportRateLimiter);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: tErrors.rateLimitExceeded },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(0, Math.ceil((rateLimit.reset - Date.now()) / 1000)).toString(),
        },
      }
    );
  }

  try {
    await requirePermission(userId, AppPermission.ACCOUNTING_CARRYOVER_VIEW, tErrors);

    const filters = parseExportFilters(request.nextUrl.searchParams, tErrors);
    const report = await CarryoverBalanceService.getReport(
      userId,
      filters,
      { limit: EXPORT_ROW_LIMIT, offset: 0 },
      tErrors
    );

    logger.info("Carryover balance CSV export", {
      actorUserId: userId,
      filters,
      rowCount: report.rows.length,
      truncated: report.totalCount > EXPORT_ROW_LIMIT,
    });

    return new NextResponse(serializeCarryoverCsv(report.rows), {
      status: 200,
      headers: buildCsvResponseHeaders(report.totalCount),
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: tErrors.insufficientPermissions }, { status: 403 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    logger.error("Carryover balance CSV export failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
  }
}
