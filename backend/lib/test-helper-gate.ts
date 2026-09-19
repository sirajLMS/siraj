import { isTestCi } from "@/backend/lib/test-ci-env";

/**
 * Gate for GraphQL test-helper mutations and TestHelperService.
 *
 * Enabled only when an explicit test flag is present:
 * - Dedicated test servers (`TEST_SERVER=1`) running `next start` against `.next-test-prod`
 * - CI jobs (`TEST_CI=true`)
 *
 * Additionally, when the process runs as production (`NODE_ENV=production`),
 * enablement requires a `TEST_HARNESS_KEY` secret of at least 32 characters —
 * a bare test flag must never be enough to expose test helpers in production.
 *
 * Hard-disabled everywhere else — there is NO NODE_ENV fallback, so a plain `next dev`
 * server (or any process without an explicit test flag) never registers test-helper
 * mutations. Also hard-disabled on deployed Vercel environments (both `production` and
 * `preview`) even if a test flag leaks into env vars. Vercel preview URLs are publicly
 * reachable and must NEVER expose test-helper mutations.
 *
 * Uses dynamic `process.env` lookups so Next.js production builds do not tree-shake
 * the registration block in `test-helper.mutation.ts`.
 */
function isRealProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
}

function isTestHarness(): boolean {
  return process.env.TEST_SERVER === "1" || isTestCi();
}

const TEST_HARNESS_KEY_MIN_LENGTH = 32;

function hasValidTestHarnessKey(): boolean {
  const key = process.env.TEST_HARNESS_KEY;
  return typeof key === "string" && key.length >= TEST_HARNESS_KEY_MIN_LENGTH;
}

export function isTestHelperEnabled(): boolean {
  if (isRealProductionDeployment()) {
    return false;
  }

  if (process.env.NODE_ENV === "production" && !hasValidTestHarnessKey()) {
    return false;
  }

  return isTestHarness();
}

export function assertTestHelperAllowed(): void {
  if (!isTestHelperEnabled()) {
    throw new Error("Test helper is not allowed in production environment.");
  }
}
