/**
 * @warning SelectType exports include all database columns — some contain sensitive data
 * (hashed tokens, banking details, internal keys, etc.). Always use ReturnType variants
 * for API responses and client-facing code to ensure sensitive fields are omitted.
 */
// ⚠️ WARNING: This barrel file re-exports all backend types, including sensitive types
// (e.g., insert types with password fields, encryption key types). Only import what you
// need via deep imports (e.g., `import type { ... } from "@/backend/types/auth.types"`)
// rather than importing from this index file in frontend or public-facing code.
export * from "./audit.types";
export * from "./auth.types";
export * from "./billing.types";
export * from "./book.types";
export * from "./class-category.types";
export * from "./class-instance-detail.types";
export * from "./class-instance-performance.types";
export * from "./class-subject.types";
export * from "./communications.types";
export * from "./complaint.types";
export * from "./complaintResponses.types";
export * from "./dst-migration.types";
export * from "./group-class.types";
export * from "./impersonation.types";
export * from "./notification-alerts.types";
export * from "./notificationDeliveries.types";
export * from "./pagination.types";
export * from "./parent.types";
export * from "./permission-group-simulation.types";
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
export * from "./userDeviceTokens.types";
export * from "./userNotificationPreferences.types";
