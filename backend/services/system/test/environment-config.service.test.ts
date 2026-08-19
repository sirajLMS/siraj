import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import {
  invalidateEnvConfigCache,
  preWarmEnvConfigCache,
  resolveEnvConfig,
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
    process.env[TEST_KEY] = "s3";

    preWarmEnvConfigCache();

    const spy = spyOn(SystemSettingsRepository, "getByKey").mockResolvedValue(null);

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

    const spy = spyOn(SystemSettingsRepository, "getByKey").mockResolvedValue(null);

    const result = await resolveEnvConfig(TEST_KEY);

    expect(result).toBeUndefined();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  test("resolveEnvConfig returns pre-warmed value on DB miss (cached env reuse)", async () => {
    process.env[TEST_KEY_2] = "fixer";

    preWarmEnvConfigCache();

    const spy = spyOn(SystemSettingsRepository, "getByKey").mockResolvedValue(null);

    const result = await resolveEnvConfig(TEST_KEY_2);

    // Pre-warmed "env" entries fall through to DB lookup; DB miss reuses cached env value.
    expect(result).toBe("fixer");
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  test("DB override takes precedence over pre-warmed env value", async () => {
    process.env[TEST_KEY] = "s3";

    preWarmEnvConfigCache();

    const spy = spyOn(SystemSettingsRepository, "getByKey").mockResolvedValue({
      key: "env::STORAGE_PROVIDER",
      value: "gcs",
      dataType: SystemSettingDataType.String,
      description: "Storage provider override",
      category: SystemSettingCategory.Storage,
      updatedByUserId: null,
      updatedAt: new Date(),
    });

    const result = await resolveEnvConfig(TEST_KEY);

    // DB override wins over pre-warmed env value (dbValue ?? envValue precedence).
    expect(result).toBe("gcs");
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  test("second resolveEnvConfig call uses db-sourced cache hit (no DB query)", async () => {
    process.env[TEST_KEY] = "s3";

    preWarmEnvConfigCache();

    const spy = spyOn(SystemSettingsRepository, "getByKey").mockResolvedValue(null);

    // First call: DB lookup runs (env-tagged entry is non-authoritative).
    await resolveEnvConfig(TEST_KEY);
    // Second call: cache entry is now source="db" → cache hit short-circuits, no DB query.
    await resolveEnvConfig(TEST_KEY);

    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  test("DB override works after cache invalidation", async () => {
    process.env[TEST_KEY] = "s3";

    preWarmEnvConfigCache();

    invalidateEnvConfigCache(TEST_KEY);

    const spy = spyOn(SystemSettingsRepository, "getByKey").mockResolvedValue({
      key: "env::STORAGE_PROVIDER",
      value: "gcs",
      dataType: SystemSettingDataType.String,
      description: "Storage provider override",
      category: SystemSettingCategory.Storage,
      updatedByUserId: null,
      updatedAt: new Date(),
    });

    const result = await resolveEnvConfig(TEST_KEY);

    expect(result).toBe("gcs");
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});
