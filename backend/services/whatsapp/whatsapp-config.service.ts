import { randomBytes } from "node:crypto";

import { WhatsappConfigRepository } from "@/backend/db/repo/whatsapp/whatsapp-config.repository";
import { DatabaseUnavailableError, isTransientError, ValidationError } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import {
  FETCH_TIMEOUT_MS,
  readErrorBody,
  resolveGraphApiVersion,
  WHATSAPP_CONFIG_DB_WRITABLE_ENV_SOURCES,
  WHATSAPP_CONFIG_ENV_SOURCES,
  WHATSAPP_CONFIG_FIELD_MAX_LENGTHS,
  type WhatsappConfigCredentialField,
} from "@/backend/lib/whatsapp-constants";
import { GraphApiError } from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import { buildGetPhoneNumberRequest } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/get-phone-number.request";
import {
  deleteEnvConfigOverride,
  invalidateEnvConfigCache,
  resolveEnvConfigMany,
  upsertEnvConfigOverride,
} from "@/backend/services/system";
import type {
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
  const resolved = await resolveEnvConfigMany(WHATSAPP_CONFIG_ENV_SOURCES.map(source => source.envKey));
  const values: Record<WhatsappConfigCredentialField, string | null> = {
    appId: null,
    appSecret: null,
    verifyToken: null,
    phoneNumberId: null,
    wabaId: null,
    accessToken: null,
    esConfigId: null,
  };
  for (const { field, envKey } of WHATSAPP_CONFIG_ENV_SOURCES) {
    const value = resolved[envKey]?.trim() ?? "";
    values[field] = value === "" ? null : value;
  }
  return { source: "env", ...values };
}

/**
 * Normalizes a save payload before persistence: provided strings are trimmed,
 * whitespace-only values are rejected (clearing a field requires an explicit
 * `null`, so an accidental empty submission can never wipe a stored secret),
 * over-length values are rejected against the per-field caps (visible fields
 * mirror the column widths, encrypted fields are capped at 512), and the
 * actor attribution must be a well-formed UUID.
 */
