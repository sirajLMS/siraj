import { date, index, numeric, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { encryptedText } from "@/backend/db/schema/custom-types";
import { accountStatusEnum, countryCodeEnum, genderEnum, paymentMethodEnum } from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";

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
    status: accountStatusEnum("status").notNull(),
    nationality: countryCodeEnum("nationality"),
    nationalId: encryptedText("national_id"),
    phone: varchar("phone", { length: 50 }),
    dateOfBirth: date("date_of_birth"),
    gender: genderEnum("gender"),
    address: text("address"),
    qualifications: text("qualifications"),
    zoomLink: varchar("zoom_link", { length: 1024 }),
    zoomUsername: varchar("zoom_username", { length: 255 }),
    // NOTE: zoomPassword must be encrypted at the application level before saving
    zoomPassword: encryptedText("zoom_password"),
    countryCode: countryCodeEnum("country_code"),
    hourlyRate: numeric("hourly_rate", { precision: 12, scale: 2 }),
    rateCurrency: varchar("rate_currency", { length: 10 }),
    paymentMethod: paymentMethodEnum("payment_method"),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("teachers_user_id_idx").on(table.userId), index("teachers_status_idx").on(table.status)]
);
