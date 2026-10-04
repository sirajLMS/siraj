/**
 * Internal helpers for the WhatsApp config service
 * (`whatsapp-config.service.ts`): payload normalization, driver-error
 * projection, and the in-transaction env-config write-through.
 */

import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { ValidationError } from "@/backend/lib";
import {
  WHATSAPP_CONFIG_CONTROL_CHARS_PATTERN,
  WHATSAPP_CONFIG_DB_WRITABLE_ENV_SOURCES,
  WHATSAPP_CONFIG_FIELD_MAX_LENGTHS,
  type WhatsappConfigCredentialField,
} from "@/backend/lib/whatsapp-constants";
import {
  auditEnvConfigChange,
  deleteEnvConfigOverride,
  toEnvSettingDbKey,
  upsertEnvConfigOverride,
} from "@/backend/services/system";
import type { DBTransaction, WhatsappConfigSeedInput, WhatsappConfigSelectType } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** RFC 4122 UUID format matcher (case-insensitive), for actor attribution. */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Patch keys the normalizer knows how to handle, with a compile-time
 * exhaustiveness tie to the seed input: `satisfies Record<keyof
 * WhatsappConfigSeedInput, true>` stops compiling when a column is added to
 * or renamed on `whatsapp_configs` without this record being updated — so a
 * new field can never ship as either a silent drop or a blanket rejection.
 * The runtime unknown-key check below derives from this single object.
 */
const CONFIG_PATCH_KEYS = {
  appId: true,
  appSecret: true,
  verifyToken: true,
  phoneNumberId: true,
  wabaId: true,
  accessToken: true,
  esConfigId: true,
  updatedByUserId: true,
} as const satisfies Record<keyof WhatsappConfigSeedInput, true>;

const CONFIG_PATCH_KEY_SET: ReadonlySet<string> = new Set(Object.keys(CONFIG_PATCH_KEYS));

/** Type guard narrowing a payload key to the seed input's keys. */
function isConfigPatchKey(key: string): key is keyof WhatsappConfigSeedInput {
  return CONFIG_PATCH_KEY_SET.has(key);
}

/**
 * Normalizes the actor-attribution field: `null` passes through untouched,
 * and any non-null value must be a well-formed UUID.
 */
function normalizeUpdatedByUserId(value: string | null, tErrors: ErrorsLabels): string | null {
  if (value !== null && !UUID_REGEX.test(value)) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return value;
}

/**
 * Normalizes a credential string field: rejects empty, over-length, and
 * control/invisible-format-character values, otherwise returns the trimmed
 * value.
 */
function normalizeCredentialValue(value: string, key: WhatsappConfigCredentialField, tErrors: ErrorsLabels): string {
  const trimmed = value.trim();
  if (
    trimmed === "" ||
    trimmed.length > WHATSAPP_CONFIG_FIELD_MAX_LENGTHS[key] ||
    WHATSAPP_CONFIG_CONTROL_CHARS_PATTERN.test(trimmed)
  ) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return trimmed;
}

/**
 * Normalizes a save payload before persistence: UNKNOWN keys are rejected
 * outright (a silently-ignored key would make the admin believe a value was
 * saved when it was dropped), provided strings are trimmed, whitespace-only
 * values are rejected (clearing a field requires an explicit `null`, so an
 * accidental empty submission can never wipe a stored secret), over-length
 * values are rejected against the per-field caps (visible fields mirror the
 * column widths, encrypted fields are capped at 512), control and invisible
 * format characters (C0/C1 controls, bidi overrides, zero-width characters,
 * and U+2028/U+2029 line separators — newlines, tabs, and friends) are
 * rejected outright, and the actor attribution must be a well-formed UUID.
 */
export function normalizeConfigInput(input: WhatsappConfigSeedInput, tErrors: ErrorsLabels): WhatsappConfigSeedInput {
  const payload: WhatsappConfigSeedInput = {};
  for (const key of Object.keys(input)) {
    if (!isConfigPatchKey(key)) {
      throw new ValidationError(tErrors.invalidInput);
    }
    const value = input[key];
    if (value === undefined) continue;
    if (key === "updatedByUserId") {
      payload.updatedByUserId = normalizeUpdatedByUserId(value, tErrors);
      continue;
    }
    if (value === null) {
      payload[key] = null;
      continue;
    }
    payload[key] = normalizeCredentialValue(value, key, tErrors);
  }
  return payload;
}

/**
 * Projects an unknown database-driver failure into stable, non-sensitive
 * metadata for logging. Drizzle (1.0.0-rc.4) wraps failed queries in a
 * `DrizzleQueryError` whose own `message` embeds the FULL bound parameters —
 * for this table that includes the plaintext verify token and the ciphertext
 * of `appSecret`/`accessToken` — so the wrapper's message (and any `params`)
 * must never reach a log line. Detection is structural (the wrapper carries
 * `query`/`params` fields), not name-based, so renamed error classes stay
 * covered. What survives the projection: the error class name, the
 * underlying driver's `code`/`detail` (e.g. a Postgres SQLSTATE and its
 * constraint context — on `whatsapp_configs` the only unique key is the `id`
 * UUID, so `detail` cannot carry credential material), and the driver-level
 * (`cause`) message, which Postgres composes from templates and identifiers
 * and never interpolates bound values.
 */
