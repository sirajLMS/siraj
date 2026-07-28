import { existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

export const TEST_BUILD_DIST_DIR = ".next-test-prod";
export const TEST_ENV_FILE = ".env.test";

const SYSTEM_ENV_KEYS = [
  "PATH",
  "HOME",
  "USER",
  "LANG",
  "LC_ALL",
  "TMPDIR",
  "TMP",
  "TEMP",
  "SHELL",
  "TERM",
  "DISPLAY",
  "CI",
] as const;

function getSystemEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const key of SYSTEM_ENV_KEYS) {
    const value = process.env[key];
    if (value !== undefined) {
      env[key] = value;
    }
  }
  return env;
}

export function loadTestEnvFile(rootDir = process.cwd()): Record<string, string> {
  const parsed = config({ path: join(rootDir, TEST_ENV_FILE), processEnv: {} }).parsed;
  if (!parsed) {
    throw new Error(`Could not load ${TEST_ENV_FILE}. Ensure the file exists in the project root.`);
  }
  return parsed;
}

function loadTestEnvFileOptional(rootDir = process.cwd()): Record<string, string> {
  const envPath = join(rootDir, TEST_ENV_FILE);
  if (!existsSync(envPath)) {
    return {};
  }
  return config({ path: envPath, processEnv: {} }).parsed ?? {};
}

function getParentProcessEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  return env;
}

/**
 * Env for `next build` / `next start` in the UI test production harness.
 *
 * Local: uses `.env.test` only (plus system vars and test overrides) so `.env` /
 * `.env.local` cannot override test config.
 *
 * CI: `.env.test` is gitignored — merges the GitHub Actions job env when `CI=true`
 * so workflow-provided secrets and fallbacks reach `next build` / `next start`.
 */
export function getTestProductionEnv(
  overrides: Record<string, string> = {},
  rootDir = process.cwd()
): Record<string, string> {
  const ciEnv = process.env.CI === "true" ? getParentProcessEnv() : {};

  return {
    ...getSystemEnv(),
    ...loadTestEnvFileOptional(rootDir),
    ...ciEnv,
    ...overrides,
    NODE_ENV: "production",
    NEXT_DIST_DIR: TEST_BUILD_DIST_DIR,
    IS_DEMO: "true",
    AUTH_COOKIE_SECURE: "false",
  };
}
