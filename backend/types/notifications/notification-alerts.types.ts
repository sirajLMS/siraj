/**
 * Canonical types for notification alerts (dashboard alerts surface).
 * These types represent the aggregated alert shape used by the notification-alerts
 * service and exposed through the notification-alerts GraphQL object.
 */

export type NotificationAlertReturnType = {
  id: string;
  type: "complaint" | "notification" | "system";
  title: string;
  body: string | null;
  createdAt: Date;
  severity: "info" | "warning" | "error";
};

export type NotificationAlertsPaginatedReturnType = {
  id: string;
  alerts: NotificationAlertReturnType[];
  totalCount: number;
  unreadCount: number;
};
