# Types Review Plan

**Date**: 2026-07-07
**Scope**: backend/types/ only — canonical definitions
**Focus**: All of the above — comprehensive types review
**Files Reviewed**: 34 files

## Summary

Reviewed all 34 type definition files in `backend/types/`. Found multiple violations of the canonical naming conventions, type duplication patterns, missing foundation types, and inconsistencies with the project's AGENTS.md rules. The most significant issues are: missing `{Entity}ReturnType` and `{Entity}SubmitInput` types for several entities, inconsistent naming (e.g., `Entity` suffix vs `SelectType`/`InsertType`), local type definitions that should be centralized, and missing `Omit` of forbidden fields.

## Findings

### CRITICAL (12)
- [ ] [CRITICAL] Naming: audit.types.ts — Missing AuditLogSelectType, AuditLogInsertType, AuditLogReturnType, AuditLogSubmitInput (uses AuditLogEntity, AuditLogEntityInput)
- [ ] [CRITICAL] Naming: auth.types.ts — Missing UserSelectType, UserInsertType, UserReturnType, UserSubmitInput (uses UserEntity, UserEntityInput, SafeUser, UserPothosDefinition)
- [ ] [CRITICAL] Naming: auth.types.ts — Multiple Pothos definition types (UserPothosDefinition, PermissionGroupPothosDefinition, PermissionPothosDefinition, GroupPermissionPothosDefinition, UserPermissionGroupPothosDefinition, SessionPothosDefinition) defined locally instead of centralized
- [ ] [CRITICAL] Naming: billing.types.ts — Missing InvoiceReturnType, InvoiceSubmitInput, PaymentReturnType, PaymentSubmitInput, CurrencyExchangeRateReturnType (commented as "removed — was unused")
- [ ] [CRITICAL] Naming: class-instance-detail.types.ts — No SelectType/InsertType foundation types; all types are ad-hoc return types
- [ ] [CRITICAL] Naming: class-instance-performance.types.ts — Missing ClassInstancePerformanceReturnType, ClassInstancePerformanceSubmitInput
- [ ] [CRITICAL] Naming: communications.types.ts — No foundation types (SelectType/InsertType); all types are ad-hoc
- [ ] [CRITICAL] Naming: complaintResponses.types.ts — Missing ComplaintResponseReturnType, ComplaintResponseSubmitInput
- [ ] [CRITICAL] Naming: group-class.types.ts — No foundation SelectType/InsertType for GroupClassAuditReturnType, GroupClassStudentReturnType, etc.
- [ ] [CRITICAL] Naming: notification-alerts.types.ts — No foundation types; all types are ad-hoc (SystemAlert, NotificationAlertsResult)
- [ ] [CRITICAL] Naming: notificationDeliveries.types.ts — Missing NotificationDeliveryReturnType, NotificationDeliverySubmitInput
- [ ] [CRITICAL] Foundation: schedule.types.ts — No foundation SelectType/InsertType; all types are ad-hoc return types

