import { describe, expect, test } from "bun:test";
import { teachers as demoTeachers } from "@/shared/demo-users";
import { demoLoginMutationDocument } from "../sharedDocuments/auth.documents";
import { teacherDirectoryQueryDocument } from "../sharedDocuments/staff-directory.documents";
import { teachersQueryDocument } from "../sharedDocuments/teacher.documents";
import { authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

async function queryTeachers(token: string, search: string, limit: number) {
  const data = await authenticatedRequest(token, "query", teachersQueryDocument, {
    search,
    limit,
  });
  if (!data?.teachers) throw new Error("No teachers returned");
  return data.teachers;
}

async function queryTeacherDirectory(
  token: string,
  search: string | null = null,
  limit: number | null = null,
  offset: number | null = null
) {
  const data = await authenticatedRequest(token, "query", teacherDirectoryQueryDocument, {
    search,
    limit,
    offset,
  });
  if (!data?.teacherDirectory) throw new Error("No directory returned");
  return data.teacherDirectory;
}

describe("GraphQL Teacher Integration Tests", () => {
  setupTestServerLifecycle();

  let authToken: string | null = null;

  const expectedTeacher = demoTeachers[0];
  if (!expectedTeacher) throw new Error("No demo teachers defined in demo-users");

  test("returns error on teachers query when unauthenticated", async () => {
    const result = await testClient.query({
      query: teachersQueryDocument,
      variables: {
        search: "",
        limit: 10,
      },
    });

    expect(result.error).toBeDefined();
  });

  test("login as super_admin to perform teacher queries", async () => {
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
    expect(authToken).not.toBeNull();
  });

  test("returns list of teachers when authenticated", async () => {
    if (!authToken) throw new Error("No auth token");

    const teachersList = await queryTeachers(authToken, "", 10);

    expect(Array.isArray(teachersList)).toBeTrue();
    expect(teachersList.length).toBeGreaterThan(0);

    const firstTeacher = teachersList[0];
    expect(firstTeacher).toBeDefined();
    expect(firstTeacher?.id).toBeDefined();
    expect(firstTeacher?.name).toBeDefined();

    // Verify expected teacher is in the list
    const hasExpectedTeacher = teachersList.some(t => t.name === expectedTeacher.name);
    expect(hasExpectedTeacher).toBeTrue();
  });

  test("filters list of teachers by search query", async () => {
    if (!authToken) throw new Error("No auth token");

    // Search using the name from demo-users
    const teachersList = await queryTeachers(authToken, expectedTeacher.name, 10);

    expect(Array.isArray(teachersList)).toBeTrue();

    const matched = teachersList.some(t => t.name === expectedTeacher.name);
    expect(matched).toBeTrue();
  });

  test("respects limit argument on teacher query", async () => {
    if (!authToken) throw new Error("No auth token");

    const teachersList = await queryTeachers(authToken, "", 1);

    expect(Array.isArray(teachersList)).toBeTrue();
    expect(teachersList.length).toBeLessThanOrEqual(1);
  });

  test("teacherDirectory returns error for unauthorized teacher", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: teacherDirectoryQueryDocument,
      variables: {
        search: null,
        limit: null,
        offset: null,
      },
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });

  test("teacherDirectory returns directory data for authorized admin", async () => {
    if (!authToken) throw new Error("No auth token");

    const directory = await queryTeacherDirectory(authToken, null, null, null);

    expect(directory.id).toBeDefined();
    expect(directory.metrics).toBeDefined();
    expect(directory.metrics?.activated).toBeGreaterThanOrEqual(0);
    expect(directory.metrics?.deactivated).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(directory.rows)).toBeTrue();
    expect(directory.totalTeachers).toBeGreaterThanOrEqual(0);
  });

  test("teacherDirectory supports search filtering", async () => {
    if (!authToken) throw new Error("No auth token");
    const expectedTeacher = demoTeachers[0];
    if (!expectedTeacher) throw new Error("No demo teachers");

    const directory = await queryTeacherDirectory(authToken, expectedTeacher.name, null, null);

    const matched = directory.rows?.some(r => r?.name === expectedTeacher.name);
    expect(matched).toBeTrue();
  });
});
