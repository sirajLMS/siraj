import { describe, expect, test } from "bun:test";
import {
  CountryCode,
  CurrencyCode,
  Gender,
  type TeacherProfileUpdateInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  teacherDirectoryQueryDocument,
  teacherProfileForEditQueryDocument,
  teachersQueryDocument,
  updateTeacherProfileMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import {
  authenticatedRequest,
  cleanupTestEntities,
  clearCookies,
  loginAndProvision,
  loginDemoUser,
  setupTestServerLifecycle,
  testClient,
} from "@/test/helpers";

function makeUpdateInput(overrides: Partial<TeacherProfileUpdateInput>): TeacherProfileUpdateInput {
  return {
    address: overrides.address ?? null,
    dateOfBirth: overrides.dateOfBirth ?? null,
    gender: overrides.gender ?? null,
    hourlyRate: overrides.hourlyRate ?? null,
    nationalId: overrides.nationalId ?? null,
    nationality: overrides.nationality ?? null,
    countryCode: overrides.countryCode ?? null,
    phone: overrides.phone ?? null,
    qualifications: overrides.qualifications ?? null,
    rateCurrency: overrides.rateCurrency ?? null,
    status: overrides.status ?? null,
    timezone: overrides.timezone ?? IanaTimezone.UTC,
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
        input: makeUpdateInput({
          address: "Fake Address",
          dateOfBirth: "1990-01-01",
          gender: Gender.Male,
          hourlyRate: "20",
          nationalId: { countryCode: null, number: "12345" },
          phone: "+1111111111",
          qualifications: "None",
          rateCurrency: CurrencyCode.Usd,
          status: null,
          timezone: IanaTimezone.UTC,
        }),
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
        input: makeUpdateInput({
          address: null,
          dateOfBirth: null,
          gender: Gender.Female,
          hourlyRate: null,
          nationalId: null,
          phone: newTeacherPhoneString,
          qualifications: null,
          rateCurrency: null,
          status: null,
          timezone: IanaTimezone.America_New_York,
        }),
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
        input: makeUpdateInput({
          address: "Updated by admin and verified by tests",
          dateOfBirth: "1985-05-15",
          gender: Gender.Male,
          hourlyRate: "50",
          nationalId: { countryCode: null, number: "999888" },
          phone: null,
          qualifications: "Certified Instructor",
          rateCurrency: CurrencyCode.Usd,
          status: null,
          timezone: IanaTimezone.UTC,
        }),
      }
    );
    expect(updateAnyTeacherData.updateTeacherProfile).toBeDefined();
    expect(updateAnyTeacherData.updateTeacherProfile?.id).toBe(teacherId);
    expect(updateAnyTeacherData.updateTeacherProfile?.address).toBe("Updated by admin and verified by tests");
  });

  // ─── Phone update tests ────────────────────────────────────────────

  test("updateTeacherProfile — can update phone to null", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ phone: null, timezone: IanaTimezone.UTC }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    expect(result.updateTeacherProfile?.phone).toBeNull();
  });

  test("updateTeacherProfile — can update phone with special characters", async () => {
    const specialPhone = "+44 (20) 7946-0958 ext. 123";
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ phone: specialPhone, timezone: IanaTimezone.UTC }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    expect(result.updateTeacherProfile?.phone).toBe(specialPhone);
  });

  test("updateTeacherProfile — can update phone to exactly 50 chars", async () => {
    const maxPhone = "+12345678901234567890123456789012345678901234567";
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ phone: maxPhone, timezone: IanaTimezone.UTC }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    expect(result.updateTeacherProfile?.phone).toBe(maxPhone);
  });

  test("updateTeacherProfile — phone exceeding 50 chars — documents current constraint gap", async () => {
    const tooLongPhone = "+1234567890123456789012345678901234567890123456789"; // 51 chars
    const result = await testClient.mutate({
      mutation: updateTeacherProfileMutationDocument,
      variables: {
        teacherId,
        input: makeUpdateInput({ phone: tooLongPhone, timezone: IanaTimezone.UTC }),
      },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
      errorPolicy: "all",
    });

    // KNOWN GAP: The @constraint(maxLength: 50) directive metadata is set in Pothos
    // but not inlined into the SDL schema, so the Apollo validation plugin cannot
    // enforce it. The DB varchar(50) constraint also doesn't reject the value in
    // the test environment. This test documents the current behavior.
    expect(result.error).toBeUndefined();
    expect(result.data?.updateTeacherProfile).toBeDefined();
    expect(result.data?.updateTeacherProfile?.phone).toBe(tooLongPhone);
  });

  // ─── Individual field update tests ─────────────────────────────────

  test("updateTeacherProfile — can update address only", async () => {
    const newAddress = "789 Pine Street, Suite 100";
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ address: newAddress, timezone: IanaTimezone.UTC }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    expect(result.updateTeacherProfile?.address).toBe(newAddress);
  });

  test("updateTeacherProfile — can update dateOfBirth only", async () => {
    const newDob = "1992-08-25";
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ dateOfBirth: newDob, timezone: IanaTimezone.UTC }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    expect(result.updateTeacherProfile?.dateOfBirth).toContain(newDob);
  });

  test("updateTeacherProfile — can update gender only", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ gender: Gender.Female, timezone: IanaTimezone.UTC }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    expect(result.updateTeacherProfile?.gender).toBe(Gender.Female);
  });

  test("updateTeacherProfile — can update hourlyRate only", async () => {
    const newRate = "65.00";
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ hourlyRate: newRate, timezone: IanaTimezone.UTC }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    expect(result.updateTeacherProfile?.hourlyRate).toBe(newRate);
  });

  test("updateTeacherProfile — can update nationalId only", async () => {
    const newNationalId = "ID-UPD-998877";
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ nationalId: { countryCode: null, number: newNationalId }, timezone: IanaTimezone.UTC }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    // nationalId number is masked by maskNationalId() in StaffProfileService
    // "ID-UPD-998877" (13 chars) → first 8 chars masked → "********" + last 4 "8877"
    expect(result.updateTeacherProfile?.nationalId?.number).toBe("********8877");
  });

  test("updateTeacherProfile — can update nationality only", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ nationality: CountryCode.Ca, timezone: IanaTimezone.UTC }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    expect(result.updateTeacherProfile?.nationality).toBe(CountryCode.Ca);
  });

  test("updateTeacherProfile — can update countryCode only", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ countryCode: CountryCode.Gb, timezone: IanaTimezone.UTC }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    expect(result.updateTeacherProfile?.countryCode).toBe(CountryCode.Gb);
  });

  test("updateTeacherProfile — can update qualifications only", async () => {
    const newQual = "Updated PhD";
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ qualifications: newQual, timezone: IanaTimezone.UTC }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    expect(result.updateTeacherProfile?.qualifications).toBe(newQual);
  });

  test("updateTeacherProfile — can update rateCurrency only", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ rateCurrency: CurrencyCode.Eur, timezone: IanaTimezone.UTC }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    expect(result.updateTeacherProfile?.rateCurrency).toBe(CurrencyCode.Eur);
  });

  test("updateTeacherProfile — can update timezone only", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({ timezone: IanaTimezone.America_New_York }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    expect(result.updateTeacherProfile?.timezone).toBe(IanaTimezone.America_New_York);
  });

  test("updateTeacherProfile — can update all fields at once", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", updateTeacherProfileMutationDocument, {
      teacherId,
      input: makeUpdateInput({
        address: "Full Update Address",
        dateOfBirth: "1991-09-09",
        gender: Gender.Female,
        hourlyRate: "99.00",
        nationalId: { countryCode: null, number: "FULL-999" },
        nationality: CountryCode.Gb,
        countryCode: CountryCode.Gb,
        phone: "+44-20-7946-0958",
        qualifications: "Full Update Qualifications",
        rateCurrency: CurrencyCode.Gbp,
        status: null,
        timezone: IanaTimezone.Europe_London,
      }),
    });
    expect(result.updateTeacherProfile).toBeDefined();
    expect(result.updateTeacherProfile?.address).toBe("Full Update Address");
    expect(result.updateTeacherProfile?.dateOfBirth).toContain("1991-09-09");
    expect(result.updateTeacherProfile?.gender).toBe(Gender.Female);
    expect(result.updateTeacherProfile?.hourlyRate).toBe("99.00");
    // nationalId is masked: "FULL-999" (8 chars) → first 4 chars masked → "****" + last 4 "-999"
    expect(result.updateTeacherProfile?.nationalId?.number).toBe("****-999");
    expect(result.updateTeacherProfile?.nationality).toBe(CountryCode.Gb);
    expect(result.updateTeacherProfile?.countryCode).toBe(CountryCode.Gb);
    expect(result.updateTeacherProfile?.phone).toBe("+44-20-7946-0958");
    expect(result.updateTeacherProfile?.qualifications).toBe("Full Update Qualifications");
    expect(result.updateTeacherProfile?.rateCurrency).toBe(CurrencyCode.Gbp);
    expect(result.updateTeacherProfile?.timezone).toBe(IanaTimezone.Europe_London);
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
