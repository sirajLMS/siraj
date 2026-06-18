import { describe, expect, test } from "bun:test";
import { teachers as demoTeachers } from "@/shared/demo-users";
import { demoLoginMutationDocument } from "../sharedDocuments/auth.documents";
import {
  dailyScheduleListQueryDocument,
  dailyScheduleMetricsQueryDocument,
} from "../sharedDocuments/schedule.documents";
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
});
