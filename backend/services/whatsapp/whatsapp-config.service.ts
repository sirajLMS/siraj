import { randomBytes } from "node:crypto";
import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import {
  WhatsappConfigEmptyPatchError,
  WhatsappConfigRepository,
} from "@/backend/db/repo/whatsapp/whatsapp-config.repository";
import { DatabaseUnavailableError, isTransientError, ValidationError } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import {
  FETCH_TIMEOUT_MS,
  resolveGraphApiVersion,
  WHATSAPP_CONFIG_CONTROL_CHARS_PATTERN,
  WHATSAPP_CONFIG_DB_WRITABLE_ENV_SOURCES,
  WHATSAPP_CONFIG_ENV_SOURCES,
  WHATSAPP_CONFIG_FIELD_MAX_LENGTHS,
  type WhatsappConfigCredentialField,
} from "@/backend/lib/whatsapp-constants";
import { GraphApiError } from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import { buildGetPhoneNumberRequest } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/get-phone-number.request";
import {
  noFollowRedirectInit,
  readJsonWithByteBudget,
  readResponseBodyWithByteBudget,
} from "@/backend/services/shared/outbound-fetch-guard";
import {
  auditEnvConfigChange,
  deleteEnvConfigOverride,
  invalidateEnvConfigCache,
  resolveEnvConfigMany,
  toEnvSettingDbKey,
  upsertEnvConfigOverride,
} from "@/backend/services/system";
import type {
  DBTransaction,
  WhatsappConfigResolvedType,
  WhatsappConfigSeedInput,
  WhatsappConfigSelectType,
  WhatsappConnectionTestResult,
} from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

/** Random byte count for generated verify tokens — 24 bytes → 48 hex characters. */
const VERIFY_TOKEN_BYTES = 24;

/** RFC 4122 UUID format matcher (case-insensitive), for actor attribution. */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Builds the env-sourced credential set. Blank values are treated as unset
 * (consistent with the env-config resolver, which never treats an empty
 * override as a value), so a partially configured deployment degrades field
 * by field instead of passing empty strings to Meta.
 */
async function resolveFromEnv(): Promise<WhatsappConfigResolvedType> {
  const carried = await WhatsappConfigService.resolveEnvCarryOver();
  const values: Record<WhatsappConfigCredentialField, string | null> = {
    appId: null,
    appSecret: null,
    verifyToken: null,
    phoneNumberId: null,
    wabaId: null,
    accessToken: null,
    esConfigId: null,
  };
  for (const { field } of WHATSAPP_CONFIG_ENV_SOURCES) {
    values[field] = carried[field] ?? null;
  }
  return { source: "env", ...values };
}

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

