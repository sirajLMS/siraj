import type { userNotificationPreferences } from "@/backend/db/schema";
import type { NotificationChannel, NotificationEventType } from "@/shared/lib/enum";

export type UserNotificationPreferenceSelectType = typeof userNotificationPreferences.$inferSelect;
export type UserNotificationPreferenceInsertType = typeof userNotificationPreferences.$inferInsert;

export type SetNotificationPreferenceInput = {
  channel: NotificationChannel;
  eventType: NotificationEventType;
  enabled: boolean;
};
