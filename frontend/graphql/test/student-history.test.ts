import { afterAll, describe, expect, test } from "bun:test";
import { studentClassHistoryQueryDocument } from "../sharedDocuments/student-history.documents";
import {
  cleanupTestEntitiesMutationDocument,
  createTestEntitiesMutationDocument,
} from "../sharedDocuments/test-helper.documents";
import { authenticatedRequest, loginDemoUser, loginUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

describe("GraphQL Student History Integration Tests", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;
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

  test("login as academy_admin and teacher", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();

    // 1. Provision isolated test entities
    const setupRes = await authenticatedRequest(adminToken, "mutate", createTestEntitiesMutationDocument, {
      prefix: "HistTest",
      classesRemaining: 10,
    });
    const entities = setupRes.createTestEntities;
    if (!entities) throw new Error("Failed to create test entities");

    studentId = entities.studentId;
    teacherId = entities.teacherId;
    studentUserId = entities.studentUserId;
    teacherUserId = entities.teacherUserId;
    parentUserId = entities.parentUserId;
    parentId = entities.parentId;

    // 2. Login as the newly created teacher to get their isolated token
    if (!entities.teacherUserEmail) throw new Error("Teacher email not returned");
    teacherToken = await loginUser(entities.teacherUserEmail, "password");
    expect(teacherToken).not.toBeNull();
  });

  test("academy admin studentClassHistory returns sessions successfully", async () => {
    if (!adminToken || !studentId) throw new Error("Missing test context");

    const result = await testClient.query({
      query: studentClassHistoryQueryDocument,
      variables: {
        studentId,
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
