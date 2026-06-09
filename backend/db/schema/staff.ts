import { index, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { accountStatusEnum } from "./enums";
import { users } from "./users";

export const staffProfiles = pgTable(
  "staff_profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    phone: varchar("phone", { length: 50 }),
    skypeId: varchar("skype_id", { length: 255 }),
    status: accountStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
  },
  table => [index("staff_profiles_user_id_idx").on(table.userId)]
);
