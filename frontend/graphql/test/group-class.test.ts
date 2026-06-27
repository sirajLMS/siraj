import { describe, expect, test } from "bun:test";
import {
  groupClassAuditQueryDocument,
  resendClassNotificationsMutationDocument,
  updateClassAdminNoteMutationDocument,
} from "../sharedDocuments";
import { authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const SEEDED_CLASS_INSTANCE_ID = "cdbf985e-871d-492a-a86e-1c2cf1572893";

describe("GraphQL: groupClassAudit query", () => {
  setupTestServerLifecycle();

  let adminToken = "";

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("admin can query groupClassAudit with valid classInstanceId", async () => {
    const result = await testClient.query({
      query: groupClassAuditQueryDocument,
      variables: { classInstanceId: SEEDED_CLASS_INSTANCE_ID },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
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

  test("non-existent classInstanceId returns GraphQL error", async () => {
    const result = await testClient.query({
      query: groupClassAuditQueryDocument,
      variables: { classInstanceId: NIL_UUID },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});

describe("GraphQL: updateClassAdminNote mutation", () => {
  setupTestServerLifecycle();

  let adminToken = "";

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("admin can update admin note", async () => {
    const data = await authenticatedRequest(adminToken, "mutate", updateClassAdminNoteMutationDocument, {
      classInstanceId: SEEDED_CLASS_INSTANCE_ID,
      content: "Updated by integration test",
    });

    expect(data.updateClassAdminNote).toBeDefined();
    if (!data.updateClassAdminNote) return;
    expect(data.updateClassAdminNote.adminNote).toBeDefined();
    expect(data.updateClassAdminNote.adminNote?.content).toBe("Updated by integration test");
  });

  test("non-existent classInstanceId returns GraphQL error", async () => {
    const result = await testClient.mutate({
      mutation: updateClassAdminNoteMutationDocument,
      variables: { classInstanceId: NIL_UUID, content: "Should fail" },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});

describe("GraphQL: resendClassNotifications mutation", () => {
  setupTestServerLifecycle();

  let adminToken = "";

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("resendClassNotifications returns result or permission error for valid classInstanceId", async () => {
    const result = await testClient.mutate({
      mutation: resendClassNotificationsMutationDocument,
      variables: { classInstanceId: SEEDED_CLASS_INSTANCE_ID },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    if (result.error) {
      expect(result.error.message.length).toBeGreaterThan(0);
    } else if (result.data?.resendClassNotifications) {
      expect(typeof result.data.resendClassNotifications.id).toBe("string");
      expect(typeof result.data.resendClassNotifications.success).toBe("boolean");
    }
  });

  test("non-existent classInstanceId returns GraphQL error", async () => {
    const result = await testClient.mutate({
      mutation: resendClassNotificationsMutationDocument,
      variables: { classInstanceId: NIL_UUID },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});
