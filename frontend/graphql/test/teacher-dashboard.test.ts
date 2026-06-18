import { describe, expect, test } from "bun:test";
import {
  createTeacherManualClassEntryMutationDocument,
  teacherDashboardQueryDocument,
} from "../sharedDocuments/teacher-dashboard.documents";
import { fetchFirstStudentTeacherPair, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

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
    if (!teacherToken || !studentId || !teacherId) throw new Error("Missing test context");

    const randomYear = 2030 + (Date.now() % 10);
    const startAt = `${randomYear}-06-25T10:00:00Z`;
    const endAt = `${randomYear}-06-25T11:00:00Z`;

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
  });
});
