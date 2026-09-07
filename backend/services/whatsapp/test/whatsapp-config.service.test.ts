import { beforeEach, describe, expect, mock, test } from "bun:test";

import { seedOrGet as seedOrGetWhatsappConfig } from "@/backend/db/seeds/whatsapp/seed-whatsapp-config";
import { WHATSAPP_CONFIG_FIELD_MAX_LENGTHS } from "@/backend/lib/whatsapp-constants";
import type {
  DBTransaction,
  SystemSettingSelectType,
  WhatsappConfigSeedInput,
  WhatsappConfigSelectType,
} from "@/backend/types";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

// ---------------------------------------------------------------------------
// Mock state (reset per test)
// ---------------------------------------------------------------------------

const getWhatsappConfigMock = mock(async (): Promise<unknown> => null);

/** Opaque transaction token the repo mock hands to the merged-row hook. */
const TX_TOKEN = { tx: "test-transaction" };
/** Rows that reached the mock's commit point (hook succeeded) — rollback proofs. */
const persistedRows: Record<string, unknown>[] = [];

const upsertWhatsappConfigMock = mock(
  async (
    input: Record<string, unknown>,
    _tx?: unknown,
    onMergedRow?: (t: unknown, mergedRow: Record<string, unknown>) => Promise<void>
  ): Promise<unknown> => {
    const row = { id: "cfg_stored_1", ...input };
    await onMergedRow?.(TX_TOKEN, row);
    persistedRows.push(row);
    return row;
  }
);

/** Env-config override writes recorded per test (key → last value). */
const envOverrideUpserts = new Map<string, string>();
/** Env-config override deletions recorded per test. */
const envOverrideDeletes: string[] = [];
/** Env-config cache invalidations recorded per test. */
const envCacheInvalidations: string[] = [];

/**
 * The env-config audit rows the (real) `auditEnvConfigChange` helper writes —
 * the structural subset of `CreateAuditLogInput` the assertions read back.
 */
interface EnvConfigAuditLogInput {
  actorUserId: string;
  actorType: string;
  action: string;
  entityId: string;
  previousState: unknown;
  newState: unknown;
  metadata: { event?: string } | null;
}

/** Audit-log inputs captured from the (real) env-config audit path. */
const auditLogInputs: EnvConfigAuditLogInput[] = [];

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
// re-exports. The typed empty-patch error is part of the module's public
// surface (the service rethrows it), so the mock carries a matching stub.
class WhatsappConfigEmptyPatchErrorStub extends Error {
  constructor() {
    super("No configuration to update: the upsert patch is empty and no whatsapp_configs row exists.");
    this.name = "WhatsappConfigEmptyPatchError";
  }
}

void mock.module("@/backend/db/repo/whatsapp/whatsapp-config.repository", () => ({
  WhatsappConfigRepository: {
    getWhatsappConfig: getWhatsappConfigMock,
    upsertWhatsappConfig: upsertWhatsappConfigMock,
  },
  WhatsappConfigEmptyPatchError: WhatsappConfigEmptyPatchErrorStub,
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

// Audit sink — mocked at the direct specifier BEFORE the system barrel is
// imported, so the REAL `auditEnvConfigChange` (registry masking, "***" for
// secret keys) runs while its `AuditService` writes land in this recorder.
const createManyAuditLogsMock = mock(
  async (inputs: readonly EnvConfigAuditLogInput[], _tx?: unknown): Promise<unknown[]> => {
    auditLogInputs.push(...inputs);
    return [];
  }
);

await mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: {
    createManyAuditLogs: createManyAuditLogsMock,
    upsertManyAuditLogs: async (): Promise<unknown[]> => [],
    createManyAdminAuditLogs: async (): Promise<unknown[]> => [],
    upsertManyAdminAuditLogs: async (): Promise<unknown[]> => [],
  },
}));

