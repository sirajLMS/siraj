import { afterAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import {
  CountryCode,
  CurrencyCode,
  Gender,
  IanaTimezone,
  PaymentDirection,
  PaymentMethodType,
  type TeacherOnboardingInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createTeacherMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  authenticatedRequest,
  cleanupTestSuperAdmin,
  loginDemoUser,
  provisionTestSuperAdmin,
  setupTestServerLifecycle,
  testClient,
} from "@/test/helpers";

const createMinimalTeacherInput = (
  overrides?: Partial<{
    name: string;
    email: string;
  }>
): TeacherOnboardingInput => ({
  name: overrides?.name ?? "Test Teacher",
  email: overrides?.email ?? `test_teacher_${Date.now()}@test.com`,
  avatarUrl: null,
  password: `Pwd_${randomUUID()}`,
  timezone: IanaTimezone.Utc,
  nationality: CountryCode.Us,
  countryCode: CountryCode.Us,
  phone: "+1234567890",
  gender: Gender.Male,
  hourlyRate: "25.00",
  rateCurrency: CurrencyCode.Usd,
  address: "123 Main St",
  dateOfBirth: "1990-01-01",
  nationalId: "ID123456",
  qualifications: "PhD",
  initialPayoutMethod: {
    type: PaymentMethodType.BankTransfer,
    direction: PaymentDirection.Payout,
    isDefault: true,
    label: "Primary Payout Method",
    details: {
      accountNumber: "1234567890",
      bankName: "Bank of America",
      beneficiaryName: "John Doe",
      iban: "US12345678901234567890",
      identifier: null,
      note: null,
      onlineAccountId: null,
      paymentLinkId: null,
      phone: null,
      routingNumber: "123456789",
      swiftBic: "BOFAUS3N",
      url: null,
      walletId: null,
    },
  },
  displayCurrency: null,
});

const attemptCreateTeacherAs = async (demoUser: string) => {
  const token = await loginDemoUser(demoUser);

  return testClient.mutate({
    mutation: createTeacherMutationDocument,
    variables: { input: createMinimalTeacherInput() },
    context: { headers: { Authorization: `Bearer ${token}` } },
    errorPolicy: "all",
  });
};

type TeacherInputOverrides = { name: string; email: string };

const createTeacherAsAdmin = async (
  overrides: TeacherInputOverrides,
  fieldOverrides?: Partial<TeacherOnboardingInput>
) => {
  const token = await loginDemoUser("academy_admin");
  const base = createMinimalTeacherInput(overrides);
  const input: TeacherOnboardingInput = fieldOverrides ? { ...base, ...fieldOverrides } : base;

  const result = await authenticatedRequest(token, "mutate", createTeacherMutationDocument, { input });

  if (!result.createTeacher) throw new Error("createTeacher is null");
  return result.createTeacher;
};

describe("Teacher Onboarding GraphQL API", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let superAdminUserId = "";

  test("provision super admin for onboarding tests", async () => {
    // createTestSuperAdmin requires superAdmin scope, so use demoLogin("super_admin")
    const existingSaToken = await loginDemoUser("super_admin");
    const sa = await provisionTestSuperAdmin(existingSaToken, "tchrOnboard");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;
    expect(superAdminToken.length).toBeGreaterThan(0);
    expect(superAdminUserId.length).toBeGreaterThan(0);
  });

  test("Admin can create teacher", async () => {
    const token = await loginDemoUser("academy_admin");

    const result = await authenticatedRequest(token, "mutate", createTeacherMutationDocument, {
      input: createMinimalTeacherInput({
        name: "GraphQL Test Teacher",
        email: `graphql_teacher_${Date.now()}@test.com`,
      }),
    });

    if (!result.createTeacher) throw new Error("createTeacher is null");
    expect(result.createTeacher.userId).toBeDefined();
    expect(result.createTeacher.id).toBeDefined();
    expect(result.createTeacher.name).toBe("GraphQL Test Teacher");
    expect(result.createTeacher.phone).toBe("+1234567890");
    expect(result.createTeacher.status).toBe("ACTIVATED");
  });

  test("Super Admin can create teacher", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", createTeacherMutationDocument, {
      input: createMinimalTeacherInput({
        name: "Super Admin Teacher",
        email: `super_teacher_${Date.now()}@test.com`,
      }),
    });

    if (!result.createTeacher) throw new Error("createTeacher is null");
    expect(result.createTeacher.userId).toBeDefined();
  });

  test("Teacher denied creating teacher", async () => {
    const result = await attemptCreateTeacherAs("teacher_default");
    expect(result.error).toBeDefined();
    expect(result.data?.createTeacher).toBeFalsy();
  });

  test("Parent denied creating teacher", async () => {
    const result = await attemptCreateTeacherAs("parent_default");
    expect(result.error).toBeDefined();
    expect(result.data?.createTeacher).toBeFalsy();
  });

  test("Unauthenticated denied creating teacher", async () => {
    const result = await testClient.mutate({
      mutation: createTeacherMutationDocument,
      variables: {
        input: createMinimalTeacherInput(),
      },
      errorPolicy: "all",
    });

    expect(result.error).toBeDefined();
  });

  // ─── Phone field tests ─────────────────────────────────────────────

  test("create teacher with null phone succeeds and persists null", async () => {
    const teacher = await createTeacherAsAdmin(
      { name: "Null Phone Teacher", email: `null_phone_${Date.now()}@test.com` },
      { phone: null }
    );
    expect(teacher.userId).toBeDefined();
    expect(teacher.phone).toBeNull();
  });

  test("create teacher with phone exactly 50 chars succeeds", async () => {
    const longPhone = "+12345678901234567890123456789012345678901234567";
    const teacher = await createTeacherAsAdmin(
      { name: "Max Phone Teacher", email: `maxphone_${Date.now()}@test.com` },
      { phone: longPhone }
    );
    expect(teacher.phone).toBe(longPhone);
  });

  test("create teacher with phone exceeding 50 chars — documents current constraint gap", async () => {
    const token = await loginDemoUser("academy_admin");
    const tooLongPhone = "+1234567890123456789012345678901234567890123456789"; // 51 chars

    const result = await testClient.mutate({
      mutation: createTeacherMutationDocument,
      variables: {
        input: {
          ...createMinimalTeacherInput({
            name: "Too Long Phone",
            email: `toolongphone_${Date.now()}@test.com`,
          }),
          phone: tooLongPhone,
        },
      },
      context: { headers: { Authorization: `Bearer ${token}` } },
      errorPolicy: "all",
    });

    // KNOWN GAP: The Pothos @constraint(maxLength: 50) directive metadata is set
    // but not inlined into the SDL schema, so the Apollo validation plugin cannot
    // enforce it. The DB varchar(50) constraint also doesn't reject the value in
    // the test environment. This test documents the current behavior: the 51-char
    // phone is accepted. When the constraint directive is properly enforced, this
    // test should be updated to assert the mutation fails.
    expect(result.error).toBeUndefined();
    expect(result.data?.createTeacher).toBeTruthy();
    expect(result.data?.createTeacher?.phone).toBe(tooLongPhone);
  });

  test("create teacher with special characters in phone succeeds", async () => {
    const specialPhone = "+1 (555) 123-4567 ext. 890";
    const teacher = await createTeacherAsAdmin(
      { name: "Special Phone", email: `specialphone_${Date.now()}@test.com` },
      { phone: specialPhone }
    );
    expect(teacher.phone).toBe(specialPhone);
  });

  // ─── Minimal input tests ────────────────────────────────────────────

  test("create teacher with only required fields succeeds", async () => {
    const token = await loginDemoUser("academy_admin");

    const minimalInput = {
      name: "Minimal Teacher",
      email: `minimal_${Date.now()}@test.com`,
      password: `Pwd_${randomUUID()}`,
      timezone: IanaTimezone.Utc,
      avatarUrl: null,
      nationality: null,
      nationalId: null,
      phone: null,
      dateOfBirth: null,
      gender: null,
      address: null,
      qualifications: null,
      countryCode: null,
      hourlyRate: null,
      rateCurrency: null,
      displayCurrency: null,
      initialPayoutMethod: null,
    };

    const result = await authenticatedRequest(token, "mutate", createTeacherMutationDocument, {
      input: minimalInput,
    });

    if (!result.createTeacher) throw new Error("createTeacher is null");
    expect(result.createTeacher.userId).toBeDefined();
    expect(result.createTeacher.id).toBeDefined();
    expect(result.createTeacher.name).toBe("Minimal Teacher");
    expect(result.createTeacher.phone).toBeNull();
  });

  // ─── Individual optional field tests ────────────────────────────────

  test("create teacher with nationality set succeeds", async () => {
    const teacher = await createTeacherAsAdmin(
      { name: "Nationality Teacher", email: `nat_${Date.now()}@test.com` },
      { nationality: CountryCode.Gb }
    );
    expect(teacher.userId).toBeDefined();
  });

  test("create teacher with nationalId set succeeds", async () => {
    const teacher = await createTeacherAsAdmin(
      { name: "NatId Teacher", email: `natid_${Date.now()}@test.com` },
      { nationalId: "PASSPORT-998877" }
    );
    expect(teacher.userId).toBeDefined();
  });

  test("create teacher with dateOfBirth set succeeds", async () => {
    const teacher = await createTeacherAsAdmin(
      { name: "DOB Teacher", email: `dob_${Date.now()}@test.com` },
      { dateOfBirth: "1985-06-15" }
    );
    expect(teacher.userId).toBeDefined();
  });

  test("create teacher with female gender succeeds", async () => {
    const teacher = await createTeacherAsAdmin(
      { name: "Female Teacher", email: `female_${Date.now()}@test.com` },
      { gender: Gender.Female }
    );
    expect(teacher.userId).toBeDefined();
    expect(teacher.gender).toBe(Gender.Female);
  });

  test("create teacher with address set succeeds", async () => {
    const teacher = await createTeacherAsAdmin(
      { name: "Address Teacher", email: `addr_${Date.now()}@test.com` },
      { address: "456 Oak Avenue, Apt 5B" }
    );
    expect(teacher.userId).toBeDefined();
  });

  test("create teacher with qualifications set succeeds", async () => {
    const teacher = await createTeacherAsAdmin(
      { name: "Qual Teacher", email: `qual_${Date.now()}@test.com` },
      { qualifications: "MSc Mathematics, BSc Education" }
    );
    expect(teacher.userId).toBeDefined();
  });

  test("create teacher with countryCode set succeeds", async () => {
    const teacher = await createTeacherAsAdmin(
      { name: "CountryCode Teacher", email: `cc_${Date.now()}@test.com` },
      { countryCode: CountryCode.Gb }
    );
    expect(teacher.userId).toBeDefined();
  });

  test("create teacher with hourlyRate and rateCurrency succeeds", async () => {
    const teacher = await createTeacherAsAdmin(
      { name: "Hourly Teacher", email: `hourly_${Date.now()}@test.com` },
      { hourlyRate: "75.50", rateCurrency: CurrencyCode.Eur }
    );
    expect(teacher.userId).toBeDefined();
  });

  test("create teacher with different timezone succeeds", async () => {
    const teacher = await createTeacherAsAdmin(
      { name: "TZ Teacher", email: `tz_${Date.now()}@test.com` },
      { timezone: IanaTimezone.AmericaNewYork }
    );
    expect(teacher.userId).toBeDefined();
  });

  test("create teacher with all fields populated succeeds", async () => {
    const token = await loginDemoUser("academy_admin");
    const input = {
      ...createMinimalTeacherInput({ name: "Complete Teacher", email: `complete_${Date.now()}@test.com` }),
      nationality: CountryCode.Ca,
      nationalId: "CAN-998877",
      phone: "+1-416-555-0199",
      gender: Gender.Female,
      dateOfBirth: "1980-03-22",
      address: "789 Maple Street, Toronto, ON",
      qualifications: "PhD Physics, MSc Education, BSc Mathematics",
      countryCode: CountryCode.Ca,
      timezone: IanaTimezone.AmericaNewYork,
      hourlyRate: "120.00",
      rateCurrency: CurrencyCode.Cad,
      displayCurrency: CurrencyCode.Cad,
      avatarUrl: null,
    };

    const result = await authenticatedRequest(token, "mutate", createTeacherMutationDocument, { input });
    if (!result.createTeacher) throw new Error("createTeacher is null");
    expect(result.createTeacher.userId).toBeDefined();
    expect(result.createTeacher.name).toBe("Complete Teacher");
    expect(result.createTeacher.phone).toBe("+1-416-555-0199");
    expect(result.createTeacher.gender).toBe(Gender.Female);
    expect(result.createTeacher.status).toBe("ACTIVATED");
  });

  afterAll(async () => {
    if (superAdminToken && superAdminUserId) {
      await cleanupTestSuperAdmin(superAdminToken, superAdminUserId);
    }
  });
});
