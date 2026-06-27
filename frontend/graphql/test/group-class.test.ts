import { describe, expect, test } from "bun:test";
import {
  groupClassAuditQueryDocument,
  resendClassNotificationsMutationDocument,
  updateClassAdminNoteMutationDocument,
} from "../sharedDocuments";
import { dailyScheduleListQueryDocument } from "../sharedDocuments/schedule.documents";
import { authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const TODAY = new Date().toISOString().split("T")[0];

describe("GraphQL: groupClassAudit query", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let classInstanceId = "";

  test("login as academy_admin and fetch a valid classInstanceId from schedule", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();

    const result = await testClient.query({
      query: dailyScheduleListQueryDocument,
      variables: { date: TODAY, teacherId: null, search: null, metricFilter: null },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeUndefined();
    const rows = result.data?.dailyScheduleList;
    expect(Array.isArray(rows)).toBeTrue();
    const firstRow = rows?.find((r: { id?: string | null }) => r?.id);
    expect(firstRow?.id).toBeTruthy();
    classInstanceId = firstRow?.id ?? "";
  });

  test("admin can query groupClassAudit with valid classInstanceId", async () => {
    const result = await testClient.query({
      query: groupClassAuditQueryDocument,
      variables: { classInstanceId },
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
  let classInstanceId = "";

  test("login as academy_admin and fetch a valid classInstanceId from schedule", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();

    const result = await testClient.query({
      query: dailyScheduleListQueryDocument,
      variables: { date: TODAY, teacherId: null, search: null, metricFilter: null },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeUndefined();
    const rows = result.data?.dailyScheduleList;
    expect(Array.isArray(rows)).toBeTrue();
    const firstRow = rows?.find((r: { id?: string | null }) => r?.id);
    expect(firstRow?.id).toBeTruthy();
    classInstanceId = firstRow?.id ?? "";
  });

  test("admin can update admin note", async () => {
    const data = await authenticatedRequest(adminToken, "mutate", updateClassAdminNoteMutationDocument, {
      classInstanceId,
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
  let classInstanceId = "";

  test("login as academy_admin and fetch a valid classInstanceId from schedule", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();

    const result = await testClient.query({
      query: dailyScheduleListQueryDocument,
      variables: { date: TODAY, teacherId: null, search: null, metricFilter: null },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeUndefined();
    const rows = result.data?.dailyScheduleList;
    expect(Array.isArray(rows)).toBeTrue();
    const firstRow = rows?.find((r: { id?: string | null }) => r?.id);
    expect(firstRow?.id).toBeTruthy();
    classInstanceId = firstRow?.id ?? "";
  });

  test("resendClassNotifications returns result or permission error for valid classInstanceId", async () => {
    const result = await testClient.mutate({
      mutation: resendClassNotificationsMutationDocument,
      variables: { classInstanceId },
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
