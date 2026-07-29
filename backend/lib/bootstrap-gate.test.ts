import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { assertSeedWriteAllowed, isSeedWriteAllowed } from "@/backend/lib/bootstrap-gate";

const ENV_KEYS = ["NODE_ENV", "TEST_SERVER", "TEST_CI", "VERCEL_ENV"] as const;

const originalEnv: Record<string, string | undefined> = {};

function setEnv(key: string, value: string | undefined): void {
  Reflect.defineProperty(process.env, key, { value, writable: true, configurable: true });
}

function clearEnv(key: string): void {
  Reflect.deleteProperty(process.env, key);
}

beforeEach(() => {
  for (const key of ENV_KEYS) {
    originalEnv[key] = process.env[key];
    clearEnv(key);
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) {
      clearEnv(key);
    } else {
      setEnv(key, originalEnv[key]);
    }
  }
});

describe("isSeedWriteAllowed", () => {
  test("allows development NODE_ENV", () => {
    setEnv("NODE_ENV", "development");
    expect(isSeedWriteAllowed()).toBe(true);
  });

  test("blocks production NODE_ENV without test harness", () => {
    setEnv("NODE_ENV", "production");
    expect(isSeedWriteAllowed()).toBe(false);
  });

  test("allows production NODE_ENV on dedicated test server", () => {
    setEnv("NODE_ENV", "production");
    setEnv("TEST_SERVER", "1");
    expect(isSeedWriteAllowed()).toBe(true);
  });

  test("blocks Vercel production even on test server", () => {
    setEnv("NODE_ENV", "production");
    setEnv("TEST_SERVER", "1");
    setEnv("VERCEL_ENV", "production");
    expect(isSeedWriteAllowed()).toBe(false);
  });

  test("assertSeedWriteAllowed throws with operation label", () => {
    setEnv("NODE_ENV", "production");
    expect(() => assertSeedWriteAllowed("Demo user seed writes")).toThrow(
      "Demo user seed writes are not allowed in production."
    );
  });
});
