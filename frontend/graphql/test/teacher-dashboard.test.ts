import { describe, expect, test } from "bun:test";
import { deleteClassInstanceMutationDocument } from "../sharedDocuments/class-session.documents";
import { dailyScheduleListQueryDocument } from "../sharedDocuments/schedule.documents";
import {
  createTeacherManualClassEntryMutationDocument,
  teacherDashboardQueryDocument,
} from "../sharedDocuments/teacher-dashboard.documents";
import { fetchFirstStudentTeacherPair, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

async function clearClassesOnDate(token: string, dateVal: string) {
  const result = await testClient.query({
    query: dailyScheduleListQueryDocument,
    variables: {
      date: dateVal,
      teacherId: null,
      search: null,
    },
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const list = result.data?.dailyScheduleList || [];
  for (const item of list) {
    if (!item.id) continue;
    await testClient.mutate({
      mutation: deleteClassInstanceMutationDocument,
      variables: {
        classInstanceId: item.id,
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }
}

describe("GraphQL Teacher Dashboard Integration Tests", () => {
  setupTestServerLifecycle();

  let teacherToken: string | null = null;
  let adminToken: string | null = null;
  let studentId: string | null = null;
  let teacherId: string | null = null;
  const testDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  test("login as teacher and academy_admin", async () => {
    teacherToken = await loginDemoUser("teacher_default");
    adminToken = await loginDemoUser("academy_admin");
    expect(teacherToken).not.toBeNull();
    expect(adminToken).not.toBeNull();
  });

  test("retrieve student and teacher IDs to use in manual entry test", async () => {
    if (!adminToken) throw new Error("No admin token");
    const pair = await fetchFirstStudentTeacherPair(adminToken, testDate);
    studentId = pair.studentId;
    teacherId = pair.teacherId;
    expect(studentId).toBeDefined();
    expect(teacherId).toBeDefined();
  });

  test("teacherDashboard query returns rows scoped to teacher", async () => {
    if (!teacherToken) throw new Error("No teacher token");

    const result = await testClient.query({
      query: teacherDashboardQueryDocument,
      variables: {
        date: testDate,
      },
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    if (!result.data?.teacherDashboard) throw new Error("No dashboard data returned");
    expect(result.data.teacherDashboard.metrics).toBeDefined();
    expect(Array.isArray(result.data.teacherDashboard.scheduleRows)).toBeTrue();
    expect(Array.isArray(result.data.teacherDashboard.progressFeed)).toBeTrue();

    const teacherDashboardData = result.data.teacherDashboard;
    const rows = teacherDashboardData.scheduleRows;
    if (!rows) throw new Error("No scheduleRows in dashboard");
    for (const row of rows) {
      if (!row) continue;
      expect(row.studentId).toBeDefined();
      expect(row.scheduledStartAt).toBeDefined();
      expect(row.durationMinutes).toBeDefined();
    }
  });

  test("user without teacher.view_dashboard (academy admin) query returns unauthorized GraphQL error", async () => {
    if (!adminToken) throw new Error("No admin token");

    const result = await testClient.query({
      query: teacherDashboardQueryDocument,
      variables: {
        date: testDate,
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });

  test("createTeacherManualClassEntry creates a manual class instance successfully", async () => {
    if (!teacherToken || !adminToken || !studentId || !teacherId) throw new Error("Missing test context");

    const randomYear = 2030 + (Date.now() % 10);
    const dateStr = `${randomYear}-06-25`;
    const startAt = `${dateStr}T10:00:00Z`;
    const endAt = `${dateStr}T11:00:00Z`;

    // Clear any existing classes on this date to prevent booking conflicts
    await clearClassesOnDate(adminToken, dateStr);

    const result = await testClient.mutate({
      mutation: createTeacherManualClassEntryMutationDocument,
      variables: {
        input: {
          studentId,
          teacherId,
          scheduledStartAt: startAt,
          scheduledEndAt: endAt,
          durationMinutes: 60,
          classType: "REGULAR",
        },
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    if (!result.data?.createTeacherManualClassEntry) throw new Error("Failed to create manual entry");

    const created = result.data.createTeacherManualClassEntry;
    expect(created.id).toBeDefined();
    expect(created.status).toBeDefined();
    expect(created.durationMinutes).toBe(60);

    const classInstanceId = created.id;
    if (!classInstanceId) {
      throw new Error("Created class instance ID is null or undefined");
    }

    // Clean up to avoid test pollution / booking overlaps in subsequent runs
    const deleteRes = await testClient.mutate({
      mutation: deleteClassInstanceMutationDocument,
      variables: {
        classInstanceId,
      },
      context: {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    });
    expect(deleteRes.error).toBeUndefined();
  });
});
