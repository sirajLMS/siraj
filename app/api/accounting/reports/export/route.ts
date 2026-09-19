import { type NextRequest, NextResponse } from "next/server";
import { AppPermission } from "@/backend/enum";
import { ForbiddenError, getServerUserContext, isUuidShape, logger, ValidationError } from "@/backend/lib";
import { checkRateLimit, exportRateLimiter } from "@/backend/lib/ratelimit";
import {
  PermissionsService,
  requirePermission,
  SessionAuditService,
  serializeSessionAuditCsv,
} from "@/backend/services";
import type {
  SessionAuditReportFilters,
  SessionAuditReportSort,
  SessionAuditReportSortField,
  SessionAuditStatus,
} from "@/backend/types";
import { STATUS_TO_PREDICATE_KEY } from "@/shared/constants/classes/session-audit-status";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/** Server-side ceiling on one CSV export; larger filtered sets are truncated. */
const EXPORT_ROW_LIMIT = 10_000;
/** Free-text search bound, shared with the session audit report filter input. */
const SEARCH_MAX_LENGTH = 200;

const SESSION_AUDIT_STATUS_VALUES: ReadonlySet<string> = new Set<string>(Object.keys(STATUS_TO_PREDICATE_KEY));

const SORTABLE_FIELDS: ReadonlySet<string> = new Set<string>([
  "scheduledStartAt",
  "scheduledEndAt",
  "actualStartAt",
  "actualEndAt",
  "durationMinutes",
  "calculatedDuration",
  "teacherPaidAmount",
  "calculationStatus",
  "teacherName",
  "studentName",
]);

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

function isSearchWithinLimit(value: string): boolean {
  return value.length <= SEARCH_MAX_LENGTH;
}

function isSessionAuditStatus(value: string): value is SessionAuditStatus {
  return SESSION_AUDIT_STATUS_VALUES.has(value);
}

function isSortField(value: string): value is SessionAuditReportSortField {
  return SORTABLE_FIELDS.has(value);
}

/** Accepts both repeatable params (`?currentStatuses=A&currentStatuses=B`) and comma-separated values (`?currentStatuses=A,B`). */
function parseCurrentStatuses(searchParams: URLSearchParams, tErrors: ErrorsLabels): SessionAuditStatus[] | null {
  const rawValues = searchParams
    .getAll("currentStatuses")
    .flatMap(raw => raw.split(","))
    .map(raw => raw.trim())
    .filter(raw => raw !== "");
  if (rawValues.length === 0) {
    return null;
  }
  const statuses: SessionAuditStatus[] = [];
  for (const rawValue of rawValues) {
    if (!isSessionAuditStatus(rawValue)) {
      throw new ValidationError(tErrors.invalidInput);
    }
    statuses.push(rawValue);
  }
  return statuses;
}

function isSortDirection(value: string): value is "asc" | "desc" {
  return value === "asc" || value === "desc";
}

/** Reads the optional `sortField` + `sortDirection` pair; absent pair → null (the service default applies), malformed pair → 400. */
function parseSort(searchParams: URLSearchParams, tErrors: ErrorsLabels): SessionAuditReportSort | null {
  const field = readTrimmedParam(searchParams, "sortField");
  const direction = readTrimmedParam(searchParams, "sortDirection");
  if (field === null && direction === null) {
    return null;
  }
  if (field === null || !isSortField(field) || direction === null || !isSortDirection(direction)) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return { field, direction };
}

/** Reads the `includeDeleted` flag; absent → false (default), anything but `true` or `false` → 400. */
function parseIncludeDeleted(searchParams: URLSearchParams, tErrors: ErrorsLabels): boolean {
  const value = readTrimmedParam(searchParams, "includeDeleted");
  if (value === null) {
    return false;
  }
  if (value !== "true" && value !== "false") {
    throw new ValidationError(tErrors.invalidInput);
  }
  return value === "true";
}

function buildCsvResponseHeaders(totalCount: number): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set("Content-Disposition", 'attachment; filename="session-audit-report.csv"');
  headers.set("X-Export-Truncated", totalCount > EXPORT_ROW_LIMIT ? "true" : "false");
  return headers;
}

/** Maps the export query string onto the session audit filter contract; malformed values reject with 400. */
async function parseExportRequest(
  searchParams: URLSearchParams,
  userId: string,
  tErrors: ErrorsLabels
): Promise<{ filters: SessionAuditReportFilters; sort: SessionAuditReportSort | null }> {
  const requestedIncludeDeleted = parseIncludeDeleted(searchParams, tErrors);
  const includeDeleted =
    requestedIncludeDeleted &&
    (await PermissionsService.hasPermission(userId, AppPermission.ACCOUNTING_REPORTS_MANAGE));

  const filters: SessionAuditReportFilters = {
    teacherId: readValidatedParam(searchParams, "teacherId", isUuidShape, tErrors),
    studentId: readValidatedParam(searchParams, "studentId", isUuidShape, tErrors),
    dateFrom: readValidatedParam(searchParams, "dateFrom", isCalendarDate, tErrors),
    dateTo: readValidatedParam(searchParams, "dateTo", isCalendarDate, tErrors),
    currentStatuses: parseCurrentStatuses(searchParams, tErrors),
    search: readValidatedParam(searchParams, "search", isSearchWithinLimit, tErrors),
    includeDeleted,
  };
  return { filters, sort: parseSort(searchParams, tErrors) };
}

/**
 * Session audit report CSV export (GET /api/accounting/reports/export).
 *
 * Auth: session cookie via `getServerUserContext` + the
 * `ACCOUNTING_REPORTS_VIEW` permission, both checked before any report data
 * is read. The `includeDeleted` filter additionally requires the
 * `ACCOUNTING_REPORTS_MANAGE` permission and is silently cleared for
 * view-only callers. The export reads at most 10 000 rows of the filtered
 * set; when the full set is larger, the response carries
 * `X-Export-Truncated: true` so the UI can warn that the file is incomplete.
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
    await requirePermission(userId, AppPermission.ACCOUNTING_REPORTS_VIEW, tErrors);

    const { filters, sort } = await parseExportRequest(request.nextUrl.searchParams, userId, tErrors);
    const report = await SessionAuditService.getReport(
      userId,
      filters,
      sort,
      { limit: EXPORT_ROW_LIMIT, offset: 0 },
      tErrors
    );

    logger.info("Session audit CSV export", {
      actorUserId: userId,
      filters,
      sort,
      rowCount: report.rows.length,
      truncated: report.totalCount > EXPORT_ROW_LIMIT,
    });

    return new NextResponse(serializeSessionAuditCsv(report.rows), {
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
    logger.error("Session audit CSV export failed", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
  }
}
