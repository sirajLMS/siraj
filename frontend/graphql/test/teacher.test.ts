import { describe, expect, test } from "bun:test";
import type { TeacherProfileUpdateInput } from "@/frontend/graphql/generated/gql/graphql-types";
import { CurrencyCode, Gender, IanaTimezone, PaymentMethod } from "@/frontend/graphql/generated/gql/graphql-types";
import { teacherDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/staff-directory.documents";
import {
  teacherProfileForEditQueryDocument,
  updateTeacherProfileMutationDocument,
} from "@/frontend/graphql/sharedDocuments/staff-profile.documents";
import { teachersQueryDocument } from "@/frontend/graphql/sharedDocuments/teacher.documents";
import {
  authenticatedRequest,
  cleanupTestEntities,
  loginAndProvision,
  loginDemoUser,
} from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";
import { clearCookies, testClient } from "@/frontend/graphql/test/testClient";

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
    status: overrides.status ?? null,
    timezone: overrides.timezone ?? IanaTimezone.Utc,
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

  let superAdminToken = "";
  let teacherId = "";
  let studentId = "";
  let studentUserId = "";
  let teacherUserId = "";
  let parentUserId = "";
  let parentId = "";

  test("provision test entities and login", async () => {
    const r = await loginAndProvision("TeacherTest");
    superAdminToken = r.superAdminToken;
    teacherId = r.teacherId;
    studentId = r.studentId;
    studentUserId = r.studentUserId;
    teacherUserId = r.teacherUserId;
    parentUserId = r.parentUserId;
    parentId = r.parentId;

    expect(superAdminToken).not.toBe("");
    expect(teacherId).not.toBe("");
    expect(studentId).not.toBe("");
    expect(teacherUserId).not.toBe("");
    expect(parentUserId).not.toBe("");
    expect(parentId).not.toBe("");
  });

  test("returns error on teachers query when unauthenticated", async () => {
    clearCookies();
    const result = await testClient.query({
      query: teachersQueryDocument,
      variables: {
        search: "",
        limit: 10,
      },
    });

    expect(result.error).toBeDefined();
  });

  test("returns list of teachers when authenticated", async () => {
    const teachersList = await queryTeachers(superAdminToken, "TeacherTest", 10);

    expect(Array.isArray(teachersList)).toBeTrue();
    expect(teachersList.length).toBeGreaterThan(0);

    const firstTeacher = teachersList[0];
    expect(firstTeacher).toBeDefined();
    expect(firstTeacher?.id).toBeDefined();
    expect(firstTeacher?.name).toBeDefined();

    const hasExpectedTeacher = teachersList.some(t => t.name?.includes("TeacherTest"));
    expect(hasExpectedTeacher).toBeTrue();
  });

  test("filters list of teachers by search query", async () => {
    const teachersList = await queryTeachers(superAdminToken, "TeacherTest", 10);

    expect(Array.isArray(teachersList)).toBeTrue();

    const matched = teachersList.some(t => t.name?.includes("TeacherTest"));
    expect(matched).toBeTrue();
  });

  test("respects limit argument on teacher query", async () => {
    const teachersList = await queryTeachers(superAdminToken, "TeacherTest", 1);

    expect(Array.isArray(teachersList)).toBeTrue();
    expect(teachersList.length).toBeLessThanOrEqual(1);
  });

  test("teacherDirectory returns error for unauthorized teacher", async () => {
    const token = await loginDemoUser("teacher_default");
    const result = await testClient.query({
      query: teacherDirectoryQueryDocument,
      variables: { search: null, paginationArgs: null },
      context: { headers: { Authorization: `Bearer ${token}` } },
    });
    expect(result.error).toBeDefined();
  });

  test("teacherDirectory returns directory data for authorized admin", async () => {
    const directory = await queryTeacherDirectory(superAdminToken, null, null);

    expect(directory.id).toBeDefined();
    expect(directory.metrics).toBeDefined();
    expect(directory.metrics?.activated).toBeGreaterThanOrEqual(0);
    expect(directory.metrics?.deactivated).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(directory.rows)).toBeTrue();
    expect(directory.totalTeachers).toBeGreaterThanOrEqual(0);
  });

  test("teacherDirectory supports search filtering", async () => {
    const directory = await queryTeacherDirectory(superAdminToken, "TeacherTest", null);

    const matched = directory.rows?.some(r => r?.name?.includes("TeacherTest"));
    expect(matched).toBeTrue();
  });

  test("teacherProfileForEdit — admin can read teacher profile", async () => {
    const profileData = await authenticatedRequest(superAdminToken, "query", teacherProfileForEditQueryDocument, {
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
    const token = await loginDemoUser("teacher_default");
    const result = await testClient.query({
      query: teacherProfileForEditQueryDocument,
      variables: { teacherId },
      context: { headers: { Authorization: `Bearer ${token}` } },
    });
    expect(result.error).toBeDefined();
  });

  test("updateTeacherProfile — teacher role is denied to update profile", async () => {
    const token = await loginDemoUser("teacher_default");
    const result = await testClient.mutate({
      mutation: updateTeacherProfileMutationDocument,
      variables: {
        teacherId,
        input: makeUpdateInput({ phone: "+9999999999" }),
      },
      context: { headers: { Authorization: `Bearer ${token}` } },
    });
    expect(result.error).toBeDefined();
  });

  test("updateTeacherProfile — returns error for non-existent teacher", async () => {
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
          rateCurrency: CurrencyCode.Usd,
          status: null,
          timezone: IanaTimezone.Utc,
        },
      },
      context: {
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
        },
      },
      errorPolicy: "all",
    });
    expect(updateNonExistentResult.error).toBeDefined();
  });

  test("updateTeacherProfile — admin can update teacher profile", async () => {
    const newTeacherPhoneString = "+1234567890";
    const updateProfileData = await authenticatedRequest(
      superAdminToken,
      "mutate",
      updateTeacherProfileMutationDocument,
      {
        teacherId,
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
          status: null,
          timezone: IanaTimezone.AmericaNewYork,
        },
      }
    );
    expect(updateProfileData.updateTeacherProfile).toBeDefined();
    expect(updateProfileData.updateTeacherProfile?.id).toBe(teacherId);
    expect(updateProfileData.updateTeacherProfile?.phone).toBe(newTeacherPhoneString);
  });

  test("updateTeacherProfile — admin can edit any teacher (no IDOR for admins)", async () => {
    const updateAnyTeacherData = await authenticatedRequest(
      superAdminToken,
      "mutate",
      updateTeacherProfileMutationDocument,
      {
        teacherId,
        input: {
          address: "Updated by admin and verified by tests",
          dateOfBirth: "1985-05-15",
          gender: Gender.Male,
          hourlyRate: "50",
          nationalId: "999888",
          paymentMethod: PaymentMethod.Paypal,
          phone: null,
          qualifications: "Certified Instructor",
          rateCurrency: CurrencyCode.Usd,
          status: null,
          timezone: IanaTimezone.Utc,
        },
      }
    );
    expect(updateAnyTeacherData.updateTeacherProfile).toBeDefined();
    expect(updateAnyTeacherData.updateTeacherProfile?.id).toBe(teacherId);
    expect(updateAnyTeacherData.updateTeacherProfile?.address).toBe("Updated by admin and verified by tests");
  });

  test("cleanup provisioned entities", async () => {
    expect(teacherId).not.toBe("");
    expect(studentId).not.toBe("");
    expect(parentId).not.toBe("");

    await cleanupTestEntities(superAdminToken, {
      studentUserId,
      teacherUserId,
      parentUserId,
      studentId,
      teacherId,
      parentId,
    });
  });
});
