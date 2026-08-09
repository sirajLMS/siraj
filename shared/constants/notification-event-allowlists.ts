export type NotificationEventTypeKey =
  | "CLASS_REMINDER"
  | "INVOICE_GENERATED"
  | "COMPLAINT_RESPONSE"
  | "PAYMENT_METHOD_CHANGED"
  | "NEW_COMPLAINT"
  | "NEW_SUGGESTION"
  | "SUGGESTION_ACKNOWLEDGED"
  | "SUGGESTION_DUPLICATE_MARKED"
  | "INVOICE_STATUS_CHANGED"
  | "CLASS_SCHEDULED"
  | "CLASS_ACTIVATED"
  | "CLASS_STARTED"
  | "CLASS_COMPLETED"
  | "CLASS_MARKED_ABSENT"
  | "CLASS_MARKED_MISSED"
  | "CLASS_LEAVE_REQUESTED"
  | "CLASS_RESCHEDULED"
  | "CLASS_CANCELLED"
  | "CLASS_RESET"
  | "STUDENT_TEACHER_REASSIGNED"
  | "STUDENT_STATUS_CHANGED"
  | "STUDENT_QUOTA_OVERRIDDEN"
  | "LESSON_REPORT_SUBMITTED"
  | "LESSON_REPORT_REVIEWED"
  | "QUOTA_EXPIRING_SOON"
  | "QUOTA_EXPIRED"
  | "QUOTA_LOW_BALANCE"
  | "ON_DEMAND_INSTANCE_PENDING_CREDIT"
  | "ON_DEMAND_INSTANCE_REMINDER_T3"
  | "ON_DEMAND_INSTANCE_REMINDER_T1"
  | "ON_DEMAND_TEACHER_DAILY_DIGEST"
  | "PASSWORD_RESET_BY_ADMIN";

export type NotificationPreferenceRole = "student" | "supervisor" | "parent" | "teacher" | "staff" | "admin";

export const STUDENT_NOTIFICATION_EVENTS: readonly NotificationEventTypeKey[] = [
  "CLASS_REMINDER",
  "CLASS_SCHEDULED",
  "CLASS_ACTIVATED",
  "CLASS_STARTED",
  "CLASS_COMPLETED",
  "CLASS_MARKED_ABSENT",
  "CLASS_MARKED_MISSED",
  "CLASS_LEAVE_REQUESTED",
  "CLASS_RESCHEDULED",
  "CLASS_CANCELLED",
  "CLASS_RESET",
  "QUOTA_EXPIRING_SOON",
  "QUOTA_EXPIRED",
  "QUOTA_LOW_BALANCE",
  "ON_DEMAND_INSTANCE_PENDING_CREDIT",
  "ON_DEMAND_INSTANCE_REMINDER_T3",
  "ON_DEMAND_INSTANCE_REMINDER_T1",
];

export const SUPERVISOR_NOTIFICATION_EVENTS: readonly NotificationEventTypeKey[] = [
  "LESSON_REPORT_SUBMITTED",
  "NEW_COMPLAINT",
  "COMPLAINT_RESPONSE",
];

export const PARENT_NOTIFICATION_EVENTS: readonly NotificationEventTypeKey[] | "ALL" = "ALL";
export const TEACHER_NOTIFICATION_EVENTS: readonly NotificationEventTypeKey[] | "ALL" = "ALL";
export const STAFF_NOTIFICATION_EVENTS: readonly NotificationEventTypeKey[] | "ALL" = "ALL";

const ROLE_ALLOWLIST_MAP: Readonly<Record<NotificationPreferenceRole, readonly NotificationEventTypeKey[] | "ALL">> = {
  student: STUDENT_NOTIFICATION_EVENTS,
  supervisor: SUPERVISOR_NOTIFICATION_EVENTS,
  parent: PARENT_NOTIFICATION_EVENTS,
  teacher: TEACHER_NOTIFICATION_EVENTS,
  staff: STAFF_NOTIFICATION_EVENTS,
  admin: "ALL",
};

const ROLE_ALLOWLIST_SETS = new Map<NotificationPreferenceRole, ReadonlySet<NotificationEventTypeKey> | "ALL">(
  (
    Object.entries(ROLE_ALLOWLIST_MAP) as Array<
      [NotificationPreferenceRole, readonly NotificationEventTypeKey[] | "ALL"]
    >
  ).map(([role, allowlist]) => [role, allowlist === "ALL" ? "ALL" : new Set(allowlist)])
);

export function resolveNotificationEventAllowlist(
  role: NotificationPreferenceRole
): readonly NotificationEventTypeKey[] | "ALL" {
  return ROLE_ALLOWLIST_MAP[role];
}

export function isEventAllowedForRole(role: NotificationPreferenceRole, eventType: NotificationEventTypeKey): boolean {
  const allowlist = ROLE_ALLOWLIST_SETS.get(role);

  if (allowlist === undefined) {
    return false;
  }

  if (allowlist === "ALL") {
    return true;
  }

  return allowlist.has(eventType);
}
