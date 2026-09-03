import type { notificationDeliveries } from "@/backend/db/schema";
import type { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import type { NotificationMetadata } from "@/backend/types";
export type NotificationDeliverySelectType = typeof notificationDeliveries.$inferSelect;
type NotificationDeliveryInsertType = typeof notificationDeliveries.$inferInsert;

export type NotificationDeliveryStatusCount = {
  status: NotificationDeliveryStatus;
  count: number;
};

export type NotificationDeliveryAnalyticsResult = {
  totalDeliveries: number;
  statusCounts: NotificationDeliveryStatusCount[];
  openRate: number;
  failureRate: number;
};

export type CreateNotificationDeliveryInput = Pick<
  NotificationDeliveryInsertType,
  "userId" | "channel" | "eventType"
> & {
  deviceTokenId?: string | null;
  title?: string | null;
  body?: string | null;
  metadata?: NotificationMetadata | null;
  providerMessageId?: string | null;
};

export type UpdateDeliveryStatusInput = {
  deliveryId: string;
  status: NotificationDeliveryStatus;
  providerMessageId?: string | null;
  failureReason?: string | null;
  webhookPayload?: Record<string, unknown> | null;
};

export type NotificationDeliveryAnalyticsFilter = {
  userId?: string;
  channel?: NotificationChannel;
  eventType?: NotificationEventType;
  startDate?: Date;
  endDate?: Date;
};

export type UserDeliveryHistoryResult = {
  rows: NotificationDeliverySelectType[];
  totalCount: number;
};
