import { afterAll, describe, expect, test } from "bun:test";
import { demoLoginMutationDocument, meQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { clearCookies, testClient } from "@/test/helpers";
import { setupColdStartTestLifecycle } from "@/test/simulate/lifecycle";

describe("Cold-start: env-config fallback via GraphQL", () => {
  setupColdStartTestLifecycle();

  afterAll(() => {
    clearCookies();
  });

  test("demo login succeeds — env-config resolves CACHE_PROVIDER from env or DB", async () => {
    // The test server starts with env vars configured. If DB is cold,
    // resolveEnvConfig falls back to process.env. This test verifies
    // the cache service initializes correctly (via env fallback or DB)
    // and the login flow completes.
    clearCookies();
    const result = await testClient.mutate({
      mutation: demoLoginMutationDocument,
      variables: {
        input: {
          groupSlug: "super_admin",
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

  test("me query works after login — env-config not blocking session verification", async () => {
    clearCookies();
    const loginResult = await testClient.mutate({
      mutation: demoLoginMutationDocument,
      variables: {
        input: {
          groupSlug: "super_admin",
        },
      },
    });

    expect(loginResult.data?.demoLogin?.token).toBeDefined();

    const token = loginResult.data?.demoLogin?.token;
    if (!token) throw new Error("No token returned from demoLogin");

    // Verify the token works for authenticated queries
    const meResult = await testClient.query({
      query: meQueryDocument,
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    expect(meResult.data?.me).toBeDefined();
    expect(meResult.data?.me?.id).toBeDefined();
    /* v8 ignore next 3 */
    if (meResult.error) {
      throw new Error(`Expected no error, got: ${meResult.error.message}`);
    }
  });
});
