import {
  createTable,
  encryptedText,
  index,
  textColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { countryCodeEnum, currencyCodeEnum, genderEnum } from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Teachers table.
 * Person timezone lives on users.timezone (see Decision 4A).
 */
export const teachers = createTable(
  "teachers",
  {
    id: uuidColumn("id"),
    userId: uuidDefaultColumn("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "restrict" }),
    nationality: countryCodeEnum("nationality"),
    nationalId: encryptedText("national_id"),
    phone: varcharColumn("phone", { length: 50 }),
    // PG-only: `date` column has no dialect-aware helper — degraded to TEXT.
    // SQLite stores ISO date strings (YYYY-MM-DD); app layer handles parsing.
    dateOfBirth: textColumn("date_of_birth"),
    gender: genderEnum("gender"),
    address: textColumn("address"),
    qualifications: textColumn("qualifications"),
    countryCode: countryCodeEnum("country_code"),
    // PG-only: `numeric` column has no dialect-aware helper — degraded to TEXT.
    // SQLite uses NUMERIC column affinity (values stored as TEXT or INTEGER
    // depending on content); precision/scale enforcement is handled at the
    // app layer. drizzle's `text` returns `string` (same as `numeric`).
    hourlyRate: textColumn("hourly_rate"),
    rateCurrency: currencyCodeEnum("rate_currency").$type<CurrencyCode>(),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    index("teachers_user_id_idx").on(table.userId),
    index("teachers_created_at_idx").on(table.createdAt),
    index("teachers_updated_at_idx").on(table.updatedAt),
    index("teachers_nationality_idx").on(table.nationality),
    index("teachers_country_code_idx").on(table.countryCode),
    index("teachers_gender_idx").on(table.gender),
    index("teachers_rate_currency_idx").on(table.rateCurrency),
  ]
);
