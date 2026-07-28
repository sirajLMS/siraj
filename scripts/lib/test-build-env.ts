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

/**
 * Env for `next build` / `next start` in the UI test production harness.
 *
 * Uses only `.env.test` (plus system vars and test overrides). Does not inherit the
 * parent shell env, so local `.env` / `.env.local` values cannot override test config.
 *
 * Next.js may still read env files from disk, but @next/env only fills keys that are
 * not already set in `process.env` — see Next.js "Test Environment Variables".
 */
export function getTestProductionEnv(
  overrides: Record<string, string> = {},
  rootDir = process.cwd()
): Record<string, string> {
  return {
    ...getSystemEnv(),
    ...loadTestEnvFile(rootDir),
    ...overrides,
    NODE_ENV: "production",
    NEXT_DIST_DIR: TEST_BUILD_DIST_DIR,
    IS_DEMO: "true",
    AUTH_COOKIE_SECURE: "false",
  };
}
