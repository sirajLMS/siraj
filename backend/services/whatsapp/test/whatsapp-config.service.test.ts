import { beforeEach, describe, expect, mock, test } from "bun:test";

import { seedOrGet as seedOrGetWhatsappConfig } from "@/backend/db/seeds/whatsapp/seed-whatsapp-config";
import { WHATSAPP_CONFIG_FIELD_MAX_LENGTHS } from "@/backend/lib/whatsapp-constants";
import type { WhatsappConfigSeedInput, WhatsappConfigSelectType } from "@/backend/types";

// ---------------------------------------------------------------------------
// Mock state (reset per test)
// ---------------------------------------------------------------------------

const getWhatsappConfigMock = mock(async (): Promise<unknown> => null);
const upsertWhatsappConfigMock = mock(
  async (input: Record<string, unknown>): Promise<unknown> => ({ id: "cfg_stored_1", ...input })
);

/** Env-config override writes recorded per test (key → last value). */
const envOverrideUpserts = new Map<string, string>();
/** Env-config override deletions recorded per test. */
const envOverrideDeletes: string[] = [];
/** Env-config cache invalidations recorded per test. */
const envCacheInvalidations: string[] = [];

/** Mutable env-config values resolved per test. */
const envValues = new Map<string, string | undefined>();

/** Controllable Meta response for the phone-number endpoint. */
let metaStatus = 200;
let metaBody: unknown = { id: "105", display_phone_number: "+1 555 000 0000" };

const fetchUrls: string[] = [];
const fetchAuthHeaders: (string | undefined)[] = [];

/** Normalizes the fetch mock's `RequestInfo | URL` input to its URL string. */
function requestUrlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

const fetchMock = mock(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = requestUrlOf(input);
  fetchUrls.push(url);
  fetchAuthHeaders.push(new Headers(init?.headers).get("Authorization") ?? undefined);
  return new Response(typeof metaBody === "string" ? metaBody : JSON.stringify(metaBody), { status: metaStatus });
});
globalThis.fetch = Object.assign(fetchMock, {
  preconnect() {
    // no-op for tests
  },
});

/** Every logger call, recorded for the no-secret-leak assertions. */
const loggerCalls: { level: string; args: unknown[] }[] = [];

// ---------------------------------------------------------------------------
// Module mocks (must precede SUT import)
// ---------------------------------------------------------------------------

// The repository module is mocked at its direct file path — importing the
// service must never open a real database connection, and mocking the direct
// specifier keeps the service's import chain independent of repo-barrel
// re-exports.
void mock.module("@/backend/db/repo/whatsapp/whatsapp-config.repository", () => ({
  WhatsappConfigRepository: {
    getWhatsappConfig: getWhatsappConfigMock,
    upsertWhatsappConfig: upsertWhatsappConfigMock,
  },
}));

void mock.module("@/backend/lib/logger", () => ({
  logger: {
    log: (...args: unknown[]) => loggerCalls.push({ level: "log", args }),
    info: (...args: unknown[]) => loggerCalls.push({ level: "info", args }),
    warn: (...args: unknown[]) => loggerCalls.push({ level: "warn", args }),
    error: (...args: unknown[]) => loggerCalls.push({ level: "error", args }),
    debug: (...args: unknown[]) => loggerCalls.push({ level: "debug", args }),
    logDomainError: (...args: unknown[]) => loggerCalls.push({ level: "logDomainError", args }),
  },
}));

const actualSystem = await import("@/backend/services/system");

const upsertEnvConfigOverrideMock = mock(async (input: { key: string; value: string }): Promise<unknown> => {
  envOverrideUpserts.set(input.key, input.value);
  return { key: input.key, source: "db", hasDbOverride: true, updatedAt: new Date() };
});
const deleteEnvConfigOverrideMock = mock(async (key: string): Promise<unknown> => {
  envOverrideDeletes.push(key);
  return { key, deleted: true, source: "unset" };
});
const invalidateEnvConfigCacheMock = mock((key?: string): void => {
  envCacheInvalidations.push(key ?? "<all>");
});

