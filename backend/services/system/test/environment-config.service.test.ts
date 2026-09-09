import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { auditLogs } from "@/backend/db/schema";
import { createTestUserWithDefaults, runInRollback } from "@/backend/db/test/test-utils";
import { AuditService } from "@/backend/services/system/audit.service";
import {
  auditEnvConfigChange,
  deleteEnvConfigOverride,
  invalidateEnvConfigCache,
  preWarmEnvConfigCache,
  resolveEnvConfig,
  toEnvSettingDbKey,
  upsertEnvConfigOverride,
} from "@/backend/services/system/environment-config.service";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

const TEST_KEY = "STORAGE_PROVIDER";
const TEST_KEY_2 = "FX_PROVIDER";

const originalEnv: Record<string, string | undefined> = {};

function saveEnv(key: string): void {
  originalEnv[key] = process.env[key];
}

function restoreEnv(): void {
  for (const [k, v] of Object.entries(originalEnv)) {
    if (v === undefined) {
      Reflect.deleteProperty(process.env, k);
    } else {
      process.env[k] = v;
    }
  }
}

function unsetEnv(key: string): void {
  Reflect.deleteProperty(process.env, key);
}

function setupEnvAndPreWarm(key: string, envValue: string): void {
  process.env[key] = envValue;
  preWarmEnvConfigCache();
}

function mockRepoNull() {
  return spyOn(SystemSettingsRepository, "getByKey").mockResolvedValue(null);
}

/** Mirrors the repo-wide rejection-assertion idiom (typed helper, no matcher overloads). */
async function expectRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected the call to reject, but it resolved");
}

/** Assertion-safe message extraction from an unknown thrown value. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const DB_OVERRIDE_MOCK = {
  key: "env::STORAGE_PROVIDER",
  value: "gcs",
  dataType: SystemSettingDataType.String,
  description: "Storage provider override",
  category: SystemSettingCategory.Storage,
  updatedByUserId: null,
  updatedAt: new Date(),
};

describe("environment-config.service — pre-warm cache", () => {
  beforeEach(() => {
    saveEnv(TEST_KEY);
    saveEnv(TEST_KEY_2);
    invalidateEnvConfigCache();
  });

  afterEach(() => {
    restoreEnv();
  });

  test("preWarmEnvConfigCache populates cache for env-fallback keys, DB miss reuses cached value", async () => {
    setupEnvAndPreWarm(TEST_KEY, "s3");

    const spy = mockRepoNull();

    const result = await resolveEnvConfig(TEST_KEY);

    // Pre-warmed "env" entries are non-authoritative — DB lookup runs to check for overrides.
    // DB misses → cached env value is reused (no redundant process.env read).
    expect(result).toBe("s3");
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  test("preWarmEnvConfigCache skips keys without env value", async () => {
    unsetEnv(TEST_KEY);

    preWarmEnvConfigCache();

    const spy = mockRepoNull();

    const result = await resolveEnvConfig(TEST_KEY);

    expect(result).toBeUndefined();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  test("resolveEnvConfig returns pre-warmed value on DB miss (cached env reuse)", async () => {
    setupEnvAndPreWarm(TEST_KEY_2, "fixer");

    const spy = mockRepoNull();

    const result = await resolveEnvConfig(TEST_KEY_2);

    // Pre-warmed "env" entries fall through to DB lookup; DB miss reuses cached env value.
    expect(result).toBe("fixer");
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  test("DB override takes precedence over pre-warmed env value", async () => {
    setupEnvAndPreWarm(TEST_KEY, "s3");

    const spy = spyOn(SystemSettingsRepository, "getByKey").mockResolvedValue(DB_OVERRIDE_MOCK);

    const result = await resolveEnvConfig(TEST_KEY);

    // DB override wins over pre-warmed env value (dbValue ?? envValue precedence).
    expect(result).toBe("gcs");
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  test("second resolveEnvConfig call uses db-sourced cache hit (no DB query)", async () => {
    setupEnvAndPreWarm(TEST_KEY, "s3");

    const spy = mockRepoNull();

    // First call: DB lookup runs (env-tagged entry is non-authoritative).
    await resolveEnvConfig(TEST_KEY);
    // Second call: cache entry is now source="db" → cache hit short-circuits, no DB query.
    await resolveEnvConfig(TEST_KEY);

    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  test("DB override works after cache invalidation", async () => {
    setupEnvAndPreWarm(TEST_KEY, "s3");

    invalidateEnvConfigCache(TEST_KEY);

    const spy = spyOn(SystemSettingsRepository, "getByKey").mockResolvedValue(DB_OVERRIDE_MOCK);

    const result = await resolveEnvConfig(TEST_KEY);

    expect(result).toBe("gcs");
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});

// ─── Tx-aware variants (real DB, rolled back) ───────────────────────────────────

const ENV_DB_KEY = toEnvSettingDbKey(TEST_KEY);

/**
 * Defensive cleanup for the tx tests: the baseline for `env::STORAGE_PROVIDER`
 * is an ABSENT row, so any leftover from an aborted run is removed first. Only
 * this test-owned key is touched — never other `env::` rows.
 */
async function removeTestOverrideRow(): Promise<void> {
  await SystemSettingsRepository.deleteSetting(ENV_DB_KEY);
}

