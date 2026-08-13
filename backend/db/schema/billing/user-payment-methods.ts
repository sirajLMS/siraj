import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { paymentDirectionEnum, paymentMethodTypeEnum } from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";
import type { PaymentMethodDetails } from "@/backend/types";

/**
 * User Payment Methods table.
 * Live/mutable saved payment methods per user with direction-specific defaults (1bA).
 *
 * Partial unique indexes enforce at most one default per pay-in and pay-out slot:
 * - PAYIN slot: direction IN ('PAYIN', 'BOTH') + is_default = true
 * - PAYOUT slot: direction IN ('PAYOUT', 'BOTH') + is_default = true
 */
export const userPaymentMethods = pgTable(
  "user_payment_methods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    type: paymentMethodTypeEnum("type").notNull(),
    direction: paymentDirectionEnum("direction").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    label: varchar("label", { length: 100 }),
    details: jsonb("details").$type<PaymentMethodDetails>().notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true, precision: 3 }),
    verifiedByUserId: uuid("verified_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("user_payment_methods_user_id_idx").on(table.userId),
    index("user_payment_methods_type_idx").on(table.type),
    index("user_payment_methods_verified_at_idx").on(table.verifiedAt),
    index("user_payment_methods_verified_by_user_id_idx").on(table.verifiedByUserId),
    index("user_payment_methods_created_at_idx").on(table.createdAt),
    index("user_payment_methods_direction_idx").on(table.direction),
    index("user_payment_methods_is_default_idx").on(table.isDefault),
    index("user_payment_methods_user_id_is_default_idx").on(table.userId, table.isDefault),
    index("user_payment_methods_user_id_direction_idx").on(table.userId, table.direction),
    uniqueIndex("user_payment_methods_payin_default_idx")
      .on(table.userId)
      .where(sql`${table.isDefault} = true AND ${table.direction} IN ('PAYIN', 'BOTH')`),
    uniqueIndex("user_payment_methods_payout_default_idx")
      .on(table.userId)
      .where(sql`${table.isDefault} = true AND ${table.direction} IN ('PAYOUT', 'BOTH')`),
  ]
);
