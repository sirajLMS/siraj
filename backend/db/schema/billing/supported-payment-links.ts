import { boolean, index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { paymentDirectionEnum } from "@/backend/db/schema/enums";
import type { LocalizedString } from "@/shared/types";

export const supportedPaymentLinks = pgTable(
  "supported_payment_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: jsonb("name").$type<LocalizedString>().notNull(),
    description: jsonb("description").$type<LocalizedString>(),
    instructions: jsonb("instructions").$type<LocalizedString>(),
    urlAllowlist: jsonb("url_allowlist").$type<readonly string[]>().notNull(),
    urlExample: varchar("url_example", { length: 1024 }),
    supportedDirections: paymentDirectionEnum("supported_directions").notNull().default("BOTH"),
    logoUrl: varchar("logo_url", { length: 1024 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("supported_payment_links_is_active_idx").on(table.isActive),
    index("supported_payment_links_supported_directions_idx").on(table.supportedDirections),
    index("supported_payment_links_created_at_idx").on(table.createdAt),
  ]
);
