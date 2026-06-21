import { describe, expect, test } from "bun:test";
import type { TeacherProfileUpdateInput } from "@/frontend/graphql/generated/gql/graphql-types";
import { teachers as demoTeachers } from "@/shared/demo-users";
import { demoLoginMutationDocument } from "../sharedDocuments/auth.documents";
import { teacherDirectoryQueryDocument } from "../sharedDocuments/staff-directory.documents";
import {
  teacherProfileForEditQueryDocument,
  updateTeacherProfileMutationDocument,
} from "../sharedDocuments/staff-profile.documents";
import { teachersQueryDocument } from "../sharedDocuments/teacher.documents";
import { authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

function makeUpdateInput(overrides: Partial<TeacherProfileUpdateInput>): TeacherProfileUpdateInput {
  return {
    address: null,
    dateOfBirth: null,
    gender: null,
    hourlyRate: null,
    nationalId: null,
    phone: null,
    qualifications: null,
    rateCurrency: null,
    skypeId: null,
    timezone: null,
    zoomLink: null,
    zoomPassword: null,
    zoomUsername: null,
    ...overrides,
  };
}

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

  test("teacherProfileForEdit — admin can read teacher profile", async () => {
    if (!authToken) throw new Error("No auth token");
    const directory = await queryTeacherDirectory(authToken, null, 1, 0);
    const teacherId = directory.rows?.[0]?.id;
    if (!teacherId) throw new Error("No seeded teacher found in directory");

    const profileData = await authenticatedRequest(authToken, "query", teacherProfileForEditQueryDocument, {
      teacherId,
    });
    expect(profileData.teacherProfileForEdit).toBeDefined();
    expect(profileData.teacherProfileForEdit?.id).toBe(teacherId);
    expect(profileData.teacherProfileForEdit?.name).toBeDefined();
    expect(profileData.teacherProfileForEdit?.email).toBeDefined();
    expect(profileData.teacherProfileForEdit?.timezone).toBeDefined();
    expect(profileData.teacherProfileForEdit?.status).toBeDefined();
  });

  test("teacherProfileForEdit — teacher role is denied access", async () => {
    const teacherToken = await loginDemoUser("teacher_default");
    if (!authToken) throw new Error("No auth token");
    const directory = await queryTeacherDirectory(authToken, null, 1, 0);
    const teacherId = directory.rows?.[0]?.id;
    if (!teacherId) throw new Error("No seeded teacher found in directory");

    const result = await testClient.query({
      query: teacherProfileForEditQueryDocument,
      variables: { teacherId },
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });
    expect(result.error).toBeDefined();
  });

  test("updateTeacherProfile — admin can update teacher profile", async () => {
    if (!authToken) throw new Error("No auth token");
    const directory = await queryTeacherDirectory(authToken, null, 1, 0);
    const teacherId = directory.rows?.[0]?.id;
    if (!teacherId) throw new Error("No seeded teacher found in directory");

    const newPhone = "+1234567890";
    const updateData = await authenticatedRequest(authToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({
        phone: newPhone,
        timezone: "America/New_York",
      }),
    });
    expect(updateData.updateTeacherProfile).toBeDefined();
    expect(updateData.updateTeacherProfile?.id).toBe(teacherId);
    expect(updateData.updateTeacherProfile?.phone).toBe(newPhone);
  });

  test("updateTeacherProfile — teacher role is denied to update profile", async () => {
    const teacherToken = await loginDemoUser("teacher_default");
    if (!authToken) throw new Error("No auth token");
    const directory = await queryTeacherDirectory(authToken, null, 1, 0);
    const teacherId = directory.rows?.[0]?.id;
    if (!teacherId) throw new Error("No seeded teacher found in directory");

    const result = await testClient.mutate({
      mutation: updateTeacherProfileMutationDocument,
      variables: {
        teacherId,
        input: makeUpdateInput({
          phone: "+9999999999",
        }),
      },
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });
    expect(result.error).toBeDefined();
  });

  test("updateTeacherProfile — returns error for non-existent teacher", async () => {
    if (!authToken) throw new Error("No auth token");
    const fakeTeacherId = "00000000-0000-0000-0000-000000000000";
    const result = await testClient.mutate({
      mutation: updateTeacherProfileMutationDocument,
      variables: {
        teacherId: fakeTeacherId,
        input: makeUpdateInput({
          phone: "+1111111111",
        }),
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });
    expect(result.error).toBeDefined();
  });

  test("updateTeacherProfile — admin can edit any teacher (no IDOR for admins)", async () => {
    if (!authToken) throw new Error("No auth token");
    const directory = await queryTeacherDirectory(authToken, null, 1, 0);
    const teacherId = directory.rows?.[0]?.id;
    if (!teacherId) throw new Error("No seeded teacher found in directory");

    const updateData = await authenticatedRequest(authToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({
        address: "Updated by admin",
      }),
    });
    expect(updateData.updateTeacherProfile).toBeDefined();
    expect(updateData.updateTeacherProfile?.id).toBe(teacherId);
    expect(updateData.updateTeacherProfile?.address).toBe("Updated by admin");
  });
});
