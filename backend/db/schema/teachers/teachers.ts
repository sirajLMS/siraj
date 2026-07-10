import { date, index, numeric, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { encryptedText } from "@/backend/db/schema/custom-types";
import { countryCodeEnum, currencyCodeEnum, genderEnum } from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";
import type { CurrencyCode } from "@/backend/enum";

/**
 * Teachers table.
 * Person timezone lives on users.timezone (see Decision 4A).
 */
export const teachers = pgTable(
  "teachers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "restrict" }),
    nationality: countryCodeEnum("nationality"),
    nationalId: encryptedText("national_id"),
    phone: varchar("phone", { length: 50 }),
    dateOfBirth: date("date_of_birth"),
    gender: genderEnum("gender"),
    address: text("address"),
    qualifications: text("qualifications"),
    countryCode: countryCodeEnum("country_code"),
    hourlyRate: numeric("hourly_rate", { precision: 12, scale: 2 }),
    rateCurrency: currencyCodeEnum("rate_currency").$type<CurrencyCode>(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("teachers_user_id_idx").on(table.userId)]
);
