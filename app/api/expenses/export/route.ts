import { type NextRequest, NextResponse } from "next/server";
import { AppPermission, ExpenseType } from "@/backend/enum";
import { ForbiddenError, getServerUserContext, logger, ValidationError } from "@/backend/lib";
import { checkRateLimit, exportRateLimiter } from "@/backend/lib/ratelimit";
import { ExpenseService, PermissionsService, requirePermission } from "@/backend/services";
import type { ExpenseFilters, ExpenseRow } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/** Server-side ceiling on one CSV export; larger filtered sets are truncated. */
const EXPORT_ROW_LIMIT = 10_000;
/** Free-text title-search bound, shared with the expense filter input. */
const SEARCH_MAX_LENGTH = 200;
/** Spreadsheet formula starters — cells beginning with one of these are neutralized (OWASP CSV-injection guidance: =, +, -, @, tab, CR). */
const CSV_FORMULA_PREFIXES: readonly string[] = ["=", "+", "-", "@", "\t", "\r"];
const CSV_LINE_SEPARATOR = "\r\n";

const EXPENSE_TYPE_VALUES: ReadonlySet<string> = new Set<string>(Object.values(ExpenseType));

interface CsvColumn {
  readonly header: string;
  readonly pick: (row: ExpenseRow) => string;
}

/** One CSV column per expense row field, in the row-contract declaration order. */
const CSV_COLUMNS: readonly CsvColumn[] = [
  { header: "id", pick: row => row.id },
  { header: "teacherId", pick: row => row.teacherId ?? "" },
  { header: "teacherName", pick: row => row.teacherName ?? "" },
  { header: "title", pick: row => row.title },
  { header: "type", pick: row => row.type },
  { header: "expenseValue", pick: row => row.expenseValue },
  { header: "expenseCurrency", pick: row => row.expenseCurrency },
  { header: "paymentDate", pick: row => row.paymentDate },
  { header: "expenseDate", pick: row => row.expenseDate },
  { header: "note", pick: row => row.note ?? "" },
  { header: "sourceEntity", pick: row => row.sourceEntity ?? "" },
  { header: "sourceEntityId", pick: row => row.sourceEntityId ?? "" },
  { header: "createdByUserId", pick: row => row.createdByUserId },
  { header: "createdByName", pick: row => row.createdByName },
  { header: "deletedAt", pick: row => row.deletedAt ?? "" },
  { header: "deletedByUserId", pick: row => row.deletedByUserId ?? "" },
  { header: "deletedReason", pick: row => row.deletedReason ?? "" },
  { header: "createdAt", pick: row => row.createdAt },
  { header: "updatedAt", pick: row => row.updatedAt },
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

/** Strict `YYYY-MM` accounting-month check; month must be 01–12. */
function isAccountingMonth(value: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
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

function isSearchWithinLimit(value: string): boolean {
  return value.length <= SEARCH_MAX_LENGTH;
}

function isExpenseType(value: string): value is ExpenseType {
  return EXPENSE_TYPE_VALUES.has(value);
}

/** Reads the `types` multi-value filter (comma-separated, trimmed); absent → null, unknown value → localized 400 error. */
function parseExpenseTypes(searchParams: URLSearchParams, tErrors: ErrorsLabels): ExpenseType[] | null {
  const value = readTrimmedParam(searchParams, "types");
  if (value === null) {
    return null;
  }
  const parsed: ExpenseType[] = [];
  for (const part of value.split(",")) {
    const candidate = part.trim();
    if (!isExpenseType(candidate)) {
      throw new ValidationError(tErrors.invalidInput);
    }
    parsed.push(candidate);
  }
  return parsed;
}

/** Reads the `includeDeleted` flag; absent → null (the service default excludes deleted), anything but `true` or `false` → 400. */
function parseIncludeDeleted(searchParams: URLSearchParams, tErrors: ErrorsLabels): boolean | null {
  const value = readTrimmedParam(searchParams, "includeDeleted");
  if (value === null) {
    return null;
  }
  if (value !== "true" && value !== "false") {
    throw new ValidationError(tErrors.invalidInput);
  }
  return value === "true";
}

/**
 * `includeDeleted` holds for manage-capable callers only; a view-only caller
 * requesting it gets the flag cleared, mirroring the ledger GraphQL query —
 * soft-deleted rows must never surface through one entry point when the
 * other would strip them.
 */
async function resolveIncludeDeleted(
  searchParams: URLSearchParams,
  userId: string,
  tErrors: ErrorsLabels
): Promise<boolean | null> {
  const requested = parseIncludeDeleted(searchParams, tErrors);
  if (requested !== true) {
    return requested;
  }
  return PermissionsService.hasPermission(userId, AppPermission.ACCOUNTING_EXPENSES_MANAGE);
}

/** Maps the export query string onto the expense filter contract; malformed values reject with 400. */
async function parseExportFilters(
  searchParams: URLSearchParams,
  userId: string,
  tErrors: ErrorsLabels
): Promise<ExpenseFilters> {
  return {
    title: readValidatedParam(searchParams, "title", isSearchWithinLimit, tErrors),
    types: parseExpenseTypes(searchParams, tErrors),
    expenseDate: readValidatedParam(searchParams, "expenseDate", isAccountingMonth, tErrors),
    paymentDateFrom: readValidatedParam(searchParams, "paymentDateFrom", isCalendarDate, tErrors),
    paymentDateTo: readValidatedParam(searchParams, "paymentDateTo", isCalendarDate, tErrors),
    includeDeleted: await resolveIncludeDeleted(searchParams, userId, tErrors),
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

/** Serializes expense rows to UTF-8 CSV (header line, one line per row, CRLF separators). */
function serializeExpenseCsv(rows: readonly ExpenseRow[]): string {
  const headerLine = CSV_COLUMNS.map(column => toCsvCell(column.header)).join(",");
  const dataLines = rows.map(row => CSV_COLUMNS.map(column => toCsvCell(column.pick(row))).join(","));
  return `${[headerLine, ...dataLines].join(CSV_LINE_SEPARATOR)}${CSV_LINE_SEPARATOR}`;
}

function buildCsvResponseHeaders(totalCount: number): Headers {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set("Content-Disposition", `attachment; filename="expenses-${dateStamp}.csv"`);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  headers.set("X-Export-Truncated", totalCount > EXPORT_ROW_LIMIT ? "true" : "false");
  return headers;
}

/**
 * Expense ledger CSV export (GET /api/expenses/export).
 *
 * Auth: session cookie via `getServerUserContext` + the
 * `ACCOUNTING_EXPENSES_VIEW` permission, both checked before any expense
 * data is read. The `includeDeleted` filter additionally requires the
 * `ACCOUNTING_EXPENSES_MANAGE` permission and is silently cleared for
 * view-only callers (same contract as the ledger GraphQL query). The export
 * reads at most 10 000 rows of the filtered set; when the full set is
 * larger, the response carries `X-Export-Truncated:
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
    await requirePermission(userId, AppPermission.ACCOUNTING_EXPENSES_VIEW, tErrors);

    const filters = await parseExportFilters(request.nextUrl.searchParams, userId, tErrors);
    const report = await ExpenseService.getReport(userId, filters, { limit: EXPORT_ROW_LIMIT, offset: 0 }, tErrors);

    logger.info("Expense ledger CSV export", {
      actorUserId: userId,
      filters,
      rowCount: report.rows.length,
      truncated: report.totalCount > EXPORT_ROW_LIMIT,
    });

    return new NextResponse(serializeExpenseCsv(report.rows), {
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
    logger.error("Expense ledger CSV export failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
  }
}
