import type { notificationDeliveries, userDeviceTokens, userNotificationPreferences } from "@/backend/db/schema";
import type { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/shared/lib/enum";

export type UserNotificationPreferenceSelectType = typeof userNotificationPreferences.$inferSelect;
export type UserNotificationPreferenceInsertType = typeof userNotificationPreferences.$inferInsert;

export type UserDeviceTokenSelectType = typeof userDeviceTokens.$inferSelect;
export type UserDeviceTokenInsertType = typeof userDeviceTokens.$inferInsert;

export type NotificationDeliverySelectType = typeof notificationDeliveries.$inferSelect;
export type NotificationDeliveryInsertType = typeof notificationDeliveries.$inferInsert;

export type RegisterDeviceTokenInput = Pick<UserDeviceTokenInsertType, "userId" | "token" | "platform"> & {
  deviceName?: string | null;
};

export type CreateNotificationDeliveryInput = Pick<
  NotificationDeliveryInsertType,
  "userId" | "channel" | "eventType"
> & {
  deviceTokenId?: string | null;
  title?: string | null;
  body?: string | null;
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
