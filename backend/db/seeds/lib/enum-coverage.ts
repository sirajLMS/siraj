import {
  AccountStatus,
  ClassType,
  DevicePlatform,
  InvoiceType,
  LeaveRequesterType,
  LeaveRequestStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
  ParentStatus,
  StudentStatus,
} from "@/backend/enum";
/**
 * Deterministic enum cycling for dev seeds — each index maps to the next enum variant
 * so a small entity count still exercises almost every UI filter/badge state.
 */
export function cycleAtIndex<T>(values: readonly T[], index: number): T {
  if (values.length === 0) {
    throw new Error("cycleAtIndex requires a non-empty values array");
  }
  return values[index % values.length];
}

export const ALL_STUDENT_STATUSES = [
  StudentStatus.REGULAR,
  StudentStatus.ON_LEAVE,
  StudentStatus.SUSPENDED,
  StudentStatus.ON_TRIAL,
  StudentStatus.DEACTIVATED,
] as const;

export const ALL_PARENT_STATUSES = [
  ParentStatus.REGULAR,
  ParentStatus.ON_TRIAL,
  ParentStatus.ON_LEAVE,
  ParentStatus.SUSPENDED,
] as const;

export const ALL_ACCOUNT_STATUSES = [AccountStatus.ACTIVATED, AccountStatus.DEACTIVATED] as const;

export const ALL_CLASS_TYPES = [ClassType.REGULAR, ClassType.TRIAL, ClassType.ADVANCE] as const;

export const ALL_LEAVE_REQUEST_STATUSES = [
  LeaveRequestStatus.APPROVED,
  LeaveRequestStatus.PENDING,
  LeaveRequestStatus.RESCHEDULED,
  LeaveRequestStatus.CANCELLED,
] as const;

export const ALL_LEAVE_REQUESTER_TYPES = [
  LeaveRequesterType.TEACHER,
  LeaveRequesterType.PARENT,
  LeaveRequesterType.ADMIN,
] as const;

export const ALL_DEVICE_PLATFORMS = [DevicePlatform.WEB, DevicePlatform.ANDROID, DevicePlatform.IOS] as const;

export const ALL_NOTIFICATION_CHANNELS = [
  NotificationChannel.EMAIL,
  NotificationChannel.SMS,
  NotificationChannel.PUSH,
  NotificationChannel.ON_APP,
] as const;

export const ALL_NOTIFICATION_EVENT_TYPES = [
  NotificationEventType.CLASS_REMINDER,
  NotificationEventType.INVOICE_GENERATED,
  NotificationEventType.COMPLAINT_RESPONSE,
  NotificationEventType.PAYMENT_METHOD_CHANGED,
  NotificationEventType.NEW_COMPLAINT,
  NotificationEventType.NEW_SUGGESTION,
  NotificationEventType.SUGGESTION_ACKNOWLEDGED,
  NotificationEventType.SUGGESTION_DUPLICATE_MARKED,
] as const;

export const ALL_NOTIFICATION_DELIVERY_STATUSES = [
  NotificationDeliveryStatus.PENDING,
  NotificationDeliveryStatus.SENT,
  NotificationDeliveryStatus.DELIVERED,
  NotificationDeliveryStatus.OPENED,
  NotificationDeliveryStatus.FAILED,
] as const;

export const ALL_INVOICE_TYPES = [InvoiceType.MONTHLY, InvoiceType.PER_CLASSES] as const;

export const ALL_FOCUS_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export const ALL_SESSION_HEALTH = ["POOR", "FAIR", "GOOD", "EXCELLENT"] as const;
export const ALL_GRADES = ["A", "A-", "B+", "B", "B-", "C+"] as const;
