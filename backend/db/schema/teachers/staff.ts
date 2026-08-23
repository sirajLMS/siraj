import {
  createTable,
  index,
  textColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { currencyCodeEnum } from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Thin staff membership marker (Decision 6A).
 * Row presence = staff audience for profile routing / manager directory.
 * Account fields (phone, status) live on users.
 */
export const staffProfiles = createTable(
  "staff_profiles",
  {
    id: uuidColumn("id"),
    userId: uuidDefaultColumn("user_id")
      .notNull()
      .unique()
      .references(() => users.id as never, { onDelete: "restrict" }),
    // PG-only: `numeric` column has no dialect-aware helper — degraded to TEXT.
    // SQLite uses NUMERIC column affinity; precision/scale enforced at app layer.
    hourlyRate: textColumn("hourly_rate"),
    rateCurrency: currencyCodeEnum("rate_currency").$type<CurrencyCode>(),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    index("staff_profiles_user_id_idx").on(table.userId),
    index("staff_profiles_created_at_idx").on(table.createdAt),
    index("staff_profiles_updated_at_idx").on(table.updatedAt),
    index("staff_profiles_rate_currency_idx").on(table.rateCurrency),
  ]
);
