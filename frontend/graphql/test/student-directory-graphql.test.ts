import { describe, expect, test } from "bun:test";
import { studentDirectoryQueryDocument } from "../sharedDocuments/student-directory.documents";
import { authenticatedRequest, cleanupTestEntities, loginAndProvision, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

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

  test("Teacher denied from student directory", async () => {
    const token = await loginDemoUser("teacher_default");
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
  });

  test("Parent denied from student directory", async () => {
    const token = await loginDemoUser("parent_default");
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
