import { describe, expect, test } from "bun:test";
import { AccountStatus, ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  changeParentLifecycleStatusMutationDocument,
  deactivateParentMutationDocument,
  parentAssociatedStudentsQueryDocument,
  parentDirectoryQueryDocument,
  parentDocumentsQueryDocument,
  parentInvoiceHistoryQueryDocument,
  parentProfileQueryDocument,
  reactivateParentMutationDocument,
  updateStudentQuotaMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  assertOperationDenied,
  authenticatedRequest,
  cleanupTestEntities,
  type LoginAndProvisionResult,
  loginAndProvision,
} from "@/frontend/common/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";
import { testClient } from "@/frontend/common/graphql/test/testClient";

describe("GraphQL Parent Directory Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let teacherId = "";
  let studentId = "";
  let studentUserId = "";
  let teacherUserId = "";
  let parentUserId = "";
  let parentId = "";

  test("provision test entities and super admin", async () => {
    const r = await loginAndProvision("ParentDirTest");
    superAdminToken = r.superAdminToken;
    teacherId = r.teacherId;
    studentId = r.studentId;
    studentUserId = r.studentUserId;
    teacherUserId = r.teacherUserId;
    parentUserId = r.parentUserId;
    parentId = r.parentId;
    expect(superAdminToken).toBeTruthy();
    expect(parentId).toBeTruthy();
    expect(studentId).toBeTruthy();
    expect(teacherId).toBeTruthy();
  });

  test("parentDirectory — admin sees data with metrics", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", parentDirectoryQueryDocument, {
      search: null,
      paginationArgs: null,
      lifecycleStatusFilter: null,
    });

    expect(data.parentDirectory).toBeDefined();
    expect(data.parentDirectory?.id).toBeDefined();
    const metrics = data.parentDirectory?.metrics;
    if (!metrics) throw new Error("No metrics in parentDirectory");
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
      lifecycleStatusFilter: null,
    });

    expect(data.parentDirectory?.rows).toBeDefined();
  });

  test("parentDirectory — teacher role is denied access", async () => {
    const denied = await assertOperationDenied("teacher_default", "query", parentDirectoryQueryDocument, {
      search: null,
      paginationArgs: null,
      lifecycleStatusFilter: null,
    });
    expect(denied).toBe(true);
  });

  test("parentDirectory — parent role is denied access", async () => {
    const denied = await assertOperationDenied("parent_default", "query", parentDirectoryQueryDocument, {
      search: null,
      paginationArgs: null,
      lifecycleStatusFilter: null,
    });
    expect(denied).toBe(true);
  });

  test("cleanup provisioned entities", async () => {
    await cleanupTestEntities(superAdminToken, {
      studentUserId,
      teacherUserId,
      parentUserId,
      studentId,
      teacherId,
      parentId,
    });
    expect(superAdminToken).toBeTruthy();
  });
});

describe("GraphQL Parent Profile Tests — parentProfile query", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let parentId = "";
  let _r: LoginAndProvisionResult | null = null;

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("ParentProfTest");
    _r = r;
    superAdminToken = r.superAdminToken;
    parentId = r.parentId;
    expect(superAdminToken).toBeTruthy();
    expect(parentId).toBeTruthy();
  });

  test("parentProfile — admin with parent.view_profile sees full profile", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", parentProfileQueryDocument, { parentId });

    expect(data.parentProfile).toBeDefined();
    expect(data.parentProfile?.id).toBe(parentId);
    expect(typeof data.parentProfile?.name).toBe("string");
    expect(typeof data.parentProfile?.email).toBe("string");
    expect(data.parentProfile?.lifecycleStatus).toBeDefined();
    expect(data.parentProfile?.accountStatus).toBeDefined();
    expect(typeof data.parentProfile?.timezone).toBe("string");
    expect(data.parentProfile?.createdAt).toBeDefined();
  });

  test("parentProfile — teacher role is denied (IDOR protection)", async () => {
    const denied = await assertOperationDenied("teacher_default", "query", parentProfileQueryDocument, {
      parentId,
    });
    expect(denied).toBe(true);
  });

  test("parentProfile — parent role is denied (IDOR protection)", async () => {
    const denied = await assertOperationDenied("parent_default", "query", parentProfileQueryDocument, {
      parentId,
    });
    expect(denied).toBe(true);
  });

  test("parentProfile — returns null for unknown parentId (not a data leak)", async () => {
    const result = await testClient.query({
      query: parentProfileQueryDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
    });

    expect(result.data?.parentProfile).toBeNull();
  });

  test("cleanup provisioned entities", async () => {
    if (!_r) return;
    await cleanupTestEntities(superAdminToken, {
      studentUserId: _r.studentUserId,
      teacherUserId: _r.teacherUserId,
      parentUserId: _r.parentUserId,
      studentId: _r.studentId,
      teacherId: _r.teacherId,
      parentId: _r.parentId,
    });
    expect(superAdminToken).toBeTruthy();
  });
});