### WARNING (18)
- [ ] [WARNING] Naming: auth.types.ts — UserCreateInput and UserUpdateInput exist but don't follow {Entity}SubmitInput pattern; CurrentUserProfile duplicates SafeUser fields
- [ ] [WARNING] Naming: billing.types.ts — Uses interface for result types instead of type aliases; UnpaidInvoiceSummaryItem, UnpaidInvoicesSummaryResult, etc. don't follow naming convention
- [ ] [WARNING] Naming: class-subject.types.ts — SubjectResourceReturnType adds displayName, filePath but doesn't follow Omit pattern cleanly
- [ ] [WARNING] Naming: complaint.types.ts — ComplaintReturnType omits parentId, studentId, submitterEmail but these are foreign keys not just forbidden fields; ComplaintSubmitInput uses Omit with many fields
- [ ] [WARNING] Naming: dst-migration.types.ts — DstMigrationReportReturnType and related types don't follow canonical naming
- [ ] [WARNING] Naming: impersonation.types.ts — ImpersonationSessionReturnType is just alias of SelectType (no Omit of forbidden fields)
- [ ] [WARNING] Naming: parent.types.ts — Multiple ad-hoc types (ParentDirectoryRow, ParentDashboardScheduleRow, ParentDashboardMetricsType, etc.) not following canonical pattern; ParentEntity uses dynamic import
- [ ] [WARNING] Naming: permission-group-simulation.types.ts — No foundation types; all ad-hoc return types
- [ ] [WARNING] Naming: permission-management.types.ts — UserOverrideReturnType follows pattern but CreateGroupInput/UpdateGroupInput don't follow SubmitInput naming
- [ ] [WARNING] Naming: profile.types.ts — Multiple ad-hoc types (ProfilePageContext, UnifiedProfileReturnType, etc.) not following canonical pattern
- [ ] [WARNING] Naming: report.types.ts — Re-exports from repo layer; AttendanceReportResult doesn't follow canonical naming
- [ ] [WARNING] Naming: scheduling.types.ts — RescheduleTrackingRow, CreateRecurringClassInput, etc. don't follow canonical naming
- [ ] [WARNING] Naming: soft-delete.types.ts — SoftDeletableEntityMap uses $inferSelect directly but no ReturnType variants
- [ ] [WARNING] Naming: staff-profile.types.ts — ManagerDirectoryRow, ManagerDirectoryMetrics don't follow canonical naming
- [ ] [WARNING] Naming: storage.types.ts — FileInfo, DirectoryInfo, StorageObjectList don't follow canonical naming; many ad-hoc result types
- [ ] [WARNING] Naming: student.types.ts — Student, StudentDirectory types don't follow {Entity}ReturnType naming; StudentCreateInput doesn't follow SubmitInput pattern
- [ ] [WARNING] Naming: student-lifecycle.types.ts — Result types (LeaveProcessingResult, ReassignStudentTeacherResult, ChangeStudentStatusResult) don't follow canonical naming
- [ ] [WARNING] Naming: student-status.types.ts — StudentUpcomingClass, StudentUpcomingClassesResult don't follow canonical naming
- [ ] [WARNING] Naming: studentStatusHistory.types.ts — SessionSummary doesn't follow naming convention

### SUGGESTION (8)
- [ ] [SUGGESTION] Consistency: billing.types.ts:3-4 — Imports from "@/backend/db" (no /schema) and "@/backend/types" for PageInfo — inconsistent import paths
- [ ] [SUGGESTION] Consistency: class-instance-detail.types.ts:1 — Imports enums from "@/shared/lib/enum" but other files use "@/shared/lib/enum"
- [ ] [SUGGESTION] Consistency: parent.types.ts:4-6 — Uses dynamic import `typeof import("@/backend/db/schema").parents.$inferSelect` instead of direct import
- [ ] [SUGGESTION] Consistency: storage.types.ts:1 — Imports from "@/backend/db/schema/storage" (subdirectory) while others use "@/backend/db/schema"
- [ ] [SUGGESTION] Consistency: teacher.types.ts:1 — Imports teacherBankingDetailsHistory, teacherPayments, teachers from schema but not using consistent pattern
- [ ] [SUGGESTION] Naming: auth.types.ts:135-136 — PasswordResetTokenReturnType commented as removed; should either be removed or re-created
- [ ] [SUGGESTION] Naming: billing.types.ts:8-13 — InvoiceReturnType, PaymentReturnType commented as removed; should either be removed or re-created
- [ ] [SUGGESTION] Naming: storage.types.ts:6 — UserDeviceTokenReturnType commented as removed; should either be removed or re-created

## Recommended Actions

1. **Standardize all entity types** to follow `{Entity}SelectType`, `{Entity}InsertType`, `{Entity}ReturnType`, `{Entity}SubmitInput` pattern
2. **Remove all local Pothos definition types** from auth.types.ts and move to proper GraphQL layer
3. **Create missing ReturnType/SubmitInput types** for all entities that only have SelectType/InsertType
4. **Clean up commented-out types** — either remove or re-create properly
5. **Standardize import paths** to use `@/backend/db/schema` consistently
6. **Convert ad-hoc result types** to follow canonical naming or move to appropriate layer

## Layer Compliance Notes

* Violates AGENTS.md: "Creating multiple similar types for the same entity" (auth.types.ts has UserEntity, SafeUser, UserPothosDefinition, CurrentUserProfile)
* Violates AGENTS.md: "Defining local types in GraphQL/Pothos files instead of using centralized types" (auth.types.ts Pothos definitions)
* Violates AGENTS.md: "Creating ad-hoc type definitions like {Entity}Definition in Pothos files" (multiple files)
* Violates AGENTS.md: "Types not following {Entity}SelectType, {Entity}InsertType, {Entity}ReturnType, {Entity}SubmitInput naming" (most files)
* Violates AGENTS.md: "Types in backend/types/ not built on Drizzle $inferSelect / $inferInsert" (class-instance-detail, communications, group-class, notification-alerts, schedule, etc.)

## Fix Status

- Total findings: 38
- Fixed: 0 / 38
- Remaining: 38