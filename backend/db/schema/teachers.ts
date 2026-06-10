import { sql } from "drizzle-orm";
import { check, date, index, integer, numeric, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { encryptedText } from "./custom-types";
import { accountStatusEnum, countryCodeEnum, genderEnum } from "./enums";
import { timezones } from "./timezones";
import { users } from "./users";

/**
 * Teachers table.
 *
 * Database-level Constraints & Triggers:
 * - CHECK Constraint `teachers_timezone_chk`: Enforces that the `timezone` matches a valid IANA timezone name
 *   in `pg_timezone_names` (validated via helper function `is_valid_timezone(tz TEXT)`).
 */
export const teachers = pgTable(
  "teachers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "restrict" }),
    status: accountStatusEnum("status").notNull(),
    nationality: countryCodeEnum("nationality"),
    nationalId: encryptedText("national_id"),
    phone: varchar("phone", { length: 50 }),
    dateOfBirth: date("date_of_birth"),
    gender: genderEnum("gender"),
    address: text("address"),
    qualifications: text("qualifications"),
    skypeId: varchar("skype_id", { length: 255 }),
    zoomLink: varchar("zoom_link", { length: 1024 }),
    zoomUsername: varchar("zoom_username", { length: 255 }),
    // NOTE: zoomPassword must be encrypted at the application level before saving
    zoomPassword: encryptedText("zoom_password"),
    countryCode: countryCodeEnum("country_code"),
    timezoneId: integer("timezone_id").references(() => timezones.id),
    timezone: varchar("timezone", { length: 100 }).notNull(),
    hourlyRate: numeric("hourly_rate", { precision: 12, scale: 2 }),
    rateCurrency: varchar("rate_currency", { length: 10 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("teachers_user_id_idx").on(table.userId),
    index("teachers_status_idx").on(table.status),
    index("teachers_timezone_id_idx").on(table.timezoneId),
    check("teachers_timezone_chk", sql`is_valid_timezone(${table.timezone})`),
  ]
);
