/**
 * True when automated test jobs run in CI (GitHub Actions sets TEST_CI=true).
 *
 * Used to distinguish CI from local dev:
 * - Local: `.env.test` (gitignored) is loaded via `--env-file`; parent DATABASE_URL is cleared.
 * - CI: no `.env.test` on disk; workflow job env supplies vars and overrides worker DATABASE_URL.
 */
export function isTestCi(): boolean {
  return process.env.TEST_CI === "true";
}
