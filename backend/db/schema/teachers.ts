import { date, index, numeric, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { accountStatusEnum, countryCodeEnum, genderEnum } from "./enums";
import { users } from "./users";

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
    nationalId: varchar("national_id", { length: 100 }),
    phone: varchar("phone", { length: 50 }),
    dateOfBirth: date("date_of_birth"),
    gender: genderEnum("gender"),
    address: text("address"),
    qualifications: text("qualifications"),
    skypeId: varchar("skype_id", { length: 255 }),
    zoomLink: varchar("zoom_link", { length: 1024 }),
    zoomUsername: varchar("zoom_username", { length: 255 }),
    // NOTE: zoomPassword must be encrypted at the application level before saving
    zoomPassword: text("zoom_password"),
    countryCode: countryCodeEnum("country_code"),
    timezone: varchar("timezone", { length: 100 }).notNull(),
    hourlyRate: numeric("hourly_rate", { precision: 12, scale: 2 }),
    rateCurrency: varchar("rate_currency", { length: 10 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("teachers_user_id_idx").on(table.userId), index("teachers_status_idx").on(table.status)]
);
