import { describe, expect, test } from "bun:test";
import type { TeacherProfileUpdateInput } from "@/frontend/graphql/generated/gql/graphql-types";
import { Gender, PaymentMethod } from "@/frontend/graphql/generated/gql/graphql-types";
import { teachers as demoTeachers } from "@/shared/demo-users";
import { teacherDirectoryQueryDocument } from "../sharedDocuments/staff-directory.documents";
import {
  teacherProfileForEditQueryDocument,
  updateTeacherProfileMutationDocument,
} from "../sharedDocuments/staff-profile.documents";
import { teachersQueryDocument } from "../sharedDocuments/teacher.documents";
import { assertOperationDenied, authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

function makeUpdateInput(overrides: Partial<TeacherProfileUpdateInput>): TeacherProfileUpdateInput {
  return {
    address: overrides.address ?? null,
    dateOfBirth: overrides.dateOfBirth ?? null,
    gender: overrides.gender ?? null,
    hourlyRate: overrides.hourlyRate ?? null,
    nationalId: overrides.nationalId ?? null,
    paymentMethod: overrides.paymentMethod ?? null,
    phone: overrides.phone ?? null,
    qualifications: overrides.qualifications ?? null,
    rateCurrency: overrides.rateCurrency ?? null,
    skypeId: overrides.skypeId ?? null,
    timezone: overrides.timezone ?? "UTC",
    zoomLink: overrides.zoomLink ?? null,
    zoomPassword: overrides.zoomPassword ?? null,
    zoomUsername: overrides.zoomUsername ?? null,
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
  paginationArgs: {
    first: number;
    page: number;
    skip: null;
    after: null;
    before: null;
    last: null;
    maxCount: null;
  } | null = null
) {
  const data = await authenticatedRequest(token, "query", teacherDirectoryQueryDocument, {
    search,
    paginationArgs,
  });
  if (!data?.teacherDirectory) throw new Error("No teacher directory returned");
  return data.teacherDirectory;
}

describe("GraphQL Teacher Integration Tests", () => {
  setupTestServerLifecycle();

  let authToken: string | null = null;

  async function getSeededTeacherId(): Promise<string> {
    if (!authToken) throw new Error("No auth token");
    const directory = await queryTeacherDirectory(authToken, null, {
      first: 1,
      page: 1,
      skip: null,
      after: null,
      before: null,
      last: null,
      maxCount: null,
    });
    const teacherId = directory.rows?.[0]?.id;
    if (!teacherId) throw new Error("No seeded teacher found in directory");
    return teacherId;
  }

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
    authToken = await loginDemoUser("super_admin");
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
    await assertOperationDenied("teacher_default", "query", teacherDirectoryQueryDocument, {
      search: null,
      paginationArgs: null,
    });
  });

  test("teacherDirectory returns directory data for authorized admin", async () => {
    if (!authToken) throw new Error("No auth token");

    const directory = await queryTeacherDirectory(authToken, null, null);

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

    const directory = await queryTeacherDirectory(authToken, expectedTeacher.name, null);

    const matched = directory.rows?.some(r => r?.name === expectedTeacher.name);
    expect(matched).toBeTrue();
  });

  test("teacherProfileForEdit — admin can read teacher profile", async () => {
    const teacherId = await getSeededTeacherId();
    if (!authToken) throw new Error("No auth token");

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
    const teacherId = await getSeededTeacherId();
    await assertOperationDenied("teacher_default", "query", teacherProfileForEditQueryDocument, { teacherId });
  });

  test("updateTeacherProfile — teacher role is denied to update profile", async () => {
    const teacherId = await getSeededTeacherId();
    await assertOperationDenied("teacher_default", "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ phone: "+9999999999" }),
    });
  });

  test("updateTeacherProfile — returns error for non-existent teacher", async () => {
    if (!authToken) throw new Error("No auth token");
    const fakeTeacherIdVal = "00000000-0000-0000-0000-000000000000";
    const updateNonExistentResult = await testClient.mutate({
      mutation: updateTeacherProfileMutationDocument,
      variables: {
        teacherId: fakeTeacherIdVal,
        input: {
          address: "Fake Address",
          dateOfBirth: "1990-01-01",
          gender: Gender.Male,
          hourlyRate: "20",
          nationalId: "12345",
          paymentMethod: PaymentMethod.BankAccount,
          phone: "+1111111111",
          qualifications: "None",
          rateCurrency: "USD",
          skypeId: "fake_skype",
          timezone: "UTC",
          zoomLink: "https://zoom.us/j/123",
          zoomPassword: "password",
          zoomUsername: "username",
        },
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
      errorPolicy: "all",
    });
    expect(updateNonExistentResult.error).toBeDefined();
  });

  test("updateTeacherProfile — admin can update teacher profile", async () => {
    const targetTeacherIdForAdmin = await getSeededTeacherId();
    if (!authToken) throw new Error("No auth token");

    const newTeacherPhoneString = "+1234567890";
    const updateProfileData = await authenticatedRequest(authToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId: targetTeacherIdForAdmin,
      input: {
        address: null,
        dateOfBirth: null,
        gender: Gender.Female,
        hourlyRate: null,
        nationalId: null,
        paymentMethod: null,
        phone: newTeacherPhoneString,
        qualifications: null,
        rateCurrency: null,
        skypeId: null,
        timezone: "America/New_York",
        zoomLink: null,
        zoomPassword: null,
        zoomUsername: null,
      },
    });
    expect(updateProfileData.updateTeacherProfile).toBeDefined();
    expect(updateProfileData.updateTeacherProfile?.id).toBe(targetTeacherIdForAdmin);
    expect(updateProfileData.updateTeacherProfile?.phone).toBe(newTeacherPhoneString);
  });

  test("updateTeacherProfile — admin can edit any teacher (no IDOR for admins)", async () => {
    const adminEditTeacherTargetId = await getSeededTeacherId();
    if (!authToken) throw new Error("No auth token");

    const updateAnyTeacherData = await authenticatedRequest(authToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId: adminEditTeacherTargetId,
      input: {
        address: "Updated by admin and verified by tests",
        dateOfBirth: "1985-05-15",
        gender: Gender.Male,
        hourlyRate: "50",
        nationalId: "999888",
        paymentMethod: PaymentMethod.Paypal,
        phone: null,
        qualifications: "Certified Instructor",
        rateCurrency: "USD",
        skypeId: "admin.instructor",
        timezone: "UTC",
        zoomLink: null,
        zoomPassword: null,
        zoomUsername: null,
      },
    });
    expect(updateAnyTeacherData.updateTeacherProfile).toBeDefined();
    expect(updateAnyTeacherData.updateTeacherProfile?.id).toBe(adminEditTeacherTargetId);
    expect(updateAnyTeacherData.updateTeacherProfile?.address).toBe("Updated by admin and verified by tests");
  });
});