describe("environment-config.service — tx-aware variants (rolled-back transactions)", () => {
  test("upsertEnvConfigOverride persists within the caller's tx and is rollback-proof", async () => {
    await removeTestOverrideRow();

    await runInRollback(async tx => {
      const result = await upsertEnvConfigOverride({ key: TEST_KEY, value: "tx-upsert-value" }, tx);

      // Visible INSIDE the caller's transaction (same connection).
      const inTx = await SystemSettingsRepository.getByKey(ENV_DB_KEY, tx);
      expect(inTx?.value).toBe("tx-upsert-value");
      // The returned metadata mirrors the stored row (`.returning()` —
      // including the stored updatedAt, not a fabricated clock read).
      expect(inTx?.updatedAt).toEqual(result.updatedAt);
      expect(result.source).toBe("db");
      expect(result.hasDbOverride).toBe(true);

      // NOT visible outside the transaction — a plain read on a separate
      // connection still sees no committed row.
      const outside = await SystemSettingsRepository.getByKey(ENV_DB_KEY);
      expect(outside).toBeNull();
    });

    // Rollback-proof: the tx rolled back → the override row is absent.
    const afterRollback = await SystemSettingsRepository.getByKey(ENV_DB_KEY);
    expect(afterRollback).toBeNull();
  });

  test("deleteEnvConfigOverride joins the caller's tx and the delete rolls back with it", async () => {
    await removeTestOverrideRow();

    await runInRollback(async tx => {
      // The delete must observe the tx's OWN uncommitted write: the row only
      // exists inside this transaction.
      await upsertEnvConfigOverride({ key: TEST_KEY, value: "tx-value-to-delete" }, tx);

      const result = await deleteEnvConfigOverride(TEST_KEY, tx);
      expect(result.deleted).toBe(true);

      const inTx = await SystemSettingsRepository.getByKey(ENV_DB_KEY, tx);
      expect(inTx).toBeNull();
    });

    // Rollback-proof: the in-tx upsert AND its delete rolled back together —
    // the override store is exactly as it was before the transaction.
    const afterRollback = await SystemSettingsRepository.getByKey(ENV_DB_KEY);
    expect(afterRollback).toBeNull();
  });

  test("auditEnvConfigChange writes inside the caller's tx and rolls back with it", async () => {
    const outsideBefore = await db.select().from(auditLogs).where(eq(auditLogs.entityId, ENV_DB_KEY));

    await runInRollback(async tx => {
      const actor = await createTestUserWithDefaults(tx);

      await auditEnvConfigChange(actor.id, "upsert", TEST_KEY, "prior-value", "next-value", tx);

      // Visible INSIDE the caller's transaction (same connection).
      const inTx = await tx.select().from(auditLogs).where(eq(auditLogs.entityId, ENV_DB_KEY));
      expect(inTx).toHaveLength(1);
      const audit = inTx[0];
      expect(audit?.actorUserId).toBe(actor.id);
      expect(audit?.action).toBe("UPDATE");
      expect(audit?.previousState).toEqual({ value: "prior-value" });
      expect(audit?.newState).toEqual({ value: "next-value" });
      expect(audit?.metadata).toEqual({ event: "env_config.upsert", key: TEST_KEY });

      // NOT visible outside the transaction (separate connection) — the audit
      // row was not committed early.
      const outsideDuring = await db.select().from(auditLogs).where(eq(auditLogs.entityId, ENV_DB_KEY));
      expect(outsideDuring).toHaveLength(outsideBefore.length);
    });

    // Rollback-proof: the tx rolled back → no audit row was persisted.
    const afterRollback = await db.select().from(auditLogs).where(eq(auditLogs.entityId, ENV_DB_KEY));
    expect(afterRollback).toHaveLength(outsideBefore.length);
  });

  test("auditEnvConfigChange with tx RETHROWS an audit write failure (caller tx aborts)", async () => {
    const outsideBefore = await db.select().from(auditLogs).where(eq(auditLogs.entityId, ENV_DB_KEY));
    const auditSpy = spyOn(AuditService, "createManyAuditLogs").mockRejectedValue(new Error("audit write failed"));

    try {
      await runInRollback(async tx => {
        // The in-tx fail-safe: the audited mutation commits with its audit row
        // or not at all — an audit failure must surface into the caller (and
        // abort the transaction), never be swallowed.
        const error = await expectRejection(
          auditEnvConfigChange("actor-1", "upsert", TEST_KEY, "prior-value", "next-value", tx)
        );
        expect(messageOf(error)).toBe("audit write failed");
      });
    } finally {
      auditSpy.mockRestore();
    }

    // Fail-safe held: the aborted tx persisted nothing.
    const afterRollback = await db.select().from(auditLogs).where(eq(auditLogs.entityId, ENV_DB_KEY));
    expect(afterRollback).toHaveLength(outsideBefore.length);
  });

  test("auditEnvConfigChange without tx SWALLOWS an audit write failure (best-effort)", async () => {
    const outsideBefore = await db.select().from(auditLogs).where(eq(auditLogs.entityId, ENV_DB_KEY));
    const auditSpy = spyOn(AuditService, "createManyAuditLogs").mockRejectedValue(new Error("audit write failed"));

    try {
      // Post-hoc side effect (the sibling env-tab path): a failed audit write
      // is logged-only — the caller's operation stands without its audit row.
      // The failure must be swallowed (no throw) rather than surfaced.
      const result = await auditEnvConfigChange("actor-1", "upsert", TEST_KEY, "prior-value", "next-value");
      expect(result).toBeUndefined();
    } finally {
      auditSpy.mockRestore();
    }

    // Best-effort held: the swallowed failure persisted no audit row.
    const afterCall = await db.select().from(auditLogs).where(eq(auditLogs.entityId, ENV_DB_KEY));
    expect(afterCall).toHaveLength(outsideBefore.length);
  });
});
