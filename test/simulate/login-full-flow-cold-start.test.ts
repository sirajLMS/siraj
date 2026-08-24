import { afterAll, describe, expect, test } from "bun:test";
import { CombinedGraphQLErrors } from "@apollo/client";
import {
  demoLoginMutationDocument,
  logoutMutationDocument,
  meQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { clearCookies, testClient } from "@/test/helpers";
import { setupColdStartTestLifecycle } from "@/test/simulate/lifecycle";

describe("Cold-start: Full login flow via GraphQL", () => {
  setupColdStartTestLifecycle();

  afterAll(() => {
    clearCookies();
  });

  test("demo login → token valid → me query returns same user", async () => {
    clearCookies();
    // H9 security fix: demoLogin("super_admin") is blocked — use academy_admin
    // (a non-excluded demo group) to exercise the cold-start demoLogin flow.
    const loginResult = await testClient.mutate({
      mutation: demoLoginMutationDocument,
      variables: {
        input: {
          groupSlug: "academy_admin",
        },
      },
    });

    expect(loginResult.data?.demoLogin?.token).toBeDefined();
    expect(loginResult.data?.demoLogin?.user?.id).toBeDefined();
    /* v8 ignore next 3 */
    if (loginResult.error) {
      throw new Error(`Expected no error, got: ${loginResult.error.message}`);
    }

    const token = loginResult.data?.demoLogin?.token;
    const userId = loginResult.data?.demoLogin?.user?.id;
    if (!token || !userId) throw new Error("Missing token or user id");

    // Use the token for an authenticated query
    const meResult = await testClient.query({
      query: meQueryDocument,
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    expect(meResult.data?.me).toBeDefined();
    expect(meResult.data?.me?.id).toBe(userId);
    /* v8 ignore next 3 */
    if (meResult.error) {
      throw new Error(`Expected no error, got: ${meResult.error.message}`);
    }
  });

  test("demo login → logout completes the auth lifecycle", async () => {
    clearCookies();
    // H9 security fix: demoLogin("super_admin") is blocked — use academy_admin.
    const loginResult = await testClient.mutate({
      mutation: demoLoginMutationDocument,
      variables: {
        input: {
          groupSlug: "academy_admin",
        },
      },
    });

    expect(loginResult.data?.demoLogin?.token).toBeDefined();

    const token = loginResult.data?.demoLogin?.token;
    if (!token) throw new Error("No token");

    // Logout
    const logoutResult = await testClient.mutate({
      mutation: logoutMutationDocument,
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    /* v8 ignore next 3 */
    if (logoutResult.error) {
      throw new Error(`Expected no error, got: ${logoutResult.error.message}`);
    }
  });

  test("invalid group slug → error is NOT SERVICE_UNAVAILABLE", async () => {
    clearCookies();
    const result = await testClient.mutate({
      mutation: demoLoginMutationDocument,
      variables: {
        input: {
          groupSlug: "this-group-does-not-exist-12345",
        },
      },
    });

    // Should get an error, but it should NOT be SERVICE_UNAVAILABLE
    // (that's reserved for cold-start DB failures)
    if (result.error && CombinedGraphQLErrors.is(result.error)) {
      const code = result.error.errors[0]?.extensions?.code;
      expect(code).not.toBe("SERVICE_UNAVAILABLE");
    }
  });
});
