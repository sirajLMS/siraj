import {
  booleanColumn,
  createTable,
  encryptedText,
  index,
  jsonbColumn,
  timestampColumn,
  uuidColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
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
export const whatsappAccounts = createTable(
  "whatsapp_accounts",
  {
    id: uuidColumn("id"),
    wabaId: varcharColumn("waba_id", { length: 64 }).notNull(),
    phoneNumberId: varcharColumn("phone_number_id", { length: 64 }).notNull().unique(),
    displayName: jsonbColumn<LocalizedString>("display_name"),
    displayPhoneNumber: varcharColumn("display_phone_number", { length: 32 }),
    qualityRating: varcharColumn("quality_rating", { length: 16 }),
    portfolioMessagingLimitTier: varcharColumn("portfolio_messaging_limit_tier", { length: 32 }),
    throughputLevel: varcharColumn("throughput_level", { length: 16 }),
    maxPhoneNumbersPerBusiness: varcharColumn("max_phone_numbers_per_business", { length: 50 }),
    encryptedAccessToken: encryptedText("encrypted_access_token").notNull(),
    encryptedTwoStepPin: encryptedText("encrypted_two_step_pin").notNull(),
    isActive: booleanColumn("is_active").notNull().default(true),
    lastWebhookAt: timestampColumn("last_webhook_at"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at")
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
