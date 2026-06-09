import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const systemSettings = pgTable(
  "system_settings",
  {
    key: varchar("key", { length: 100 }).primaryKey(),
    value: text("value").notNull(),
    dataType: varchar("data_type", { length: 20 }).notNull().default("string"),
    description: text("description").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    updatedByUserId: integer("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("system_settings_category_idx").on(table.category)]
);
