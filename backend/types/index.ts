/**
 * @warning SelectType exports include all database columns — some contain sensitive data
 * (hashed tokens, banking details, internal keys, etc.). Always use ReturnType variants
 * for API responses and client-facing code to ensure sensitive fields are omitted.
 */
// ⚠️ WARNING: This barrel file re-exports all backend types, including sensitive types
// (e.g., insert types with password fields, encryption key types). Only import what you
// need via deep imports (e.g., `import type { ... } from "@/backend/types/auth.types"`)
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
} from "./audit.types";
export * from "./audit.types";

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
} from "./auth.types";
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
} from "./billing.types";
// Billing types
export * from "./billing.types";
// Class-instance-detail types (already exported, but remove duplicate ClassInstancePerformanceReturnType)
export * from "./class-category.types";
export * from "./class-instance-detail.types";
// Class Instance Performance types
export type {
  ClassInstancePerformanceInsertType,
  ClassInstancePerformanceSelectType as ClassInstancePerformanceEntity,
} from "./class-instance-performance.types";
export * from "./class-subject.types";
// Communications types
export * from "./communications.types";
// Complaint types
export * from "./complaint.types";
export type {
  ComplaintResponseReturnType,
  ComplaintResponseSubmitInput,
} from "./complaintResponses.types";
export type {
  DstCheckedEmptyItemReturnType,
  DstConflictGroupReturnType,
  DstConflictItemReturnType,
  DstMigrationReportReturnType,
  DstUpdatedSessionReturnType,
} from "./dst-migration.types";
// DST Migration types
export * from "./dst-migration.types";
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
} from "./group-class.types";
// Group Class types
export * from "./group-class.types";
export type {
  EndImpersonationReturnType,
  ImpersonationAuditAction,
  ImpersonationSessionReturnType,
  ImpersonationStatusReturnType,
  RedisImpersonationData,
  StartImpersonationInput,
  StartImpersonationReturnType,
} from "./impersonation.types";
// Impersonation types
export * from "./impersonation.types";
export * from "./learning-resources.types";
export * from "./manager-onboarding.types";
export type {
  NotificationAlertReturnType as SystemAlert,
  NotificationAlertsPaginatedReturnType as NotificationAlertsResult,
} from "./notification-alerts.types";
// Notification Alerts types
export * from "./notification-alerts.types";
export * from "./notification-preferences.types";
export * from "./notificationDeliveries.types";
export * from "./pagination.types";
export * from "./parent.types";
export * from "./parentHandbook.types";
export type { PermissionReturnType as PermissionEntity } from "./permission.types";
export * from "./permission.types";
export * from "./permission-group-simulation.types";
// Permission management types
export type {
  CreateGroupInput,
  GroupUserEntity,
  GroupWithPermissionIds,
  UpdateGroupInput,
  UserOverrideInput,
  UserOverrideReturnType,
} from "./permission-management.types";
export * from "./permission-management.types";
export * from "./profile.types";
export * from "./schedule.types";
export * from "./scheduling.types";
export * from "./soft-delete.types";
export * from "./staff-profile.types";
export * from "./storage.types";
export * from "./student.types";
export * from "./student-lifecycle.types";
export * from "./student-status.types";
export * from "./studentProgress.types";
export * from "./studentStatusHistory.types";
export * from "./suggestions.types";
export * from "./system-settings.types";
export * from "./teacher.types";
export * from "./teacher-availability.types";
export * from "./teacher-notes.types";
export * from "./teacher-onboarding.types";
// User types
// Re-export UserSelectType and UserReturnType
export type { SafeUser, UserReturnType, UserSelectType } from "./user.types";
export * from "./userDeviceTokens.types";
export * from "./userNotificationPreferences.types";
