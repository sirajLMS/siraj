import { describe, expect, test } from "bun:test";
import { ENV_CONFIG_KEYS, isEnvConfigKeyExposedInSettings } from "@/backend/lib/env-config-keys";
import { HIDDEN_ENV_CONFIG_KEYS } from "@/shared/constants/env-config-keys";

describe("env-config-keys", () => {
  test("hidden keys stay in sync with excludeFromDb registry entries", () => {
    const registryHiddenKeys: string[] = ENV_CONFIG_KEYS.filter(descriptor => descriptor.excludeFromDb).map(
      descriptor => descriptor.key
    );
    const sharedHiddenKeys: string[] = [...HIDDEN_ENV_CONFIG_KEYS];
    expect(registryHiddenKeys.sort()).toEqual(sharedHiddenKeys.sort());
  });

  test("hidden keys are env-only and never exposed in settings", () => {
    expect(HIDDEN_ENV_CONFIG_KEYS).toContain("ADMIN_EMAIL");
    expect(HIDDEN_ENV_CONFIG_KEYS).toContain("DATABASE_URL");
    expect(HIDDEN_ENV_CONFIG_KEYS).toContain("JWT_SECRET");

    for (const key of HIDDEN_ENV_CONFIG_KEYS) {
      const descriptor = ENV_CONFIG_KEYS.find(entry => entry.key === key);
      expect(descriptor).toBeDefined();
      if (!descriptor) {
        continue;
      }
      expect(descriptor.excludeFromDb).toBeTrue();
      expect(isEnvConfigKeyExposedInSettings(descriptor)).toBeFalse();
    }
  });

  test("db-manageable keys remain exposed in settings", () => {
    const storageProvider = ENV_CONFIG_KEYS.find(entry => entry.key === "STORAGE_PROVIDER");
    expect(storageProvider).toBeDefined();
    if (!storageProvider) {
      return;
    }
    expect(isEnvConfigKeyExposedInSettings(storageProvider)).toBeTrue();
  });
});
