import type { userNotificationPreferences } from "@/backend/db/schema";
export type UserNotificationPreferenceSelectType = typeof userNotificationPreferences.$inferSelect;
export type UserNotificationPreferenceInsertType = typeof userNotificationPreferences.$inferInsert;
