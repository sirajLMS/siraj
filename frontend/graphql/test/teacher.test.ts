import { describe, expect, test } from "bun:test";
import { teachers as demoTeachers } from "@/shared/demo-users";
import { demoLoginMutationDocument } from "../sharedDocuments/auth.documents";
import { teachersQueryDocument } from "../sharedDocuments/teacher.documents";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

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

    const result = await testClient.query({
      query: teachersQueryDocument,
      variables: {
        search: "",
        limit: 10,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    const teachersList = result.data?.teachers;
    if (!teachersList) throw new Error("No teachers returned");

    expect(Array.isArray(teachersList)).toBeTrue();
    expect(teachersList.length).toBeGreaterThan(0);

    const firstTeacher = teachersList[0];
    expect(firstTeacher).toBeDefined();
    expect(firstTeacher?.id).toBeDefined();
    expect(firstTeacher?.name).toBeDefined();

    // Verify expected teacher is in the list
    const hasExpectedTeacher = teachersList.some((t) => t.name === expectedTeacher.name);
    expect(hasExpectedTeacher).toBeTrue();
  });

  test("filters list of teachers by search query", async () => {
    if (!authToken) throw new Error("No auth token");

    // Search using the name from demo-users
    const result = await testClient.query({
      query: teachersQueryDocument,
      variables: {
        search: expectedTeacher.name,
        limit: 10,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    const teachersList = result.data?.teachers;
    if (!teachersList) throw new Error("No teachers returned");

    expect(Array.isArray(teachersList)).toBeTrue();
    
    const matched = teachersList.some((t) => t.name === expectedTeacher.name);
    expect(matched).toBeTrue();
  });

  test("respects limit argument on teacher query", async () => {
    if (!authToken) throw new Error("No auth token");

    const result = await testClient.query({
      query: teachersQueryDocument,
      variables: {
        search: "",
        limit: 1,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    const teachersList = result.data?.teachers;
    if (!teachersList) throw new Error("No teachers returned");

    expect(Array.isArray(teachersList)).toBeTrue();
    expect(teachersList.length).toBeLessThanOrEqual(1);
  });
});