function normalizeConfigInput(input: WhatsappConfigSeedInput, tErrors: ErrorsLabels): WhatsappConfigSeedInput {
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
function toLoggableDbError(error: unknown): { name: string; message?: string; code?: string; detail?: string } {
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
function isPhoneNumberResponseBody(body: unknown): body is { display_phone_number?: unknown } {
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
async function propagateEnvConfigOverrides(
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

/**
 * Service for the deployment-wide WhatsApp Cloud API credentials stored in
 * the singleton `whatsapp_configs` row.
 *
 * Resolution priority is DB-first: a saved row is authoritative, and only a
 * missing row (or an unreachable database) falls back to the `WHATSAPP_*`
 * env-config keys. Reads are outage-resilient — the settings page stays
 * usable during cold starts and pool exhaustion. Writes are gated: when the
 * database cannot accept writes the caller receives the database-unavailable
 * domain error instead of a raw driver failure, and no credential value ever
 * appears in a thrown message or a log line. A successful save is also
 * written through — atomically, inside the same advisory-locked transaction
 * as the row write — to the env-config override system so the enforcement
 * paths (webhook handshake/HMAC, outbound Graph API resolution) see the new
 * credentials without a process restart.
 */
export namespace WhatsappConfigService {
  /**
   * Resolves the credential set actively used by the integration.
   *
   * The database is queried first; a saved row wins as a whole (its nullable
   * fields stay null, so an admin-cleared field is not silently restored
   * from the environment). When no row exists — or the read fails with a
   * transient (timeout, cold start, pool exhaustion) or non-transient
   * database error — the failure is logged and the `WHATSAPP_*` env-config
   * keys are used instead, so reads never crash the caller.
   */
  export async function resolveConfiguration(): Promise<WhatsappConfigResolvedType> {
    let row: WhatsappConfigSelectType | null;
    try {
      row = await WhatsappConfigRepository.getWhatsappConfig();
    } catch (error) {
      // The projection keeps driver internals (which can embed bound query
      // parameters) out of the log line — only name/code/detail survive.
      const detail = JSON.stringify(toLoggableDbError(error));
      if (isTransientError(error)) {
        logger.warn(
          `whatsapp-config-service: DB read failed (transient) — falling back to env config. Error: ${detail}`
        );
      } else {
        logger.error(
          `whatsapp-config-service: DB read failed (non-transient) — falling back to env config. Error: ${detail}`
        );
      }
      row = null;
    }

    if (row) {
      return {
        source: "db",
        appId: row.appId,
        appSecret: row.appSecret,
        verifyToken: row.verifyToken,
        phoneNumberId: row.phoneNumberId,
        wabaId: row.wabaId,
        accessToken: row.accessToken,
        esConfigId: row.esConfigId,
      };
    }
    return resolveFromEnv();
  }

  /**
   * Resolves the `WHATSAPP_*` carry-over values for the env bootstrap seeder
   * through the SAME resolution the env fallback uses — `resolveEnvConfigMany`
   * (DB override in `system_settings` first, then `process.env`; blank =
   * unset). The seeder therefore carries the values the enforcement paths
   * actually resolve, never a raw `process.env` snapshot that a DB override
   * could already have superseded.
   */
  export async function resolveEnvCarryOver(): Promise<WhatsappConfigSeedInput> {
    const resolved = await resolveEnvConfigMany(WHATSAPP_CONFIG_ENV_SOURCES.map(source => source.envKey));
    const carry: WhatsappConfigSeedInput = {};
    for (const { field, envKey } of WHATSAPP_CONFIG_ENV_SOURCES) {
      const value = resolved[envKey]?.trim() ?? "";
      if (value === "") continue;
      carry[field] = value;
    }
    return carry;
  }

  /**
   * Whether the singleton `whatsapp_configs` row currently exists.
   *
   * Unlike `resolveConfiguration` — which degrades to the env fallback on any
   * read failure — a failed read propagates to the caller, so the env
   * bootstrap seeder can fail safe: when the stored state cannot be verified,
   * it must not write (a re-persisted env payload would silently revert
   * admin-saved credentials).
   */
  export async function hasStoredConfiguration(): Promise<boolean> {
    return (await WhatsappConfigRepository.getWhatsappConfig()) !== null;
  }

  /**
   * Creates or updates the singleton credential row and returns the stored
   * entity. Delegates to the repository's advisory-lock-serialized upsert,
   * so concurrent saves converge on a single row.
   *
   * The env-config write-through is part of the same transaction as the row
   * write: the FINAL MERGED ROW is propagated for ALL DB-writable
   * `WHATSAPP_*` keys (non-null → `env::` override upsert, null → override
   * delete — reconciling stale overrides for untouched fields too), and any
   * override-write failure rolls the whole save back, so the mutation either
   * fully succeeds or errors — a committed row can never diverge from the
   * overrides the enforcement paths read. Because propagation runs inside
   * the advisory lock, concurrent saves serialize end-to-end (no
   * last-propagator-wins race). Set `propagateEnvConfigOverrides: false` to
   * skip that propagation — the env bootstrap seeder does, because the row
   * and the process environment then hold the same values and no redundant
   * plaintext copy is stored.
   *
   * After commit, the env-config cache is invalidated per key. Locally that
   * makes the new values immediately visible; on OTHER instances the cached
   * value can persist for up to the env-config cache TTL (`ENV_CONFIG_CACHE_TTL_MS`,
   * default 5 min) before their next re-read self-heals — an accepted,
   * bounded staleness window for multi-instance deployments.
   *
   * When the database is unreachable or read-only the underlying failure is
   * logged (projected to non-sensitive metadata — driver messages can embed
   * bound parameters) and the localized-safe `DatabaseUnavailableError` is
   * thrown; its code/digest is what clients map to "temporarily unavailable"
   * copy — raw driver errors never reach the caller.
   *
   * @param input Per-field patch — present fields are written, an explicit
   *   `null` clears a column, absent fields keep their stored values. A
   *   patch that provides no credential value at all (empty, or only
   *   explicit nulls) is rejected as invalid input before any database
   *   access: persisted as the first save it would store an all-null
   *   singleton row and permanently shadow the `WHATSAPP_*` env fallback.
   * @param options.actorUserId Admin attributed as the editor of the row and
   *   as the actor of the per-key env-config audit entries.
   * @param options.locale Locale for the validation error messages.
   * @param options.propagateEnvConfigOverrides When false, skip the
   *   env-config write-through (defaults to true).
   */
  export async function saveConfiguration(
    input: WhatsappConfigSeedInput,
    options: {
      actorUserId?: string;
      locale?: string;
      propagateEnvConfigOverrides?: boolean;
    } = {}
  ): Promise<WhatsappConfigSelectType> {
    const tErrors = getServerTranslations(options.locale ?? "en").errorsTranslations;
    if (options.actorUserId !== undefined && !UUID_REGEX.test(options.actorUserId)) {
      throw new ValidationError(tErrors.invalidInput);
    }
    const payload = normalizeConfigInput(input, tErrors);
    if (!WHATSAPP_CONFIG_ENV_SOURCES.some(({ field }) => typeof payload[field] === "string")) {
      throw new ValidationError(tErrors.invalidInput);
    }
    if (options.actorUserId) {
      payload.updatedByUserId = options.actorUserId;
    }

    const propagate = options.propagateEnvConfigOverrides !== false;
    let row: WhatsappConfigSelectType;
    try {
      // The propagation hook runs INSIDE the repository's advisory-locked
      // transaction, before commit — see propagateEnvConfigOverrides.
      row = await WhatsappConfigRepository.upsertWhatsappConfig(
        payload,
        undefined,
        propagate ? (t, mergedRow) => propagateEnvConfigOverrides(t, mergedRow, options.actorUserId) : undefined
      );
    } catch (error) {
      if (error instanceof WhatsappConfigEmptyPatchError) {
        // Repository-level invariant (empty patch on an empty table). The
        // empty-patch rejection above makes it unreachable through this API;
        // rethrow unchanged so direct repository consumers see the typed
        // contract error instead of a misleading database-unavailable mapping.
        throw error;
      }
      // Projected to name/code/detail only: the raw driver error (drizzle
      // wraps failures in DrizzleQueryError) embeds the full bound params in
      // its message — plaintext verify token, ciphertext secrets — and must
      // never reach a log line. Override-write failures inside the
      // transaction land here too: the transaction rolled back, so the row
      // is NOT persisted and the caller sees the domain error (surfaced
      // outcome — no silent row/override divergence).
      logger.logDomainError("whatsapp-config-service: configuration save failed — DB may be unreachable or read-only", {
        error: toLoggableDbError(error),
      });
      throw new DatabaseUnavailableError();
    }

    if (propagate) {
      // Post-commit cache invalidation, per propagated key. Locally the new
      // values are immediately visible; on other instances the TTL cache
      // self-heals within ENV_CONFIG_CACHE_TTL_MS (see the JSDoc above).
      for (const { envKey } of WHATSAPP_CONFIG_DB_WRITABLE_ENV_SOURCES) {
        invalidateEnvConfigCache(envKey);
      }
    }
    return row;
  }

  /**
   * Generates a webhook verify-token candidate: 24 cryptographically secure
   * random bytes hex-encoded (48 characters). The value is returned to the
   * caller only — it is not persisted and not logged, so the admin can paste
   * it into the Meta developer console before saving it.
   */
  export function generateVerifyToken(): string {
    return randomBytes(VERIFY_TOKEN_BYTES).toString("hex");
  }

  /**
   * Lightweight live check against the Meta Graph API: a GET on the resolved
   * phone number ID using the active access token. Returns a structured
   * result instead of throwing — the caller renders `message` directly, and
   * failures (bad credentials, malformed IDs, network errors, non-2xx
   * responses) are logged server-side while the client only ever sees the
   * generic localized copy.
   *
   * The token is sent via the `Authorization` header, never as a URL
   * parameter, so it cannot leak into logs through the request URL.
   */
  export async function testConnection(locale?: string): Promise<WhatsappConnectionTestResult> {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    const config = await resolveConfiguration();

    if (!config.accessToken) {
      return { success: false, message: tErrors.whatsappAccessTokenNotConfigured };
    }
    if (!config.phoneNumberId) {
      return { success: false, message: tErrors.whatsappPhoneNumberIdNotConfigured };
    }

    try {
      const apiVersion = await resolveGraphApiVersion();
      const request = buildGetPhoneNumberRequest(
        { accessToken: config.accessToken, apiVersion },
        {
          phoneNumberId: config.phoneNumberId,
        }
      );
      const response = await fetch(request.url, {
        ...request.init,
        ...noFollowRedirectInit(),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        const errorBody = await readResponseBodyWithByteBudget(response);
        throw new GraphApiError(response.status, errorBody);
      }
      // A 2xx response already proves the credentials work; the display
      // number is best-effort metadata, so an unparsable body stays a pass.
      const body: unknown = await readJsonWithByteBudget(response).catch(() => null);
      const phoneNumber =
        isPhoneNumberResponseBody(body) && typeof body.display_phone_number === "string"
          ? body.display_phone_number
          : undefined;
      return {
        success: true,
        message: tErrors.whatsappConnectionTestSucceeded,
        phoneNumber,
      };
    } catch (error) {
      // Meta's error body can echo credential fragments back (its invalid-token
      // message includes a truncated token), so the raw `GraphApiError` — which
      // carries the full response body — is never logged. Only the stable,
      // non-sensitive metadata fields are; non-Meta errors (network failures,
      // timeouts) carry no credential material and pass through unchanged.
      const loggableError =
        error instanceof GraphApiError
          ? {
              name: error.name,
              statusCode: error.statusCode,
              code: error.code,
              type: error.type,
              fbtrace_id: error.fbtrace_id,
              error_subcode: error.error_subcode,
            }
          : error;
      logger.logDomainError(
        `whatsapp-config-service: connection test failed for phone number ${config.phoneNumberId}`,
        {
          error: loggableError,
        }
      );
      return { success: false, message: tErrors.whatsappConnectionTestFailed };
    }
  }
}
