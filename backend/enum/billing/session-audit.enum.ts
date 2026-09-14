/**
 * Backend-facing facade for the session audit report enums.
 *
 * `SessionAuditStatusEnum` is canonical in `shared/constants` (frontend and
 * backend both consume it) and is re-exported here per the cross-layer enum
 * migration rules, so backend consumers keep the `@/backend/enum` facade.
 *
 * `SessionAuditReportSortFieldEnum` is backend-only: the report domain model
 * derives its sort-field union from this runtime enum, and the Pothos enum
 * registration consumes it once from `backend/graphql/pothos/shared`.
 */

export { SessionAuditStatusEnum } from "@/shared/constants/classes/session-audit-status";

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
