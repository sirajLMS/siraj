import { beforeEach, describe, expect, mock, test } from "bun:test";

// ---------------------------------------------------------------------------
// Mock state (reset per test)
// ---------------------------------------------------------------------------

const getWhatsappConfigMock = mock(async (): Promise<unknown> => null);
const upsertWhatsappConfigMock = mock(
  async (input: Record<string, unknown>): Promise<unknown> => ({ id: "cfg_stored_1", ...input })
);

/** Mutable env-config values resolved per test. */
const envValues = new Map<string, string | undefined>();

/** Controllable Meta response for the phone-number endpoint. */
let metaStatus = 200;
let metaBody: unknown = { id: "105", display_phone_number: "+1 555 000 0000" };

const fetchUrls: string[] = [];
const fetchAuthHeaders: (string | undefined)[] = [];

const fetchMock = mock(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
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

await mock.module("@/backend/services/system", () => ({
  ...actualSystem,
  resolveEnvConfig: async (key: string) => envValues.get(key),
  resolveEnvConfigMany: async (keys: string[]) => {
    const result: Record<string, string | undefined> = {};
    for (const key of keys) result[key] = envValues.get(key);
    return result;
  },
  invalidateEnvConfigCache: () => {},
}));

// ---------------------------------------------------------------------------
// SUT + fixtures
// ---------------------------------------------------------------------------

const { WhatsappConfigService } = await import("@/backend/services/whatsapp/whatsapp-config.service");
const { DatabaseUnavailableError } = await import("@/backend/lib");
const { errorsEn } = await import("@/shared/locale/en/errors");

const DB_ROW = {
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

/** Flattens all recorded logger output into one string for leak scans. */
function allLoggerOutput(): string {
  return loggerCalls.map(call => call.args.map(arg => String(arg)).join(" | ")).join("\n");
}

/** Assertion-safe message extraction from an unknown thrown value. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

beforeEach(() => {
  metaStatus = 200;
  metaBody = { id: "105", display_phone_number: "+1 555 000 0000" };
  envValues.clear();
  fetchUrls.length = 0;
  fetchAuthHeaders.length = 0;
  loggerCalls.length = 0;
  getWhatsappConfigMock.mockReset();
  getWhatsappConfigMock.mockResolvedValue(null);
  upsertWhatsappConfigMock.mockReset();
  upsertWhatsappConfigMock.mockImplementation(
    async (input: Record<string, unknown>): Promise<unknown> => ({ id: "cfg_stored_1", ...input })
  );
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

  test("explicit null clears a field; absent fields stay untouched", async () => {
    await WhatsappConfigService.saveConfiguration({ wabaId: null });

    const payload = upsertWhatsappConfigMock.mock.calls[0][0];
    expect(payload.wabaId).toBeNull();
    expect("appId" in payload).toBe(false);
    expect("accessToken" in payload).toBe(false);
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

describe("generateVerifyToken", () => {
  test("produces 48-character lowercase hex tokens", () => {
    const token = WhatsappConfigService.generateVerifyToken();

    expect(token).toMatch(/^[0-9a-f]{48}$/);
    expect(token.length).toBe(48);
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

    expect(error).toBeInstanceOf(Error);
    expect(messageOf(error)).toBe(errorsEn.invalidInput);
    expect(upsertWhatsappConfigMock).not.toHaveBeenCalled();
  });

  test("a malformed actor id is rejected without touching the DB", async () => {
    const error = await expectRejection(
      WhatsappConfigService.saveConfiguration({ verifyToken: "tok" }, { actorUserId: "not-a-uuid" })
    );

    expect((error as Error).message).toBe(errorsEn.invalidInput);
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
});
