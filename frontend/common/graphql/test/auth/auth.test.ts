import { afterAll, describe, expect, test } from "bun:test";
import { CombinedGraphQLErrors } from "@apollo/client";
import {
  demoLoginMutationDocument,
  ensureDemoUsersMutationDocument,
  logoutMutationDocument,
  meQueryDocument,
  refreshTokenMutationDocument,
  userQueryDocument,
  usersQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  authenticatedRequest,
  clearCookies,
  getTestCookie,
  loginDemoUser,
  loginSuperAdmin,
  setupTestServerLifecycle,
  testClient,
} from "@/test/helpers";

async function expectDemoLoginSucceeds(groupSlug: string): Promise<void> {
  const result = await testClient.mutate({
    mutation: demoLoginMutationDocument,
    variables: {
      input: {
        groupSlug,
      },
    },
  });

  expect(result.data).toBeDefined();
  expect(result.error).toBeUndefined();

  if (!result.data?.demoLogin) throw new Error("No demoLogin data");
  expect(result.data.demoLogin.token).toBeDefined();
  expect(result.data.demoLogin.user).toBeDefined();
  expect(result.data.demoLogin.user?.id).toBeDefined();
}

describe("GraphQL Auth Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";

  test("obtain super admin token for auth tests", async () => {
    // H9 security fix: demoLogin("super_admin") is blocked (excluded group slug) —
    // obtain the token via standard password login as the canonical super admin.
    superAdminToken = await loginSuperAdmin();
    expect(superAdminToken).toBeTruthy();
  });

  test("returns token and user on demoLogin with academy_admin", async () => {
    await expectDemoLoginSucceeds("academy_admin");
  });

  test("rejects demoLogin with super_admin (H9 security fix)", async () => {
    // H9 fix: super_admin is excluded from demo login (EXCLUDED_DEMO_LOGIN_GROUP_SLUGS)
    // so demoLogin("super_admin") must NOT return a token.
    const result = await testClient.mutate({
      mutation: demoLoginMutationDocument,
      variables: { input: { groupSlug: "super_admin" } },
    });
    expect(result.data?.demoLogin ?? null).toBeNull();
  });

  test("returns current user via me query", async () => {
    const token = await loginDemoUser("academy_admin");
    const data = await authenticatedRequest(token, "query", meQueryDocument);
    expect(data.me?.id).toBeDefined();
  });

  test("returns a specific user via user query", async () => {
    // The user query requires STAFF_EDIT permission; use super admin token
    const token = superAdminToken;
    if (!token) throw new Error("No super admin token from provision test");

    const meData = await authenticatedRequest(token, "query", meQueryDocument);
    const userId = meData.me?.id;
    if (!userId) throw new Error("No user ID from me query");

    const data = await authenticatedRequest(token, "query", userQueryDocument, {
      id: userId,
    });
    expect(data.user?.id).toBe(userId);
  });

  test("returns list of users via users query", async () => {
    // The users query requires STAFF_LIST permission; use super admin token
    const token = superAdminToken;
    if (!token) throw new Error("No super admin token from provision test");

    const data = await authenticatedRequest(token, "query", usersQueryDocument);
    expect(Array.isArray(data.users)).toBeTrue();
    if (data.users) {
      expect(data.users.length).toBeGreaterThan(0);
    }
  });

  test("refreshes token", async () => {
    clearCookies();
    const token = await loginDemoUser("academy_admin");
    const data = await authenticatedRequest(token, "mutate", refreshTokenMutationDocument);
    expect(data.refreshToken?.token).toBeDefined();
    expect(data.refreshToken?.user).toBeDefined();
  });

  test("refreshToken succeeds with valid session_id and stale refresh_token JTI", async () => {
    clearCookies();

    await testClient.mutate({
      mutation: demoLoginMutationDocument,
      variables: { input: { groupSlug: "academy_admin" } },
    });

    const staleRefreshToken = getTestCookie("refresh_token");
    const sessionId = getTestCookie("session_id");
    if (!staleRefreshToken || !sessionId) {
      throw new Error("Expected session_id and refresh_token cookies after demoLogin");
    }

    // First refresh rotates the session JTI and issues a new refresh_token cookie.
    const firstRefresh = await testClient.mutate({
      mutation: refreshTokenMutationDocument,
    });
    expect(firstRefresh.data?.refreshToken?.token).toBeDefined();

    // Simulate a browser that still sends the pre-rotation refresh_token cookie.
    const staleCookieRefresh = await testClient.mutate({
      mutation: refreshTokenMutationDocument,
      context: {
        headers: {
          Cookie: `session_id=${sessionId}; refresh_token=${staleRefreshToken}`,
        },
      },
    });

    expect(staleCookieRefresh.error).toBeUndefined();
    expect(staleCookieRefresh.data?.refreshToken?.token).toBeDefined();
    expect(staleCookieRefresh.data?.refreshToken?.user).toBeDefined();
  });

  test("executes logout", async () => {
    clearCookies();
    const token = await loginDemoUser("academy_admin");
    const data = await authenticatedRequest(token, "mutate", logoutMutationDocument);
    expect(data.logout).toBe(true);
  });

  test("refreshToken returns null when invalid token or missing session", async () => {
    // Clear cookies to ensure no server-side session leaks from other tests
    clearCookies();

    const result = await testClient.mutate({
      mutation: refreshTokenMutationDocument,
      context: {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(result.data?.refreshToken).toBeNull();
  });

  test("returns UNAUTHENTICATED error code when querying me without auth headers", async () => {
    clearCookies();

    const result = await testClient.query({
      query: meQueryDocument,
      context: {
        headers: {
          // No Authorization header, no cookies
        },
      },
    });

    expect(result.data?.me).toBeNull();
    expect(result.error).toBeInstanceOf(CombinedGraphQLErrors);
    if (result.error instanceof CombinedGraphQLErrors) {
      const gqlError = result.error.errors?.[0];
      expect(gqlError?.extensions?.code).toBe("UNAUTHENTICATED");
    }
  });

  test("ensureDemoUsers mutation requires authentication", async () => {
    clearCookies();

    const result = await testClient.mutate({
      mutation: ensureDemoUsersMutationDocument,
      context: {
        headers: {
          // No Authorization header, no cookies
        },
      },
    });

    expect(result.data?.ensureDemoUsers).toBeFalsy();
    expect(result.error).toBeDefined();
  });

  afterAll(() => {
    // No cleanup needed — super admin token was obtained via demoLogin, not provisioned
  });
});
