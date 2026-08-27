import { sql } from "drizzle-orm";
import {
  booleanColumn,
  checkConstraint,
  createTable,
  index,
  integerColumn,
  jsonbColumn,
  numericColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { currencyCodeEnum } from "@/backend/db/schema/enums";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Package Plans table.
 *
 * A CONFIG/CATALOG table (NOT a ledger): predefined credit-hour packages
 * (codename, hours, price, currency) that auto-fill the Add Payment form.
 * At purchase time the hour/price/currency snapshot is copied onto the
 * payment row, so later plan edits never retroactively change payments.
 *
 * Database-level Constraints:
 * - Partial unique index `package_plans_codename_active_unique_idx`: codename
 *   is unique only among non-deleted plans (soft-deleted codenames reusable).
 * - CHECK constraints enforce positive hours/price and non-negative sort.
 */
export const packagePlans = createTable(
  "package_plans",
  {
    id: uuidColumn("id"),
    codename: varcharColumn("codename", { length: 50 }).notNull(),
    displayName: varcharColumn("display_name", { length: 255 }).notNull(),
    description: textColumn("description"),
    // numeric(12,2) on PG; TEXT on SQLite (precision-preserving string).
    creditHours: numericColumn("credit_hours", { precision: 12, scale: 2 }).notNull(),
    priceAmount: numericColumn("price_amount", { precision: 12, scale: 2 }).notNull(),
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
    // Optional purchase validity window in months (catalog metadata; the
    // purchase-time snapshot on payments stays authoritative for history).
    validityMonths: integerColumn("validity_months"),
    active: booleanColumn("active").notNull().default(true),
    sortOrder: integerColumn("sort_order").notNull().default(0),
    // Optimistic-lock counter (mirrors invoices/students pattern).
    version: integerColumn("version").notNull().default(0),
    metadata: jsonbColumn("metadata"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
    deletedAt: timestampColumn("deleted_at"),
  },
  table => [
    uniqueIndex("package_plans_codename_active_unique_idx").on(table.codename).where(sql`${table.deletedAt} IS NULL`),
    index("package_plans_active_sort_idx").on(table.active, table.sortOrder),
    index("package_plans_deleted_at_idx").on(table.deletedAt),
    checkConstraint(
      "package_plans_credit_hours_positive_chk",
      sql`${table.creditHours} > 0`,
      sql`${table.creditHours} > 0`
    ),
    checkConstraint(
      "package_plans_price_amount_positive_chk",
      sql`${table.priceAmount} > 0`,
      sql`${table.priceAmount} > 0`
    ),
    checkConstraint(
      "package_plans_sort_order_non_negative_chk",
      sql`${table.sortOrder} >= 0`,
      sql`${table.sortOrder} >= 0`
    ),
  ]
);
