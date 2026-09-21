import { describe, expect, test } from "bun:test";
import {
  decodeEncryptionKeyMaterial,
  generateCronSecret,
  generateDatabaseEncryptionKey,
  generateJwtSecret,
  isProductionEncryptionKeyAccepted,
  KNOWN_DEV_KEY_CONSTANT,
  parseArgs,
} from "@/scripts/generate-encryption-key";

describe("generate-encryption-key script", () => {
  describe("generateDatabaseEncryptionKey", () => {
    test("generates 64-char hex key that satisfies production validation", () => {
      const hexKey = generateDatabaseEncryptionKey("hex");
      expect(hexKey).toMatch(/^[0-9a-f]{64}$/);
      expect(isProductionEncryptionKeyAccepted(hexKey)).toBe(true);

      const decoded = decodeEncryptionKeyMaterial(hexKey);
      expect(decoded).not.toBeNull();
      expect(decoded?.length).toBe(32);
    });

    test("generates 44-char base64 key that satisfies production validation", () => {
      const base64Key = generateDatabaseEncryptionKey("base64");
      expect(base64Key).toHaveLength(44);
      expect(isProductionEncryptionKeyAccepted(base64Key)).toBe(true);

      const decoded = decodeEncryptionKeyMaterial(base64Key);
      expect(decoded).not.toBeNull();
      expect(decoded?.length).toBe(32);
    });

    test("generates distinct keys on subsequent calls", () => {
      const key1 = generateDatabaseEncryptionKey("hex");
      const key2 = generateDatabaseEncryptionKey("hex");
      expect(key1).not.toBe(key2);
    });
  });

  describe("isProductionEncryptionKeyAccepted", () => {
    test("rejects known development key constant", () => {
      expect(isProductionEncryptionKeyAccepted(KNOWN_DEV_KEY_CONSTANT)).toBe(false);
    });

    test("rejects invalid or too short keys", () => {
      expect(isProductionEncryptionKeyAccepted("short")).toBe(false);
      expect(isProductionEncryptionKeyAccepted("")).toBe(false);
      expect(isProductionEncryptionKeyAccepted("a".repeat(32))).toBe(false);
    });
  });

  describe("parseArgs options", () => {
    test("defaults to writeEnv: false when run without write flags", () => {
      const options = parseArgs([]);
      expect(options.writeEnv).toBe(false);
      expect(options.targetEnvFiles).toHaveLength(0);
    });

    test("enables writeEnv with -w or --write", () => {
      expect(parseArgs(["-w"]).writeEnv).toBe(true);
      expect(parseArgs(["--write"]).writeEnv).toBe(true);
    });

    test("enables writeEnv and records target files with --env-file", () => {
      const options = parseArgs(["--env-file", ".env.custom"]);
      expect(options.writeEnv).toBe(true);
      expect(options.targetEnvFiles).toEqual([".env.custom"]);
    });

    test("supports multiple --env-file arguments", () => {
      const options = parseArgs(["--env-file", ".env", "--env-file", ".env.local"]);
      expect(options.writeEnv).toBe(true);
      expect(options.targetEnvFiles).toEqual([".env", ".env.local"]);
    });

    test("supports --env-file=<file> syntax", () => {
      const options = parseArgs(["--env-file=.env.production"]);
      expect(options.writeEnv).toBe(true);
      expect(options.targetEnvFiles).toEqual([".env.production"]);
    });
  });

  describe("generateJwtSecret & generateCronSecret", () => {
    test("generates JWT secret with at least 32 bytes (64 bytes hex)", () => {
      const jwtSecret = generateJwtSecret("hex");
      expect(jwtSecret).toMatch(/^[0-9a-f]{128}$/);
    });

    test("generates CRON secret with 32 bytes (64 chars hex)", () => {
      const cronSecret = generateCronSecret("hex");
      expect(cronSecret).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});
