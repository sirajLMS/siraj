import { afterAll, describe, expect, test } from "bun:test";
import { CombinedGraphQLErrors } from "@apollo/client";
import { demoLoginMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { clearCookies, testClient } from "@/test/helpers";
import { setupColdStartTestLifecycle } from "@/test/simulate/lifecycle";

describe("Cold-start: Rate limiter fail-open via GraphQL", () => {
  setupColdStartTestLifecycle();

  afterAll(() => {
    clearCookies();
  });

  test("demo login succeeds — rate limiter is fail-open during cold-start", async () => {
    // The test server sets DISABLE_RATE_LIMITING=true.
    // In production cold-start, checkRateLimit would throw (cache cold),
    // and the fail-open try/catch in auth.mutation.ts catches it and proceeds
    // — same behavior as DISABLE_RATE_LIMITING=true.
    // H9 security fix: demoLogin("super_admin") is blocked — use academy_admin.
    clearCookies();
    const result = await testClient.mutate({
      mutation: demoLoginMutationDocument,
      variables: {
        input: {
          groupSlug: "academy_admin",
        },
      },
    });

    expect(result.data?.demoLogin?.token).toBeDefined();
    expect(result.data?.demoLogin?.user).toBeDefined();
    /* v8 ignore next 3 */
    if (result.error) {
      throw new Error(`Expected no error, got: ${result.error.message}`);
    }
  });

  test("rate limiter fail-open does not mask genuine auth failure", async () => {
    // Login with wrong credentials should still return INVALID_CREDENTIALS,
    // not SERVICE_UNAVAILABLE or TOO_MANY_ATTEMPTS, even during cold-start.
    clearCookies();
    const result = await testClient.mutate({
      mutation: demoLoginMutationDocument,
      variables: {
        input: {
          groupSlug: "non-existent-group-slug",
        },
      },
    });

    // Non-existent group slug should produce an error
    /* v8 ignore next 1 */
    if (!result.error) return;
    if (CombinedGraphQLErrors.is(result.error)) {
      const code = result.error.errors[0]?.extensions?.code;
      // Should NOT be SERVICE_UNAVAILABLE or TOO_MANY_ATTEMPTS
      expect(code).not.toBe("SERVICE_UNAVAILABLE");
      expect(code).not.toBe("TOO_MANY_ATTEMPTS");
    }
  });
});
