import { describe, expect, test } from "bun:test";
import { parentDirectoryQueryDocument } from "../sharedDocuments/parent-directory.documents";
import { authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

describe("GraphQL Parent Integration Tests", () => {
  setupTestServerLifecycle();

  let authToken: string | null = null;

  test("login as super_admin to perform parent queries", async () => {
    authToken = await loginDemoUser("super_admin");
    expect(authToken).not.toBeNull();
  });

  test("parentDirectory — admin sees data with metrics", async () => {
    if (!authToken) throw new Error("No auth token");

    const data = await authenticatedRequest(authToken, "query", parentDirectoryQueryDocument, {
      search: null,
      limit: 50,
      offset: 0,
    });

    expect(data.parentDirectory).toBeDefined();
    expect(data.parentDirectory?.id).toBeDefined();
    const metrics = data.parentDirectory?.metrics;
    if (!metrics) throw new Error("No metrics in parentDirectory");
    expect(metrics.activated).toBeGreaterThanOrEqual(0);
    expect(metrics.deactivated).toBeGreaterThanOrEqual(0);
    expect(metrics.regular).toBeGreaterThanOrEqual(0);
    expect(metrics.onLeave).toBeGreaterThanOrEqual(0);
    expect(metrics.suspended).toBeGreaterThanOrEqual(0);
    expect(metrics.onTrial).toBeGreaterThanOrEqual(0);

    expect(Array.isArray(data.parentDirectory?.rows)).toBeTrue();
    expect(data.parentDirectory?.totalParents).toBeGreaterThanOrEqual(0);

    if (data.parentDirectory?.rows && data.parentDirectory.rows.length > 0) {
      const firstRow = data.parentDirectory.rows[0];
      if (!firstRow) throw new Error("First row is null");
      expect(firstRow.id).toBeDefined();
      expect(firstRow.name).toBeDefined();
      expect(firstRow.email).toBeDefined();
      expect(firstRow.accountStatus).toBeDefined();
      expect(firstRow.unpaidInvoices).toBeGreaterThanOrEqual(0);
    }
  });

  test("parentDirectory — admin search filter works", async () => {
    if (!authToken) throw new Error("No auth token");

    const data = await authenticatedRequest(authToken, "query", parentDirectoryQueryDocument, {
      search: "Default Parent",
      limit: 50,
      offset: 0,
    });

    expect(data.parentDirectory?.rows).toBeDefined();
    if (data.parentDirectory?.rows) {
      const allMatch = data.parentDirectory.rows.every(row => row?.name?.toLowerCase().includes("default parent"));
      expect(allMatch).toBeTrue();
    }
  });

  test("parentDirectory — teacher role is denied access", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: parentDirectoryQueryDocument,
      variables: {
        search: null,
        limit: 50,
        offset: 0,
      },
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });

  test("parentDirectory — parent role is denied access", async () => {
    const parentToken = await loginDemoUser("parent_default");

    const result = await testClient.query({
      query: parentDirectoryQueryDocument,
      variables: {
        search: null,
        limit: 50,
        offset: 0,
      },
      context: {
        headers: {
          Authorization: `Bearer ${parentToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });
});
