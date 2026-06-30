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
import {
  assertOperationDenied,
  authenticatedRequest,
  cleanupTestEntities,
  cleanupTestSuperAdmin,
  type LoginAndProvisionResult,
  loginAndProvision,
  provisionTestSuperAdmin,
} from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

describe("GraphQL Parent Directory Tests", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let teacherId = "";
  let studentId = "";
  let studentUserId = "";
  let teacherUserId = "";
  let parentUserId = "";
  let parentId = "";
  let superAdminToken = "";
  let superAdminUserId = "";

  test("provision test entities and super admin", async () => {
    const r = await loginAndProvision("ParentDirTest");
    adminToken = r.adminToken;
    teacherId = r.teacherId;
    studentId = r.studentId;
    studentUserId = r.studentUserId;
    teacherUserId = r.teacherUserId;
    parentUserId = r.parentUserId;
    parentId = r.parentId;

    const sa = await provisionTestSuperAdmin(adminToken, "ParentDirTestSA");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;
  });

  test("parentDirectory — admin sees data with metrics", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", parentDirectoryQueryDocument, {
      search: null,
      paginationArgs: null,
      statusFilter: null,
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
    expect(data.parentDirectory?.totalCount).toBeGreaterThanOrEqual(0);

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
    const data = await authenticatedRequest(superAdminToken, "query", parentDirectoryQueryDocument, {
      search: "ParentDirTest",
      paginationArgs: null,
      statusFilter: null,
    });

    expect(data.parentDirectory?.rows).toBeDefined();
  });

  test("parentDirectory — teacher role is denied access", async () => {
    await assertOperationDenied("teacher_default", "query", parentDirectoryQueryDocument, {
      search: null,
      paginationArgs: null,
      statusFilter: null,
    });
  });

  test("parentDirectory — parent role is denied access", async () => {
    await assertOperationDenied("parent_default", "query", parentDirectoryQueryDocument, {
      search: null,
      paginationArgs: null,
      statusFilter: null,
    });
  });

  test("cleanup provisioned entities", async () => {
    await cleanupTestEntities(adminToken, {
      studentUserId,
      teacherUserId,
      parentUserId,
      studentId,
      teacherId,
      parentId,
    });
    await cleanupTestSuperAdmin(superAdminToken, superAdminUserId);
  });
});

describe("GraphQL Parent Profile Tests — parentProfile query", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let parentId = "";
  let _r: LoginAndProvisionResult | null = null;

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("ParentProfTest");
    _r = r;
    adminToken = r.adminToken;
    parentId = r.parentId;
  });

  test("parentProfile — admin with parent.view_profile sees full profile", async () => {
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
    await assertOperationDenied("teacher_default", "query", parentProfileQueryDocument, {
      parentId,
    });
  });

  test("parentProfile — parent role is denied (IDOR protection)", async () => {
    await assertOperationDenied("parent_default", "query", parentProfileQueryDocument, {
      parentId,
    });
  });

  test("parentProfile — returns null for unknown parentId (not a data leak)", async () => {
    const result = await testClient.query({
      query: parentProfileQueryDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.data?.parentProfile).toBeNull();
  });

  test("cleanup provisioned entities", async () => {
    if (!_r) return;
    await cleanupTestEntities(adminToken, {
      studentUserId: _r.studentUserId,
      teacherUserId: _r.teacherUserId,
      parentUserId: _r.parentUserId,
      studentId: _r.studentId,
      teacherId: _r.teacherId,
      parentId: _r.parentId,
    });
  });
});

