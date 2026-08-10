import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { systemSettingCategoryEnum, systemSettingDataTypeEnum } from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";
import { type SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

export const systemSettings = pgTable(
  "system_settings",
  {
    key: varchar("key", { length: 100 }).primaryKey(),
    value: text("value").notNull(),
    dataType: systemSettingDataTypeEnum("data_type")
      .$type<SystemSettingDataType>()
      .notNull()
      .default(SystemSettingDataType.String),
    description: text("description").notNull(),
    category: systemSettingCategoryEnum("category").$type<SystemSettingCategory>().notNull(),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("system_settings_category_idx").on(table.category),
    index("system_settings_updated_by_user_id_idx").on(table.updatedByUserId),
    index("system_settings_updated_at_idx").on(table.updatedAt),
    index("system_settings_data_type_idx").on(table.dataType),
  ]
);
