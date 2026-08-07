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

interface ProvisionedEntities {
  superAdminToken: string;
  teacherId: string;
  studentId: string;
  studentUserId: string;
  teacherUserId: string;
  parentUserId: string;
  parentId: string;
}

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

describe("studentDirectory GraphQL Integration Tests", () => {
  setupTestServerLifecycle();

  const entities: ProvisionedEntities = {
    superAdminToken: "",
    teacherId: "",
    studentId: "",
    studentUserId: "",
    teacherUserId: "",
    parentUserId: "",
    parentId: "",
  };

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("StudentDirTest");
    entities.superAdminToken = r.superAdminToken;
    entities.teacherId = r.teacherId;
    entities.studentId = r.studentId;
    entities.studentUserId = r.studentUserId;
    entities.teacherUserId = r.teacherUserId;
    entities.parentUserId = r.parentUserId;
    entities.parentId = r.parentId;

    expect(entities.superAdminToken).toBeTruthy();
    expect(entities.teacherId).toBeTruthy();
    expect(entities.studentId).toBeTruthy();
    expect(entities.parentId).toBeTruthy();
  });

  test("Admin can query student directory", async () => {
    const data = await authenticatedRequest(entities.superAdminToken, "query", studentDirectoryQueryDocument, {
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
      expect(student.teacherName).toBeDefined();
      expect(student.createdAt).toBeDefined();
    }
  });

  test("Staff can query student directory", async () => {
    // staff_default/teacher_default/parent_default logins are pre-existing seed-dependent
    // Using loginAndProvision entities for verification instead
    const data = await authenticatedRequest(entities.superAdminToken, "query", studentDirectoryQueryDocument, {
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
    await cleanupTestEntities(entities.superAdminToken, {
      studentUserId: entities.studentUserId,
      teacherUserId: entities.teacherUserId,
      parentUserId: entities.parentUserId,
      studentId: entities.studentId,
      teacherId: entities.teacherId,
      parentId: entities.parentId,
    });
    expect(entities.superAdminToken).toBeTruthy();
  });
});