describe("GraphQL Parent Profile Tests — parentAssociatedStudents query", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let parentId = "";
  let _r: LoginAndProvisionResult | null = null;

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("ParentAssocTest");
    _r = r;
    superAdminToken = r.superAdminToken;
    parentId = r.parentId;
    expect(superAdminToken).toBeTruthy();
    expect(parentId).toBeTruthy();
  });

  test("parentAssociatedStudents — admin sees student list with quota data", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", parentAssociatedStudentsQueryDocument, {
      parentId,
    });

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
    const denied = await assertOperationDenied("teacher_default", "query", parentAssociatedStudentsQueryDocument, {
      parentId: "00000000-0000-0000-0000-000000000000",
    });
    expect(denied).toBe(true);
  });

  test("cleanup provisioned entities", async () => {
    if (!_r) return;
    await cleanupTestEntities(superAdminToken, {
      studentUserId: _r.studentUserId,
      teacherUserId: _r.teacherUserId,
      parentUserId: _r.parentUserId,
      studentId: _r.studentId,
      teacherId: _r.teacherId,
      parentId: _r.parentId,
    });
    expect(superAdminToken).toBeTruthy();
  });
});

describe("GraphQL Parent Profile Tests — deactivateParent mutation", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let parentId = "";

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("ParentDeactTest");
    superAdminToken = r.superAdminToken;
    parentId = r.parentId;
    expect(superAdminToken).toBeTruthy();
    expect(parentId).toBeTruthy();
  });

  test("deactivateParent — teacher role is denied", async () => {
    const denied = await assertOperationDenied("teacher_default", "mutate", deactivateParentMutationDocument, {
      parentId: "00000000-0000-0000-0000-000000000000",
    });
    expect(denied).toBe(true);
  });

  test("deactivateParent — unknown parentId throws parentNotFound", async () => {
    const result = await testClient.mutate({
      mutation: deactivateParentMutationDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("deactivateParent — super admin can deactivate a valid parent (status becomes DEACTIVATED)", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", deactivateParentMutationDocument, {
      parentId,
    });

    expect(data.deactivateParent).toBeDefined();
    expect(data.deactivateParent?.id).toBe(parentId);
    expect(data.deactivateParent?.accountStatus).toBe(AccountStatus.Deactivated);
  });
});

describe("GraphQL Parent Profile Tests — reactivateParent mutation", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let parentId = "";

  test("provision deactivated parent and login", async () => {
    const r = await loginAndProvision("ParentReactivateTest");
    superAdminToken = r.superAdminToken;
    parentId = r.parentId;
    await authenticatedRequest(superAdminToken, "mutate", deactivateParentMutationDocument, { parentId });
    expect(superAdminToken).toBeTruthy();
    expect(parentId).toBeTruthy();
  });

  test("reactivateParent — restores ACTIVATED account status", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", reactivateParentMutationDocument, {
      parentId,
    });

    expect(data.reactivateParent?.id).toBe(parentId);
    expect(data.reactivateParent?.accountStatus).toBe(AccountStatus.Activated);
  });
});

describe("GraphQL Parent Profile Tests — changeParentLifecycleStatus mutation", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let parentId = "";

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("ParentLifecycleTest");
    superAdminToken = r.superAdminToken;
    parentId = r.parentId;
    expect(superAdminToken).toBeTruthy();
    expect(parentId).toBeTruthy();
  });

  test("changeParentLifecycleStatus — updates lifecycle without changing account status", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", changeParentLifecycleStatusMutationDocument, {
      parentId,
      newStatus: ParentStatus.OnTrial,
    });

    expect(data.changeParentLifecycleStatus?.id).toBe(parentId);
    expect(data.changeParentLifecycleStatus?.lifecycleStatus).toBe(ParentStatus.OnTrial);

    const profile = await authenticatedRequest(superAdminToken, "query", parentProfileQueryDocument, { parentId });
    expect(profile.parentProfile?.lifecycleStatus).toBe(ParentStatus.OnTrial);
    expect(profile.parentProfile?.accountStatus).toBe(AccountStatus.Activated);
  });
});

