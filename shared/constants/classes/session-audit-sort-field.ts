/**
 * Runtime enum for the session audit report's sortable columns. Defined in
 * the shared layer so the backend enum barrel, the Pothos schema
 * registration, and the derived sort-field union in backend/types share one
 * source of truth.
 */
export enum SessionAuditReportSortFieldEnum {
  scheduledStartAt = "scheduledStartAt",
  scheduledEndAt = "scheduledEndAt",
  actualStartAt = "actualStartAt",
  actualEndAt = "actualEndAt",
  durationMinutes = "durationMinutes",
  calculatedDuration = "calculatedDuration",
  teacherPaidAmount = "teacherPaidAmount",
  calculationStatus = "calculationStatus",
  teacherName = "teacherName",
  studentName = "studentName",
}
