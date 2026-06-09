import { index, integer, numeric, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { countryCodeEnum, invoiceTypeEnum, parentStatusEnum, paymentMethodEnum } from "./enums";
import { users } from "./users";

export const parents = pgTable(
  "parents",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    status: parentStatusEnum("status").notNull(),
    phone: varchar("phone", { length: 50 }),
    nationality: countryCodeEnum("nationality"),
    address: text("address"),
    facebook: varchar("facebook", { length: 512 }),
    whatsapp: varchar("whatsapp", { length: 50 }),
    twitter: varchar("twitter", { length: 255 }),
    skype: varchar("skype", { length: 255 }),
    defaultZoomLink: varchar("default_zoom_link", { length: 1024 }),
    invoiceType: invoiceTypeEnum("invoice_type"),
    feeAmount: numeric("fee_amount", { precision: 12, scale: 2 }),
    paymentMethod: paymentMethodEnum("payment_method"),
    currency: varchar("currency", { length: 10 }),
    createdAt: timestamp("created_at", { precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
  },
  table => [index("parents_user_id_idx").on(table.userId), index("parents_status_idx").on(table.status)]
);
