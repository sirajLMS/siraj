export type { CurrencyCode } from "@/backend/enum";

/**
 * @warning SelectType exports include all database columns — some contain sensitive data
 * (hashed tokens, banking details, internal keys, etc.). Always use ReturnType variants
 * for API responses and client-facing code to ensure sensitive fields are omitted.
 */
// ⚠️ WARNING: This barrel file re-exports all backend types, including sensitive types
// (e.g., insert types with password fields, encryption key types). Only import what you
// need via deep imports (e.g., `import type { ... } from "@/backend/types/auth/auth.types"`)
// rather than importing from this index file in frontend or public-facing code.

export type {
  ActorType,
  AuditAction,
  AuditEntityType,
  AuditLogFilterInput,
  AuditLogQueryResult,
  AuditLogReturnType as AuditLogEntity,
  AuditLogSubmitInput,
  CreateAdminAuditLogInput,
  CreateAuditLogInput,
} from "@/backend/types/audit/audit.types";
export * from "@/backend/types/audit/audit.types";
export * from "@/backend/types/audit/soft-delete.types";
// Auth types (includes session, permission, and user-related types)
export type {
  AdminAuditLogSelectType,
  AuthRateLimitSelectType as AuthRateLimitEntityInput,
  CurrentUserProfile,
  DemoLoginInput,
  LoginInput,
  LoginResponse,
  PermissionGroupSelectType as PermissionGroupEntity,
  RefreshTokenResponse,
  SessionConfigSelectType as SessionConfigEntity,
  SessionMetadataSelectType as SessionMetadataEntity,
  SessionSelectType as SessionEntity,
  SessionSubmitInput as SessionEntityInput,
} from "@/backend/types/auth/auth.types";
export type {
  EndImpersonationReturnType,
  ImpersonationAuditAction,
  ImpersonationSessionReturnType,
  ImpersonationStatusReturnType,
  RedisImpersonationData,
  StartImpersonationInput,
  StartImpersonationReturnType,
} from "@/backend/types/auth/impersonation.types";
// Impersonation types
export * from "@/backend/types/auth/impersonation.types";
export type {
  AdminBillingSummaryResult,
  CreateManualInvoiceInput,
  CurrencyExchangeRateInsertType,
  DeleteInvoiceReturnType,
  InvoiceHistoryPaginatedResult,
  InvoiceHistoryRow,
  InvoiceInsertType,
  InvoiceSelectType,
  ManualInvoiceResult,
  MarkInvoicePaidReturnType,
  NextUnpaidInvoiceSummary,
  ParentBillingSummaryResult,
  PaymentInsertType,
  PaymentSelectType,
  SendPaymentReminderResult,
  StudentCreditRow,
  UnpaidInvoiceSummaryItem,
  UnpaidInvoicesSummaryResult,
} from "@/backend/types/billing/billing.types";
// Billing types
export * from "@/backend/types/billing/billing.types";
export * from "@/backend/types/billing/credit.types";
export * from "@/backend/types/billing/payment-method.types";
// Book types
export * from "@/backend/types/books/book.types";
// Report types
export * from "@/backend/types/books/report.types";
// Class-instance-detail types (already exported, but remove duplicate ClassInstancePerformanceReturnType)
export * from "@/backend/types/classes/class-category.types";
export * from "@/backend/types/classes/class-instance-detail.types";
// Class Instance Performance types
export type {
  ClassInstancePerformanceInsertType,
  ClassInstancePerformanceSelectType as ClassInstancePerformanceEntity,
} from "@/backend/types/classes/class-instance-performance.types";
export * from "@/backend/types/classes/class-subject.types";
export type {
  ClassCommunicationInsertType,
  ClassCommunicationSelectType,
  GroupClassAdminNoteReturnType as AdminNoteReturnType,
  GroupClassAuditReturnType,
  GroupClassCommunicationLogEntryReturnType as CommunicationLogEntryReturnType,
  GroupClassEnrollmentInsertType,
  GroupClassEnrollmentSelectType,
  GroupClassInsertType,
  GroupClassOnlineMeetingInfoReturnType as OnlineMeetingInfoReturnType,
  GroupClassSelectType,
  GroupClassStudentReturnType,
} from "@/backend/types/classes/group-class.types";
// Group Class types
export * from "@/backend/types/classes/group-class.types";
// Lesson Report types
export * from "@/backend/types/classes/lesson-report.types";
// Complaint types
export * from "@/backend/types/complaints/complaint.types";
export type {
  ComplaintResponseReturnType,
  ComplaintResponseSubmitInput,
} from "@/backend/types/complaints/complaintResponses.types";
export * from "@/backend/types/meeting";
// Communications types
export * from "@/backend/types/notifications/communications.types";
export * from "@/backend/types/notifications/notification-alerts.metadata.types";
export type {
  NotificationAlertReturnType as SystemAlert,
  NotificationAlertsPaginatedReturnType as NotificationAlertsResult,
} from "@/backend/types/notifications/notification-alerts.types";
// Notification Alerts types
export * from "@/backend/types/notifications/notification-alerts.types";
export * from "@/backend/types/notifications/notification-preferences.types";
export * from "@/backend/types/notifications/notificationDeliveries.types";
export * from "@/backend/types/parents/parent.types";
export * from "@/backend/types/parents/parentHandbook.types";
export * from "@/backend/types/parents/suggestions.types";
export type { PermissionReturnType as PermissionEntity } from "@/backend/types/permissions/permission.types";
export * from "@/backend/types/permissions/permission.types";
export * from "@/backend/types/permissions/permission-group.types";
export * from "@/backend/types/permissions/permission-group-simulation.types";
// Permission management types
export type {
  CreateGroupInput,
  GroupUserEntity,
  GroupWithPermissionIds,
  UpdateGroupInput,
  UserOverrideInput,
  UserOverrideReturnType,
} from "@/backend/types/permissions/permission-management.types";
export * from "@/backend/types/permissions/permission-management.types";
export * from "@/backend/types/profile/profile.types";
// Monthly report types (parental report types — distinct from books/report.types)
export * from "@/backend/types/report/report.types";
export type {
  DstCheckedEmptyItemReturnType,
  DstConflictGroupReturnType,
  DstConflictItemReturnType,
  DstMigrationReportReturnType,
  DstUpdatedSessionReturnType,
} from "@/backend/types/scheduling/dst-migration.types";
// DST Migration types
export * from "@/backend/types/scheduling/dst-migration.types";
export * from "@/backend/types/scheduling/schedule.types";
export * from "@/backend/types/scheduling/scheduling.types";
// Shared types (localized-string, pagination, system-settings, manager-onboarding)
export * from "@/backend/types/shared";
export * from "@/backend/types/staff/staff-profile.types";
export * from "@/backend/types/storage/learning-resources.types";
export type { SiteContentSelectType, SiteContentUpsertInput } from "@/backend/types/storage/site-content.types";
export * from "@/backend/types/storage/storage.types";
export * from "@/backend/types/students/student.types";
export * from "@/backend/types/students/student-lifecycle.types";
export * from "@/backend/types/students/student-status.types";
export * from "@/backend/types/students/studentProgress.types";
export * from "@/backend/types/students/studentStatusHistory.types";
export * from "@/backend/types/teachers/teacher.types";
export * from "@/backend/types/teachers/teacher-availability.types";
export * from "@/backend/types/teachers/teacher-due.types";
export * from "@/backend/types/teachers/teacher-notes.types";
export * from "@/backend/types/teachers/teacher-onboarding.types";
// User types
// Re-export UserSelectType and UserReturnType
export type { SafeUser, UserReturnType, UserSelectType } from "@/backend/types/users/user.types";
export * from "@/backend/types/users/userDeviceTokens.types";
export * from "@/backend/types/users/userNotificationPreferences.types";

export * from "./supervisor";
