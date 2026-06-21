import { describe, expect, test } from "bun:test";
import {
  deactivateParentMutationDocument,
  parentAssociatedStudentsQueryDocument,
  parentDocumentsQueryDocument,
  parentInvoiceHistoryQueryDocument,
  parentProfileQueryDocument,
  updateStudentQuotaMutationDocument,
} from "../sharedDocuments";
import { parentDirectoryQueryDocument } from "../sharedDocuments/parent-directory.documents";
import { assertOperationDenied, authenticatedRequest, loginDemoUser } from "./helpers";
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
    await assertOperationDenied("teacher_default", "query", parentDirectoryQueryDocument, {
      search: null,
      limit: 50,
      offset: 0,
    });
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

describe("GraphQL Parent Profile Tests — parentProfile query", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;
  let validParentId: string | null = null;

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("parentProfile — admin with parent.view_profile sees full profile", async () => {
    if (!adminToken) throw new Error("No auth token");

    // First, get a valid parentId from the directory (which admin already has access to)
    const dataDir = await authenticatedRequest(adminToken, "query", parentDirectoryQueryDocument, {
      search: null,
      limit: 1,
      offset: 0,
    });

    const parentId = dataDir.parentDirectory?.rows?.[0]?.id;
    if (!parentId) return; // skip if no seeded parents

    validParentId = parentId;

    const data = await authenticatedRequest(adminToken, "query", parentProfileQueryDocument, { parentId });

    expect(data.parentProfile).toBeDefined();
    expect(data.parentProfile?.id).toBe(parentId);
    expect(typeof data.parentProfile?.name).toBe("string");
    expect(typeof data.parentProfile?.email).toBe("string");
    expect(typeof data.parentProfile?.status).toBe("string");
    expect(typeof data.parentProfile?.timezone).toBe("string");
    expect(data.parentProfile?.createdAt).toBeDefined();
  });

  test("parentProfile — teacher role is denied (IDOR protection)", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: parentProfileQueryDocument,
      variables: { parentId: validParentId ?? "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("parentProfile — parent role is denied (IDOR protection)", async () => {
    const parentToken = await loginDemoUser("parent_default");

    const result = await testClient.query({
      query: parentProfileQueryDocument,
      variables: { parentId: validParentId ?? "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${parentToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("parentProfile — returns null for unknown parentId (not a data leak)", async () => {
    if (!adminToken) throw new Error("No auth token");

    const data = await authenticatedRequest(adminToken, "query", parentProfileQueryDocument, {
      parentId: "00000000-0000-0000-0000-000000000000",
    });

    // parentProfile is nullable: null is the correct response for unknown ID
    expect(data.parentProfile === null || data.parentProfile === undefined).toBeTrue();
  });
});

describe("GraphQL Parent Profile Tests — parentAssociatedStudents query", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("parentAssociatedStudents — admin sees student list with quota data", async () => {
    if (!adminToken) throw new Error("No auth token");

    const dir = await authenticatedRequest(adminToken, "query", parentDirectoryQueryDocument, {
      search: null,
      limit: 1,
      offset: 0,
    });
    const parentId = dir.parentDirectory?.rows?.[0]?.id;
    if (!parentId) return;

    const data = await authenticatedRequest(adminToken, "query", parentAssociatedStudentsQueryDocument, { parentId });

    expect(Array.isArray(data.parentAssociatedStudents)).toBeTrue();

    if (data.parentAssociatedStudents && data.parentAssociatedStudents.length > 0) {
      const first = data.parentAssociatedStudents[0];
      expect(first).toBeDefined();
      expect(typeof first?.id).toBe("string");
      expect(typeof first?.name).toBe("string");
      expect(typeof first?.classesRemaining).toBe("number");
      expect(typeof first?.classesTotal).toBe("number");
      expect(first?.classesRemaining).toBeGreaterThanOrEqual(0);
    }
  });

  test("parentAssociatedStudents — teacher role denied", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: parentAssociatedStudentsQueryDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});

describe("GraphQL Parent Profile Tests — deactivateParent mutation", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("deactivateParent — teacher role is denied", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.mutate({
      mutation: deactivateParentMutationDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("deactivateParent — unknown parentId throws parentNotFound", async () => {
    if (!adminToken) throw new Error("No auth token");

    const result = await testClient.mutate({
      mutation: deactivateParentMutationDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  // NOTE: The actual deactivation of a live parent is done in an isolated test that resets DB state
  test("deactivateParent — admin can deactivate a valid parent (status becomes DEACTIVATED)", async () => {
    if (!adminToken) throw new Error("No auth token");

    const dir = await authenticatedRequest(adminToken, "query", parentDirectoryQueryDocument, {
      search: null,
      limit: 10,
      offset: 0,
    });

    // Find a parent that is REGULAR (not already DEACTIVATED)
    const targetRow = dir.parentDirectory?.rows?.find(r => r?.accountStatus !== "deactivated");
    if (!targetRow?.id) return; // skip if no suitable parent

    const data = await authenticatedRequest(adminToken, "mutate", deactivateParentMutationDocument, {
      parentId: targetRow.id,
    });

    expect(data.deactivateParent).toBeDefined();
    expect(data.deactivateParent?.id).toBe(targetRow.id);
    expect(data.deactivateParent?.status).toBe("DEACTIVATED");
  });
});

describe("GraphQL Student Quota Tests — updateStudentQuota mutation", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("updateStudentQuota — teacher role is denied", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.mutate({
      mutation: updateStudentQuotaMutationDocument,
      variables: {
        studentId: "00000000-0000-0000-0000-000000000000",
        newClassesRemaining: 5,
        expectedVersion: null,
      },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("updateStudentQuota — unknown studentId throws error", async () => {
    if (!adminToken) throw new Error("No auth token");

    const result = await testClient.mutate({
      mutation: updateStudentQuotaMutationDocument,
      variables: {
        studentId: "00000000-0000-0000-0000-000000000000",
        newClassesRemaining: 5,
        expectedVersion: null,
      },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});

describe("GraphQL Billing History Tests — parentInvoiceHistory query", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("parentInvoiceHistory — admin sees invoice list", async () => {
    if (!adminToken) throw new Error("No auth token");

    const dir = await authenticatedRequest(adminToken, "query", parentDirectoryQueryDocument, {
      search: null,
      limit: 1,
      offset: 0,
    });
    const parentId = dir.parentDirectory?.rows?.[0]?.id;
    if (!parentId) return;

    const data = await authenticatedRequest(adminToken, "query", parentInvoiceHistoryQueryDocument, { parentId });

    expect(Array.isArray(data.parentInvoiceHistory)).toBeTrue();
    if (data.parentInvoiceHistory && data.parentInvoiceHistory.length > 0) {
      const first = data.parentInvoiceHistory[0];
      expect(typeof first?.id).toBe("string");
      expect(typeof first?.amount).toBe("string");
      expect(typeof first?.status).toBe("string");
    }
  });

  test("parentInvoiceHistory — teacher role denied", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: parentInvoiceHistoryQueryDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});

describe("GraphQL Document Tests — parentDocuments query", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("parentDocuments — admin sees document list (may be empty)", async () => {
    if (!adminToken) throw new Error("No auth token");

    const dir = await authenticatedRequest(adminToken, "query", parentDirectoryQueryDocument, {
      search: null,
      limit: 1,
      offset: 0,
    });
    const parentId = dir.parentDirectory?.rows?.[0]?.id;
    if (!parentId) return;

    const data = await authenticatedRequest(adminToken, "query", parentDocumentsQueryDocument, { parentId });

    expect(Array.isArray(data.parentDocuments)).toBeTrue();
    // Empty array is valid — no documents may be seeded
  });

  test("parentDocuments — teacher role denied", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: parentDocumentsQueryDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});
