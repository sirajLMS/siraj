import { index, integer, numeric, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { accountStatusEnum, countryCodeEnum, genderEnum } from "./enums";
import { users } from "./users";

export const teachers = pgTable(
  "teachers",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    status: accountStatusEnum("status").notNull(),
    nationality: countryCodeEnum("nationality"),
    nationalId: varchar("national_id", { length: 100 }),
    phone: varchar("phone", { length: 50 }),
    age: integer("age"),
    gender: genderEnum("gender"),
    address: text("address"),
    qualifications: text("qualifications"),
    skypeId: varchar("skype_id", { length: 255 }),
    zoomLink: varchar("zoom_link", { length: 1024 }),
    zoomUsername: varchar("zoom_username", { length: 255 }),
    zoomPassword: varchar("zoom_password", { length: 255 }),
    countryCode: countryCodeEnum("country_code"),
    timezone: varchar("timezone", { length: 100 }).notNull(),
    hourlyRate: numeric("hourly_rate", { precision: 12, scale: 2 }),
    rateCurrency: varchar("rate_currency", { length: 10 }),
    beneficiaryName: varchar("beneficiary_name", { length: 255 }),
    bankName: varchar("bank_name", { length: 255 }),
    accountNumber: varchar("account_number", { length: 100 }),
    routingNumber: varchar("routing_number", { length: 100 }),
    swiftBic: varchar("swift_bic", { length: 50 }),
    iban: varchar("iban", { length: 50 }),
    createdAt: timestamp("created_at", { precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
  },
  table => [index("teachers_user_id_idx").on(table.userId), index("teachers_status_idx").on(table.status)]
);
