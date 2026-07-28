import type { systemSettings } from "@/backend/db/schema";

export type SystemSettingSelectType = typeof systemSettings.$inferSelect;
export type SystemSettingInsertInput = typeof systemSettings.$inferInsert;

/** Input for creating or updating a general (non-env) system setting via GraphQL. */
export type SystemSettingUpsertInput = {
  key: string;
  value: string;
  dataType?: string;
  description?: string;
  category?: string;
};
