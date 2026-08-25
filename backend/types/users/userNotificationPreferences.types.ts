import type { userNotificationPreferences } from "@/backend/db/schema";
import type { NotificationChannel, NotificationEventType } from "@/backend/enum";
export type UserNotificationPreferenceSelectType = typeof userNotificationPreferences.$inferSelect;
export type UserNotificationPreferenceInsertType = typeof userNotificationPreferences.$inferInsert;

