/**
 * Shared constants and helpers used across WhatsApp Graph API integration layers.
 *
 * Extracted to avoid duplication between the MetaCloudApiAdapter and the
 * account service's `executeGraphApiFetch` helper.
 */

import { resolveEnvConfig } from "@/backend/services";
import type { WhatsappConfigResolvedType } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Maximum concurrent Graph API calls per batch / fan-out (P1). */
export const MAX_CONCURRENT_CALLS = 10;

/** Abort timeout (ms) for all Graph API fetch calls. */
export const FETCH_TIMEOUT_MS = 10_000;

/**
 * Placeholder written into the `whatsapp_accounts` credential columns when no
 * real credential exists yet (`createAccount` without a token, or a
 * `syncFromMeta` number Meta does not report as CONNECTED). Any per-account
 * Graph API caller must treat it as "credentials not configured" and fail
 * locally instead of dispatching a doomed request.
 */
export const WHATSAPP_CREDENTIAL_PLACEHOLDER = "pending" as const;

/**
 * Fallback Graph API version when neither `WHATSAPP_GRAPH_API_VERSION` nor the
 * legacy `WHATSAPP_API_VERSION` env-config key resolves to a value.
 */
const DEFAULT_GRAPH_API_VERSION = "v25.0";

/**
 * Credential fields of the `whatsapp_configs` singleton that map onto
 * `WHATSAPP_*` env-config keys.
 */
export type WhatsappConfigCredentialField = Exclude<keyof WhatsappConfigResolvedType, "source">;

/**
 * Mapping between the credential fields of `whatsapp_configs` and the
 * `WHATSAPP_*` env-config keys. Shared by the env bootstrap seeder (which
 * carries configured variables into the database once) and the WhatsApp
 * config service (which falls back to the same keys whenever the row is
 * missing or the database is unreachable) — one source of truth so the
 * seed-over and fallback paths can never drift apart.
 */
export const WHATSAPP_CONFIG_ENV_SOURCES = [
  { field: "appId", envKey: "WHATSAPP_APP_ID" },
  { field: "appSecret", envKey: "WHATSAPP_APP_SECRET" },
  { field: "verifyToken", envKey: "WHATSAPP_VERIFY_TOKEN" },
  { field: "phoneNumberId", envKey: "WHATSAPP_PHONE_NUMBER_ID" },
  { field: "wabaId", envKey: "WHATSAPP_WABA_ID" },
  { field: "accessToken", envKey: "WHATSAPP_ACCESS_TOKEN" },
  { field: "esConfigId", envKey: "WHATSAPP_ES_CONFIG_ID" },
] as const satisfies readonly { field: WhatsappConfigCredentialField; envKey: string }[];

/**
 * The DB-writable members of {@link WHATSAPP_CONFIG_ENV_SOURCES}, derived by
 * filtering so each entry keeps its literal `field`/`envKey` types (a widened
 * annotation would blur `envKey` to `string` and lose exhaustiveness).
 */
type WhatsappConfigDbWritableEnvSource = Extract<
  (typeof WHATSAPP_CONFIG_ENV_SOURCES)[number],
  { field: Exclude<WhatsappConfigCredentialField, "accessToken"> }
>;

/**
 * Subset of {@link WHATSAPP_CONFIG_ENV_SOURCES} whose env-config keys are
 * DB-manageable, i.e. safe to write through to the env-config override system
 * (`system_settings` rows under `env::<key>`) when the configuration row is
 * saved.
 *
 * `WHATSAPP_ACCESS_TOKEN` is excluded by hard contract: its registry
 * descriptor in `env-config-keys.ts` is `excludeFromDb: true`, so the
 * env-config resolver never reads it from the DB and never caches it — a
 * UI-saved access token cannot be propagated through env-config and keeps
 * living only in the `whatsapp_configs` row (outbound Graph calls resolve
 * per-account tokens from `whatsapp_accounts`, not from this global key).
 */
export const WHATSAPP_CONFIG_DB_WRITABLE_ENV_SOURCES: readonly WhatsappConfigDbWritableEnvSource[] =
  WHATSAPP_CONFIG_ENV_SOURCES.filter(
    (source): source is WhatsappConfigDbWritableEnvSource => source.field !== "accessToken"
  );

