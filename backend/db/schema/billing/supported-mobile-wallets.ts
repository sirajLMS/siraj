import { boolean, index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { countryCodeEnum, currencyCodeEnum, paymentDirectionEnum } from "@/backend/db/schema/enums";
import type { LocalizedString } from "@/shared/types";

export const supportedMobileWallets = pgTable(
  "supported_mobile_wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: jsonb("name").$type<LocalizedString>().notNull(),
    description: jsonb("description").$type<LocalizedString>(),
    instructions: jsonb("instructions").$type<LocalizedString>(),
    countryCode: countryCodeEnum("country_code"),
    currencyCode: currencyCodeEnum("currency_code"),
    phoneRegion: varchar("phone_region", { length: 10 }),
    supportedDirections: paymentDirectionEnum("supported_directions").notNull().default("BOTH"),
    logoUrl: varchar("logo_url", { length: 1024 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("supported_mobile_wallets_country_code_idx").on(table.countryCode),
    index("supported_mobile_wallets_is_active_idx").on(table.isActive),
    index("supported_mobile_wallets_currency_code_idx").on(table.currencyCode),
    index("supported_mobile_wallets_phone_region_idx").on(table.phoneRegion),
    index("supported_mobile_wallets_supported_directions_idx").on(table.supportedDirections),
    index("supported_mobile_wallets_created_at_idx").on(table.createdAt),
  ]
);
