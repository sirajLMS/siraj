import { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql";

/** Mirrors backend enum NotificationEventCategory — frontend-local copy for prefs UI grouping. */
export type NotificationEventCategory = "info" | "reminder" | "urgent" | "digest";

/** Maps every NotificationEventType → category so the prefs UI can group/toggle by category. */
export const NOTIFICATION_EVENT_CATEGORY: Record<NotificationEventType, NotificationEventCategory> = {
  [NotificationEventType.ClassReminder]: "reminder",
  [NotificationEventType.InvoiceGenerated]: "info",
  [NotificationEventType.ComplaintResponse]: "info",
  [NotificationEventType.PaymentMethodChanged]: "info",
  [NotificationEventType.NewComplaint]: "info",
  [NotificationEventType.NewSuggestion]: "info",
  [NotificationEventType.SuggestionAcknowledged]: "info",
  [NotificationEventType.SuggestionDuplicateMarked]: "info",
  [NotificationEventType.InvoiceStatusChanged]: "info",
  [NotificationEventType.ClassScheduled]: "info",
  [NotificationEventType.ClassActivated]: "info",
  [NotificationEventType.ClassStarted]: "info",
  [NotificationEventType.ClassCompleted]: "info",
  [NotificationEventType.ClassMarkedAbsent]: "info",
  [NotificationEventType.ClassMarkedMissed]: "info",
  [NotificationEventType.ClassLeaveRequested]: "info",
  [NotificationEventType.ClassRescheduled]: "info",
  [NotificationEventType.ClassCancelled]: "info",
  [NotificationEventType.ClassReset]: "info",
  [NotificationEventType.StudentTeacherReassigned]: "info",
  [NotificationEventType.StudentStatusChanged]: "info",
  [NotificationEventType.StudentQuotaOverridden]: "info",
  [NotificationEventType.LessonReportSubmitted]: "info",
  [NotificationEventType.LessonReportReviewed]: "info",
  [NotificationEventType.QuotaExpiringSoon]: "reminder",
  [NotificationEventType.QuotaExpired]: "info",
  [NotificationEventType.QuotaLowBalance]: "reminder",
  [NotificationEventType.OnDemandInstancePendingCredit]: "urgent",
  [NotificationEventType.OnDemandInstanceReminderT3]: "reminder",
  [NotificationEventType.OnDemandInstanceReminderT1]: "urgent",
  [NotificationEventType.OnDemandTeacherDailyDigest]: "digest",
  [NotificationEventType.PasswordResetByAdmin]: "info",
  [NotificationEventType.UserStatusChanged]: "info",
  [NotificationEventType.AccountingLowHours]: "reminder",
  [NotificationEventType.AccountingPaymentRecorded]: "info",
};

export const NOTIFICATION_CHANNELS = [
  NotificationChannel.Email,
  NotificationChannel.Sms,
  NotificationChannel.Push,
  NotificationChannel.OnApp,
  NotificationChannel.Whatsapp,
] as const;

/** Full event catalog — staff/parent/teacher/admin matrices use this when allowlist is ALL. */
export const NOTIFICATION_EVENT_TYPES = [
  NotificationEventType.ClassReminder,
  NotificationEventType.InvoiceGenerated,
  NotificationEventType.ComplaintResponse,
  NotificationEventType.PaymentMethodChanged,
  NotificationEventType.NewComplaint,
  NotificationEventType.NewSuggestion,
  NotificationEventType.SuggestionAcknowledged,
  NotificationEventType.SuggestionDuplicateMarked,
  // Notification Wiring v5 — 14 new event types (specs.md §4.1)
  NotificationEventType.InvoiceStatusChanged,
  NotificationEventType.ClassScheduled,
  NotificationEventType.ClassActivated,
  NotificationEventType.ClassStarted,
  NotificationEventType.ClassCompleted,
  NotificationEventType.ClassMarkedAbsent,
  NotificationEventType.ClassMarkedMissed,
  NotificationEventType.ClassLeaveRequested,
  NotificationEventType.ClassRescheduled,
  NotificationEventType.ClassCancelled,
  NotificationEventType.ClassReset,
  NotificationEventType.StudentTeacherReassigned,
  NotificationEventType.StudentStatusChanged,
  NotificationEventType.StudentQuotaOverridden,
  // Student/supervisor notification integration
  NotificationEventType.LessonReportSubmitted,
  NotificationEventType.LessonReportReviewed,
  // Quota & on-demand notification events
  NotificationEventType.QuotaExpiringSoon,
  NotificationEventType.QuotaExpired,
  NotificationEventType.QuotaLowBalance,
  NotificationEventType.OnDemandInstancePendingCredit,
  NotificationEventType.OnDemandInstanceReminderT3,
  NotificationEventType.OnDemandInstanceReminderT1,
  NotificationEventType.OnDemandTeacherDailyDigest,
  // Admin notification events
  NotificationEventType.PasswordResetByAdmin,
  NotificationEventType.UserStatusChanged,
] as const;

export const NOTIFICATION_EVENT_TYPES_BY_CATEGORY: Record<NotificationEventCategory, readonly NotificationEventType[]> =
  {
    urgent: NOTIFICATION_EVENT_TYPES.filter(et => NOTIFICATION_EVENT_CATEGORY[et] === "urgent"),
    reminder: NOTIFICATION_EVENT_TYPES.filter(et => NOTIFICATION_EVENT_CATEGORY[et] === "reminder"),
    info: NOTIFICATION_EVENT_TYPES.filter(et => NOTIFICATION_EVENT_CATEGORY[et] === "info"),
    digest: NOTIFICATION_EVENT_TYPES.filter(et => NOTIFICATION_EVENT_CATEGORY[et] === "digest"),
  };
