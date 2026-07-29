import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { isTestHelperEnabled } from "@/backend/lib/test-helper-gate";

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

describe("isTestHelperEnabled", () => {
  test("allows local development", () => {
    setEnv("NODE_ENV", "development");
    expect(isTestHelperEnabled()).toBe(true);
  });

  test("allows test NODE_ENV", () => {
    setEnv("NODE_ENV", "test");
    expect(isTestHelperEnabled()).toBe(true);
  });

  test("blocks production NODE_ENV without test harness flags", () => {
    setEnv("NODE_ENV", "production");
    expect(isTestHelperEnabled()).toBe(false);
  });

  test("allows production NODE_ENV on dedicated test server", () => {
    setEnv("NODE_ENV", "production");
    setEnv("TEST_SERVER", "1");
    expect(isTestHelperEnabled()).toBe(true);
  });

  test("allows production NODE_ENV in CI test jobs", () => {
    setEnv("NODE_ENV", "production");
    setEnv("TEST_CI", "true");
    expect(isTestHelperEnabled()).toBe(true);
  });

  test("blocks Vercel production even when TEST_SERVER is set", () => {
    setEnv("NODE_ENV", "production");
    setEnv("TEST_SERVER", "1");
    setEnv("VERCEL_ENV", "production");
    expect(isTestHelperEnabled()).toBe(false);
  });

  test("blocks Vercel production even when TEST_CI is set", () => {
    setEnv("NODE_ENV", "development");
    setEnv("TEST_CI", "true");
    setEnv("VERCEL_ENV", "production");
    expect(isTestHelperEnabled()).toBe(false);
  });

  test("blocks Vercel production with no test flags", () => {
    setEnv("NODE_ENV", "production");
    setEnv("VERCEL_ENV", "production");
    expect(isTestHelperEnabled()).toBe(false);
  });

  test("blocks Vercel preview deployments running production NODE_ENV", () => {
    setEnv("NODE_ENV", "production");
    setEnv("VERCEL_ENV", "preview");
    expect(isTestHelperEnabled()).toBe(false);
  });
});
