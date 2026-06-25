import { afterAll, describe, expect, test } from "bun:test";
import { deleteClassInstanceMutationDocument } from "../sharedDocuments/class-session.documents";
import { dailyScheduleListQueryDocument } from "../sharedDocuments/schedule.documents";
import {
  createTeacherManualClassEntryMutationDocument,
  teacherDashboardQueryDocument,
  teacherFutureScheduleQueryDocument,
} from "../sharedDocuments/teacher-dashboard.documents";
import { cleanupTestEntitiesMutationDocument } from "../sharedDocuments/test-helper.documents";
import { authenticatedRequest, loginAndProvision } from "./helpers";
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
  let studentUserId: string | null = null;
  let teacherUserId: string | null = null;
  let parentUserId: string | null = null;
  let parentId: string | null = null;
  const testDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  test("login as teacher and academy_admin", async () => {
    const r = await loginAndProvision("DashTest");
    adminToken = r.adminToken;
    teacherToken = r.teacherToken;
    studentId = r.studentId;
    teacherId = r.teacherId;
    studentUserId = r.studentUserId;
    teacherUserId = r.teacherUserId;
    parentUserId = r.parentUserId;
    parentId = r.parentId;
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

  test("teacherFutureSchedule — authorized teacher receives future schedule with quota data", async () => {
    if (!teacherToken) throw new Error("No teacher token");

    const result = await testClient.query({
      query: teacherFutureScheduleQueryDocument,
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.teacherFutureSchedule).toBeDefined();
    const schedule = result.data?.teacherFutureSchedule;
    if (!schedule) throw new Error("No teacherFutureSchedule data returned");

    expect(schedule.id).toBeDefined();
    expect(typeof schedule.leaveQuotaUsed).toBe("number");
    expect(typeof schedule.leaveQuotaTotal).toBe("number");
    expect((schedule.leaveQuotaTotal ?? 0) >= 2).toBeTrue();
    expect(typeof schedule.totalClasses).toBe("number");
    expect(Array.isArray(schedule.classes)).toBeTrue();

    for (const cls of schedule.classes ?? []) {
      if (!cls) continue;
      expect(cls.id).toBeDefined();
      expect(typeof cls.isRescheduled).toBe("boolean");
      expect(typeof cls.leaveRequestDisabled).toBe("boolean");
      if (cls.leaveRequestDisabledReason !== null) {
        expect(["time", "quota"]).toContain(cls.leaveRequestDisabledReason);
      }
    }
  });

  test("teacherFutureSchedule — denied when user has no teacher record (academy admin)", async () => {
    if (!adminToken) throw new Error("No admin token");

    const result = await testClient.query({
      query: teacherFutureScheduleQueryDocument,
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });

  test("teacherFutureSchedule — denied when unauthenticated", async () => {
    const result = await testClient.query({
      query: teacherFutureScheduleQueryDocument,
      errorPolicy: "all",
    });

    expect(result.error).toBeDefined();
  });

  afterAll(async () => {
    if (adminToken && studentUserId && teacherUserId && parentUserId) {
      await authenticatedRequest(adminToken, "mutate", cleanupTestEntitiesMutationDocument, {
        studentUserId,
        teacherUserId,
        parentUserId,
        studentId: studentId || "",
        teacherId: teacherId || "",
        parentId: parentId || "",
      });
    }
  });
});
