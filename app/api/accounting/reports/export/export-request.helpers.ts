import {
  isSearchWithinLimit,
  parseEnumListParam,
  readValidatedParam,
} from "@/app/api/__shared__/export/export-params.helpers";
import { buildCsvResponseHeaders as buildCsvExportResponseHeaders } from "@/app/api/__shared__/export/export-response.helpers";
import { AppPermission } from "@/backend/enum";
import { isUuidShape, ValidationError } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";
import type {
  SessionAuditReportFilters,
  SessionAuditReportSort,
  SessionAuditReportSortField,
  SessionAuditStatus,
} from "@/backend/types";
import { STATUS_TO_PREDICATE_KEY } from "@/shared/constants/classes/session-audit-status";
import { isCalendarDate } from "@/shared/lib/datetime/calendar-date";
import { readTrimmedParam } from "@/shared/lib/query-params.helpers";
import type { ErrorsLabels } from "@/shared/locale";

/** The session audit export file is not date-stamped. */
const SESSION_AUDIT_CSV_FILENAME = "session-audit-report.csv";

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

function isSessionAuditStatus(value: string): value is SessionAuditStatus {
  return SESSION_AUDIT_STATUS_VALUES.has(value);
}

function isSortField(value: string): value is SessionAuditReportSortField {
  return SORTABLE_FIELDS.has(value);
}

/** Accepts both repeatable params (`?currentStatuses=A&currentStatuses=B`) and comma-separated values (`?currentStatuses=A,B`). */
function parseCurrentStatuses(searchParams: URLSearchParams, tErrors: ErrorsLabels): SessionAuditStatus[] | null {
  return parseEnumListParam(searchParams, "currentStatuses", isSessionAuditStatus, tErrors);
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

export function buildCsvResponseHeaders(totalCount: number): Headers {
  return buildCsvExportResponseHeaders(SESSION_AUDIT_CSV_FILENAME, totalCount);
}

/** Maps the export query string onto the session audit filter contract; malformed values reject with 400. */
export async function parseExportRequest(
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
