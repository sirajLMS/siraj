import { describe, expect, test } from "bun:test";
import {
  demoLoginMutationDocument,
  logoutMutationDocument,
  meQueryDocument,
  refreshTokenMutationDocument,
  userQueryDocument,
  usersQueryDocument,
} from "../sharedDocuments/auth.documents";
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

    const result = await testClient.query({
      query: meQueryDocument,
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    if (!result.data) throw new Error("No data");
    expect(result.data.me?.id).toBe(loggedInUserId);
  });

  test("returns a specific user via user query", async () => {
    if (!loggedInUserId || !authToken) throw new Error("Missing credentials");

    const result = await testClient.query({
      query: userQueryDocument,
      variables: {
        id: loggedInUserId,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    if (!result.data) throw new Error("No data");
    expect(result.data.user?.id).toBe(loggedInUserId);
  });

  test("returns list of users via users query", async () => {
    const result = await testClient.query({
      query: usersQueryDocument,
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    if (!result.data) throw new Error("No data");
    expect(Array.isArray(result.data.users)).toBeTrue();
    if (result.data.users) {
      expect(result.data.users.length).toBeGreaterThan(0);
    }
  });

  test("refreshes token", async () => {
    const result = await testClient.mutate({
      mutation: refreshTokenMutationDocument,
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(result.data?.refreshToken?.token).toBeDefined();
    expect(result.data?.refreshToken?.user).toBeDefined();
  });

  test("executes logout", async () => {
    const result = await testClient.mutate({
      mutation: logoutMutationDocument,
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(result.data?.logout).toBe(true);
  });
});
