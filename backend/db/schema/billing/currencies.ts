import {
  createTable,
  booleanColumn,
  integerColumn,
  timestampColumn,
  varcharColumn,
  index,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { countryCodeEnum, currencyCodeEnum } from "@/backend/db/schema/enums";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export const supportedCurrencies = createTable(
  "supported_currencies",
  {
    code: currencyCodeEnum("code").$type<CurrencyCode>().primaryKey(),
    symbol: varcharColumn("symbol", { length: 16 }).notNull(),
    countryCode: countryCodeEnum("country_code"),
    decimals: integerColumn("decimals"), // smallint -> integer (both return number)
    sortOrder: integerColumn("sort_order").notNull().default(0),
    isActive: booleanColumn("is_active").notNull().default(true),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    index("supported_currencies_is_active_idx").on(table.isActive),
    index("supported_currencies_country_code_idx").on(table.countryCode),
    index("supported_currencies_sort_order_idx").on(table.sortOrder),
    index("supported_currencies_created_at_idx").on(table.createdAt),
  ]
);