describe("GraphQL Parent Profile Tests — parentAssociatedStudents query", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let parentId = "";
  let _r: LoginAndProvisionResult | null = null;

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("ParentAssocTest");
    _r = r;
    adminToken = r.adminToken;
    parentId = r.parentId;
  });

  test("parentAssociatedStudents — admin sees student list with quota data", async () => {
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
    await assertOperationDenied("teacher_default", "query", parentAssociatedStudentsQueryDocument, {
      parentId: "00000000-0000-0000-0000-000000000000",
    });
  });

  test("cleanup provisioned entities", async () => {
    if (!_r) return;
    await cleanupTestEntities(adminToken, {
      studentUserId: _r.studentUserId,
      teacherUserId: _r.teacherUserId,
      parentUserId: _r.parentUserId,
      studentId: _r.studentId,
      teacherId: _r.teacherId,
      parentId: _r.parentId,
    });
  });
});

describe("GraphQL Parent Profile Tests — deactivateParent mutation", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let parentId = "";

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("ParentDeactTest");
    adminToken = r.adminToken;
    parentId = r.parentId;
  });

  test("deactivateParent — teacher role is denied", async () => {
    await assertOperationDenied("teacher_default", "mutate", deactivateParentMutationDocument, {
      parentId: "00000000-0000-0000-0000-000000000000",
    });
  });

  test("deactivateParent — unknown parentId throws parentNotFound", async () => {
    const result = await testClient.mutate({
      mutation: deactivateParentMutationDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("deactivateParent — admin can deactivate a valid parent (status becomes DEACTIVATED)", async () => {
    const data = await authenticatedRequest(adminToken, "mutate", deactivateParentMutationDocument, {
      parentId,
    });

    expect(data.deactivateParent).toBeDefined();
    expect(data.deactivateParent?.id).toBe(parentId);
    expect(data.deactivateParent?.status).toBe("DEACTIVATED");
  });
});

describe("GraphQL Student Quota Tests — updateStudentQuota mutation", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let _r: LoginAndProvisionResult | null = null;

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("ParentQuotaTest");
    _r = r;
    adminToken = r.adminToken;
  });

  test("updateStudentQuota — teacher role is denied", async () => {
    await assertOperationDenied("teacher_default", "mutate", updateStudentQuotaMutationDocument, {
      studentId: "00000000-0000-0000-0000-000000000000",
      newClassesRemaining: 5,
      expectedVersion: null,
    });
  });

  test("updateStudentQuota — unknown studentId throws error", async () => {
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

  test("cleanup provisioned entities", async () => {
    if (!_r) return;
    await cleanupTestEntities(adminToken, {
      studentUserId: _r.studentUserId,
      teacherUserId: _r.teacherUserId,
      parentUserId: _r.parentUserId,
      studentId: _r.studentId,
      teacherId: _r.teacherId,
      parentId: _r.parentId,
    });
  });
});

describe("GraphQL Billing History Tests — parentInvoiceHistory query", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let parentId = "";

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("ParentInvTest");
    adminToken = r.adminToken;
    parentId = r.parentId;
  });

  test("parentInvoiceHistory — admin sees invoice list", async () => {
    const data = await authenticatedRequest(adminToken, "query", parentInvoiceHistoryQueryDocument, {
      parentId,
      userId: null,
      paginationArgs: null,
    });

    expect(data.parentInvoiceHistory?.rows).toBeDefined();
  });

  test("parentInvoiceHistory — teacher role denied", async () => {
    await assertOperationDenied("teacher_default", "query", parentInvoiceHistoryQueryDocument, {
      parentId: "00000000-0000-0000-0000-000000000000",
      userId: null,
      paginationArgs: null,
    });
  });
});

describe("GraphQL Document Tests — parentDocuments query", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let parentId = "";

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("ParentDocsTest");
    adminToken = r.adminToken;
    parentId = r.parentId;
  });

  test("parentDocuments — admin sees document list (may be empty)", async () => {
    const data = await authenticatedRequest(adminToken, "query", parentDocumentsQueryDocument, { parentId });

    expect(Array.isArray(data.parentDocuments)).toBeTrue();
  });

  test("parentDocuments — teacher role denied", async () => {
    await assertOperationDenied("teacher_default", "query", parentDocumentsQueryDocument, {
      parentId: "00000000-0000-0000-0000-000000000000",
    });
  });
});
