import { boolean, index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { encryptedText } from "@/backend/db/schema/custom-types";
import type { LocalizedString } from "@/shared/types/localized-string";

/**
 * WhatsApp Business Accounts table.
 * Stores per-account credentials and Meta-synced metadata for the Cloud API channel.
 *
 * Hybrid credential storage (REQ-3):
 * - `encryptedAccessToken` and `encryptedTwoStepPin` use the `encryptedText` custom
 *   Drizzle type — encryption/decryption happens transparently at the driver boundary
 *   via `field-encryption.ts`. The repository/service layer never handles raw ciphertext.
 * - Global webhook secrets (app secret, verify token) live in env-config, not here.
 *
 * Meta tier fields (Q5):
 * - `portfolioMessagingLimitTier` stores Meta's enum string verbatim
 *   (UNTIERED / TIER_50 / TIER_250 / TIER_1K / TIER_10K / TIER_100K / TIER_UNLIMITED / TIER_NOT_SET)
 *   with no transformation — needed for exact tier-budget accounting.
 * - `throughputLevel` stores STANDARD / COEXISTENCE / HIGH.
 *
 * B4: `updatedAt` uses `.$onUpdate(() => new Date())` so the repository need not
 * set it manually on every update.
 */
export const whatsappAccounts = pgTable(
  "whatsapp_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wabaId: varchar("waba_id", { length: 64 }).notNull(),
    phoneNumberId: varchar("phone_number_id", { length: 64 }).notNull().unique(),
    displayName: jsonb("display_name").$type<LocalizedString>(),
    displayPhoneNumber: varchar("display_phone_number", { length: 32 }),
    qualityRating: varchar("quality_rating", { length: 16 }),
    portfolioMessagingLimitTier: varchar("portfolio_messaging_limit_tier", { length: 32 }),
    throughputLevel: varchar("throughput_level", { length: 16 }),
    maxPhoneNumbersPerBusiness: varchar("max_phone_numbers_per_business", { length: 50 }),
    encryptedAccessToken: encryptedText("encrypted_access_token").notNull(),
    encryptedTwoStepPin: encryptedText("encrypted_two_step_pin").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    lastWebhookAt: timestamp("last_webhook_at", { withTimezone: true, precision: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    index("whatsapp_accounts_waba_id_idx").on(table.wabaId),
    index("whatsapp_accounts_is_active_idx").on(table.isActive),
    index("whatsapp_accounts_active_created_at_idx").on(table.isActive, table.createdAt),
  ]
);
