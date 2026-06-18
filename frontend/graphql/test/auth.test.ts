import { describe, expect, test } from "bun:test";
import { CombinedGraphQLErrors } from "@apollo/client";
import {
  demoLoginMutationDocument,
  logoutMutationDocument,
  meQueryDocument,
  refreshTokenMutationDocument,
  userQueryDocument,
  usersQueryDocument,
} from "../sharedDocuments/auth.documents";
import { authenticatedRequest } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

describe("GraphQL Auth Integration Tests", () => {
  setupTestServerLifecycle();

  let authToken: string | null = null;
  let loggedInUserId: string | null = null;

  test("returns token and user on demoLogin", async () => {
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

    authToken = result.data.demoLogin.token || null;
    loggedInUserId = result.data.demoLogin.user?.id || null;
  });

  test("returns current user via me query", async () => {
    if (!authToken) throw new Error("No auth token");

    const data = await authenticatedRequest(authToken, "query", meQueryDocument);
    expect(data.me?.id).toBe(loggedInUserId);
  });

  test("returns a specific user via user query", async () => {
    if (!loggedInUserId || !authToken) throw new Error("Missing credentials");

    const data = await authenticatedRequest(authToken, "query", userQueryDocument, {
      id: loggedInUserId,
    });
    expect(data.user?.id).toBe(loggedInUserId);
  });

  test("returns list of users via users query", async () => {
    if (!authToken) throw new Error("No auth token");
    const data = await authenticatedRequest(authToken, "query", usersQueryDocument);
    expect(Array.isArray(data.users)).toBeTrue();
    if (data.users) {
      expect(data.users.length).toBeGreaterThan(0);
    }
  });

  test("refreshes token", async () => {
    if (!authToken) throw new Error("No auth token");
    const data = await authenticatedRequest(authToken, "mutate", refreshTokenMutationDocument);
    expect(data.refreshToken?.token).toBeDefined();
    expect(data.refreshToken?.user).toBeDefined();
  });

  test("executes logout", async () => {
    if (!authToken) throw new Error("No auth token");
    const data = await authenticatedRequest(authToken, "mutate", logoutMutationDocument);
    expect(data.logout).toBe(true);
  });

  test("refreshToken returns null when invalid token or missing session", async () => {
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
    const result = await testClient.query({
      query: meQueryDocument,
      context: {
        headers: {
          // No Authorization header
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
});
