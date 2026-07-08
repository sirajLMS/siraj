import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { accountStatusEnum } from "./enums";
import { users } from "./users";

export const staffProfiles = pgTable(
  "staff_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "restrict" }),
    phone: varchar("phone", { length: 50 }),
    status: accountStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("staff_profiles_user_id_idx").on(table.userId)]
);
