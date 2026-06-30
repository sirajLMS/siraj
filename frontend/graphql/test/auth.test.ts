import { afterAll, describe, expect, test } from "bun:test";
import { CombinedGraphQLErrors } from "@apollo/client";
import {
  demoLoginMutationDocument,
  logoutMutationDocument,
  meQueryDocument,
  refreshTokenMutationDocument,
  userQueryDocument,
  usersQueryDocument,
} from "../sharedDocuments/auth.documents";
import { authenticatedRequest, cleanupTestSuperAdmin, loginDemoUser, provisionTestSuperAdmin } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { clearCookies, testClient } from "./testClient";

describe("GraphQL Auth Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let superAdminUserId = "";

  test("provision super admin for demo login tests", async () => {
    const adminToken = await loginDemoUser("academy_admin");
    const sa = await provisionTestSuperAdmin(adminToken, "authSa");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;
  });

  test("returns token and user on demoLogin with academy_admin", async () => {
    const result = await testClient.mutate({
      mutation: demoLoginMutationDocument,
      variables: {
        input: {
          groupSlug: "academy_admin",
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();

    if (!result.data?.demoLogin) throw new Error("No demoLogin data");
    expect(result.data.demoLogin.token).toBeDefined();
    expect(result.data.demoLogin.user).toBeDefined();
    expect(result.data.demoLogin.user?.id).toBeDefined();
  });

  test("returns token and user on demoLogin with super_admin", async () => {
    // Provision a super admin inline so demoLogin("super_admin") can find it in the DB
    const adminToken = await loginDemoUser("academy_admin");
    const sa = await provisionTestSuperAdmin(adminToken, "authDemoLoginSa");

    try {
      const result = await testClient.mutate({
        mutation: demoLoginMutationDocument,
        variables: {
          input: {
            groupSlug: "super_admin",
          },
        },
      });

      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();

      if (!result.data?.demoLogin) throw new Error("No demoLogin data");
      expect(result.data.demoLogin.token).toBeDefined();
      expect(result.data.demoLogin.user).toBeDefined();
      expect(result.data.demoLogin.user?.id).toBeDefined();
    } finally {
      await cleanupTestSuperAdmin(sa.token, sa.userId);
    }
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
    const token = await loginDemoUser("academy_admin");
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

  afterAll(async () => {
    if (superAdminToken && superAdminUserId) {
      await cleanupTestSuperAdmin(superAdminToken, superAdminUserId);
    }
  });
});
