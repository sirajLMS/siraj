import type { systemSettings } from "@/backend/db/schema";
import type { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

export type SystemSettingSelectType = typeof systemSettings.$inferSelect;
export type SystemSettingInsertType = typeof systemSettings.$inferInsert;

/** Input for creating or updating a general (non-env) system setting via GraphQL. */
export type SystemSettingUpsertInput = {
  key: string;
  value: string;
  dataType?: SystemSettingDataType;
  description?: string;
  category?: SystemSettingCategory;
};
