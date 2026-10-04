import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PayrollReportRow } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";

/** Search length accepted by both the report query and the CSV export route. */
export const SEARCH_INPUT_MAX_LENGTH = 200;

/** Status chips previewed inside the collapsed multi-select before the overflow chip. */
export const STATUS_CHIP_PREVIEW_LIMIT = 2;

const CALCULATION_STATUS_VALUES: readonly string[] = Object.values(CalculationStatus);

export function isCalculationStatus(value: string): value is CalculationStatus {
  return CALCULATION_STATUS_VALUES.includes(value);
}

export const rowTeacherId = (row: PayrollReportRow): string | null => row.teacherId;
export const rowTeacherName = (row: PayrollReportRow): string | null => row.teacherName;
export const rowStudentId = (row: PayrollReportRow): string | null => row.studentId;
export const rowStudentName = (row: PayrollReportRow): string | null => row.studentName;

/**
 * Display option for a person filter whose id is already applied. The loaded
 * report rows supply the name after a remount or an external filter reset;
 * null when the id matches no row on the current page.
 */
export function findRowPersonOption(
  rows: readonly PayrollReportRow[],
  personId: string,
  idOf: (row: PayrollReportRow) => string | null,
  nameOf: (row: PayrollReportRow) => string | null
): PersonOption | null {
  const match = rows.find(row => idOf(row) === personId);
  return match ? { id: personId, name: nameOf(match) ?? "" } : null;
}