/**
 * Maximum accepted input length per credential field, enforced by the config
 * service's normalization. Visible fields mirror the `whatsapp_configs`
 * column widths; the two encrypted columns (`appSecret`, `accessToken`) have
 * no SQL width (stored as ciphertext `text`), so 512 is the service-level
 * sanity cap — the same value the GraphQL input's `@constraint(maxLength)`
 * carries.
 */
export const WHATSAPP_CONFIG_FIELD_MAX_LENGTHS = {
  appId: 64,
  appSecret: 512,
  verifyToken: 255,
  phoneNumberId: 64,
  wabaId: 64,
  accessToken: 512,
  esConfigId: 64,
} as const satisfies Record<WhatsappConfigCredentialField, number>;

/**
 * Matches characters that cannot legitimately appear in a Meta credential
 * value and that the config service's normalization rejects:
 *
 * - `\p{Cc}` — C0 controls (`\n`, `\r`, `\t`, `\0`-`\x1F`), DEL, and C1
 *   controls (`\u007F`-`\u009F`) — paste artifacts and protocol smuggling
 *   through header-bound values.
 * - `\p{Cf}` — format characters: bidi overrides/isolates
 *   (`\u202A`-`\u202E`, `\u2066`-`\u2069`), zero-width/no-break spaces
 *   (`\u200B`-`\u200F`, `\uFEFF`) — invisible characters that make two
 *   visually identical tokens differ, a classic credential-comparison and
 *   log-forgery hazard.
 * - `\u2028`/`\u2029` — LINE/PARAGRAPH SEPARATOR, the only line breaks
 *   outside `Cc` (they are `Zl`/`Zp`): headers and single-line config
 *   values must never carry them.
 *
 * Written as property escapes / explicit escapes rather than literal control
 * characters so no invisible character appears in the source (the sanitizer's
 * own pattern must stay lint-clean).
 */
export const WHATSAPP_CONFIG_CONTROL_CHARS_PATTERN = /[\p{Cc}\p{Cf}\u{2028}\u{2029}]/u;

/**
 * Resolves the Graph API version for WhatsApp Cloud API calls.
 *
 * Resolution order: `WHATSAPP_GRAPH_API_VERSION` (canonical, DB-overridable via
 * `env::` settings) → legacy `WHATSAPP_API_VERSION` → {@link DEFAULT_GRAPH_API_VERSION}.
 */
export async function resolveGraphApiVersion(): Promise<string> {
  const configured =
    (await resolveEnvConfig("WHATSAPP_GRAPH_API_VERSION")) ?? (await resolveEnvConfig("WHATSAPP_API_VERSION"));
  const trimmed = configured?.trim() ?? "";
  return trimmed === "" ? DEFAULT_GRAPH_API_VERSION : trimmed;
}

/**
 * Resolves the Graph API access-token and api-version from env-config, throwing
 * a localized error when the access token is missing.
 *
 * Both `whatsapp-account.service.ts` (`resolveGraphApiContext`) and
 * `MetaCloudApiAdapter.ts` (`resolveCredentials` env-config fallback) assemble
 * the same `{ accessToken, apiVersion }` context shape with the same
 * missing-token → throw pattern. This helper centralizes that logic.
 *
 * Callers that need additional env-config values (e.g. `wabaId`,
 * `phoneNumberId`) resolve those separately and combine with the returned
 * context.
 *
 * @param tErrors Localized error labels for the caller's locale.
 * @returns `{ accessToken, apiVersion }` — the shared context fields.
 * @throws When `WHATSAPP_ACCESS_TOKEN` is not configured.
 */
export async function resolveGraphApiContextFromEnv(
  tErrors: ErrorsLabels
): Promise<{ accessToken: string; apiVersion: string | undefined }> {
  const accessToken = await resolveEnvConfig("WHATSAPP_ACCESS_TOKEN");
  if (!accessToken) {
    throw new Error(tErrors.whatsappAccessTokenNotConfigured);
  }
  const apiVersion = await resolveGraphApiVersion();
  return { accessToken, apiVersion };
}
