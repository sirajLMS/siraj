import { afterAll, describe, expect, test } from "bun:test";
import {
  groupClassAuditQueryDocument,
  resendClassNotificationsMutationDocument,
  updateClassAdminNoteMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { deleteClassInstanceMutationDocument } from "@/frontend/graphql/sharedDocuments/class-session.documents";
import {
  cleanupTestEntitiesMutationDocument,
  cleanupTestGroupClassMutationDocument,
  createTestGroupClassMutationDocument,
} from "@/frontend/graphql/sharedDocuments/test-helper.documents";
import {
  authenticatedRequest,
  cleanupTestSuperAdmin,
  createManualClassEntry,
  loginAndProvision,
  provisionTestSuperAdmin,
} from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";
import { testClient } from "@/frontend/graphql/test/testClient";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

describe("GraphQL: Group Class integration tests", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;
  let superAdminToken: string | null = null;
  let superAdminUserId: string | null = null;
  let teacherToken: string | null = null;
  let studentId: string | null = null;
  let teacherId: string | null = null;
  let studentUserId: string | null = null;
  let teacherUserId: string | null = null;
  let parentUserId: string | null = null;
  let parentId: string | null = null;
  let classInstanceId: string | null = null;
  let groupClassId: string | null = null;

  test("provision test entities, class instance, and group class", async () => {
    const r = await loginAndProvision("GroupClassIntTest");
    adminToken = r.adminToken;
    teacherToken = r.teacherToken;
    studentId = r.studentId;
    teacherId = r.teacherId;
    studentUserId = r.studentUserId;
    teacherUserId = r.teacherUserId;
    parentUserId = r.parentUserId;
    parentId = r.parentId;

    const sa = await provisionTestSuperAdmin(r.superAdminToken, "GroupClassIntTestSA");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;

    if (!teacherToken || !studentId || !teacherId) throw new Error("Missing test context");

    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    const createRes = await createManualClassEntry(
      teacherToken,
      studentId,
      teacherId,
      now.toISOString(),
      end.toISOString()
    );
    expect(createRes.error).toBeUndefined();
    classInstanceId = createRes.data?.createTeacherManualClassEntry?.id ?? null;
    expect(classInstanceId).toBeTruthy();

    if (!adminToken || !classInstanceId) throw new Error("Missing admin token or classInstanceId");

    if (!superAdminToken) throw new Error("Missing super admin token");
    const gcRes = await authenticatedRequest(superAdminToken, "mutate", createTestGroupClassMutationDocument, {
      classInstanceId,
      teacherName: "Test Teacher",
    });
    groupClassId = gcRes.createTestGroupClass?.groupClassId ?? null;
    expect(groupClassId).toBeTruthy();
  });

  test("admin can query groupClassAudit with valid classInstanceId", async () => {
    if (!superAdminToken || !classInstanceId) throw new Error("Missing test context");

    const result = await testClient.query({
      query: groupClassAuditQueryDocument,
      variables: { classInstanceId },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.groupClassAudit).toBeDefined();

    const audit = result.data?.groupClassAudit;
    if (!audit) return;
    expect(typeof audit.id).toBe("string");
    expect(typeof audit.className).toBe("string");
    expect(typeof audit.teacherName).toBe("string");
    expect(typeof audit.timeSlot).toBe("string");
    expect(typeof audit.status).toBe("string");
    expect(typeof audit.registeredStudentCount).toBe("number");
    expect(typeof audit.totalStudentCount).toBe("number");
    expect(Array.isArray(audit.students)).toBeTrue();
    expect(audit.meetingInfo).toBeDefined();
    expect(typeof audit.meetingInfo?.platform).toBe("string");
    expect(Array.isArray(audit.communications)).toBeTrue();
    expect(audit.adminNote).toBeDefined();
    expect(typeof audit.adminNote?.content).toBe("string");
    expect(typeof audit.adminNote?.lastUpdated).toBe("string");
  });

  test("groupClassAudit: non-existent classInstanceId returns GraphQL error", async () => {
    if (!superAdminToken) throw new Error("Missing test context");

    const result = await testClient.query({
      query: groupClassAuditQueryDocument,
      variables: { classInstanceId: NIL_UUID },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("admin can update admin note via updateClassAdminNote", async () => {
    if (!superAdminToken || !classInstanceId) throw new Error("Missing test context");

    const data = await authenticatedRequest(superAdminToken, "mutate", updateClassAdminNoteMutationDocument, {
      classInstanceId,
      content: "Updated by integration test",
    });

    expect(data.updateClassAdminNote).toBeDefined();
    if (!data.updateClassAdminNote) return;
    expect(data.updateClassAdminNote.adminNote).toBeDefined();
    expect(data.updateClassAdminNote.adminNote?.content).toBe("Updated by integration test");
  });

  test("updateClassAdminNote: non-existent classInstanceId returns GraphQL error", async () => {
    if (!superAdminToken) throw new Error("Missing test context");

    const result = await testClient.mutate({
      mutation: updateClassAdminNoteMutationDocument,
      variables: { classInstanceId: NIL_UUID, content: "Should fail" },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("resendClassNotifications returns result or permission error for valid classInstanceId", async () => {
    if (!superAdminToken || !classInstanceId) throw new Error("Missing test context");

    const result = await testClient.mutate({
      mutation: resendClassNotificationsMutationDocument,
      variables: { classInstanceId },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
    });

    const err = result.error;
    if (err) {
      expect(err.message.length).toBeGreaterThan(0);
    } else if (result.data?.resendClassNotifications) {
      expect(typeof result.data.resendClassNotifications.id).toBe("string");
      expect(typeof result.data.resendClassNotifications.success).toBe("boolean");
    }
  });

  test("resendClassNotifications: non-existent classInstanceId returns GraphQL error", async () => {
    if (!superAdminToken) throw new Error("Missing test context");

    const result = await testClient.mutate({
      mutation: resendClassNotificationsMutationDocument,
      variables: { classInstanceId: NIL_UUID },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  afterAll(async () => {
    if (!adminToken || !superAdminToken) return;

    if (groupClassId) {
      await authenticatedRequest(superAdminToken, "mutate", cleanupTestGroupClassMutationDocument, {
        groupClassId,
      }).catch(() => {});
    }
    if (classInstanceId) {
      await testClient
        .mutate({
          mutation: deleteClassInstanceMutationDocument,
          variables: { classInstanceId },
          errorPolicy: "all",
          context: { headers: { Authorization: `Bearer ${adminToken}` } },
        })
        .catch(() => {});
    }
    if (studentUserId && teacherUserId && parentUserId && studentId && teacherId && parentId) {
      await authenticatedRequest(adminToken, "mutate", cleanupTestEntitiesMutationDocument, {
        studentUserId,
        teacherUserId,
        parentUserId,
        studentId,
        teacherId,
        parentId,
      }).catch(() => {});
    }
    if (superAdminUserId) {
      await cleanupTestSuperAdmin(superAdminToken, superAdminUserId).catch(() => {});
    }
  });
});
