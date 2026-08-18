import { isTestCi } from "@/backend/lib/test-ci-env";

/**
 * Gate for GraphQL test-helper mutations and TestHelperService.
 *
 * Enabled only in explicit test contexts:
 * - Local dev / test NODE_ENV (`next dev`, `bun test` workers)
 * - Dedicated test servers (`TEST_SERVER=1`) running `next start` against `.next-test-prod`
 * - CI jobs (`TEST_CI=true`)
 *
 * Hard-disabled on deployed Vercel environments (both `production` and `preview`) even if a
 * test flag leaks into env vars. Vercel preview URLs are publicly reachable and must NEVER
 * expose test-helper mutations.
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

export function isTestHelperEnabled(): boolean {
  if (isRealProductionDeployment()) {
    return false;
  }

  if (isTestHarness()) {
    return true;
  }

  return process.env.NODE_ENV !== "production";
}

export function assertTestHelperAllowed(): void {
  if (!isTestHelperEnabled()) {
    throw new Error("Test helper is not allowed in production environment.");
  }
}
