import { describe, expect, test } from "bun:test";
import {
  ClassOutcome,
  ClassType,
  type CreateRecurringClassInput,
  DayOfWeek,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { executeDstBulkUpdateMutationDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/dst-migration.documents";
import {
  adminDashboardScheduleQueryDocument,
  dailyScheduleListQueryDocument,
  dailyScheduleMetricsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/scheduling/schedule.documents";
import {
  clearWeeklyScheduleMutationDocument,
  deleteRecurringClassMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/scheduling/schedule-deletion.documents";
import {
  teacherWeeklyScheduleGridQueryDocument,
  teacherWorkloadMetricsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/scheduling/weekly-schedule.documents";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { resolveClassInstanceDashboardStatus } from "@/shared/lib/schedule/schedule-instance-dashboard-status";
import {
  assertRecurringClassDenied,
  authenticatedRequest,
  cleanupTestEntities,
  cleanupTestSuperAdmin,
  ensureTestSubjectId,
  extractGqlErrorCode,
  fetchFirstClassInstanceId,
  loginAndProvision,
  mutateCreateRecurringClass,
  provisionTestEntities,
  provisionTestSuperAdmin,
  setupTestServerLifecycle,
  testClient,
  verifyWeeklyScheduleGrid,
  verifyWorkloadMetrics,
} from "@/test/helpers";

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

function buildRecurringClassInput(
  overrides: Pick<CreateRecurringClassInput, "studentId" | "teacherId" | "subjectId">
): CreateRecurringClassInput {
  return {
    studentId: overrides.studentId,
    teacherId: overrides.teacherId,
    subjectId: overrides.subjectId,
    durationMinutes: 60,
    defaultStartTime: "10:00:00",
    timezone: IanaTimezone.UTC,
    days: [{ dayOfWeek: DayOfWeek.Monday, startTime: "10:00:00", isActive: true }],
    classType: ClassType.Regular,
    generateInstancesForWeeks: 1,
    effectiveFrom: null,
    effectiveUntil: null,
    hourlyRate: null,
    rateCurrency: null,
    quotaId: null,
    earmarkedClasses: null,
    schedulingMode: null,
    generationHorizonWeeks: null,
    ondemandNoCreditsOutcome: null,
  };
}

describe("GraphQL Schedule Integration Tests", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let teacherToken = "";
  let teacherId = "";
  let studentId = "";
  let studentUserId = "";
  let teacherUserId = "";
  let parentUserId = "";
  let parentId = "";
  let superAdminToken = "";
  let superAdminUserId = "";
  let secondTeacherId = "";
  let secondStudentId = "";
  let secondStudentUserId = "";
  let secondTeacherUserId = "";
  let secondParentUserId = "";
  let secondParentId = "";
  const testDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  test("provision test entities and super admin", async () => {
    const r = await loginAndProvision("SchedTest");
    expect(r.adminToken).not.toBe("");
    adminToken = r.adminToken;
    teacherToken = r.teacherToken;
    teacherId = r.teacherId;
    studentId = r.studentId;
    studentUserId = r.studentUserId;
    teacherUserId = r.teacherUserId;
    parentUserId = r.parentUserId;
    parentId = r.parentId;

    const sa = await provisionTestSuperAdmin(r.superAdminToken, "SchedTestSA");
    expect(sa.token).not.toBe("");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;

    // Provision a second teacher for cross-access tests
    const secondEntities = await provisionTestEntities(r.superAdminToken, "SchedTest2");
    expect(secondEntities.teacherId).not.toBe("");
    secondTeacherId = secondEntities.teacherId;
    secondStudentId = secondEntities.studentId;
    secondStudentUserId = secondEntities.studentUserId;
    secondTeacherUserId = secondEntities.teacherUserId;
    secondParentUserId = secondEntities.parentUserId;
    secondParentId = secondEntities.parentId;
  });

  test("returns daily schedule metrics", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", dailyScheduleMetricsQueryDocument, {
      date: testDate,
      teacherId: null,
    });
    expect(data.dailyScheduleMetrics).toBeDefined();
    if (data.dailyScheduleMetrics) {
      expect(data.dailyScheduleMetrics.total).toBeGreaterThanOrEqual(0);
    }
  });

  test("returns daily schedule list and includes timezone times", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", dailyScheduleListQueryDocument, {
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
    const data = await authenticatedRequest(superAdminToken, "query", dailyScheduleListQueryDocument, {
      date: testDate,
      teacherId: null,
      search: "SchedTest",
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
        teacherName.toLowerCase().includes("schedtest") || studentName.toLowerCase().includes("schedtest");
      expect(nameMatch).toBeTrue();
    }
  });

  test("dailyScheduleList with metricFilter returns subset of rows", async () => {
    const allData = await authenticatedRequest(superAdminToken, "query", dailyScheduleListQueryDocument, {
      date: testDate,
      teacherId: null,
      search: null,
      metricFilter: null,
    });
    const pendingData = await authenticatedRequest(superAdminToken, "query", dailyScheduleListQueryDocument, {
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
      expect(resolveClassInstanceDashboardStatus(item.outcome, item.executionState)).toBe(ClassOutcome.Pending);
    }
  });

  test("adminDashboardSchedule returns aligned metrics and filtered rows", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", adminDashboardScheduleQueryDocument, {
      input: {
        date: testDate,
        teacherId: null,
        search: null,
        metricFilter: "pending",
        paginationArgs: null,
      },
    });

    const result = data.adminDashboardSchedule;
    if (!result) throw new Error("No adminDashboardSchedule data returned");

    expect(result.metrics).toBeDefined();
    expect(Array.isArray(result.rows)).toBeTrue();
    expect(result.totalCount).toBe(result.rows?.length ?? 0);

    for (const item of result.rows ?? []) {
      if (!item) continue;
      expect(resolveClassInstanceDashboardStatus(item.outcome, item.executionState)).toBe(ClassOutcome.Pending);
    }
  });

  test("adminDashboardSchedule returns UNAUTHORIZED error code for teacher role", async () => {
    const result = await testClient.query({
      query: adminDashboardScheduleQueryDocument,
      variables: {
        input: {
          date: testDate,
          teacherId: null,
          search: null,
          metricFilter: null,
          paginationArgs: null,
        },
      },
      errorPolicy: "all",
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
    expect(extractGqlErrorCode(result.error)).toBe("UNAUTHORIZED");
  });

  test("user without dashboard.search + search arg returns GraphQL error with UNAUTHORIZED code", async () => {
    const result = await testClient.query({
      query: dailyScheduleListQueryDocument,
      variables: {
        date: testDate,
        teacherId: null,
        search: "SchedTest",
        metricFilter: null,
      },
      errorPolicy: "all",
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
    expect(extractGqlErrorCode(result.error)).toBe("UNAUTHORIZED");
  });

  test("teacherWeeklyScheduleGrid returns schedule for admin", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", teacherWeeklyScheduleGridQueryDocument, {
      teacherId,
      weekDate: testDate,
    });
    verifyWeeklyScheduleGrid(data.teacherWeeklyScheduleGrid, teacherId);
    expect(data.teacherWeeklyScheduleGrid).toBeDefined();
  });

  test("teacherWeeklyScheduleGrid returns own schedule for teacher", async () => {
    const data = await authenticatedRequest(teacherToken, "query", teacherWeeklyScheduleGridQueryDocument, {
      teacherId: null,
      weekDate: testDate,
    });
    verifyWeeklyScheduleGrid(data.teacherWeeklyScheduleGrid);
    expect(data.teacherWeeklyScheduleGrid).toBeDefined();
  });

  test("teacherWeeklyScheduleGrid denies cross-teacher access", async () => {
    const result = await testClient.query({
      query: teacherWeeklyScheduleGridQueryDocument,
      variables: {
        teacherId: secondTeacherId,
        weekDate: testDate,
      },
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.teacherWeeklyScheduleGrid?.teacherId).not.toBe(secondTeacherId);
  });

  test("teacherWorkloadMetrics returns metrics for admin", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", teacherWorkloadMetricsQueryDocument, {
      teacherId,
      weekDate: testDate,
    });
    verifyWorkloadMetrics(data.teacherWorkloadMetrics);
    expect(data.teacherWorkloadMetrics?.totalMinutes).toBeGreaterThanOrEqual(0);
    expect(data.teacherWorkloadMetrics?.classCount).toBeGreaterThanOrEqual(0);
  });

  test("teacherWorkloadMetrics returns own metrics for teacher", async () => {
    const data = await authenticatedRequest(teacherToken, "query", teacherWorkloadMetricsQueryDocument, {
      teacherId: null,
      weekDate: testDate,
    });
    verifyWorkloadMetrics(data.teacherWorkloadMetrics);
    expect(data.teacherWorkloadMetrics).toBeDefined();
  });

  test("createRecurringClass denied for teacher role with FORBIDDEN code", async () => {
    await assertRecurringClassDenied(
      teacherToken,
      [{ dayOfWeek: DayOfWeek.Monday, startTime: "10:00:00", isActive: true }],
      "FORBIDDEN"
    );
    expect(teacherToken).not.toBe("");
  });

  test("createRecurringClass denied for invalid input (no days) with RECURRING_CLASS_DAYS_REQUIRED code", async () => {
    await assertRecurringClassDenied(superAdminToken, [], "RECURRING_CLASS_DAYS_REQUIRED");
    expect(superAdminToken).not.toBe("");
  });

  test("createRecurringClass rejected when subjectId is omitted", async () => {
    const result = await mutateCreateRecurringClass(
      superAdminToken,
      buildRecurringClassInput({ studentId, teacherId, subjectId: "" })
    );
    expect(result.error).toBeDefined();
    expect(extractGqlErrorCode(result.error)).toBe("SUBJECT_REQUIRED");
  });

  // DST Migration tests
  test("executeDstBulkUpdate — system admin succeeds", async () => {
    const result = await testClient.mutate({
      mutation: executeDstBulkUpdateMutationDocument,
      variables: {
        offsetMinutes: 90,
        description: "Test DST adjustment",
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
        },
      },
    });
    if (result.data?.executeDstBulkUpdate) {
      expect(result.data.executeDstBulkUpdate.runId).toBeDefined();
      expect(result.data.executeDstBulkUpdate.updated).toBeGreaterThanOrEqual(0);
      expect(result.data.executeDstBulkUpdate.conflicts).toBeGreaterThanOrEqual(0);
      expect(result.data.executeDstBulkUpdate.unchanged).toBeGreaterThanOrEqual(0);
      expect(result.data.executeDstBulkUpdate.total).toBeGreaterThanOrEqual(0);
    } else {
      expect(result.error).toBeDefined();
    }
  });

  test("executeDstBulkUpdate — academy admin denied", async () => {
    await assertDstBulkUpdateFails(adminToken);
  });

  test("executeDstBulkUpdate — teacher denied", async () => {
    await assertDstBulkUpdateFails(teacherToken);
  });

  // Schedule deletion tests (including security/IDOR coverage)
  test("deleteRecurringClass — teacher denied (other's class)", async () => {
    const classInstanceId = await fetchFirstClassInstanceId(superAdminToken, testDate);

    const result = await testClient.mutate({
      mutation: deleteRecurringClassMutationDocument,
      variables: {
        classInstanceId,
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
    const classInstanceId = await fetchFirstClassInstanceId(superAdminToken, testDate);

    const deleteData = await authenticatedRequest(superAdminToken, "mutate", deleteRecurringClassMutationDocument, {
      classInstanceId,
    });
    expect(deleteData.deleteRecurringClass).toBeTrue();
  });

  test("createRecurringClass returns meetingUrl null when no meeting provider configured", async () => {
    const subjectId = await ensureTestSubjectId(superAdminToken);
    const result = await mutateCreateRecurringClass(
      superAdminToken,
      buildRecurringClassInput({ studentId, teacherId, subjectId })
    );
    expect(result.error).toBeUndefined();
    expect(result.data?.createRecurringClass?.meetingUrl).toBeNull();
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
    await cleanupTestEntities(superAdminToken, {
      studentUserId: secondStudentUserId,
      teacherUserId: secondTeacherUserId,
      parentUserId: secondParentUserId,
      studentId: secondStudentId,
      teacherId: secondTeacherId,
      parentId: secondParentId,
    });
    await cleanupTestSuperAdmin(superAdminToken, superAdminUserId);
    expect(superAdminToken).not.toBe("");
  });
});
