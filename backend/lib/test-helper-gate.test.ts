import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { isTestHelperEnabled } from "@/backend/lib/test-helper-gate";

const ENV_KEYS = ["NODE_ENV", "TEST_SERVER", "TEST_CI", "VERCEL_ENV", "TEST_HARNESS_KEY"] as const;

const originalEnv: Record<string, string | undefined> = {};

function setEnv(key: string, value: string | undefined): void {
  Reflect.defineProperty(process.env, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
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
  test("allows dedicated test server (TEST_SERVER=1)", () => {
    setEnv("TEST_SERVER", "1");
    expect(isTestHelperEnabled()).toBe(true);
  });

  test("allows CI test jobs (TEST_CI=true)", () => {
    setEnv("TEST_CI", "true");
    expect(isTestHelperEnabled()).toBe(true);
  });

  test("blocks local development without test harness flags", () => {
    setEnv("NODE_ENV", "development");
    expect(isTestHelperEnabled()).toBe(false);
  });

  test("blocks test NODE_ENV without test harness flags", () => {
    setEnv("NODE_ENV", "test");
    expect(isTestHelperEnabled()).toBe(false);
  });

  test("blocks production NODE_ENV without test harness flags", () => {
    setEnv("NODE_ENV", "production");
    expect(isTestHelperEnabled()).toBe(false);
  });

  test("allows dedicated test server with production NODE_ENV and valid TEST_HARNESS_KEY", () => {
    setEnv("NODE_ENV", "production");
    setEnv("TEST_SERVER", "1");
    setEnv("TEST_HARNESS_KEY", "a".repeat(32));
    expect(isTestHelperEnabled()).toBe(true);
  });

  test("blocks production NODE_ENV test server without TEST_HARNESS_KEY", () => {
    setEnv("NODE_ENV", "production");
    setEnv("TEST_SERVER", "1");
    expect(isTestHelperEnabled()).toBe(false);
  });

  test("blocks production NODE_ENV test server with too-short TEST_HARNESS_KEY", () => {
    setEnv("NODE_ENV", "production");
    setEnv("TEST_SERVER", "1");
    setEnv("TEST_HARNESS_KEY", "a".repeat(31));
    expect(isTestHelperEnabled()).toBe(false);
  });

  test("blocks Vercel production even when TEST_SERVER is set", () => {
    setEnv("TEST_SERVER", "1");
    setEnv("VERCEL_ENV", "production");
    expect(isTestHelperEnabled()).toBe(false);
  });

  test("blocks Vercel production even when TEST_CI is set", () => {
    setEnv("TEST_CI", "true");
    setEnv("VERCEL_ENV", "production");
    expect(isTestHelperEnabled()).toBe(false);
  });

  test("blocks Vercel production with no test flags", () => {
    setEnv("VERCEL_ENV", "production");
    expect(isTestHelperEnabled()).toBe(false);
  });

  test("blocks Vercel preview deployments even when TEST_SERVER is set", () => {
    setEnv("TEST_SERVER", "1");
    setEnv("VERCEL_ENV", "preview");
    expect(isTestHelperEnabled()).toBe(false);
  });
});