await mock.module("@/backend/services/system", () => ({
  ...actualSystem,
  resolveEnvConfig: async (key: string) => envValues.get(key),
  resolveEnvConfigMany: async (keys: string[]) => {
    const result: Record<string, string | undefined> = {};
    for (const key of keys) result[key] = envValues.get(key);
    return result;
  },
  invalidateEnvConfigCache: invalidateEnvConfigCacheMock,
  upsertEnvConfigOverride: upsertEnvConfigOverrideMock,
  deleteEnvConfigOverride: deleteEnvConfigOverrideMock,
}));

// ---------------------------------------------------------------------------
// SUT + fixtures
// ---------------------------------------------------------------------------

const { WhatsappConfigService } = await import("@/backend/services/whatsapp/whatsapp-config.service");
const { DatabaseUnavailableError, ValidationError } = await import("@/backend/lib");
const { errorsEn } = await import("@/shared/locale/en/errors");

const DB_ROW: WhatsappConfigSelectType = {
  id: "cfg_row_1",
  appId: "app_db_1",
  appSecret: "secret_db_1",
  verifyToken: "token_db_1",
  phoneNumberId: "111",
  wabaId: "222",
  accessToken: "access_db_1",
  esConfigId: null,
  updatedByUserId: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const ENV_APP_ID = "app_env_1";
const ENV_SECRET = "shhh_env_secret_value";
const ENV_TOKEN = "tok_env_123";

/**
 * Exception-safe serialization for the leak scans: strings pass through,
 * objects are JSON-serialized with a circular-reference guard, and anything
 * non-serializable falls back to a "[unserializable]" marker — so nested
 * logger content is actually scanned instead of collapsing to "[object
 * Object]", without ever invoking an arbitrary object's `toString()`.
 */
function serializeForScan(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || typeof value !== "object") return String(value);
  const seen = new WeakSet<object>();
  try {
    return (
      JSON.stringify(value, (_key, nested: unknown) => {
        if (typeof nested === "object" && nested !== null) {
          if (seen.has(nested)) return "[circular]";
          seen.add(nested);
        }
        return nested;
      }) ?? "[unserializable]"
    );
  } catch {
    return "[unserializable]";
  }
}

/** Flattens all recorded logger output into one string for leak scans. */
function allLoggerOutput(): string {
  return loggerCalls.map(call => call.args.map(arg => serializeForScan(arg)).join(" | ")).join("\n");
}

