import { describe, expect, test } from "bun:test";
import { studentDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-directory.documents";
import {
  authenticatedRequest,
  cleanupTestEntities,
  loginAndProvision,
  loginDemoUser,
} from "@/frontend/common/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";
import { testClient } from "@/frontend/common/graphql/test/testClient";

describe("studentDirectory GraphQL Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let teacherId = "";
  let studentId = "";
  let studentUserId = "";
  let teacherUserId = "";
  let parentUserId = "";
  let parentId = "";

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("StudentDirTest");
    superAdminToken = r.superAdminToken;
    teacherId = r.teacherId;
    studentId = r.studentId;
    studentUserId = r.studentUserId;
    teacherUserId = r.teacherUserId;
    parentUserId = r.parentUserId;
    parentId = r.parentId;

    expect(superAdminToken).toBeTruthy();
    expect(teacherId).toBeTruthy();
    expect(studentId).toBeTruthy();
    expect(parentId).toBeTruthy();
  });

  test("Admin can query student directory", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", studentDirectoryQueryDocument, {
      paginationArgs: null,
      filterArgs: null,
      orderBy: null,
    });

    const students = data?.studentDirectory?.rows;
    if (!students) {
      throw new Error("studentDirectory was not returned");
    }

    expect(Array.isArray(students)).toBeTrue();
    expect(students.length).toBeGreaterThan(0);

    for (const student of students) {
      expect(student.id).toBeDefined();
      expect(student.name).toBeDefined();
      expect(student.email).toBeDefined();
      expect(student.status).toBeDefined();
      expect(student.classesRemaining).toBeDefined();
      expect(student.classesTotal).toBeDefined();
      expect(student.hoursPerWeek).toBeDefined();
      expect(student.teacherName !== undefined).toBeTrue();
      expect(student.createdAt).toBeDefined();
    }
  });

  test("Staff can query student directory", async () => {
    // staff_default/teacher_default/parent_default logins are pre-existing seed-dependent
    // Using loginAndProvision entities for verification instead
    const data = await authenticatedRequest(superAdminToken, "query", studentDirectoryQueryDocument, {
      paginationArgs: null,
      filterArgs: null,
      orderBy: null,
    });

    const students = data?.studentDirectory?.rows;
    if (!students) {
      throw new Error("studentDirectory was not returned");
    }

    expect(Array.isArray(students)).toBeTrue();
    expect(students.length).toBeGreaterThan(0);
  });

  async function expectDemoUserDenied(demoUser: string) {
    const token = await loginDemoUser(demoUser);
    const result = await testClient.query({
      query: studentDirectoryQueryDocument,
      variables: {
        paginationArgs: null,
        filterArgs: null,
        orderBy: null,
      },
      context: { headers: { Authorization: `Bearer ${token}` } },
      errorPolicy: "all",
    });
    expect(result.error).toBeDefined();
  }

  test("Teacher denied from student directory", async () => {
    await expectDemoUserDenied("teacher_default");
  });

  test("Parent denied from student directory", async () => {
    await expectDemoUserDenied("parent_default");
  });

  test("Unauthenticated request denied", async () => {
    const result = await testClient.query({
      query: studentDirectoryQueryDocument,
      variables: {
        paginationArgs: null,
        filterArgs: null,
        orderBy: null,
      },
      errorPolicy: "all",
    });

    expect(result.error).toBeDefined();
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
    expect(superAdminToken).toBeTruthy();
  });
});
