import { describe, expect, test } from "bun:test";
import { teachers as demoTeachers } from "@/shared/demo-users";
import { demoLoginMutationDocument } from "../sharedDocuments/auth.documents";
import { createRecurringClassMutationDocument } from "../sharedDocuments/recurring-class.documents";
import {
  dailyScheduleListQueryDocument,
  dailyScheduleMetricsQueryDocument,
} from "../sharedDocuments/schedule.documents";
import {
  teacherWeeklyScheduleGridQueryDocument,
  teacherWorkloadMetricsQueryDocument,
} from "../sharedDocuments/weekly-schedule.documents";
import { fetchFirstStudentTeacherPair, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

describe("GraphQL Schedule Integration Tests", () => {
  setupTestServerLifecycle();

  let authToken: string | null = null;
  const testDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  test("login as super_admin to perform schedule queries", async () => {
    const result = await testClient.mutate({
      mutation: demoLoginMutationDocument,
      variables: {
        input: {
          groupSlug: "super_admin",
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    authToken = result.data?.demoLogin?.token || null;
    if (!authToken) throw new Error("No auth token");
  });

  test("returns daily schedule metrics", async () => {
    const result = await testClient.query({
      query: dailyScheduleMetricsQueryDocument,
      variables: {
        date: testDate,
        teacherId: null,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    if (!result.data) throw new Error("No data");
    expect(result.data.dailyScheduleMetrics).toBeDefined();
    if (result.data.dailyScheduleMetrics) {
      expect(result.data.dailyScheduleMetrics.total).toBeGreaterThanOrEqual(0);
    }
  });

  test("returns daily schedule list and includes timezone times", async () => {
    const result = await testClient.query({
      query: dailyScheduleListQueryDocument,
      variables: {
        date: testDate,
        teacherId: null,
        search: null,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    if (!result.data?.dailyScheduleList) throw new Error("No data");
    expect(Array.isArray(result.data.dailyScheduleList)).toBeTrue();
    if (result.data.dailyScheduleList.length > 0) {
      const firstRow = result.data.dailyScheduleList[0];
      if (!firstRow) throw new Error("No firstRow");
      expect(firstRow.yourTime).toBeDefined();
      expect(firstRow.teacherTime).toBeDefined();
      expect(firstRow.studentTime).toBeDefined();
    }
  });

  test("dailyScheduleList with search param returns filtered rows", async () => {
    const expectedTeacher = demoTeachers[0];
    if (!expectedTeacher) throw new Error("No demo teachers");

    const result = await testClient.query({
      query: dailyScheduleListQueryDocument,
      variables: {
        date: testDate,
        teacherId: null,
        search: expectedTeacher.name,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    if (!result.data?.dailyScheduleList) throw new Error("No data");
    const list = result.data.dailyScheduleList;
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

  test("user without dashboard.search + search arg returns GraphQL error", async () => {
    const loginResult = await testClient.mutate({
      mutation: demoLoginMutationDocument,
      variables: {
        input: {
          groupSlug: "teacher_default",
        },
      },
    });

    const teacherToken = loginResult.data?.demoLogin?.token;
    if (!teacherToken) throw new Error("No teacher token");

    const expectedTeacher = demoTeachers[0];
    if (!expectedTeacher) throw new Error("No demo teachers");

    const result = await testClient.query({
      query: dailyScheduleListQueryDocument,
      variables: {
        date: testDate,
        teacherId: null,
        search: expectedTeacher.name,
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

    const result = await testClient.query({
      query: teacherWeeklyScheduleGridQueryDocument,
      variables: {
        teacherId,
        weekDate: testDate,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    const schedule = result.data?.teacherWeeklyScheduleGrid;
    if (!schedule) throw new Error("No schedule returned");

    expect(schedule.id).toBeDefined();
    expect(schedule.teacherId).toBe(teacherId);
    expect(Array.isArray(schedule.classes)).toBeTrue();
  });

  test("teacherWeeklyScheduleGrid returns own schedule for teacher", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: teacherWeeklyScheduleGridQueryDocument,
      variables: {
        teacherId: null,
        weekDate: testDate,
      },
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    const schedule = result.data?.teacherWeeklyScheduleGrid;
    if (!schedule) throw new Error("No schedule returned");

    expect(schedule.id).toBeDefined();
    expect(schedule.teacherId).toBeDefined();
    expect(Array.isArray(schedule.classes)).toBeTrue();
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

    expect(result.error).toBeDefined();
  });

  test("teacherWorkloadMetrics returns metrics for admin", async () => {
    if (!authToken) throw new Error("No auth token");

    const { teacherId } = await fetchFirstStudentTeacherPair(authToken, testDate);

    const result = await testClient.query({
      query: teacherWorkloadMetricsQueryDocument,
      variables: {
        teacherId,
        weekDate: testDate,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    const metrics = result.data?.teacherWorkloadMetrics;
    if (!metrics) throw new Error("No metrics returned");

    expect(metrics.id).toBeDefined();
    expect(metrics.weeklyHoursWorked).toBeDefined();
    expect(metrics.totalMinutes).toBeGreaterThanOrEqual(0);
    expect(metrics.classCount).toBeGreaterThanOrEqual(0);
  });

  test("teacherWorkloadMetrics returns own metrics for teacher", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: teacherWorkloadMetricsQueryDocument,
      variables: {
        teacherId: null,
        weekDate: testDate,
      },
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    const metrics = result.data?.teacherWorkloadMetrics;
    if (!metrics) throw new Error("No metrics returned");

    expect(metrics.id).toBeDefined();
    expect(metrics.weeklyHoursWorked).toBeDefined();
  });

  test("createRecurringClass denied for teacher role", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.mutate({
      mutation: createRecurringClassMutationDocument,
      variables: {
        input: {
          studentId: "fake-student-id",
          teacherId: "fake-teacher-id",
          durationMinutes: 60,
          defaultStartTime: "10:00:00",
          timezone: "UTC",
          days: [{ dayOfWeek: "MONDAY", startTime: "10:00:00", isActive: true }],
        },
      },
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });

  test("createRecurringClass denied for invalid input (no days)", async () => {
    if (!authToken) throw new Error("No auth token");

    const result = await testClient.mutate({
      mutation: createRecurringClassMutationDocument,
      variables: {
        input: {
          studentId: "fake-student-id",
          teacherId: "fake-teacher-id",
          durationMinutes: 60,
          defaultStartTime: "10:00:00",
          timezone: "UTC",
          days: [],
        },
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });
});
