import {
  createTable,
  index,
  textColumn,
  timestampColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { systemSettingCategoryEnum, systemSettingDataTypeEnum } from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";
import { type SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

export const systemSettings = createTable(
  "system_settings",
  {
    key: varcharColumn("key", { length: 100 }).primaryKey(),
    value: textColumn("value").notNull(),
    dataType: systemSettingDataTypeEnum("data_type")
      .$type<SystemSettingDataType>()
      .notNull()
      .default(SystemSettingDataType.String),
    description: textColumn("description").notNull(),
    category: systemSettingCategoryEnum("category").$type<SystemSettingCategory>().notNull(),
    updatedByUserId: uuidDefaultColumn("updated_by_user_id").references(() => users.id as never, { onDelete: "set null" }),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    index("system_settings_category_idx").on(table.category),
    index("system_settings_updated_by_user_id_idx").on(table.updatedByUserId),
    index("system_settings_updated_at_idx").on(table.updatedAt),
    index("system_settings_data_type_idx").on(table.dataType),
  ]
);
