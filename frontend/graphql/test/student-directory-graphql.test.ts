import { describe, expect, test } from "bun:test";
import { studentDirectoryQueryDocument } from "../sharedDocuments/student-directory.documents";
import { authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

describe("studentDirectory GraphQL Integration Tests", () => {
  setupTestServerLifecycle();

  test("Academy Admin can query student directory", async () => {
    const adminToken = await loginDemoUser("academy_admin");
    const data = await authenticatedRequest(adminToken, "query", studentDirectoryQueryDocument, {
      paginationArgs: null,
      filterArgs: null,
      orderBy: null,
    });

    const students = data?.studentDirectory;
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
      expect(student.parentName).toBeDefined();
      expect(student.teacherName !== undefined).toBeTrue();
      expect(student.createdAt).toBeDefined();
    }
  });

  test("Staff Default can query student directory", async () => {
    const staffToken = await loginDemoUser("staff_default");
    const data = await authenticatedRequest(staffToken, "query", studentDirectoryQueryDocument, {
      paginationArgs: null,
      filterArgs: null,
      orderBy: null,
    });

    const students = data?.studentDirectory;
    if (!students) {
      throw new Error("studentDirectory was not returned");
    }

    expect(Array.isArray(students)).toBeTrue();
    expect(students.length).toBeGreaterThan(0);
  });

  test("Teacher denied from student directory", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: studentDirectoryQueryDocument,
      variables: {
        paginationArgs: null,
        filterArgs: null,
        orderBy: null,
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

  test("Parent denied from student directory", async () => {
    const parentToken = await loginDemoUser("parent_default");

    const result = await testClient.query({
      query: studentDirectoryQueryDocument,
      variables: {
        paginationArgs: null,
        filterArgs: null,
        orderBy: null,
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${parentToken}`,
        },
      },
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
});