/** Assertion-safe message extraction from an unknown thrown value. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

beforeEach(() => {
  metaStatus = 200;
  metaBody = { id: "105", display_phone_number: "+1 555 000 0000" };
  envValues.clear();
  envOverrideUpserts.clear();
  envOverrideDeletes.length = 0;
  envCacheInvalidations.length = 0;
  fetchUrls.length = 0;
  fetchAuthHeaders.length = 0;
  loggerCalls.length = 0;
  getWhatsappConfigMock.mockReset();
  getWhatsappConfigMock.mockResolvedValue(null);
  upsertWhatsappConfigMock.mockReset();
  upsertWhatsappConfigMock.mockImplementation(
    async (input: Record<string, unknown>): Promise<unknown> => ({ id: "cfg_stored_1", ...input })
  );
  upsertEnvConfigOverrideMock.mockClear();
  deleteEnvConfigOverrideMock.mockClear();
  invalidateEnvConfigCacheMock.mockClear();
  fetchMock.mockClear();
});

async function expectRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected the call to reject, but it resolved");
}

describe("resolveConfiguration — resolution priority", () => {
  test("returns the DB row when one exists, without consulting env", async () => {
    envValues.set("WHATSAPP_APP_ID", ENV_APP_ID);
    getWhatsappConfigMock.mockResolvedValue(DB_ROW);

    const config = await WhatsappConfigService.resolveConfiguration();

    expect(config.source).toBe("db");
    expect(config.appId).toBe("app_db_1");
    expect(config.appSecret).toBe("secret_db_1");
    expect(config.verifyToken).toBe("token_db_1");
    expect(config.phoneNumberId).toBe("111");
    expect(config.wabaId).toBe("222");
    expect(config.accessToken).toBe("access_db_1");
    expect(config.esConfigId).toBeNull();
    expect(getWhatsappConfigMock).toHaveBeenCalledTimes(1);
  });

  test("falls back to env when no DB row exists", async () => {
    envValues.set("WHATSAPP_APP_ID", ENV_APP_ID);
    envValues.set("WHATSAPP_ACCESS_TOKEN", ENV_TOKEN);

    const config = await WhatsappConfigService.resolveConfiguration();

    expect(config.source).toBe("env");
    expect(config.appId).toBe(ENV_APP_ID);
    expect(config.accessToken).toBe(ENV_TOKEN);
    expect(config.appSecret).toBeNull();
    expect(getWhatsappConfigMock).toHaveBeenCalledTimes(1);
  });

  test("falls back to env when the DB read fails, with a warning logged", async () => {
    envValues.set("WHATSAPP_APP_ID", ENV_APP_ID);
    envValues.set("WHATSAPP_APP_SECRET", ENV_SECRET);
    getWhatsappConfigMock.mockRejectedValue(new Error("connection refused"));

    const config = await WhatsappConfigService.resolveConfiguration();

    expect(config.source).toBe("env");
    expect(config.appId).toBe(ENV_APP_ID);
    expect(config.appSecret).toBe(ENV_SECRET);
    expect(loggerCalls.some(call => call.level === "warn")).toBe(true);
  });

  test("a saved row is authoritative as a whole — null fields stay null", async () => {
    envValues.set("WHATSAPP_APP_ID", ENV_APP_ID);
    getWhatsappConfigMock.mockResolvedValue({ ...DB_ROW, appId: null, esConfigId: null });

    const config = await WhatsappConfigService.resolveConfiguration();

    expect(config.source).toBe("db");
    expect(config.appId).toBeNull();
    expect(config.esConfigId).toBeNull();
  });
});

describe("saveConfiguration", () => {
  test("persists through the repository upsert with actor attribution", async () => {
    upsertWhatsappConfigMock.mockResolvedValue(DB_ROW);

    const stored = await WhatsappConfigService.saveConfiguration(
      { appId: "  app_x  ", verifyToken: "tok", updatedByUserId: "bbbb0001-bbbb-bbbb-bbbb-bbbb0001bbbb" },
      { actorUserId: "aaaa0001-aaaa-aaaa-aaaa-aaaa0001aaaa" }
    );

    expect(stored).toBe(DB_ROW);
    expect(upsertWhatsappConfigMock).toHaveBeenCalledTimes(1);
    const payload = upsertWhatsappConfigMock.mock.calls[0][0];
    expect(payload.appId).toBe("app_x");
    expect(payload.verifyToken).toBe("tok");
    // The acting admin wins over any attribution carried in the payload.
    expect(payload.updatedByUserId).toBe("aaaa0001-aaaa-aaaa-aaaa-aaaa0001aaaa");
  });

  test("explicit null clears a field while a valued field still merges; absent fields stay untouched", async () => {
    await WhatsappConfigService.saveConfiguration({ wabaId: null, verifyToken: "tok" });

    const payload = upsertWhatsappConfigMock.mock.calls[0][0];
    expect(payload.wabaId).toBeNull();
    expect(payload.verifyToken).toBe("tok");
    expect("appId" in payload).toBe(false);
    expect("accessToken" in payload).toBe(false);
  });

  test("a patch with no credential value is rejected without touching the DB", async () => {
    // An empty (or null-only) patch must never reach the repository: on an
    // empty table it would insert an all-null singleton row and permanently
    // shadow the WHATSAPP_* env fallback with null credentials.
    const empty = await expectRejection(WhatsappConfigService.saveConfiguration({}, { locale: "en" }));
    expect(empty).toBeInstanceOf(ValidationError);
    expect(messageOf(empty)).toBe(errorsEn.invalidInput);

    const nullOnly = await expectRejection(WhatsappConfigService.saveConfiguration({ appId: null }));
    expect(nullOnly).toBeInstanceOf(ValidationError);
    expect(messageOf(nullOnly)).toBe(errorsEn.invalidInput);

    expect(upsertWhatsappConfigMock).not.toHaveBeenCalled();
  });

  test("maps a DB failure on save to the graceful database-unavailable error", async () => {
    upsertWhatsappConfigMock.mockRejectedValue(new Error("db boom"));

    const error = await expectRejection(
      WhatsappConfigService.saveConfiguration({ verifyToken: "tok" }, { locale: "en" })
    );

    expect(error).toBeInstanceOf(DatabaseUnavailableError);
    if (!(error instanceof DatabaseUnavailableError)) throw new Error("unreachable");
    expect(error.code).toBe("DATABASE_UNAVAILABLE");
    expect(loggerCalls.some(call => call.level === "logDomainError")).toBe(true);
  });
});

describe("saveConfiguration — env-config write-through", () => {
  test("propagates saved values as env-config overrides and invalidates their cache", async () => {
    await WhatsappConfigService.saveConfiguration({
      appId: "app_ui_1",
      appSecret: "sec_ui_1",
      verifyToken: "tok_ui_1",
    });

    expect(envOverrideUpserts.get("WHATSAPP_APP_ID")).toBe("app_ui_1");
    expect(envOverrideUpserts.get("WHATSAPP_APP_SECRET")).toBe("sec_ui_1");
    expect(envOverrideUpserts.get("WHATSAPP_VERIFY_TOKEN")).toBe("tok_ui_1");
    expect(envCacheInvalidations).toEqual(
      expect.arrayContaining(["WHATSAPP_APP_ID", "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN"])
    );
    // Omitted fields are untouched — no override writes or invalidations.
    expect(envOverrideUpserts.has("WHATSAPP_PHONE_NUMBER_ID")).toBe(false);
    expect(envOverrideUpserts.has("WHATSAPP_WABA_ID")).toBe(false);
    expect(envOverrideUpserts.has("WHATSAPP_ES_CONFIG_ID")).toBe(false);
    expect(envCacheInvalidations).not.toContain("WHATSAPP_PHONE_NUMBER_ID");
  });

  test("override values match the persisted row (trimmed)", async () => {
    await WhatsappConfigService.saveConfiguration({ verifyToken: "  spaced-token  " });

    const payload = upsertWhatsappConfigMock.mock.calls[0][0];
    expect(payload.verifyToken).toBe("spaced-token");
    expect(envOverrideUpserts.get("WHATSAPP_VERIFY_TOKEN")).toBe("spaced-token");
  });

  test("never writes the access token through (excludeFromDb hard contract)", async () => {
    await WhatsappConfigService.saveConfiguration({ accessToken: "tok_access_ui_1", verifyToken: "tok_ui_1" });

    expect(upsertWhatsappConfigMock).toHaveBeenCalledTimes(1);
    expect(envOverrideUpserts.has("WHATSAPP_ACCESS_TOKEN")).toBe(false);
    expect(envCacheInvalidations).not.toContain("WHATSAPP_ACCESS_TOKEN");
    expect(envCacheInvalidations).toContain("WHATSAPP_VERIFY_TOKEN");
  });

  test("clearing a field deletes its env-config override", async () => {
    await WhatsappConfigService.saveConfiguration({ wabaId: null, verifyToken: "tok_ui_1" });

    expect(envOverrideDeletes).toContain("WHATSAPP_WABA_ID");
    expect(envOverrideUpserts.has("WHATSAPP_WABA_ID")).toBe(false);
    expect(envCacheInvalidations).toContain("WHATSAPP_WABA_ID");
  });

  test("an override write failure does not fail the save and still invalidates the cache", async () => {
    upsertEnvConfigOverrideMock.mockRejectedValueOnce(new Error("override write boom"));

    const stored = await WhatsappConfigService.saveConfiguration({ verifyToken: "tok_ui_marker_value" });

    expect(stored.id).toBe("cfg_stored_1");
    expect(envCacheInvalidations).toContain("WHATSAPP_VERIFY_TOKEN");
    expect(
      loggerCalls.some(call => call.level === "warn" && JSON.stringify(call.args).includes("WHATSAPP_VERIFY_TOKEN"))
    ).toBe(true);
    // The warning carries the key name only — never the credential value.
    expect(allLoggerOutput()).not.toContain("tok_ui_marker_value");
  });

  test("skips the write-through when the caller opts out (env bootstrap seeder)", async () => {
    await WhatsappConfigService.saveConfiguration(
      { appId: "app_seed_1", appSecret: "sec_seed_1" },
      { propagateEnvConfigOverrides: false }
    );

    expect(upsertWhatsappConfigMock).toHaveBeenCalledTimes(1);
    expect(envOverrideUpserts.size).toBe(0);
    expect(envOverrideDeletes).toHaveLength(0);
    expect(envCacheInvalidations).toHaveLength(0);
  });
});

describe("hasStoredConfiguration", () => {
  test("returns true only when the repo returns a row", async () => {
    getWhatsappConfigMock.mockResolvedValue(DB_ROW);
    expect(await WhatsappConfigService.hasStoredConfiguration()).toBe(true);

    getWhatsappConfigMock.mockResolvedValue(null);
    expect(await WhatsappConfigService.hasStoredConfiguration()).toBe(false);
  });

  test("propagates a failed read so callers can fail safe", async () => {
    getWhatsappConfigMock.mockRejectedValue(new Error("read failed"));

    const error = await expectRejection(WhatsappConfigService.hasStoredConfiguration());

    expect(messageOf(error)).toBe("read failed");
  });
});

describe("seedOrGet — look-before-create", () => {
  const ENV_SEED_APP_ID = "seed_app_env";
  const ENV_SEED_SECRET = "seed_secret_env_value";

  function withSeedEnvVars(set: boolean): void {
    if (set) {
      process.env.WHATSAPP_APP_ID = ENV_SEED_APP_ID;
      process.env.WHATSAPP_APP_SECRET = ENV_SEED_SECRET;
    } else {
      delete process.env.WHATSAPP_APP_ID;
      delete process.env.WHATSAPP_APP_SECRET;
    }
  }

  test("a pre-existing row is never re-persisted — env re-runs cannot revert admin-saved credentials", async () => {
    withSeedEnvVars(true);
    try {
      const persist = mock(async (): Promise<WhatsappConfigSelectType> => DB_ROW);

      const result = await seedOrGetWhatsappConfig({ hasExisting: async () => true, persist });

      expect(result).toBeUndefined();
      expect(persist).not.toHaveBeenCalled();
      expect(
        loggerCalls.some(call => call.level === "info" && JSON.stringify(call.args).includes("left untouched"))
      ).toBe(true);
    } finally {
      withSeedEnvVars(false);
    }
  });

  test("an empty table persists the carried-over env fields", async () => {
    withSeedEnvVars(true);
    try {
      const persist = mock(
        (_input: WhatsappConfigSeedInput): Promise<WhatsappConfigSelectType> => Promise.resolve(DB_ROW)
      );

      const result = await seedOrGetWhatsappConfig({ hasExisting: async () => false, persist });

      expect(result).toBeDefined();
      expect(persist).toHaveBeenCalledTimes(1);
      const payload = persist.mock.calls[0][0];
      expect(payload.appId).toBe(ENV_SEED_APP_ID);
      expect(payload.appSecret).toBe(ENV_SEED_SECRET);
    } finally {
      withSeedEnvVars(false);
    }
  });

  test("a failing existence check fails safe — nothing is persisted", async () => {
    withSeedEnvVars(true);
    try {
      const persist = mock(async (): Promise<WhatsappConfigSelectType> => DB_ROW);

      const result = await seedOrGetWhatsappConfig({
        hasExisting: async () => {
          throw new Error("read failed");
        },
        persist,
      });

      expect(result).toBeUndefined();
      expect(persist).not.toHaveBeenCalled();
      expect(loggerCalls.some(call => call.level === "warn")).toBe(true);
    } finally {
      withSeedEnvVars(false);
    }
  });

  test("without the existence gate the persist path is unchanged (backward compatible)", async () => {
    withSeedEnvVars(true);
    try {
      const persist = mock(async (): Promise<WhatsappConfigSelectType> => DB_ROW);

      await seedOrGetWhatsappConfig({ persist });

      expect(persist).toHaveBeenCalledTimes(1);
    } finally {
      withSeedEnvVars(false);
    }
  });

  test("no WHATSAPP_* env vars set — skipped without any existence query", async () => {
    withSeedEnvVars(false);
    const hasExisting = mock(async (): Promise<boolean> => true);
    const persist = mock(async (): Promise<WhatsappConfigSelectType> => DB_ROW);

    const result = await seedOrGetWhatsappConfig({ hasExisting, persist });

    expect(result).toBeUndefined();
    expect(hasExisting).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });
});

describe("generateVerifyToken", () => {
  test("produces 48-character lowercase hex tokens", () => {
    const token = WhatsappConfigService.generateVerifyToken();

    expect(token).toMatch(/^[0-9a-f]{48}$/);
    expect(token).toHaveLength(48);
  });

  test("tokens are unique across calls", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => WhatsappConfigService.generateVerifyToken()));

    expect(tokens.size).toBe(50);
  });
});

describe("testConnection", () => {
  test("succeeds and returns the display phone number", async () => {
    envValues.set("WHATSAPP_ACCESS_TOKEN", ENV_TOKEN);
    envValues.set("WHATSAPP_PHONE_NUMBER_ID", "105");

    const result = await WhatsappConfigService.testConnection("en");

    expect(result.success).toBe(true);
    expect(result.message).toBe(errorsEn.whatsappConnectionTestSucceeded);
    expect(result.phoneNumber).toBe("+1 555 000 0000");
    expect(fetchUrls).toHaveLength(1);
    expect(fetchUrls[0]).toBe("https://graph.facebook.com/v25.0/105");
    // The token travels in the Authorization header, never in the URL.
    expect(fetchAuthHeaders[0]).toBe(`Bearer ${ENV_TOKEN}`);
    expect(fetchUrls[0]).not.toContain(ENV_TOKEN);
  });

  test("reports a missing access token without calling Meta", async () => {
    const result = await WhatsappConfigService.testConnection("en");

    expect(result.success).toBe(false);
    expect(result.message).toBe(errorsEn.whatsappAccessTokenNotConfigured);
    expect(fetchUrls).toHaveLength(0);
  });

  test("reports a missing phone number ID without calling Meta", async () => {
    envValues.set("WHATSAPP_ACCESS_TOKEN", ENV_TOKEN);

    const result = await WhatsappConfigService.testConnection("en");

    expect(result.success).toBe(false);
    expect(result.message).toBe(errorsEn.whatsappPhoneNumberIdNotConfigured);
    expect(fetchUrls).toHaveLength(0);
  });

  test("degrades gracefully on a malformed phone number ID", async () => {
    envValues.set("WHATSAPP_ACCESS_TOKEN", ENV_TOKEN);
    envValues.set("WHATSAPP_PHONE_NUMBER_ID", "not-numeric!");

    const result = await WhatsappConfigService.testConnection("en");

    expect(result.success).toBe(false);
    expect(result.message).toBe(errorsEn.whatsappConnectionTestFailed);
    expect(fetchUrls).toHaveLength(0);
    expect(result.message).not.toContain("Invalid phoneNumberId");
  });

  test("maps a Meta HTTP error to a failed result with the generic message", async () => {
    envValues.set("WHATSAPP_ACCESS_TOKEN", ENV_TOKEN);
    envValues.set("WHATSAPP_PHONE_NUMBER_ID", "105");
    metaStatus = 401;
    metaBody = { error: { code: 190, message: "Invalid OAuth access token - booooo" } };

    const result = await WhatsappConfigService.testConnection("en");

    expect(result.success).toBe(false);
    expect(result.message).toBe(errorsEn.whatsappConnectionTestFailed);
    expect(loggerCalls.some(call => call.level === "logDomainError")).toBe(true);
  });

  test("tolerates a non-JSON error body", async () => {
    envValues.set("WHATSAPP_ACCESS_TOKEN", ENV_TOKEN);
    envValues.set("WHATSAPP_PHONE_NUMBER_ID", "105");
    metaStatus = 500;
    metaBody = "Service Unavailable";

    const result = await WhatsappConfigService.testConnection("en");

    expect(result.success).toBe(false);
    expect(result.message).toBe(errorsEn.whatsappConnectionTestFailed);
  });

  test("a 2xx response without a display number still succeeds", async () => {
    envValues.set("WHATSAPP_ACCESS_TOKEN", ENV_TOKEN);
    envValues.set("WHATSAPP_PHONE_NUMBER_ID", "105");
    metaBody = {};

    const result = await WhatsappConfigService.testConnection("en");

    expect(result.success).toBe(true);
    expect(result.phoneNumber).toBeUndefined();
  });
});

describe("Tier 2 — boundary inputs", () => {
  test("blank env values are treated as unset", async () => {
    envValues.set("WHATSAPP_APP_ID", "");
    envValues.set("WHATSAPP_WABA_ID", "   ");

    const config = await WhatsappConfigService.resolveConfiguration();

    expect(config.source).toBe("env");
    expect(config.appId).toBeNull();
    expect(config.wabaId).toBeNull();
  });

  test("whitespace-only credential saves are rejected without touching the DB", async () => {
    const error = await expectRejection(
      WhatsappConfigService.saveConfiguration({ appSecret: "   " }, { locale: "en" })
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect(messageOf(error)).toBe(errorsEn.invalidInput);
    expect(upsertWhatsappConfigMock).not.toHaveBeenCalled();
  });

  test("a malformed actor id is rejected without touching the DB", async () => {
    const error = await expectRejection(
      WhatsappConfigService.saveConfiguration({ verifyToken: "tok" }, { actorUserId: "not-a-uuid" })
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect(messageOf(error)).toBe(errorsEn.invalidInput);
    expect(upsertWhatsappConfigMock).not.toHaveBeenCalled();
  });

  test("exactly-at-limit values are accepted and stored", async () => {
    const limits = WHATSAPP_CONFIG_FIELD_MAX_LENGTHS;
    await WhatsappConfigService.saveConfiguration({
      appId: "a".repeat(limits.appId),
      appSecret: "s".repeat(limits.appSecret),
      verifyToken: "t".repeat(limits.verifyToken),
      phoneNumberId: "1".repeat(limits.phoneNumberId),
      wabaId: "w".repeat(limits.wabaId),
      accessToken: "k".repeat(limits.accessToken),
      esConfigId: "e".repeat(limits.esConfigId),
    });

    expect(upsertWhatsappConfigMock).toHaveBeenCalledTimes(1);
    const payload = upsertWhatsappConfigMock.mock.calls[0][0];
    expect(payload.appId).toHaveLength(limits.appId);
    expect(payload.verifyToken).toHaveLength(limits.verifyToken);
    expect(payload.accessToken).toHaveLength(limits.accessToken);
  });

  test("over-limit values are rejected without touching the DB", async () => {
    const limits = WHATSAPP_CONFIG_FIELD_MAX_LENGTHS;
    const overLimitInputs: WhatsappConfigSeedInput[] = [
      { appId: "a".repeat(limits.appId + 1) },
      { appSecret: "s".repeat(limits.appSecret + 1) },
      { verifyToken: "t".repeat(limits.verifyToken + 1) },
      { phoneNumberId: "1".repeat(limits.phoneNumberId + 1) },
      { wabaId: "w".repeat(limits.wabaId + 1) },
      { accessToken: "k".repeat(limits.accessToken + 1) },
      { esConfigId: "e".repeat(limits.esConfigId + 1) },
    ];

    const errors = await Promise.all(
      overLimitInputs.map(input => expectRejection(WhatsappConfigService.saveConfiguration(input, { locale: "en" })))
    );

    for (const error of errors) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(messageOf(error)).toBe(errorsEn.invalidInput);
    }
    expect(upsertWhatsappConfigMock).not.toHaveBeenCalled();
  });
});

describe("Tier 3 — concurrent resilient reads", () => {
  test("concurrent resolutions all survive a DB outage via env fallback", async () => {
    envValues.set("WHATSAPP_APP_ID", ENV_APP_ID);
    envValues.set("WHATSAPP_APP_SECRET", ENV_SECRET);
    getWhatsappConfigMock.mockRejectedValue(new Error("pool exhausted"));

    const results = await Promise.all(Array.from({ length: 25 }, () => WhatsappConfigService.resolveConfiguration()));

    expect(results).toHaveLength(25);
    for (const config of results) {
      expect(config.source).toBe("env");
      expect(config.appId).toBe(ENV_APP_ID);
    }
    expect(getWhatsappConfigMock).toHaveBeenCalledTimes(25);
  });

  test("concurrent saves each reach the repository and all resolve", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, index) => WhatsappConfigService.saveConfiguration({ verifyToken: `tok-${index}` }))
    );

    expect(results).toHaveLength(20);
    expect(upsertWhatsappConfigMock).toHaveBeenCalledTimes(20);
  });
});

describe("Tier 4 — no credential leakage", () => {
  test("DB-outage fallback logs never contain credential values", async () => {
    envValues.set("WHATSAPP_APP_ID", ENV_APP_ID);
    envValues.set("WHATSAPP_APP_SECRET", ENV_SECRET);
    envValues.set("WHATSAPP_ACCESS_TOKEN", ENV_TOKEN);
    getWhatsappConfigMock.mockRejectedValue(new Error("connection refused"));

    await WhatsappConfigService.resolveConfiguration();

    const output = allLoggerOutput();
    expect(output).not.toContain(ENV_SECRET);
    expect(output).not.toContain(ENV_TOKEN);
    expect(output).not.toContain("secret_db_1");
    expect(output).not.toContain("Bearer");
  });

  test("connection-test results and logs never leak the token or Meta internals", async () => {
    envValues.set("WHATSAPP_ACCESS_TOKEN", ENV_TOKEN);
    envValues.set("WHATSAPP_PHONE_NUMBER_ID", "105");
    metaStatus = 401;
    metaBody = { error: { code: 190, message: "Invalid OAuth access token - booooo" } };

    const result = await WhatsappConfigService.testConnection("en");

    expect(result.message).toBe(errorsEn.whatsappConnectionTestFailed);
    const serialized = JSON.stringify(result) + allLoggerOutput();
    expect(serialized).not.toContain(ENV_TOKEN);
    expect(serialized).not.toContain("Bearer");
    expect(serialized).not.toContain("booooo");
  });

  test("a successful connection test exposes no token", async () => {
    envValues.set("WHATSAPP_ACCESS_TOKEN", ENV_TOKEN);
    envValues.set("WHATSAPP_PHONE_NUMBER_ID", "105");

    const result = await WhatsappConfigService.testConnection("en");

    expect(result.success).toBe(true);
    expect(JSON.stringify(result)).not.toContain(ENV_TOKEN);
  });

  test("a save failure surfaces the domain error, never the driver message", async () => {
    upsertWhatsappConfigMock.mockRejectedValue(new Error('duplicate key value violates unique constraint "x"'));

    const error = await expectRejection(WhatsappConfigService.saveConfiguration({ verifyToken: "tok" }));

    expect(error).toBeInstanceOf(DatabaseUnavailableError);
    expect(String(error)).not.toContain("duplicate key");
  });

  test("save-failure logs project drizzle driver errors — bound params never reach the log line", async () => {
    // Mirrors drizzle 1.0.0-rc.4's DrizzleQueryError: its own message embeds
    // the full bound parameters (here a fake plaintext verify-token marker),
    // which is exactly the credential-leak vector — the projection must keep
    // the message and params out of the log while keeping stable metadata.
    const TOKEN_MARKER = "leakme-plaintext-verify-token-0f3ab1";
    const driverError = Object.assign(
      new Error(`Failed query: insert into "whatsapp_configs" (...) values ('${TOKEN_MARKER}')`),
      {
        name: "DrizzleQueryError",
        query: 'insert into "whatsapp_configs"',
        params: { verifyToken: TOKEN_MARKER },
        cause: {
          code: "23505",
          detail: "Key (id)=(cfg_row_1) already exists.",
          message: "duplicate key value violates unique constraint",
        },
      }
    );
    upsertWhatsappConfigMock.mockRejectedValue(driverError);

    const error = await expectRejection(WhatsappConfigService.saveConfiguration({ verifyToken: TOKEN_MARKER }));

    expect(error).toBeInstanceOf(DatabaseUnavailableError);
    const output = allLoggerOutput();
    expect(output).not.toContain(TOKEN_MARKER);
    expect(output).not.toContain("Failed query");
    // Stable, non-sensitive metadata survives for operators.
    expect(output).toContain("DrizzleQueryError");
    expect(output).toContain("23505");
    expect(output).toContain("duplicate key value violates unique constraint");
  });
});
