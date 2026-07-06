import { describe, expect, test } from "bun:test";
import {
  teacherAssignedClassesQueryDocument,
  teacherAssignedStudentsQueryDocument,
  teacherOwnProfileQueryDocument,
} from "../sharedDocuments/teacher-portal.documents";
import { assertOperationDenied, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

describe("GraphQL Teacher Portal Integration Tests", () => {
  setupTestServerLifecycle();

  test("teacherAssignedStudents — allowed for teacher_default", async () => {
    const token = await loginDemoUser("teacher_default");
    const result = await testClient.query({
      query: teacherAssignedStudentsQueryDocument,
      context: { headers: { Authorization: `Bearer ${token}` } },
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.teacherAssignedStudents).toBeDefined();
    expect(Array.isArray(result.data?.teacherAssignedStudents?.rows)).toBeTrue();
  });

  test("teacherOwnProfile — allowed for teacher_default", async () => {
    const token = await loginDemoUser("teacher_default");
    const result = await testClient.query({
      query: teacherOwnProfileQueryDocument,
      context: { headers: { Authorization: `Bearer ${token}` } },
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.teacherOwnProfile?.id).toBeDefined();
    expect(result.data?.teacherOwnProfile?.name).toBeDefined();
  });

  test("teacherAssignedClasses — allowed for teacher_default", async () => {
    const token = await loginDemoUser("teacher_default");
    const result = await testClient.query({
      query: teacherAssignedClassesQueryDocument,
      context: { headers: { Authorization: `Bearer ${token}` } },
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.teacherAssignedClasses).toBeDefined();
    expect(Array.isArray(result.data?.teacherAssignedClasses?.rows)).toBeTrue();
  });

  test("teacherAssignedStudents — denied for parent_default", async () => {
    await assertOperationDenied("parent_default", "query", teacherAssignedStudentsQueryDocument, {});
  });

  test("teacherOwnProfile — denied for parent_default", async () => {
    await assertOperationDenied("parent_default", "query", teacherOwnProfileQueryDocument, {});
  });

  test("teacherAssignedClasses — denied for parent_default", async () => {
    await assertOperationDenied("parent_default", "query", teacherAssignedClassesQueryDocument, {});
  });
});
