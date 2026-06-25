import { describe, expect, test } from "bun:test";
import { teachers as demoTeachers } from "@/shared/demo-users";
import { ClassOutcome } from "@/shared/lib/enum";
import { resolveClassInstanceDashboardStatus } from "@/shared/lib/schedule-instance-dashboard-status";
import { executeDstBulkUpdateMutationDocument } from "../sharedDocuments/dst-migration.documents";
import {
  adminDashboardScheduleQueryDocument,
  dailyScheduleListQueryDocument,
  dailyScheduleMetricsQueryDocument,
} from "../sharedDocuments/schedule.documents";
import {
  clearWeeklyScheduleMutationDocument,
  deleteRecurringClassMutationDocument,
} from "../sharedDocuments/schedule-deletion.documents";
import {
  teacherWeeklyScheduleGridQueryDocument,
  teacherWorkloadMetricsQueryDocument,
} from "../sharedDocuments/weekly-schedule.documents";
import {
  assertRecurringClassDenied,
  authenticatedRequest,
  fetchFirstStudentTeacherPair,
  loginDemoUser,
  verifyWeeklyScheduleGrid,
  verifyWorkloadMetrics,
} from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

async function assertDstBulkUpdateFails(token: string) {
  const result = await testClient.mutate({
    mutation: executeDstBulkUpdateMutationDocument,
    variables: {
      offsetMinutes: 60,
      description: "Should fail",
    },
    errorPolicy: "all",
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  expect(result.error).toBeDefined();
}

describe("GraphQL Schedule Integration Tests", () => {
  setupTestServerLifecycle();

  let authToken: string | null = null;
  const testDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  test("login as super_admin to perform schedule queries", async () => {
    authToken = await loginDemoUser("super_admin");
    expect(authToken).not.toBeNull();
  });

  test("returns daily schedule metrics", async () => {
    if (!authToken) throw new Error("No auth token");
    const data = await authenticatedRequest(authToken, "query", dailyScheduleMetricsQueryDocument, {
      date: testDate,
      teacherId: null,
    });
    expect(data.dailyScheduleMetrics).toBeDefined();
    if (data.dailyScheduleMetrics) {
      expect(data.dailyScheduleMetrics.total).toBeGreaterThanOrEqual(0);
    }
  });

  test("returns daily schedule list and includes timezone times", async () => {
    if (!authToken) throw new Error("No auth token");
    const data = await authenticatedRequest(authToken, "query", dailyScheduleListQueryDocument, {
      date: testDate,
      teacherId: null,
      search: null,
      metricFilter: null,
    });
    if (!data.dailyScheduleList) throw new Error("No dailyScheduleList data returned");
    expect(Array.isArray(data.dailyScheduleList)).toBeTrue();
    if (data.dailyScheduleList.length > 0) {
      const firstRow = data.dailyScheduleList[0];
      if (!firstRow) throw new Error("No firstRow");
      expect(firstRow.yourTime).toBeDefined();
      expect(firstRow.teacherTime).toBeDefined();
      expect(firstRow.studentTime).toBeDefined();
      expect(firstRow.outcome).toBeDefined();
      expect(firstRow.executionState).toBeDefined();
    }
  });

  test("dailyScheduleList with search param returns filtered rows", async () => {
    if (!authToken) throw new Error("No auth token");
    const expectedTeacher = demoTeachers[0];
    if (!expectedTeacher) throw new Error("No demo teachers");

    const data = await authenticatedRequest(authToken, "query", dailyScheduleListQueryDocument, {
      date: testDate,
      teacherId: null,
      search: expectedTeacher.name,
      metricFilter: null,
    });
    const list = data.dailyScheduleList;
    if (!list) throw new Error("No dailyScheduleList data returned");
    expect(Array.isArray(list)).toBeTrue();
    for (const item of list) {
      if (!item) continue;
      const teacherName = item.teacher?.name;
      const studentName = item.student?.name;
      if (!teacherName || !studentName) throw new Error("Missing teacher/student name");
      const nameMatch =
        teacherName.toLowerCase().includes(expectedTeacher.name.toLowerCase()) ||
        studentName.toLowerCase().includes(expectedTeacher.name.toLowerCase());
      expect(nameMatch).toBeTrue();
    }
  });

  test("dailyScheduleList with metricFilter returns subset of rows", async () => {
    if (!authToken) throw new Error("No auth token");

    const allData = await authenticatedRequest(authToken, "query", dailyScheduleListQueryDocument, {
      date: testDate,
      teacherId: null,
      search: null,
      metricFilter: null,
    });
    const pendingData = await authenticatedRequest(authToken, "query", dailyScheduleListQueryDocument, {
      date: testDate,
      teacherId: null,
      search: null,
      metricFilter: "pending",
    });

    const allList = allData.dailyScheduleList;
    const pendingList = pendingData.dailyScheduleList;
    if (!allList || !pendingList) throw new Error("No dailyScheduleList data returned");

    expect(pendingList.length).toBeLessThanOrEqual(allList.length);
    for (const item of pendingList) {
      if (!item) continue;
      expect(resolveClassInstanceDashboardStatus(item.outcome, item.executionState)).toBe(ClassOutcome.PENDING);
    }
  });

  test("adminDashboardSchedule returns aligned metrics and filtered rows", async () => {
    if (!authToken) throw new Error("No auth token");

    const data = await authenticatedRequest(authToken, "query", adminDashboardScheduleQueryDocument, {
      input: {
        date: testDate,
        teacherId: null,
        search: null,
        metricFilter: "pending",
      },
    });

    const result = data.adminDashboardSchedule;
    if (!result) throw new Error("No adminDashboardSchedule data returned");

    expect(result.metrics).toBeDefined();
    expect(Array.isArray(result.rows)).toBeTrue();
    expect(result.totalCount).toBe(result.rows?.length ?? 0);

    for (const item of result.rows ?? []) {
      if (!item) continue;
      expect(resolveClassInstanceDashboardStatus(item.outcome, item.executionState)).toBe(ClassOutcome.PENDING);
    }
  });

  test("user without dashboard.search + search arg returns GraphQL error", async () => {
    const teacherToken = await loginDemoUser("teacher_default");
    const expectedTeacher = demoTeachers[0];
    if (!expectedTeacher) throw new Error("No demo teachers");

    const result = await testClient.query({
      query: dailyScheduleListQueryDocument,
      variables: {
        date: testDate,
        teacherId: null,
        search: expectedTeacher.name,
        metricFilter: null,
      },
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });

  test("teacherWeeklyScheduleGrid returns schedule for admin", async () => {
    if (!authToken) throw new Error("No auth token");
    const { teacherId } = await fetchFirstStudentTeacherPair(authToken, testDate);
    const data = await authenticatedRequest(authToken, "query", teacherWeeklyScheduleGridQueryDocument, {
      teacherId,
      weekDate: testDate,
    });
    verifyWeeklyScheduleGrid(data.teacherWeeklyScheduleGrid, teacherId);
  });

  test("teacherWeeklyScheduleGrid returns own schedule for teacher", async () => {
    const teacherToken = await loginDemoUser("teacher_default");
    const data = await authenticatedRequest(teacherToken, "query", teacherWeeklyScheduleGridQueryDocument, {
      teacherId: null,
      weekDate: testDate,
    });
    verifyWeeklyScheduleGrid(data.teacherWeeklyScheduleGrid);
  });

  test("teacherWeeklyScheduleGrid denies cross-teacher access", async () => {
    if (!authToken) throw new Error("No auth token");
    const teacherToken = await loginDemoUser("teacher_default");
    const { teacherId: adminTeacherId } = await fetchFirstStudentTeacherPair(authToken, testDate);

    const result = await testClient.query({
      query: teacherWeeklyScheduleGridQueryDocument,
      variables: {
        teacherId: adminTeacherId,
        weekDate: testDate,
      },
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.teacherWeeklyScheduleGrid?.teacherId).not.toBe(adminTeacherId);
  });

  test("teacherWorkloadMetrics returns metrics for admin", async () => {
    if (!authToken) throw new Error("No auth token");
    const { teacherId } = await fetchFirstStudentTeacherPair(authToken, testDate);
    const data = await authenticatedRequest(authToken, "query", teacherWorkloadMetricsQueryDocument, {
      teacherId,
      weekDate: testDate,
    });
    verifyWorkloadMetrics(data.teacherWorkloadMetrics);
    expect(data.teacherWorkloadMetrics?.totalMinutes).toBeGreaterThanOrEqual(0);
    expect(data.teacherWorkloadMetrics?.classCount).toBeGreaterThanOrEqual(0);
  });

  test("teacherWorkloadMetrics returns own metrics for teacher", async () => {
    const teacherToken = await loginDemoUser("teacher_default");
    const data = await authenticatedRequest(teacherToken, "query", teacherWorkloadMetricsQueryDocument, {
      teacherId: null,
      weekDate: testDate,
    });
    verifyWorkloadMetrics(data.teacherWorkloadMetrics);
  });

  test("createRecurringClass denied for teacher role", async () => {
    const teacherToken = await loginDemoUser("teacher_default");
    await assertRecurringClassDenied(teacherToken, [{ dayOfWeek: "MONDAY", startTime: "10:00:00", isActive: true }]);
  });

  test("createRecurringClass denied for invalid input (no days)", async () => {
    if (!authToken) throw new Error("No auth token");
    await assertRecurringClassDenied(authToken, []);
  });

  // DST Migration tests
  test("executeDstBulkUpdate — system admin succeeds", async () => {
    if (!authToken) throw new Error("No auth token");
    const data = await authenticatedRequest(authToken, "mutate", executeDstBulkUpdateMutationDocument, {
      offsetMinutes: 60,
      description: "Test DST adjustment",
    });
    expect(data.executeDstBulkUpdate).toBeDefined();
    expect(data.executeDstBulkUpdate?.runId).toBeDefined();
    expect(data.executeDstBulkUpdate?.updated).toBeGreaterThanOrEqual(0);
    expect(data.executeDstBulkUpdate?.conflicts).toBeGreaterThanOrEqual(0);
    expect(data.executeDstBulkUpdate?.unchanged).toBeGreaterThanOrEqual(0);
    expect(data.executeDstBulkUpdate?.total).toBeGreaterThanOrEqual(0);
  });

  test("executeDstBulkUpdate — academy admin denied", async () => {
    const academyToken = await loginDemoUser("academy_admin");
    await assertDstBulkUpdateFails(academyToken);
  });

  test("executeDstBulkUpdate — teacher denied", async () => {
    const teacherToken = await loginDemoUser("teacher_default");
    await assertDstBulkUpdateFails(teacherToken);
  });

  // Schedule deletion tests (including security/IDOR coverage)
  test("deleteRecurringClass — teacher denied (other's class)", async () => {
    if (!authToken) throw new Error("No auth token");
    const teacherToken = await loginDemoUser("teacher_default");
    const { teacherId } = await fetchFirstStudentTeacherPair(authToken, testDate);
    const gridData = await authenticatedRequest(authToken, "query", teacherWeeklyScheduleGridQueryDocument, {
      teacherId,
      weekDate: testDate,
    });
    const classItem = gridData.teacherWeeklyScheduleGrid?.classes?.[0];
    if (!classItem?.id) throw new Error("No class instance found in teacher schedule");

    const result = await testClient.mutate({
      mutation: deleteRecurringClassMutationDocument,
      variables: {
        classInstanceId: classItem.id,
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });
    expect(result.error).toBeDefined();
  });

  test("clearWeeklySchedule — teacher denied (other's schedule)", async () => {
    if (!authToken) throw new Error("No auth token");
    const teacherToken = await loginDemoUser("teacher_default");
    const { teacherId } = await fetchFirstStudentTeacherPair(authToken, testDate);

    const result = await testClient.mutate({
      mutation: clearWeeklyScheduleMutationDocument,
      variables: {
        teacherId,
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });
    expect(result.error).toBeDefined();
  });

  test("deleteRecurringClass — admin succeeds (any class)", async () => {
    if (!authToken) throw new Error("No auth token");
    const { teacherId } = await fetchFirstStudentTeacherPair(authToken, testDate);
    const gridData = await authenticatedRequest(authToken, "query", teacherWeeklyScheduleGridQueryDocument, {
      teacherId,
      weekDate: testDate,
    });
    const classItem = gridData.teacherWeeklyScheduleGrid?.classes?.[0];
    if (!classItem?.id) throw new Error("No class instance found in teacher schedule");

    const deleteData = await authenticatedRequest(authToken, "mutate", deleteRecurringClassMutationDocument, {
      classInstanceId: classItem.id,
    });
    expect(deleteData.deleteRecurringClass).toBeTrue();
  });
});
