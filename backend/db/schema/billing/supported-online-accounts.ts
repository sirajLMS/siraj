import { boolean, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { identifierKindEnum, paymentDirectionEnum } from "@/backend/db/schema/enums";
import type { LocalizedString } from "@/shared/types";

export const supportedOnlineAccounts = pgTable("supported_online_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: jsonb("name").$type<LocalizedString>().notNull(),
  description: jsonb("description").$type<LocalizedString>(),
  instructions: jsonb("instructions").$type<LocalizedString>(),
  identifierKind: identifierKindEnum("identifier_kind").notNull(),
  identifierLabel: jsonb("identifier_label").$type<LocalizedString>().notNull(),
  supportedDirections: paymentDirectionEnum("supported_directions").notNull().default("BOTH"),
  logoUrl: varchar("logo_url", { length: 1024 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
});
