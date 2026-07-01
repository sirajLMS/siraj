import { afterAll, describe, expect, test } from "bun:test";
import { studentClassHistoryQueryDocument } from "../sharedDocuments/student-history.documents";
import { cleanupTestEntitiesMutationDocument } from "../sharedDocuments/test-helper.documents";
import { authenticatedRequest, loginAndProvision } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

describe("GraphQL Student History Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken: string | null = null;
  let teacherToken: string | null = null;
  let studentId: string | null = null;
  let teacherId: string | null = null;
  let studentUserId: string | null = null;
  let teacherUserId: string | null = null;
  let parentUserId: string | null = null;
  let parentId: string | null = null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed (1-12)

  test("login as super_admin and teacher", async () => {
    const r = await loginAndProvision("HistTest");
    superAdminToken = r.superAdminToken;
    teacherToken = r.teacherToken;
    studentId = r.studentId;
    teacherId = r.teacherId;
    studentUserId = r.studentUserId;
    teacherUserId = r.teacherUserId;
    parentUserId = r.parentUserId;
    parentId = r.parentId;
  });

  test("academy admin studentClassHistory returns sessions successfully", async () => {
    if (!superAdminToken || !studentId) throw new Error("Missing test context");

    const result = await testClient.query({
      query: studentClassHistoryQueryDocument,
      variables: {
        studentId,
        year: currentYear,
        month: currentMonth,
      },
      context: {
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
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
    if (!teacherToken || !studentId) throw new Error("Missing test context");

    const result = await testClient.query({
      query: studentClassHistoryQueryDocument,
      variables: {
        studentId,
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

  afterAll(async () => {
    if (superAdminToken && studentUserId && teacherUserId && parentUserId) {
      await authenticatedRequest(superAdminToken, "mutate", cleanupTestEntitiesMutationDocument, {
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
