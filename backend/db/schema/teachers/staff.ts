import { index, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { currencyCodeEnum } from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Thin staff membership marker (Decision 6A).
 * Row presence = staff audience for profile routing / manager directory.
 * Account fields (phone, status) live on users.
 */
export const staffProfiles = pgTable(
  "staff_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "restrict" }),
    hourlyRate: numeric("hourly_rate", { precision: 12, scale: 2 }),
    rateCurrency: currencyCodeEnum("rate_currency").$type<CurrencyCode>(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("staff_profiles_user_id_idx").on(table.userId),
    index("staff_profiles_created_at_idx").on(table.createdAt),
    index("staff_profiles_updated_at_idx").on(table.updatedAt),
    index("staff_profiles_rate_currency_idx").on(table.rateCurrency),
  ]
);