// Prior-override store for the propagation's in-tx prior-value read
// (`SystemSettingsRepository.getByKey(dbKey, tx)`), keyed by the
// `env::<KEY>` storage key. Mocked at the direct specifier so the REAL
// env-config service/audit path keeps running while the reads land here.
const priorOverrideValues = new Map<string, string>();
// Typed with the REAL `SystemSettingsRepository.getByKey(key, tx?)` signature so
// recorded calls keep the transaction handle readable at `mock.calls[i][1]`.
const getByKeyMock = mock(async (key: string, _tx?: DBTransaction): Promise<SystemSettingSelectType | null> => {
  const priorValue = priorOverrideValues.get(key);
  if (priorValue === undefined) return null;
  return {
    key,
    value: priorValue,
    dataType: SystemSettingDataType.String,
    description: "",
    category: SystemSettingCategory.Communication,
    updatedByUserId: null,
    updatedAt: new Date(0),
  };
});

await mock.module("@/backend/db/repo/shared", () => ({
  SystemSettingsRepository: {
    getByKey: getByKeyMock,
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
  auditLogInputs.length = 0;
  persistedRows.length = 0;
  priorOverrideValues.clear();
  fetchUrls.length = 0;
  fetchAuthHeaders.length = 0;
  loggerCalls.length = 0;
  getWhatsappConfigMock.mockReset();
  getWhatsappConfigMock.mockResolvedValue(null);
  upsertWhatsappConfigMock.mockReset();
  upsertWhatsappConfigMock.mockImplementation(
    async (
      input: Record<string, unknown>,
      _tx?: unknown,
      onMergedRow?: (t: unknown, mergedRow: Record<string, unknown>) => Promise<void>
    ): Promise<unknown> => {
      const row = { id: "cfg_stored_1", ...input };
      await onMergedRow?.(TX_TOKEN, row);
      persistedRows.push(row);
      return row;
    }
  );
  upsertEnvConfigOverrideMock.mockClear();
  deleteEnvConfigOverrideMock.mockClear();
  invalidateEnvConfigCacheMock.mockClear();
  createManyAuditLogsMock.mockClear();
  getByKeyMock.mockClear();
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

/** Clears the seed env vars (module scope: captures nothing, per consistent-function-scoping). */
function removeSeedEnvVars(): void {
  delete process.env.WHATSAPP_APP_ID;
  delete process.env.WHATSAPP_APP_SECRET;
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

  test("a payload carrying an unknown key is rejected without touching the DB", async () => {
    // Simulates a renamed/unknown field in a hand-built payload: the
    // normalizer must reject it loudly instead of silently dropping it (a
    // dropped field would make the admin believe a value was saved).
    const payload: WhatsappConfigSeedInput = { verifyToken: "tok_ui_1" };
    Object.assign(payload, { rogueField: "would-be-silently-dropped" });

    const error = await expectRejection(WhatsappConfigService.saveConfiguration(payload, { locale: "en" }));

    expect(error).toBeInstanceOf(ValidationError);
    expect(messageOf(error)).toBe(errorsEn.invalidInput);
    expect(upsertWhatsappConfigMock).not.toHaveBeenCalled();
    expect(envOverrideUpserts.size).toBe(0);
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
  /**
   * Installs a repo mock that merges the patch onto the stored row (the
   * existing-row save shape) before invoking the merged-row hook — the
   * production repo computes the FINAL MERGED ROW inside its transaction and
   * hands it to the propagation.
   */
  function withExistingRowMerge(): void {
    upsertWhatsappConfigMock.mockImplementation(
      async (
        input: Record<string, unknown>,
        _tx?: unknown,
        onMergedRow?: (t: unknown, mergedRow: Record<string, unknown>) => Promise<void>
      ): Promise<WhatsappConfigSelectType> => {
        const merged = { ...DB_ROW, ...input };
        await onMergedRow?.(TX_TOKEN, merged);
        persistedRows.push(merged);
        return merged;
      }
    );
  }

  test("propagates ALL writable fields of the final merged row, not just the patch", async () => {
    withExistingRowMerge();
    await WhatsappConfigService.saveConfiguration({ verifyToken: "tok_ui_1" });

    // Untouched fields are reconciled from the stored row — stale overrides
    // for non-patched fields cannot survive a save.
    // A row credential column is `string | null` — `?? undefined` normalizes
    // the null case to the map's `undefined` (no override value) so the
    // `toBe` argument type matches the received `string | undefined`.
    expect(envOverrideUpserts.get("WHATSAPP_APP_ID")).toBe(DB_ROW.appId ?? undefined);
    expect(envOverrideUpserts.get("WHATSAPP_APP_SECRET")).toBe(DB_ROW.appSecret ?? undefined);
    expect(envOverrideUpserts.get("WHATSAPP_VERIFY_TOKEN")).toBe("tok_ui_1");
    expect(envOverrideUpserts.get("WHATSAPP_PHONE_NUMBER_ID")).toBe(DB_ROW.phoneNumberId ?? undefined);
    expect(envOverrideUpserts.get("WHATSAPP_WABA_ID")).toBe(DB_ROW.wabaId ?? undefined);
    // A null field of the merged row deletes its override (no stale copy).
    expect(envOverrideDeletes).toContain("WHATSAPP_ES_CONFIG_ID");
    expect(envOverrideUpserts.has("WHATSAPP_ES_CONFIG_ID")).toBe(false);
    // The access token is never written through (excludeFromDb hard contract).
    expect(envOverrideUpserts.has("WHATSAPP_ACCESS_TOKEN")).toBe(false);
    expect(envOverrideDeletes).not.toContain("WHATSAPP_ACCESS_TOKEN");
    // Cache invalidation covers every propagated key, still never the token.
    expect(envCacheInvalidations).toEqual(
      expect.arrayContaining([
        "WHATSAPP_APP_ID",
        "WHATSAPP_APP_SECRET",
        "WHATSAPP_VERIFY_TOKEN",
        "WHATSAPP_PHONE_NUMBER_ID",
        "WHATSAPP_WABA_ID",
        "WHATSAPP_ES_CONFIG_ID",
      ])
    );
    expect(envCacheInvalidations).not.toContain("WHATSAPP_ACCESS_TOKEN");
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

  test("an override write failure fails the save and rolls the row back — no silent divergence", async () => {
    upsertEnvConfigOverrideMock.mockRejectedValueOnce(new Error("override write boom"));

    const error = await expectRejection(
      WhatsappConfigService.saveConfiguration({ verifyToken: "tok_ui_marker_value" })
    );

    // The surfaced outcome: the mutation errors instead of returning success.
    expect(error).toBeInstanceOf(DatabaseUnavailableError);
    // Rollback proof: the row never reached the mock's commit point, so the
    // override store and the persisted row stay consistent.
    expect(persistedRows).toHaveLength(0);
    // Nothing committed — the pre-save override state is still authoritative,
    // so no cache invalidation was needed (and none ran).
    expect(envCacheInvalidations).toHaveLength(0);
    // The domain-error log carries the failure without the credential value.
    expect(allLoggerOutput()).not.toContain("tok_ui_marker_value");
  });

  test("an override delete failure fails the save as well (deletes are failure-atomic)", async () => {
    withExistingRowMerge(); // DB_ROW.esConfigId is null → delete path runs.
    deleteEnvConfigOverrideMock.mockRejectedValueOnce(new Error("override delete boom"));

    const error = await expectRejection(WhatsappConfigService.saveConfiguration({ verifyToken: "tok_ui_1" }));

    expect(error).toBeInstanceOf(DatabaseUnavailableError);
    expect(persistedRows).toHaveLength(0);
  });

  test("propagation runs inside the upsert and saves serialize on the lock", async () => {
    const events: string[] = [];
    // Emulates the repository's advisory lock: each upsert waits for the
    // previous one to finish (sequential lock acquisition), so a save's
    // propagation cannot interleave with another save's write window.
    let lockChain: Promise<unknown> = Promise.resolve();
    upsertWhatsappConfigMock.mockImplementation(
      (
        input: Record<string, unknown>,
        _tx?: unknown,
        onMergedRow?: (t: unknown, mergedRow: Record<string, unknown>) => Promise<void>
      ): Promise<unknown> => {
        const run = async (): Promise<WhatsappConfigSelectType> => {
          const row: WhatsappConfigSelectType = { ...DB_ROW, id: "cfg_stored_1", ...input };
          const token = row.verifyToken;
          events.push(`begin:${token}`);
          await onMergedRow?.(TX_TOKEN, row);
          events.push(`commit:${token}`);
          persistedRows.push(row);
          return row;
        };
        const result = lockChain.then(run, run);
        lockChain = result.catch(() => undefined);
        return result;
      }
    );

    await Promise.all([
      WhatsappConfigService.saveConfiguration({ verifyToken: "tok-A" }),
      WhatsappConfigService.saveConfiguration({ verifyToken: "tok-B" }),
    ]);

    expect(persistedRows).toHaveLength(2);
    // The two write windows did not interleave: the event log strictly
    // alternates begin → commit → begin → commit (propagation happens inside
    // the lock window, not after it).
    expect(events).toHaveLength(4);
    expect(events[0]).toMatch(/^begin:/);
    expect(events[0]?.slice("begin:".length)).toBe(events[1]?.slice("commit:".length));
    expect(events[2]).toMatch(/^begin:/);
    expect(events[3]).toMatch(/^commit:/);
    // The override store ends up consistent with the WINNING row: the last
    // committed save's token is the one the overrides carry.
    const winner = events[3]?.slice("commit:".length);
    expect(envOverrideUpserts.get("WHATSAPP_VERIFY_TOKEN")).toBe(winner);
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

describe("saveConfiguration — env-config audit trail", () => {
  const ACTOR = "aaaa0001-aaaa-aaaa-aaaa-aaaa0001aaaa";

  function auditEntriesFor(event: string) {
    return auditLogInputs.filter(input => input.metadata?.event === event);
  }

  test("writes one audit entry per propagated key with the actor and masked secret values", async () => {
    // Prior overrides in system_settings: the audit must record what each
    // propagated write REPLACES — masked for secret keys, raw for non-secret
    // ones — instead of a phantom "no prior state".
    priorOverrideValues.set("env::WHATSAPP_APP_ID", "app_override_prior");
    priorOverrideValues.set("env::WHATSAPP_VERIFY_TOKEN", "tok_override_prior");
    priorOverrideValues.set("env::WHATSAPP_PHONE_NUMBER_ID", "phone_override_prior");

    await WhatsappConfigService.saveConfiguration(
      { appId: "app_ui_1", verifyToken: "tok_ui_1", phoneNumberId: "1050" },
      { actorUserId: ACTOR }
    );

    const upserts = auditEntriesFor("env_config.upsert");
    expect(upserts).toHaveLength(3);

    const byKey = new Map(upserts.map(entry => [entry.entityId, entry]));
    // Secret keys (registry isSecret) are masked to "***" — never plaintext.
    expect(byKey.get("env::WHATSAPP_APP_ID")?.newState).toEqual({ value: "***" });
    expect(byKey.get("env::WHATSAPP_VERIFY_TOKEN")?.newState).toEqual({ value: "***" });
    // Non-secret keys record the propagated value.
    expect(byKey.get("env::WHATSAPP_PHONE_NUMBER_ID")?.newState).toEqual({ value: "1050" });
    for (const entry of upserts) {
      expect(entry.actorUserId).toBe(ACTOR);
      expect(entry.actorType).toBe("USER");
    }
    // Prior-value fidelity: every replaced override is recorded — masked to
    // "***" for secret (isSecret) keys, raw for non-secret ones.
    expect(byKey.get("env::WHATSAPP_APP_ID")?.previousState).toEqual({ value: "***" });
    expect(byKey.get("env::WHATSAPP_VERIFY_TOKEN")?.previousState).toEqual({ value: "***" });
    expect(byKey.get("env::WHATSAPP_PHONE_NUMBER_ID")?.previousState).toEqual({ value: "phone_override_prior" });
    // The prior values were read in-tx (same tx handle the repo handed to the
    // propagation hook), one per audited key.
    expect(getByKeyMock.mock.calls.map(call => call[0])).toEqual(
      expect.arrayContaining(["env::WHATSAPP_APP_ID", "env::WHATSAPP_VERIFY_TOKEN", "env::WHATSAPP_PHONE_NUMBER_ID"])
    );
    for (const call of getByKeyMock.mock.calls) {
      // The recorded handle is widened to `unknown` for the identity check:
      // the mock's tx TYPE stays honest (real `tx?: DBTransaction` signature),
      // while toBe compares the handle against the propagation's token.
      const recordedTxHandle: unknown = call[1];
      expect(recordedTxHandle).toBe(TX_TOKEN);
    }
    // The audit writes joined the caller's transaction (same tx handle the
    // repo handed to the propagation hook).
    expect(createManyAuditLogsMock).toHaveBeenCalledTimes(3);
    expect(createManyAuditLogsMock.mock.calls[0][1]).toBe(TX_TOKEN);
  });

  test("a cleared field writes an env_config.delete audit entry with the removed prior value", async () => {
    priorOverrideValues.set("env::WHATSAPP_WABA_ID", "waba_override_prior");

    await WhatsappConfigService.saveConfiguration({ wabaId: null, verifyToken: "tok_ui_1" }, { actorUserId: ACTOR });

    const deletes = auditEntriesFor("env_config.delete");
    expect(deletes).toHaveLength(1);
    expect(deletes[0]?.entityId).toBe("env::WHATSAPP_WABA_ID");
    expect(deletes[0]?.actorUserId).toBe(ACTOR);
    expect(deletes[0]?.action).toBe("DELETE");
    // The delete audit records the override value that is being removed.
    expect(deletes[0]?.previousState).toEqual({ value: "waba_override_prior" });
    // A delete observes no new value.
    expect(deletes[0]?.newState).toBeNull();
  });

  test("without actor attribution no audit entries are written", async () => {
    await WhatsappConfigService.saveConfiguration({ verifyToken: "tok_ui_1" });

    expect(auditLogInputs).toHaveLength(0);
    // No audit → no prior-value reads either: unattributed saves stay read-free.
    expect(getByKeyMock).not.toHaveBeenCalled();
    // The propagation itself still ran.
    expect(envOverrideUpserts.get("WHATSAPP_VERIFY_TOKEN")).toBe("tok_ui_1");
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

  // Split per sonarjs/no-selector-parameter: dedicated setters instead of a
  // boolean selector choosing between the two actions.
  function installSeedEnvVars(): void {
    process.env.WHATSAPP_APP_ID = ENV_SEED_APP_ID;
    process.env.WHATSAPP_APP_SECRET = ENV_SEED_SECRET;
  }

  test("a pre-existing row is never re-persisted — env re-runs cannot revert admin-saved credentials", async () => {
    installSeedEnvVars();
    try {
      const persist = mock(async (): Promise<WhatsappConfigSelectType> => DB_ROW);

      const result = await seedOrGetWhatsappConfig({ hasExisting: async () => true, persist });

      expect(result).toBeUndefined();
      expect(persist).not.toHaveBeenCalled();
      expect(
        loggerCalls.some(call => call.level === "info" && JSON.stringify(call.args).includes("left untouched"))
      ).toBe(true);
    } finally {
      removeSeedEnvVars();
    }
  });

  test("an empty table persists the carried-over env fields", async () => {
    installSeedEnvVars();
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
      removeSeedEnvVars();
    }
  });

  test("a failing existence check fails safe — nothing is persisted", async () => {
    installSeedEnvVars();
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
      removeSeedEnvVars();
    }
  });

  test("without the existence gate the persist path is unchanged (backward compatible)", async () => {
    installSeedEnvVars();
    try {
      const persist = mock(async (): Promise<WhatsappConfigSelectType> => DB_ROW);

      await seedOrGetWhatsappConfig({ persist });

      expect(persist).toHaveBeenCalledTimes(1);
    } finally {
      removeSeedEnvVars();
    }
  });

  test("no WHATSAPP_* env vars set — skipped without any existence query", async () => {
    removeSeedEnvVars();
    const hasExisting = mock(async (): Promise<boolean> => true);
    const persist = mock(async (): Promise<WhatsappConfigSelectType> => DB_ROW);

    const result = await seedOrGetWhatsappConfig({ hasExisting, persist });

    expect(result).toBeUndefined();
    expect(hasExisting).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  test("carries the service-resolved values, not a raw process.env read (override-influenced)", async () => {
    // The raw env var holds a DIFFERENT value than the resolver returns — the
    // resolver models a `system_settings` override (DB-first resolution), and
    // the seed must carry the override, matching what enforcement resolves.
    process.env.WHATSAPP_APP_ID = "raw_env_app_id";
    try {
      const persist = mock(
        (_input: WhatsappConfigSeedInput): Promise<WhatsappConfigSelectType> => Promise.resolve(DB_ROW)
      );

      await seedOrGetWhatsappConfig({
        hasExisting: async () => false,
        resolveEnvValues: async () => ({ appId: "resolved_override_app_id" }),
        persist,
      });

      const payload = persist.mock.calls[0][0];
      expect(payload.appId).toBe("resolved_override_app_id");
    } finally {
      delete process.env.WHATSAPP_APP_ID;
    }
  });

  test("the service resolveEnvCarryOver helper feeds the seed end-to-end", async () => {
    // `envValues` drives the mocked `resolveEnvConfigMany` that the service's
    // carry-over helper resolves through.
    envValues.set("WHATSAPP_APP_ID", ENV_SEED_APP_ID);
    envValues.set("WHATSAPP_APP_SECRET", ENV_SEED_SECRET);
    const persist = mock(
      (_input: WhatsappConfigSeedInput): Promise<WhatsappConfigSelectType> => Promise.resolve(DB_ROW)
    );

    await seedOrGetWhatsappConfig({
      hasExisting: async () => false,
      resolveEnvValues: () => WhatsappConfigService.resolveEnvCarryOver(),
      persist,
    });

    const payload = persist.mock.calls[0][0];
    expect(payload.appId).toBe(ENV_SEED_APP_ID);
    expect(payload.appSecret).toBe(ENV_SEED_SECRET);
  });

  test("an over-length resolved value is skipped with a warning and seeding continues", async () => {
    const overLengthSecret = "s".repeat(WHATSAPP_CONFIG_FIELD_MAX_LENGTHS.appSecret + 1);
    const persist = mock(
      (_input: WhatsappConfigSeedInput): Promise<WhatsappConfigSelectType> => Promise.resolve(DB_ROW)
    );

    const result = await seedOrGetWhatsappConfig({
      hasExisting: async () => false,
      resolveEnvValues: async () => ({ appId: ENV_SEED_APP_ID, appSecret: overLengthSecret }),
      persist,
    });

    expect(result).toBeDefined();
    expect(persist).toHaveBeenCalledTimes(1);
    const payload = persist.mock.calls[0][0];
    expect(payload.appId).toBe(ENV_SEED_APP_ID);
    expect("appSecret" in payload).toBe(false);
    // The warning names the field only — the value is never logged.
    expect(loggerCalls.some(call => call.level === "warn" && JSON.stringify(call.args).includes("appSecret"))).toBe(
      true
    );
    expect(allLoggerOutput()).not.toContain(overLengthSecret);
  });

  test("all resolved values over length — the seed stands down without an existence query", async () => {
    const hasExisting = mock(async (): Promise<boolean> => true);
    const persist = mock(async (): Promise<WhatsappConfigSelectType> => DB_ROW);

    const result = await seedOrGetWhatsappConfig({
      hasExisting,
      resolveEnvValues: async () => ({ appSecret: "s".repeat(WHATSAPP_CONFIG_FIELD_MAX_LENGTHS.appSecret + 1) }),
      persist,
    });

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

  test("credential values containing control characters are rejected without touching the DB", async () => {
    const controlCharInputs: WhatsappConfigSeedInput[] = [
      { verifyToken: "tok\nwith-newline" },
      { verifyToken: "tok\twith-tab" },
      { appSecret: "sec\rwith-cr" },
      { appId: "app\u0000with-nul" },
      // Invisible format characters (Cf): bidi overrides and zero-width
      // characters pass a plain Cc-only pattern but must be rejected.
      { verifyToken: "tok\u202Ewith-bidi-override" },
      { verifyToken: "tok\u2066with-bidi-isolate" },
      { appSecret: "sec\u200Bwith-zero-width" },
      { appId: "app\uFEFFwith-bom" },
      // Line/paragraph separators (Zl/Zp) — the only line breaks outside Cc.
      { verifyToken: "tok\u2028with-line-separator" },
      { appSecret: "sec\u2029with-paragraph-separator" },
    ];

    const errors = await Promise.all(
      controlCharInputs.map(input => expectRejection(WhatsappConfigService.saveConfiguration(input, { locale: "en" })))
    );

    for (const error of errors) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(messageOf(error)).toBe(errorsEn.invalidInput);
    }
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
