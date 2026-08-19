import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { demoLoginMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { extractGqlErrorCode, getTestPort, isTestServerRunning, startTestServer, testClient } from "@/test/helpers";

/**
 * Clear the auth rate-limit counter in Redis so subsequent test files that call
 * demoLogin are not blocked by TOO_MANY_ATTEMPTS.
 *
 * The rate limiter uses the key pattern `ratelimit:auth:<identifier>`. In dev
 * mode all test requests come from [IP_REDACTED], so we delete that key.
 */
async function clearAuthRateLimitCache(): Promise<void> {
  await Promise.all([
    Bun.spawn(["redis-cli", "-u", "redis://localhost:6379", "DEL", "ratelimit:auth:[IP_REDACTED]"], {
      stdout: "pipe",
      stderr: "pipe",
    }).exited,
    Bun.spawn(["redis-cli", "-n", "1", "FLUSHDB"], {
      stdout: "pipe",
      stderr: "pipe",
    }).exited,
  ]);
}

/**
 * The rate limit test requires the dev server to have TEST_ENFORCE_RATE_LIMIT=true.
 * This env var is NOT set in .env / .env.test / .env.development because it would
 * break all other test files that call demoLogin (they would exhaust the
 * 10-request/15-min auth rate limit window and cascade into failures).
 *
 * To run this test individually:
 *   1. Add TEST_ENFORCE_RATE_LIMIT=true to .env.development (or .env.local)
 *   2. Restart the dev server: bun run dev
 *   3. TEST_ENFORCE_RATE_LIMIT=true bun run scripts/run-test/run-test.ts \
 *        frontend/common/graphql/test/rate-limit/rate-limit.test.ts
 *
 * In the full suite (bun test:graphql), the test is skipped — rate limiting is
 * not enforced by default to avoid interfering with other tests' demoLogin calls.
 */
const isRateLimitEnforced = process.env.TEST_ENFORCE_RATE_LIMIT?.toLowerCase() === "true";

describe("Rate limit enforcement with TEST_ENFORCE_RATE_LIMIT", () => {
  // Use a lightweight server lifecycle — no ensureDemoUsersForTests() since
  // this test uses invalid group slugs and doesn't need demo users.
  beforeAll(async () => {
    if (isRateLimitEnforced) {
      await clearAuthRateLimitCache();
    }
    if (!(await isTestServerRunning())) {
      await startTestServer();
    }
    testLogger.info(`GraphQL test server ready on port ${getTestPort()}`);
  }, 180_000);

  afterAll(async () => {
    await clearAuthRateLimitCache();
  });

  if (isRateLimitEnforced) {
    test("demoLogin returns TOO_MANY_ATTEMPTS error code when rate limit exceeded", async () => {
      // Reset the rate-limit counter so the test has a full 10-request window.
      await clearAuthRateLimitCache();

      const invalidInput = { input: { groupSlug: `nonexistent-group-${Date.now()}` } };

      async function fireNTimes(n: number, acc: Array<{ error: unknown }> = []): Promise<Array<{ error: unknown }>> {
        if (n === 0) return acc;
        const result = await testClient.mutate({
          mutation: demoLoginMutationDocument,
          variables: invalidInput,
          errorPolicy: "all",
        });
        acc.push({ error: result.error });
        return fireNTimes(n - 1, acc);
      }

      const results = await fireNTimes(12);

      const hasRateLimitError = results.some(r => extractGqlErrorCode(r.error) === "TOO_MANY_ATTEMPTS");

      expect(hasRateLimitError).toBe(true);
    });
  } else {
    // Skipped in the full suite — TEST_ENFORCE_RATE_LIMIT is not set.
    // See file-level comment for instructions on running this test individually.
    test.skip("demoLogin returns TOO_MANY_ATTEMPTS error code when rate limit exceeded", () => {
      expect(isRateLimitEnforced).toBe(false);
    });
  }
});
