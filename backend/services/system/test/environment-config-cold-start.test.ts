import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { makeTransientError } from "@/backend/lib/test/helpers";
import { invalidateEnvConfigCache, resolveEnvConfig } from "@/backend/services/system/environment-config.service";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

const TEST_KEY = "STORAGE_PROVIDER";

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

describe("environment-config cold-start resilience", () => {
  beforeEach(() => {
    saveEnv(TEST_KEY);
    invalidateEnvConfigCache();
  });

  afterEach(() => {
    restoreEnv();
  });

  test("DB transient failure falls back to process.env", async () => {
    process.env[TEST_KEY] = "s3";

    const spy = spyOn(SystemSettingsRepository, "getByKey").mockRejectedValueOnce(
      makeTransientError("ETIMEDOUT", "connect ETIMEDOUT")
    );

    const result = await resolveEnvConfig(TEST_KEY);

    expect(result).toBe("s3");
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  test("DB transient failure caches with short TTL — second call within 30s does NOT re-query DB (throttle)", async () => {
    process.env[TEST_KEY] = "s3";

    const spy = spyOn(SystemSettingsRepository, "getByKey").mockRejectedValue(
      makeTransientError("ETIMEDOUT", "connect ETIMEDOUT")
    );

    await resolveEnvConfig(TEST_KEY);
    await resolveEnvConfig(TEST_KEY);

    // Transient "env" entries now short-circuit within the short TTL window (30s)
    // to throttle re-queries against a failing DB (prevents thundering herd).
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  test("DB success caches as source=db (authoritative) — second call does NOT query DB", async () => {
    process.env[TEST_KEY] = "s3";

    const spy = spyOn(SystemSettingsRepository, "getByKey").mockResolvedValue(null);

    await resolveEnvConfig(TEST_KEY);
    await resolveEnvConfig(TEST_KEY);

    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  test("DB non-transient failure still tags as source=env (non-authoritative)", async () => {
    process.env[TEST_KEY] = "s3";

    const spy = spyOn(SystemSettingsRepository, "getByKey").mockRejectedValue(
      new Error("relation system_settings does not exist")
    );

    const result = await resolveEnvConfig(TEST_KEY);

    expect(result).toBe("s3");

    await resolveEnvConfig(TEST_KEY);

    expect(spy).toHaveBeenCalledTimes(2);

    spy.mockRestore();
  });

  test("DB override picked up after cold-start recovery", async () => {
    process.env[TEST_KEY] = "s3";

    const spy = spyOn(SystemSettingsRepository, "getByKey");

    spy.mockRejectedValueOnce(makeTransientError("ETIMEDOUT", "connect ETIMEDOUT"));
    spy.mockResolvedValueOnce({
      key: "env::STORAGE_PROVIDER",
      value: "gcs",
      dataType: SystemSettingDataType.String,
      description: "Storage provider override",
      category: SystemSettingCategory.Storage,
      updatedByUserId: null,
      updatedAt: new Date(),
    });

    const result1 = await resolveEnvConfig(TEST_KEY);
    expect(result1).toBe("s3");

    // Invalidate cache to simulate recovery after the short TTL window expires
    invalidateEnvConfigCache();

    const result2 = await resolveEnvConfig(TEST_KEY);
    expect(result2).toBe("gcs");

    spy.mockRestore();
  });
});
