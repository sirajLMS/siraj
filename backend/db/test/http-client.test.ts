import { afterEach, describe, expect, test } from "bun:test";
import { db, getNeonHttpClient, getNeonHttpDb, queryDb } from "@/backend/db";

const ENV_KEYS = ["DB_CONNECTION_MODE", "DB_PROVIDER", "DB_NEON_HTTP_ENABLED", "DATABASE_URL"] as const;

type EnvKey = (typeof ENV_KEYS)[number];
type EnvSnapshot = Partial<Record<EnvKey, string | undefined>>;

let envSnapshot: EnvSnapshot = {};

function setProcessEnv(key: EnvKey, value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) {
    delete env[key];
  } else {
    env[key] = value;
  }
}

function snapshotEnv(): void {
  envSnapshot = Object.fromEntries(ENV_KEYS.map(key => [key, process.env[key]]));
}

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    setProcessEnv(key, envSnapshot[key]);
  }
}

function setEnv(overrides: EnvSnapshot): void {
  for (const key of ENV_KEYS) {
    setProcessEnv(key, undefined);
  }
  for (const key of ENV_KEYS) {
    if (key in overrides) {
      setProcessEnv(key, overrides[key]);
    }
  }
}

describe("http-client internal guards & queryDb", () => {
  afterEach(() => {
    restoreEnv();
  });

  test("getNeonHttpClient and getNeonHttpDb throw when not eligible", () => {
    snapshotEnv();
    setEnv({
      DB_PROVIDER: "postgres",
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/siraj",
    });

    expect(() => getNeonHttpClient()).toThrow(/Neon HTTP client is not eligible/);
    expect(() => getNeonHttpDb()).toThrow(/Neon HTTP client is not eligible/);
  });

  test("queryDb() falls back to db singleton when not HTTP-eligible", () => {
    snapshotEnv();
    setEnv({
      DB_PROVIDER: "postgres",
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/siraj",
    });

    const queryHandle = queryDb();
    expect(queryHandle).toBe(db);
  });

  test("queryDb(tx) always returns passed tx regardless of eligibility", () => {
    snapshotEnv();
    setEnv({
      DB_PROVIDER: "postgres",
    });

    const mockTx = { isMockTx: true };
    expect(queryDb(mockTx)).toBe(mockTx);
  });
});