describe("GraphQL Parent Directory Tests — accountStatus field", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";

  test("provision and login", async () => {
    const r = await loginAndProvision("ParentDirectoryAccountTest");
    superAdminToken = r.superAdminToken;
    expect(superAdminToken).toBeTruthy();
  });

  test("parentDirectory rows include accountStatus", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", parentDirectoryQueryDocument, {
      search: null,
      lifecycleStatusFilter: null,
      paginationArgs: { first: 10, page: 1, skip: null, after: null, before: null, last: null, maxCount: null },
    });

    const row = data.parentDirectory?.rows?.find(r => r?.accountStatus != null);
    expect(row?.accountStatus).toBeDefined();
  });
});

describe("GraphQL Student Quota Tests — updateStudentQuota mutation", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let _r: LoginAndProvisionResult | null = null;

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("ParentQuotaTest");
    _r = r;
    superAdminToken = r.superAdminToken;
    expect(superAdminToken).toBeTruthy();
  });

  test("updateStudentQuota — teacher role is denied", async () => {
    const denied = await assertOperationDenied("teacher_default", "mutate", updateStudentQuotaMutationDocument, {
      studentId: "00000000-0000-0000-0000-000000000000",
      newClassesRemaining: 5,
      expectedVersion: null,
    });
    expect(denied).toBe(true);
  });

  test("updateStudentQuota — unknown studentId throws error", async () => {
    const result = await testClient.mutate({
      mutation: updateStudentQuotaMutationDocument,
      variables: {
        studentId: "00000000-0000-0000-0000-000000000000",
        newClassesRemaining: 5,
        expectedVersion: null,
      },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("cleanup provisioned entities", async () => {
    if (!_r) return;
    await cleanupTestEntities(_r.superAdminToken, {
      studentUserId: _r.studentUserId,
      teacherUserId: _r.teacherUserId,
      parentUserId: _r.parentUserId,
      studentId: _r.studentId,
      teacherId: _r.teacherId,
      parentId: _r.parentId,
    });
    expect(_r.superAdminToken).toBeTruthy();
  });
});

describe("GraphQL Billing History Tests — parentInvoiceHistory query", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let parentId = "";

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("ParentInvTest");
    superAdminToken = r.superAdminToken;
    parentId = r.parentId;
    expect(superAdminToken).toBeTruthy();
    expect(parentId).toBeTruthy();
  });

  test("parentInvoiceHistory — admin sees invoice list", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", parentInvoiceHistoryQueryDocument, {
      parentId,
      userId: null,
      search: null,
      paginationArgs: null,
    });

    expect(data.parentInvoiceHistory?.rows).toBeDefined();
  });

  test("parentInvoiceHistory — teacher role denied", async () => {
    const denied = await assertOperationDenied("teacher_default", "query", parentInvoiceHistoryQueryDocument, {
      parentId: "00000000-0000-0000-0000-000000000000",
      userId: null,
      search: null,
      paginationArgs: null,
    });
    expect(denied).toBe(true);
  });
});

describe("GraphQL Document Tests — parentDocuments query", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let parentId = "";

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("ParentDocsTest");
    superAdminToken = r.superAdminToken;
    parentId = r.parentId;
    expect(superAdminToken).toBeTruthy();
    expect(parentId).toBeTruthy();
  });

  test("parentDocuments — admin sees document list (may be empty)", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", parentDocumentsQueryDocument, { parentId });

    expect(Array.isArray(data.parentDocuments)).toBeTrue();
  });

  test("parentDocuments — teacher role denied", async () => {
    const denied = await assertOperationDenied("teacher_default", "query", parentDocumentsQueryDocument, {
      parentId: "00000000-0000-0000-0000-000000000000",
    });
    expect(denied).toBe(true);
  });
});
