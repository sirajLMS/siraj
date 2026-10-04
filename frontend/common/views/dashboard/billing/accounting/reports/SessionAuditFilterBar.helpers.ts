import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import { SessionAuditStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";

/** Search length accepted by both the report query and the CSV export route. */
export const SEARCH_INPUT_MAX_LENGTH = 200;

/** Status chips previewed inside the collapsed multi-select before the overflow chip. */
export const STATUS_CHIP_PREVIEW_LIMIT = 2;

const SESSION_AUDIT_STATUS_VALUES: readonly string[] = Object.values(SessionAuditStatus);

export function isSessionAuditStatus(value: string): value is SessionAuditStatus {
  return SESSION_AUDIT_STATUS_VALUES.includes(value);
}

export const rowTeacherId = (row: SessionAuditReportRow): string | null => row.teacherId;
export const rowTeacherName = (row: SessionAuditReportRow): string | null => row.teacherName;
export const rowStudentId = (row: SessionAuditReportRow): string | null => row.studentId;
export const rowStudentName = (row: SessionAuditReportRow): string | null => row.studentName;

export function findRowPersonOption(
  rows: readonly SessionAuditReportRow[],
  personId: string,
  idOf: (row: SessionAuditReportRow) => string | null,
  nameOf: (row: SessionAuditReportRow) => string | null
): PersonOption | null {
  const match = rows.find(row => idOf(row) === personId);
  return match ? { id: personId, name: nameOf(match) ?? "" } : null;
}

/** True when both range bounds are set and the from date follows the to date. */
export function isDateRangeInverted(dateFrom: string | null, dateTo: string | null): boolean {
  if (dateFrom === null || dateFrom === "" || dateTo === null || dateTo === "") return false;
  return dateFrom > dateTo;
}
