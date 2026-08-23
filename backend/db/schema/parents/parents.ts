import {
  createTable,
  index,
  textColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { countryCodeEnum, currencyCodeEnum, invoiceTypeEnum, parentStatusEnum } from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export const parents = createTable(
  "parents",
  {
    id: uuidColumn("id"),
    userId: uuidDefaultColumn("user_id")
      .notNull()
      .unique()
      .references(() => users.id as never, { onDelete: "restrict" }),
    status: parentStatusEnum("status").notNull(),
    nationality: countryCodeEnum("nationality"),
    address: textColumn("address"),
    facebook: varcharColumn("facebook", { length: 512 }),
    whatsapp: varcharColumn("whatsapp", { length: 50 }),
    twitter: varcharColumn("twitter", { length: 255 }),
    invoiceType: invoiceTypeEnum("invoice_type"),
    // numeric/decimal -> text for SQLite (precision-preserving); PG keeps numeric semantics
    // via the text representation — monetary arithmetic should be performed at the app layer
    // using a decimal library (e.g. decimal.js, dinero.js) rather than SQL arithmetic.
    feeAmount: textColumn("fee_amount"),
    currency: currencyCodeEnum("currency").$type<CurrencyCode>(),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    index("parents_user_id_idx").on(table.userId),
    index("parents_status_idx").on(table.status),
    index("parents_created_at_idx").on(table.createdAt),
    index("parents_updated_at_idx").on(table.updatedAt),
    index("parents_invoice_type_idx").on(table.invoiceType),
    index("parents_currency_idx").on(table.currency),
  ]
);
