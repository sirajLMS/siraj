import { index, numeric, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { countryCodeEnum, currencyCodeEnum, invoiceTypeEnum, parentStatusEnum } from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";
import type { CurrencyCode } from "@/backend/enum";

export const parents = pgTable(
  "parents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "restrict" }),
    status: parentStatusEnum("status").notNull(),
    nationality: countryCodeEnum("nationality"),
    address: text("address"),
    facebook: varchar("facebook", { length: 512 }),
    whatsapp: varchar("whatsapp", { length: 50 }),
    twitter: varchar("twitter", { length: 255 }),
    invoiceType: invoiceTypeEnum("invoice_type"),
    feeAmount: numeric("fee_amount", { precision: 12, scale: 2 }),
    currency: currencyCodeEnum("currency").$type<CurrencyCode>(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
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
