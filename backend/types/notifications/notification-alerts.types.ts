/**
 * Canonical types for notification alerts (dashboard alerts surface).
 * These types represent the aggregated alert shape used by the notification-alerts
 * service and exposed through the notification-alerts GraphQL object.
 */

import type { NotificationChannel, NotificationEventType } from "@/backend/enum";
import type { NotificationMetadata } from "@/backend/types/notifications/notification-alerts.metadata.types";

export type NotificationAlertReturnType = {
  id: string;
  deliveryId: string | null;
  type: "complaint" | "notification" | "system";
  eventType: NotificationEventType | null;
  channel: NotificationChannel | null;
  metadata: NotificationMetadata | null;
  title: string;
  body: string | null;
  createdAt: Date;
  severity: "info" | "warning" | "error";
  readAt: Date | null;
};

export type NotificationAlertsPaginatedReturnType = {
  id: string;
  alerts: NotificationAlertReturnType[];
  totalCount: number;
  unreadCount: number;
};
