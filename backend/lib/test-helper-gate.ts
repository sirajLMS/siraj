/**
 * Gate for GraphQL test-helper mutations and TestHelperService.
 *
 * Enabled in non-production NODE_ENV (local dev GraphQL tests), or on dedicated
 * test servers (`TEST_SERVER=1`) that run `next start` against a pre-built
 * bundle (CI GraphQL tests, UI E2E). Uses a dynamic env lookup so Next.js
 * production builds do not tree-shake the registration block.
 */
export function isTestHelperEnabled(): boolean {
  if (process.env.TEST_SERVER === "1") {
    return true;
  }
  return process.env.NODE_ENV !== "production";
}

export function assertTestHelperAllowed(): void {
  if (!isTestHelperEnabled()) {
    throw new Error("Test helper is not allowed in production environment.");
  }
}
