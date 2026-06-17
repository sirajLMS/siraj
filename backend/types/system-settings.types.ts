import type { systemSettings } from "@/backend/db/schema";

export type SystemSettingSelectType = typeof systemSettings.$inferSelect;
export type SystemSettingInsertInput = typeof systemSettings.$inferInsert;
