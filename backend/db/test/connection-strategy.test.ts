import { afterEach, describe, expect, test } from "bun:test";
import {
  getActiveHttpProvider,
  isNeonHttpEligible,
  poolMax,
  resolveConnectionStrategy,
  resolvePoolMax,
} from "@/backend/db/connection-strategy";

const ENV_KEYS = [
  "DB_CONNECTION_MODE",
  "DB_PROVIDER",
  "DB_NEON_HTTP_ENABLED",
  "DATABASE_URL",
  "VERCEL",
  "RAILWAY_ENVIRONMENT",
  "NETLIFY",
  "AWS_LAMBDA_FUNCTION_NAME",
  "BUN_TEST",
] as const;

type EnvKey = (typeof ENV_KEYS)[number];
type EnvSnapshot = Partial<Record<EnvKey, string | undefined>>;

const ENV_KEY_SET: ReadonlySet<string> = new Set(ENV_KEYS);

function isEnvKey(value: string): value is EnvKey {
  return ENV_KEY_SET.has(value);
}

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
  for (const [key, value] of Object.entries(overrides)) {
    if (isEnvKey(key)) {
      setProcessEnv(key, value);
    }
  }
}

describe("resolveConnectionStrategy", () => {
  afterEach(() => {
    restoreEnv();
  });

  test("DB_CONNECTION_MODE=neon forces neon-serverless on any platform", () => {
    snapshotEnv();
    setEnv({ DB_CONNECTION_MODE: "neon", VERCEL: "1", DB_PROVIDER: "postgres" });
    expect(resolveConnectionStrategy()).toBe("neon-serverless");
  });

  test("DB_CONNECTION_MODE=pg forces pg-pooled on any platform", () => {
    snapshotEnv();
    setEnv({ DB_CONNECTION_MODE: "pg", DB_PROVIDER: "neon" });
    expect(resolveConnectionStrategy()).toBe("pg-pooled");
  });

  test("auto + DB_PROVIDER=neon + no serverless env uses neon-serverless", () => {
    snapshotEnv();
    setEnv({ DB_PROVIDER: "neon" });
    expect(resolveConnectionStrategy()).toBe("neon-serverless");
  });

  test("auto + DB_PROVIDER=postgres + no serverless env uses pg-pooled", () => {
    snapshotEnv();
    setEnv({ DB_PROVIDER: "postgres" });
    expect(resolveConnectionStrategy()).toBe("pg-pooled");
  });

  test("auto + VERCEL=1 uses pg-pooled when DB_PROVIDER=postgres", () => {
    snapshotEnv();
    setEnv({ VERCEL: "1", DB_PROVIDER: "postgres" });
    expect(resolveConnectionStrategy()).toBe("pg-pooled");
  });

  test("auto + RAILWAY_ENVIRONMENT=production uses pg-pooled when DB_PROVIDER=postgres", () => {
    snapshotEnv();
    setEnv({ RAILWAY_ENVIRONMENT: "production", DB_PROVIDER: "postgres" });
    expect(resolveConnectionStrategy()).toBe("pg-pooled");
  });

  test("auto + VERCEL=1 uses neon-serverless when DB_PROVIDER=neon", () => {
    snapshotEnv();
    setEnv({ VERCEL: "1", DB_PROVIDER: "neon" });
    expect(resolveConnectionStrategy()).toBe("neon-serverless");
  });

  test("auto + RAILWAY_ENVIRONMENT=production uses neon-serverless when DB_PROVIDER=neon", () => {
    snapshotEnv();
    setEnv({ RAILWAY_ENVIRONMENT: "production", DB_PROVIDER: "neon" });
    expect(resolveConnectionStrategy()).toBe("neon-serverless");
  });
});

describe("resolvePoolMax", () => {
  test("uses 3 in test env", () => {
    expect(resolvePoolMax({ isTest: true, isVercel: false, isServerless: false })).toBe(3);
  });

  test("uses 1 on Vercel", () => {
    expect(resolvePoolMax({ isTest: false, isVercel: true, isServerless: false })).toBe(1);
  });

  test("uses 2 on other serverless platforms", () => {
    expect(resolvePoolMax({ isTest: false, isVercel: false, isServerless: true })).toBe(2);
  });

  test("uses 10 on long-running hosts", () => {
    expect(resolvePoolMax({ isTest: false, isVercel: false, isServerless: false })).toBe(10);
  });
});

describe("poolMax", () => {
  test("returns test pool size under bun test runner", () => {
    expect(poolMax()).toBe(3);
  });
});

const NEON_DB_URL = "postgres://user:pass@ep-cool-12345.us-east-2.aws.neon.tech/neondb";

function assertNeonHttpEligible(overrides: EnvSnapshot, eligible: boolean, expectedProvider: "neon" | "none"): void {
  snapshotEnv();
  setEnv(overrides);
  expect(isNeonHttpEligible()).toBe(eligible);
  expect(getActiveHttpProvider()).toBe(expectedProvider);
}

describe("isNeonHttpEligible", () => {
  afterEach(() => {
    restoreEnv();
  });

  test("returns true when DB_PROVIDER=neon, *.neon.tech host, mode!=pg, enabled!=false", () => {
    assertNeonHttpEligible(
      {
        DB_PROVIDER: "neon",
        DATABASE_URL: NEON_DB_URL,
        DB_CONNECTION_MODE: "auto",
        DB_NEON_HTTP_ENABLED: "true",
      },
      true,
      "neon"
    );
  });

  test("returns false when DB_NEON_HTTP_ENABLED=false", () => {
    assertNeonHttpEligible(
      {
        DB_PROVIDER: "neon",
        DATABASE_URL: NEON_DB_URL,
        DB_NEON_HTTP_ENABLED: "false",
      },
      false,
      "none"
    );
  });

  test("returns false when DB_PROVIDER=postgres", () => {
    assertNeonHttpEligible(
      {
        DB_PROVIDER: "postgres",
        DATABASE_URL: NEON_DB_URL,
      },
      false,
      "none"
    );
  });

  test("returns false when DB_CONNECTION_MODE=pg", () => {
    snapshotEnv();
    setEnv({
      DB_PROVIDER: "neon",
      DB_CONNECTION_MODE: "pg",
      DATABASE_URL: NEON_DB_URL,
    });
    expect(isNeonHttpEligible()).toBe(false);
  });

  test("returns false when DATABASE_URL hostname is not *.neon.tech", () => {
    snapshotEnv();
    setEnv({
      DB_PROVIDER: "neon",
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/siraj",
    });
    expect(isNeonHttpEligible()).toBe(false);
  });
});
