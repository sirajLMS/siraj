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
  CreateAuditLogInput,
} from "./audit/audit.types";
export * from "./audit/audit.types";
export * from "./audit/soft-delete.types";
// Auth types (includes session, permission, and user-related types)
export type {
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
} from "./auth/auth.types";
export type {
  EndImpersonationReturnType,
  ImpersonationAuditAction,
  ImpersonationSessionReturnType,
  ImpersonationStatusReturnType,
  RedisImpersonationData,
  StartImpersonationInput,
  StartImpersonationReturnType,
} from "./auth/impersonation.types";
// Impersonation types
export * from "./auth/impersonation.types";
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
  ParentBillingSummaryResult,
  PaymentInsertType,
  PaymentSelectType,
  SendPaymentReminderResult,
  StudentCreditRow,
  UnpaidInvoiceSummaryItem,
  UnpaidInvoicesSummaryResult,
} from "./billing/billing.types";
// Billing types
export * from "./billing/billing.types";
// Book types
export * from "./books/book.types";
// Report types
export * from "./books/report.types";
// Class-instance-detail types (already exported, but remove duplicate ClassInstancePerformanceReturnType)
export * from "./classes/class-category.types";
export * from "./classes/class-instance-detail.types";
// Class Instance Performance types
export type {
  ClassInstancePerformanceInsertType,
  ClassInstancePerformanceSelectType as ClassInstancePerformanceEntity,
} from "./classes/class-instance-performance.types";
export * from "./classes/class-subject.types";
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
} from "./classes/group-class.types";
// Group Class types
export * from "./classes/group-class.types";
// Complaint types
export * from "./complaints/complaint.types";
export type {
  ComplaintResponseReturnType,
  ComplaintResponseSubmitInput,
} from "./complaints/complaintResponses.types";
// Communications types
export * from "./notifications/communications.types";
export type {
  NotificationAlertReturnType as SystemAlert,
  NotificationAlertsPaginatedReturnType as NotificationAlertsResult,
} from "./notifications/notification-alerts.types";
// Notification Alerts types
export * from "./notifications/notification-alerts.types";
export * from "./notifications/notification-preferences.types";
export * from "./notifications/notificationDeliveries.types";
export * from "./parents/parent.types";
export * from "./parents/parentHandbook.types";
export * from "./parents/suggestions.types";
export type { PermissionReturnType as PermissionEntity } from "./permissions/permission.types";
export * from "./permissions/permission.types";
export * from "./permissions/permission-group.types";
export * from "./permissions/permission-group-simulation.types";
// Permission management types
export type {
  CreateGroupInput,
  GroupUserEntity,
  GroupWithPermissionIds,
  UpdateGroupInput,
  UserOverrideInput,
  UserOverrideReturnType,
} from "./permissions/permission-management.types";
export * from "./permissions/permission-management.types";
export * from "./profile/profile.types";
export type {
  DstCheckedEmptyItemReturnType,
  DstConflictGroupReturnType,
  DstConflictItemReturnType,
  DstMigrationReportReturnType,
  DstUpdatedSessionReturnType,
} from "./scheduling/dst-migration.types";
// DST Migration types
export * from "./scheduling/dst-migration.types";
export * from "./scheduling/schedule.types";
export * from "./scheduling/scheduling.types";
// Shared types (localized-string, pagination, system-settings, manager-onboarding)
export * from "./shared";
export * from "./staff/staff-profile.types";
export * from "./storage/learning-resources.types";
export * from "./storage/storage.types";
export * from "./students/student.types";
export * from "./students/student-lifecycle.types";
export * from "./students/student-status.types";
export * from "./students/studentProgress.types";
export * from "./students/studentStatusHistory.types";
export * from "./teachers/teacher.types";
export * from "./teachers/teacher-availability.types";
export * from "./teachers/teacher-notes.types";
export * from "./teachers/teacher-onboarding.types";
// User types
// Re-export UserSelectType and UserReturnType
export type { SafeUser, UserReturnType, UserSelectType } from "./users/user.types";
export * from "./users/userDeviceTokens.types";
export * from "./users/userNotificationPreferences.types";
