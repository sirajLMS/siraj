import { isSearchWithinLimit, readValidatedParam } from "@/app/api/__shared__/export/export-params.helpers";
import {
  buildCsvResponseHeaders as buildCsvExportResponseHeaders,
  buildDatedCsvFilename,
} from "@/app/api/__shared__/export/export-response.helpers";
import { isUuidShape, ValidationError } from "@/backend/lib";
import type { CarryoverFilters, CarryoverPaidStatusFilter, CarryoverRow } from "@/backend/types";
import { CARRYOVER_PAID_STATUS_VALUES } from "@/shared/constants/billing/carryover.enum";
import { type CsvColumn, serializeCsvRowset } from "@/shared/lib/csv";
import { isCalendarDate } from "@/shared/lib/datetime/calendar-date";
import { readTrimmedParam } from "@/shared/lib/query-params.helpers";
import type { ErrorsLabels } from "@/shared/locale";

const PAID_STATUS_VALUES: ReadonlySet<string> = new Set<string>(CARRYOVER_PAID_STATUS_VALUES);

/** One CSV column per carryover row field, in the row-contract declaration order. */
const CSV_COLUMNS: readonly CsvColumn<CarryoverRow>[] = [
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
export function parseExportFilters(searchParams: URLSearchParams, tErrors: ErrorsLabels): CarryoverFilters {
  return {
    teacherId: readValidatedParam(searchParams, "teacherId", isUuidShape, tErrors),
    paidStatus: parsePaidStatus(searchParams, tErrors),
    dateFrom: readValidatedParam(searchParams, "dateFrom", isCalendarDate, tErrors),
    dateTo: readValidatedParam(searchParams, "dateTo", isCalendarDate, tErrors),
    includeDisabledTeachers: parseIncludeDisabledTeachers(searchParams, tErrors),
    search: readValidatedParam(searchParams, "search", isSearchWithinLimit, tErrors),
  };
}

/** Serializes carryover rows to UTF-8 CSV (header line, one line per row, CRLF separators). */
export function serializeCarryoverCsv(rows: readonly CarryoverRow[]): string {
  return serializeCsvRowset(CSV_COLUMNS, rows);
}

export function buildCsvResponseHeaders(totalCount: number): Headers {
  return buildCsvExportResponseHeaders(buildDatedCsvFilename("carryover-balances"), totalCount);
}
