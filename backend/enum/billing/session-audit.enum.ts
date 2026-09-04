/**
 * GraphQL-facing enums for the session audit report.
 *
 * The report's domain layer works with string-literal unions (the canonical
 * `SessionAuditStatus` union in `@/shared/constants` and the
 * `SessionAuditReportSortField` union in `backend/types`), but the Pothos enum
 * registration needs a runtime enum object. These enums carry the identical
 * values so the GraphQL wire values match the domain values one to one.
 */

export enum SessionAuditStatusEnum {
  open = "open",
  end = "end",
  Absent = "Absent",
  absent_student = "absent_student",
}

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
