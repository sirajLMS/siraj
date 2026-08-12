import { boolean, jsonb, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { paymentDirectionEnum } from "@/backend/db/schema/enums";
import type { LocalizedString } from "@/shared/types";

/**
 * Shared column helpers for the `supported_mobile_wallets`, `supported_payment_links`,
 * and `supported_online_accounts` table definitions.
 *
 * These three tables share an identical "envelope" of columns that wrap a small
 * set of domain-specific columns in the middle. The base is split into a **head**
 * (columns before the domain-specific block) and a **tail** (columns after) so the
 * consumer can insert its own columns between them while preserving the exact
 * column order of the original inline definitions — preventing column-reordering
 * migrations.
 *
 * Usage:
 * ```ts
 * pgTable("my_table", {
 *   ...supportedPaymentMethodBaseHead(),
 *   // domain-specific columns go here
 *   ...supportedPaymentMethodBaseTail(),
 * }, (t) => [ ...indexes... ]);
 * ```
 *
 * Spread matches direct column definitions exactly — Drizzle infers the same
 * `$inferSelect` / `$inferInsert` types — so the generated migration is unchanged.
 */

const timestampColumnConfig = { withTimezone: true, precision: 3 } as const;

/**
 * Returns the head columns of the supported-payment-method base.
 *
 * These are the columns that appear before the domain-specific middle block:
 * `id`, `slug`, `name`, `description`, `instructions`.
 */
export function supportedPaymentMethodBaseHead() {
  return {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: jsonb("name").$type<LocalizedString>().notNull(),
    description: jsonb("description").$type<LocalizedString>(),
    instructions: jsonb("instructions").$type<LocalizedString>(),
  };
}

/**
 * Returns the tail columns of the supported-payment-method base.
 *
 * These are the columns that appear after the domain-specific middle block:
 * `supportedDirections`, `logoUrl`, `isActive`, `createdAt`, `updatedAt`.
 */
export function supportedPaymentMethodBaseTail() {
  return {
    supportedDirections: paymentDirectionEnum("supported_directions").notNull().default("BOTH"),
    logoUrl: varchar("logo_url", { length: 1024 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", timestampColumnConfig).notNull(),
    updatedAt: timestamp("updated_at", timestampColumnConfig).notNull(),
  };
}