export function toLoggableDbError(error: unknown): {
  name: string;
  message?: string;
  code?: string;
  detail?: string;
} {
  if (typeof error !== "object" || error === null) {
    return { name: "UnknownError" };
  }
  const source = error as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    detail?: unknown;
    query?: unknown;
    params?: unknown;
    cause?: unknown;
  };
  const isQueryWrapper = "query" in source || "params" in source;
  const cause = isRecord(source.cause) ? source.cause : undefined;
  // `in` narrowing keeps the driver-cause fields readable without a type
  // assertion — the cause's shape stays fully opaque otherwise.
  const causeMessage = readCauseField(cause, "message");
  const causeCode = readCauseField(cause, "code");
  const causeDetail = readCauseField(cause, "detail");
  const message = [
    typeof causeMessage === "string" ? causeMessage : undefined,
    !isQueryWrapper && typeof source.message === "string" ? source.message : undefined,
  ].find(value => typeof value === "string");
  const code = [source.code, causeCode].find(value => typeof value === "string");
  const detail = [source.detail, causeDetail].find(value => typeof value === "string");
  return {
    name: typeof source.name === "string" ? source.name : "UnknownError",
    ...(typeof message === "string" ? { message } : {}),
    ...(typeof code === "string" ? { code } : {}),
    ...(typeof detail === "string" ? { detail } : {}),
  };
}

/**
 * Type guard narrowing an opaque value to a plain string-keyed record, used
 * to read the driver `cause` object's fields without a type assertion.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Reads a field off the driver `cause` object (kept opaque), returning
 * `undefined` when the cause is absent or the field is not present.
 */
function readCauseField(cause: Record<string, unknown> | undefined, field: "message" | "code" | "detail"): unknown {
  return cause !== undefined && field in cause ? cause[field] : undefined;
}

/**
 * Type guard for the one field the connection test reads from the Graph API
 * response body — everything else about the payload is treated as opaque.
 */
export function isPhoneNumberResponseBody(body: unknown): body is { display_phone_number?: unknown } {
  return typeof body === "object" && body !== null && "display_phone_number" in body;
}

/**
 * Write-through propagation, run INSIDE the repository upsert's
 * advisory-locked transaction. Mirrors the FINAL MERGED ROW onto the
 * env-config override system so the enforcement paths — the webhook
 * verify-token handshake + HMAC check and the outbound Graph API resolvers,
 * all of which read the `WHATSAPP_*` keys via `resolveEnvConfig` — pick up
 * UI-managed credential rotation without a process restart.
 * `resolveEnvConfig` prefers a DB override in `system_settings` (`env::<key>`)
 * over `process.env`, so these writes are what make a save
 * enforcement-visible.
 *
 * Field-complete by design: EVERY DB-writable key is reconciled from the
 * merged row on every save (non-null → upsert, null → delete) — not just the
 * patched fields — so a pre-existing `env::` override for an untouched field
 * can never go stale relative to the committed row.
 *
 * Atomicity: every override write joins the caller's transaction (the
 * `system_settings` table lives in the same Postgres database), so a failure
 * anywhere throws and rolls the whole save back — the row and its
 * enforcement-visible overrides either both persist or neither does. Cache
 * invalidation is deliberately NOT done here: it must run after commit (see
 * the save path), because clearing inside the transaction would let a
 * concurrent read re-cache the pre-commit value.
 *
 * Audit: one `env_config.upsert`/`env_config.delete` entry per propagated key
 * with the acting admin as the actor; the audit row joins the same
 * transaction. The prior override value is read IN-TX before the write so the
 * entry records the state actually being replaced or removed (absent stays
 * absent — no phantom prior). The audit helper masks secret keys to `"***"`
 * per the env-config registry `isSecret` flags (the sibling env-tab behavior).
 * Because propagation ALWAYS passes the save transaction, the audit helper's
 * in-tx error contract applies: an audit failure is logged and rethrown,
 * rolling the whole save back — the audited mutation commits with its audit
 * row or not at all (fail-safe). Only the helper's no-transaction path — the
 * Settings → Environment Config tab mutations, where the audit is a post-hoc
 * side effect — is best-effort (logged, never thrown).
 *
 * Storage convention note: `system_settings.value` is stored as plaintext
 * (masked only at the GraphQL surface — the same convention as the Settings
 * → Environment Config tab, which already writes these very keys), while the
 * `whatsapp_configs` row encrypts `appSecret`/`accessToken` at the driver
 * boundary. `WHATSAPP_ACCESS_TOKEN` is never written through — see
 * {@link WHATSAPP_CONFIG_DB_WRITABLE_ENV_SOURCES}.
 */
export async function propagateEnvConfigOverrides(
  t: DBTransaction,
  mergedRow: WhatsappConfigSelectType,
  actorUserId: string | undefined
): Promise<void> {
  await Promise.all(
    WHATSAPP_CONFIG_DB_WRITABLE_ENV_SOURCES.map(async ({ field, envKey }) => {
      const value = mergedRow[field];
      // Prior-override state is read IN-TX, BEFORE the upsert/delete, so the
      // audit row records the value actually being replaced/removed (the
      // sibling env-tab mutations resolve the prior entry the same way —
      // `priorEntry?.value ?? undefined`). Skipped when no audit will be
      // written (no actor attribution) so unattributed saves stay read-free.
      const priorValue =
        actorUserId !== undefined
          ? ((await SystemSettingsRepository.getByKey(toEnvSettingDbKey(envKey), t))?.value ?? undefined)
          : undefined;
      if (value === null) {
        await deleteEnvConfigOverride(envKey, t);
      } else {
        await upsertEnvConfigOverride({ key: envKey, value }, t);
      }
      if (actorUserId !== undefined) {
        // A delete observes no new value: `null` normalizes to `undefined` so
        // the audit row records an absent new value, never a written one.
        await auditEnvConfigChange(
          actorUserId,
          value === null ? "delete" : "upsert",
          envKey,
          priorValue,
          value ?? undefined,
          t
        );
      }
    })
  );
}