function normalizeConfigInput(input: WhatsappConfigSeedInput, tErrors: ErrorsLabels): WhatsappConfigSeedInput {
  const payload: WhatsappConfigSeedInput = {};
  for (const { field } of WHATSAPP_CONFIG_ENV_SOURCES) {
    const value = input[field];
    if (value === undefined) continue;
    if (value === null) {
      payload[field] = null;
      continue;
    }
    const trimmed = value.trim();
    if (trimmed === "" || trimmed.length > WHATSAPP_CONFIG_FIELD_MAX_LENGTHS[field]) {
      throw new ValidationError(tErrors.invalidInput);
    }
    payload[field] = trimmed;
  }
  if (input.updatedByUserId !== undefined) {
    if (input.updatedByUserId !== null && !UUID_REGEX.test(input.updatedByUserId)) {
      throw new ValidationError(tErrors.invalidInput);
    }
    payload.updatedByUserId = input.updatedByUserId;
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
  const cause = typeof source.cause === "object" && source.cause !== null ? source.cause : undefined;
  // `in` narrowing keeps the driver-cause fields readable without a type
  // assertion — the cause's shape stays fully opaque otherwise.
  const causeMessage = cause !== undefined && "message" in cause ? cause.message : undefined;
  const causeCode = cause !== undefined && "code" in cause ? cause.code : undefined;
  const causeDetail = cause !== undefined && "detail" in cause ? cause.detail : undefined;
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
 * Type guard for the one field the connection test reads from the Graph API
 * response body — everything else about the payload is treated as opaque.
 */
function isPhoneNumberResponseBody(body: unknown): body is { display_phone_number?: unknown } {
  return typeof body === "object" && body !== null && "display_phone_number" in body;
}

/**
 * Write-through: mirrors a saved configuration onto the env-config override
 * system so the enforcement paths — the webhook verify-token handshake + HMAC
 * check and the outbound Graph API resolvers, all of which read the
 * `WHATSAPP_*` keys via `resolveEnvConfig` — pick up UI-managed credential
 * rotation without a process restart. `resolveEnvConfig` prefers a DB
 * override in `system_settings` (`env::<key>`) over `process.env`, so the
 * upsert below is what makes a save enforcement-visible; the explicit cache
 * invalidation afterwards guarantees the next read re-queries the DB even if
 * an override write failed midway.
 *
 * A field cleared to `null` deletes its override row, so no stale plaintext
 * copy of a removed credential lingers in `system_settings` (the next read
 * falls back to `process.env`, the documented env-config behavior).
 *
 * Storage convention note: `system_settings.value` is stored as plaintext
 * (masked only at the GraphQL surface — the same convention as the Settings
 * → Environment Config tab, which already writes these very keys), while the
 * `whatsapp_configs` row encrypts `appSecret`/`accessToken` at the driver
 * boundary. `WHATSAPP_ACCESS_TOKEN` is never written through — see
 * {@link WHATSAPP_CONFIG_DB_WRITABLE_ENV_SOURCES}.
 *
 * Best-effort: a failed override write is logged (key name only, never a
 * value) without failing the save — the row is already persisted — and the
 * cache invalidation still runs so stale values are never served beyond one
 * re-read.
 */
async function propagateEnvConfigOverrides(payload: WhatsappConfigSeedInput): Promise<void> {
  // The writes are independent — collect them first, then run them in
  // parallel. Each key still invalidates its cache even when its own write
  // fails, so a stale value is never served beyond one re-read.
  const writes: { envKey: string; write: Promise<unknown> }[] = [];
  for (const { field, envKey } of WHATSAPP_CONFIG_DB_WRITABLE_ENV_SOURCES) {
    const value = payload[field];
    if (value === undefined) continue;
    writes.push({
      envKey,
      write: value === null ? deleteEnvConfigOverride(envKey) : upsertEnvConfigOverride({ key: envKey, value }),
    });
  }

  await Promise.allSettled(
    writes.map(async ({ envKey, write }) => {
      try {
        await write;
      } catch (error) {
        logger.warn(
          `whatsapp-config-service: env-config override write failed for "${envKey}" — enforcement paths re-resolve on the next read. Error: ${JSON.stringify(
            toLoggableDbError(error)
          )}`
        );
      } finally {
        invalidateEnvConfigCache(envKey);
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
 * written through to the env-config override system so the enforcement paths
 * (webhook handshake/HMAC, outbound Graph API resolution) see the new
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
   * After the row is persisted, the patch is written through to the
   * env-config override system (an upsert per changed `WHATSAPP_*` key, a
   * delete for cleared fields) and the env-config cache is invalidated, so
   * the enforcement paths that resolve `WHATSAPP_*` via `resolveEnvConfig`
   * immediately observe the new credentials. Set
   * `propagateEnvConfigOverrides: false` to skip that propagation — the env
   * bootstrap seeder does, because the row and the process environment then
   * hold the same values and no redundant plaintext copy is stored.
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
   * @param options.actorUserId Admin attributed as the editor of the row.
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

    let row: WhatsappConfigSelectType;
    try {
      row = await WhatsappConfigRepository.upsertWhatsappConfig(payload);
    } catch (error) {
      // Projected to name/code/detail only: the raw driver error (drizzle
      // wraps failures in DrizzleQueryError) embeds the full bound params in
      // its message — plaintext verify token, ciphertext secrets — and must
      // never reach a log line.
      logger.logDomainError("whatsapp-config-service: configuration save failed — DB may be unreachable or read-only", {
        error: toLoggableDbError(error),
      });
      throw new DatabaseUnavailableError();
    }

    if (options.propagateEnvConfigOverrides !== false) {
      await propagateEnvConfigOverrides(payload);
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
      const response = await fetch(request.url, { ...request.init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!response.ok) {
        const errorBody = await readErrorBody(response);
        throw new GraphApiError(response.status, errorBody);
      }
      // A 2xx response already proves the credentials work; the display
      // number is best-effort metadata, so an unparsable body stays a pass.
      const body: unknown = await response.json().catch(() => null);
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
