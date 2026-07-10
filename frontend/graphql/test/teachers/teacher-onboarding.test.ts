import { afterAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import {
  CountryCode,
  CurrencyCode,
  Gender,
  IanaTimezone,
  PaymentDirection,
  PaymentMethodType,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { createTeacherMutationDocument } from "@/frontend/graphql/sharedDocuments";
import {
  authenticatedRequest,
  cleanupTestSuperAdmin,
  loginDemoUser,
  provisionTestSuperAdmin,
} from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";
import { testClient } from "@/frontend/graphql/test/testClient";

const createMinimalTeacherInput = (
  overrides?: Partial<{
    name: string;
    email: string;
  }>
) => ({
  name: overrides?.name ?? "Test Teacher",
  email: overrides?.email ?? `test_teacher_${Date.now()}@test.com`,
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
      routingNumber: "123456789",
      swiftBic: "BOFAUS3N",
    } as import("@/frontend/graphql/generated/gql/graphql-types").PaymentMethodDetailsInput,
  },
});

const _expectTeacherCreationDenied = async (demoUser: string) => {
  const token = await loginDemoUser(demoUser);

  const result = await testClient.mutate({
    mutation: createTeacherMutationDocument,
    variables: { input: createMinimalTeacherInput() },
    context: { headers: { Authorization: `Bearer ${token}` } },
    errorPolicy: "all",
  });

  expect(result.error).toBeDefined();
  expect(result.data?.createTeacher).toBeFalsy();
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
    const { testClient } = await import("@/frontend/graphql/test/testClient");
    const token = await loginDemoUser("teacher_default");

    const result = await testClient.mutate({
      mutation: createTeacherMutationDocument,
      variables: { input: createMinimalTeacherInput() },
      context: { headers: { Authorization: `Bearer ${token}` } },
      errorPolicy: "all",
    });

    expect(result.error).toBeDefined();
    expect(result.data?.createTeacher).toBeFalsy();
  });

  test("Parent denied creating teacher", async () => {
    const { testClient } = await import("@/frontend/graphql/test/testClient");
    const token = await loginDemoUser("parent_default");

    const result = await testClient.mutate({
      mutation: createTeacherMutationDocument,
      variables: { input: createMinimalTeacherInput() },
      context: { headers: { Authorization: `Bearer ${token}` } },
      errorPolicy: "all",
    });

    expect(result.error).toBeDefined();
    expect(result.data?.createTeacher).toBeFalsy();
  });

  test("Unauthenticated denied creating teacher", async () => {
    const { testClient } = await import("@/frontend/graphql/test/testClient");

    const result = await testClient.mutate({
      mutation: createTeacherMutationDocument,
      variables: {
        input: createMinimalTeacherInput(),
      },
      errorPolicy: "all",
    });

    expect(result.error).toBeDefined();
  });

  afterAll(async () => {
    if (superAdminToken && superAdminUserId) {
      await cleanupTestSuperAdmin(superAdminToken, superAdminUserId);
    }
  });
});
