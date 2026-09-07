import { randomBytes } from "node:crypto";

import { WhatsappConfigRepository } from "@/backend/db/repo/whatsapp/whatsapp-config.repository";
import { DatabaseUnavailableError, isTransientError } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import { FETCH_TIMEOUT_MS, readErrorBody, resolveGraphApiVersion } from "@/backend/lib/whatsapp-constants";
import { GraphApiError } from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import { buildGetPhoneNumberRequest } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/get-phone-number.request";
import { resolveEnvConfigMany } from "@/backend/services/system";
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

type ResolvedConfigField = Exclude<keyof WhatsappConfigResolvedType, "source">;

/**
 * Mapping between the credential fields of `whatsapp_configs` and the
 * `WHATSAPP_*` env-config keys used when the database row does not exist
 * (or the database is unreachable).
 */
const CONFIG_ENV_SOURCES = [
  { field: "appId", envKey: "WHATSAPP_APP_ID" },
  { field: "appSecret", envKey: "WHATSAPP_APP_SECRET" },
  { field: "verifyToken", envKey: "WHATSAPP_VERIFY_TOKEN" },
  { field: "phoneNumberId", envKey: "WHATSAPP_PHONE_NUMBER_ID" },
  { field: "wabaId", envKey: "WHATSAPP_WABA_ID" },
  { field: "accessToken", envKey: "WHATSAPP_ACCESS_TOKEN" },
  { field: "esConfigId", envKey: "WHATSAPP_ES_CONFIG_ID" },
] as const satisfies readonly { field: ResolvedConfigField; envKey: string }[];

/**
 * Builds the env-sourced credential set. Blank values are treated as unset
 * (consistent with the env-config resolver, which never treats an empty
 * override as a value), so a partially configured deployment degrades field
 * by field instead of passing empty strings to Meta.
 */
async function resolveFromEnv(): Promise<WhatsappConfigResolvedType> {
  const resolved = await resolveEnvConfigMany(CONFIG_ENV_SOURCES.map(source => source.envKey));
  const values: Record<ResolvedConfigField, string | null> = {
    appId: null,
    appSecret: null,
    verifyToken: null,
    phoneNumberId: null,
    wabaId: null,
    accessToken: null,
    esConfigId: null,
  };
  for (const { field, envKey } of CONFIG_ENV_SOURCES) {
    const value = resolved[envKey]?.trim() ?? "";
    values[field] = value === "" ? null : value;
  }
  return { source: "env", ...values };
}

/**
 * Normalizes a save payload before persistence: provided strings are trimmed,
 * whitespace-only values are rejected (clearing a field requires an explicit
 * `null`, so an accidental empty submission can never wipe a stored secret),
 * and the actor attribution must be a well-formed UUID.
 */
function normalizeConfigInput(input: WhatsappConfigSeedInput, tErrors: ErrorsLabels): WhatsappConfigSeedInput {
  const payload: WhatsappConfigSeedInput = {};
  for (const { field } of CONFIG_ENV_SOURCES) {
    const value = input[field];
    if (value === undefined) continue;
    if (value === null) {
      payload[field] = null;
      continue;
    }
    const trimmed = value.trim();
    if (trimmed === "") {
      throw new Error(tErrors.invalidInput);
    }
    payload[field] = trimmed;
  }
  if (input.updatedByUserId !== undefined) {
    if (input.updatedByUserId !== null && !UUID_REGEX.test(input.updatedByUserId)) {
      throw new Error(tErrors.invalidInput);
    }
    payload.updatedByUserId = input.updatedByUserId;
  }
  return payload;
}

/**
 * Type guard for the one field the connection test reads from the Graph API
 * response body — everything else about the payload is treated as opaque.
 */
function isPhoneNumberResponseBody(body: unknown): body is { display_phone_number?: unknown } {
  return typeof body === "object" && body !== null && "display_phone_number" in body;
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
 * appears in a thrown message or a log line.
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
      const detail = error instanceof Error ? error.message : String(error);
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
   * Creates or updates the singleton credential row and returns the stored
   * entity. Delegates to the repository's advisory-lock-serialized upsert,
   * so concurrent saves converge on a single row.
   *
   * When the database is unreachable or read-only the underlying failure is
   * logged (without any credential value) and the localized-safe
   * `DatabaseUnavailableError` is thrown; its code/digest is what clients
   * map to "temporarily unavailable" copy — raw driver errors never reach
   * the caller.
   *
   * @param input Per-field patch — present fields are written, an explicit
   *   `null` clears a column, absent fields keep their stored values.
   * @param options.actorUserId Admin attributed as the editor of the row.
   * @param options.locale Locale for the validation error messages.
   */
  export async function saveConfiguration(
    input: WhatsappConfigSeedInput,
    options: { actorUserId?: string; locale?: string } = {}
  ): Promise<WhatsappConfigSelectType> {
    const tErrors = getServerTranslations(options.locale ?? "en").errorsTranslations;
    if (options.actorUserId !== undefined && !UUID_REGEX.test(options.actorUserId)) {
      throw new Error(tErrors.invalidInput);
    }
    const payload = normalizeConfigInput(input, tErrors);
    if (options.actorUserId) {
      payload.updatedByUserId = options.actorUserId;
    }

    try {
      return await WhatsappConfigRepository.upsertWhatsappConfig(payload);
    } catch (error) {
      logger.logDomainError("whatsapp-config-service: configuration save failed — DB may be unreachable or read-only", {
        error,
      });
      throw new DatabaseUnavailableError();
    }
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
      logger.logDomainError(
        `whatsapp-config-service: connection test failed for phone number ${config.phoneNumberId}`,
        {
          error,
        }
      );
      return { success: false, message: tErrors.whatsappConnectionTestFailed };
    }
  }
}
