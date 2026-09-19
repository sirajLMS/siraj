import { describe, expect, test } from "bun:test";
import { isEncryptedFieldValue } from "@/backend/lib/env-config.helpers";
import { ENV_CONFIG_KEYS, isEnvConfigKeyExposedInSettings } from "@/backend/lib/env-config-keys";
import { HIDDEN_ENV_CONFIG_KEYS } from "@/shared/constants/env-config-keys";

describe("env-config-keys", () => {
  test("hidden keys stay in sync with excludeFromDb registry entries", () => {
    const registryHiddenKeys: string[] = ENV_CONFIG_KEYS.filter(descriptor => descriptor.excludeFromDb).map(
      descriptor => descriptor.key
    );
    const sharedHiddenKeys: string[] = [...HIDDEN_ENV_CONFIG_KEYS];
    const sortedRegistryKeys = registryHiddenKeys.toSorted((a, b) => a.localeCompare(b));
    const sortedSharedKeys = sharedHiddenKeys.toSorted((a, b) => a.localeCompare(b));
    expect(sortedRegistryKeys).toEqual(sortedSharedKeys);
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

  test("REDIS_URL is a secret that requests URL-credential masking in the Settings list path", () => {
    const redisUrl = ENV_CONFIG_KEYS.find(entry => entry.key === "REDIS_URL");
    expect(redisUrl).toBeDefined();
    expect(redisUrl?.maskUrlCredentials).toBe(true);
    expect(redisUrl?.isSecret).toBe(true);
  });
});

describe("isEncryptedFieldValue", () => {
  test("recognizes the encryptField ciphertext shape (versioned and legacy) and rejects plaintext", () => {
    expect(
      isEncryptedFieldValue("0123456789abcdef01234567:0123456789abcdef:0123456789abcdef0123456789abcdef")
    ).toBeTrue();
    expect(
      isEncryptedFieldValue("v1:0123456789abcdef01234567:0123456789abcdef:0123456789abcdef0123456789abcdef")
    ).toBeTrue();
    expect(isEncryptedFieldValue("plain-legacy-secret")).toBeFalse();
    expect(isEncryptedFieldValue("a:b:c")).toBeFalse();
    expect(isEncryptedFieldValue("010:123:4567")).toBeFalse();
    expect(isEncryptedFieldValue("v1:not-a-ciphertext")).toBeFalse();
    expect(isEncryptedFieldValue("")).toBeFalse();
  });
});
