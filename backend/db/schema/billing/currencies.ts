import { boolean, index, integer, pgTable, smallint, timestamp, varchar } from "drizzle-orm/pg-core";
import { countryCodeEnum, currencyCodeEnum } from "@/backend/db/schema/enums";
import type { CurrencyCode } from "@/backend/enum";

export const supportedCurrencies = pgTable(
  "supported_currencies",
  {
    code: currencyCodeEnum("code").$type<CurrencyCode>().primaryKey(),
    symbol: varchar("symbol", { length: 16 }).notNull(),
    countryCode: countryCodeEnum("country_code"),
    decimals: smallint("decimals"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("supported_currencies_is_active_idx").on(table.isActive),
    index("supported_currencies_country_code_idx").on(table.countryCode),
    index("supported_currencies_sort_order_idx").on(table.sortOrder),
    index("supported_currencies_created_at_idx").on(table.createdAt),
  ]
);
