import { timestampColumns } from "@/backend/db/schema/__shared__/columnHelpers";
import {
  createTable,
  encryptedText,
  index,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { users } from "@/backend/db/schema/users/users";

/**
 * WhatsApp Cloud API configuration — the single-row credential store managed
 * from the WhatsApp settings page.
 *
 * Database values take precedence over environment variables: the service
 * layer reads this row first and falls back to `WHATSAPP_*` env vars only
 * when no row exists yet (or the database is unreachable).
 *
 * Credential confidentiality:
 * - `appSecret` (Meta app secret used for webhook HMAC validation) and
 *   `accessToken` (permanent Graph API token) use the `encryptedText` custom
 *   Drizzle type — AES-256-GCM encryption/decryption happens transparently at
 *   the driver boundary via `field-encryption.ts`. Callers work with
 *   plaintext in memory; ciphertext only exists at rest, and the GraphQL layer
 *   is responsible for masking them in API responses.
 * - `verifyToken` is not sensitive at rest (it is shared with Meta's webhook
 *   subscription and echoed during GET verification), so it stays plaintext.
 *
 * `updatedByUserId` attributes the administrator who last saved the
 * configuration; it is nullable because the initial row may be created
 * without an acting user.
 */
export const whatsappConfigs = createTable(
  "whatsapp_configs",
  {
    id: uuidColumn("id"),
    appId: varcharColumn("app_id", { length: 64 }),
    appSecret: encryptedText("app_secret"),
    verifyToken: varcharColumn("verify_token", { length: 255 }),
    phoneNumberId: varcharColumn("phone_number_id", { length: 64 }),
    wabaId: varcharColumn("waba_id", { length: 64 }),
    accessToken: encryptedText("access_token"),
    esConfigId: varcharColumn("es_config_id", { length: 64 }),
    updatedByUserId: uuidDefaultColumn("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    ...timestampColumns({ withDefaultNow: true, withOnUpdate: true }),
  },
  table => [index("whatsapp_configs_updated_by_user_id_idx").on(table.updatedByUserId)]
);
