import {
  isSearchWithinLimit,
  parseEnumListParam,
  readValidatedParam,
} from "@/app/api/__shared__/export/export-params.helpers";
import {
  buildCsvResponseHeaders as buildCsvExportResponseHeaders,
  buildDatedCsvFilename,
} from "@/app/api/__shared__/export/export-response.helpers";
import { CalculationStatus } from "@/backend/enum";
import { isUuidShape } from "@/backend/lib";
import type { PayrollReportFilters, PayrollReportRow } from "@/backend/types";
import { type CsvColumn, serializeCsvRowset } from "@/shared/lib/csv";
import { isCalendarDate } from "@/shared/lib/datetime/calendar-date";
import type { ErrorsLabels } from "@/shared/locale";

/** One CSV column per payroll report row field, in the row-contract declaration order. */
const CSV_COLUMNS: readonly CsvColumn<PayrollReportRow>[] = [
  { header: "instanceId", pick: row => row.instanceId },
  { header: "scheduledStartAt", pick: row => row.scheduledStartAt },
  { header: "scheduledEndAt", pick: row => row.scheduledEndAt },
  { header: "scheduledDurationMinutes", pick: row => String(row.scheduledDurationMinutes) },
  { header: "actualStartAt", pick: row => row.actualStartAt ?? "" },
  { header: "actualEndAt", pick: row => row.actualEndAt ?? "" },
  { header: "calculatedDuration", pick: row => String(row.calculatedDuration ?? "") },
  { header: "teacherPaidAmount", pick: row => row.teacherPaidAmount ?? "" },
  { header: "teacherPaidCurrency", pick: row => row.teacherPaidCurrency ?? "" },
  { header: "calculationStatus", pick: row => row.calculationStatus },
  { header: "isPartialPercentage", pick: row => String(row.isPartialPercentage ?? "") },
  { header: "payrollNote", pick: row => row.payrollNote ?? "" },
  { header: "teacherId", pick: row => row.teacherId },
  { header: "teacherName", pick: row => row.teacherName },
  { header: "studentId", pick: row => row.studentId },
  { header: "studentName", pick: row => row.studentName },
  { header: "subjectId", pick: row => row.subjectId },
  { header: "subjectName", pick: row => row.subjectName },
  { header: "isStudentAbsence", pick: row => String(row.isStudentAbsence) },
  { header: "isTeacherAbsence", pick: row => String(row.isTeacherAbsence) },
];

const CALCULATION_STATUS_VALUES: ReadonlySet<string> = new Set<string>(Object.values(CalculationStatus));

function isCalculationStatus(value: string): value is CalculationStatus {
  return CALCULATION_STATUS_VALUES.has(value);
}

/** Accepts both repeatable params (`?status=A&status=B`) and comma-separated values (`?status=A,B`). */
function parseCalculationStatuses(searchParams: URLSearchParams, tErrors: ErrorsLabels): CalculationStatus[] | null {
  return parseEnumListParam(searchParams, "calculationStatuses", isCalculationStatus, tErrors);
}

/** Maps the export query string onto the payroll report filter contract; malformed values reject with 400. */
export function parsePayrollExportFilters(searchParams: URLSearchParams, tErrors: ErrorsLabels): PayrollReportFilters {
  return {
    teacherId: readValidatedParam(searchParams, "teacherId", isUuidShape, tErrors),
    studentId: readValidatedParam(searchParams, "studentId", isUuidShape, tErrors),
    dateFrom: readValidatedParam(searchParams, "dateFrom", isCalendarDate, tErrors),
    dateTo: readValidatedParam(searchParams, "dateTo", isCalendarDate, tErrors),
    calculationStatuses: parseCalculationStatuses(searchParams, tErrors),
    search: readValidatedParam(searchParams, "search", isSearchWithinLimit, tErrors),
  };
}

export function serializePayrollReportCsv(rows: readonly PayrollReportRow[]): string {
  return serializeCsvRowset(CSV_COLUMNS, rows);
}

export function buildCsvResponseHeaders(totalCount: number): Headers {
  return buildCsvExportResponseHeaders(buildDatedCsvFilename("payroll-report"), totalCount);
}
