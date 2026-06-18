import { describe, expect, test } from "bun:test";
import { studentClassHistoryQueryDocument } from "../sharedDocuments/student-history.documents";
import { fetchFirstStudentTeacherPair, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

describe("GraphQL Student History Integration Tests", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;
  let teacherToken: string | null = null;
  let targetStudentId: string | null = null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed (1-12)

  test("login as academy_admin and teacher", async () => {
    adminToken = await loginDemoUser("academy_admin");
    teacherToken = await loginDemoUser("teacher_default");
    expect(adminToken).not.toBeNull();
    expect(teacherToken).not.toBeNull();
  });

  test("retrieve a valid student ID from schedule list", async () => {
    if (!adminToken) throw new Error("No admin token");
    const testDate = now.toISOString().split("T")[0];
    const pair = await fetchFirstStudentTeacherPair(adminToken, testDate);
    targetStudentId = pair.studentId;
    expect(targetStudentId).toBeDefined();
  });

  test("academy admin studentClassHistory returns sessions successfully", async () => {
    if (!adminToken || !targetStudentId) throw new Error("Missing test context");

    const result = await testClient.query({
      query: studentClassHistoryQueryDocument,
      variables: {
        studentId: targetStudentId,
        year: currentYear,
        month: currentMonth,
      },
      context: {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    if (!result.data?.studentClassHistory) throw new Error("No data returned");
    expect(result.data.studentClassHistory).toBeDefined();
    expect(result.data.studentClassHistory.studentName).toBeDefined();
    expect(Array.isArray(result.data.studentClassHistory.sessions)).toBeTrue();
    expect(result.data.studentClassHistory.metrics).toBeDefined();
  });

  test("user without history.view_calendar (teacher) returns unauthorized GraphQL error", async () => {
    if (!teacherToken || !targetStudentId) throw new Error("Missing test context");

    const result = await testClient.query({
      query: studentClassHistoryQueryDocument,
      variables: {
        studentId: targetStudentId,
        year: currentYear,
        month: currentMonth,
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
});
