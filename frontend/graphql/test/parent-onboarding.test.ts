import { afterAll, describe, expect, test } from "bun:test";
import { InvoiceType, PaymentMethod } from "@/frontend/graphql/generated/gql/graphql-types";
import { createParentMutationDocument } from "@/frontend/graphql/sharedDocuments/parent-onboarding.documents";
import {
  assertOperationDenied,
  authenticatedRequest,
  cleanupTestSuperAdmin,
  loginDemoUser,
  provisionTestSuperAdmin,
} from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";

const createMinimalParentInput = (
  overrides?: Partial<{
    name: string;
    email: string;
  }>
) => ({
  name: overrides?.name ?? "Test Parent",
  email: overrides?.email ?? `test_parent_${Date.now()}@test.com`,
  password: "TestPassword123!",
  phone: null,
  invoiceType: null,
  feeAmount: null,
  paymentMethod: null,
  currency: null,
  timezone: null,
  address: null,
  defaultZoomLink: null,
  facebook: null,
  nationality: null,
  skype: null,
  twitter: null,
  whatsapp: null,
});

const createFullParentInput = (
  overrides?: Partial<{
    name: string;
    email: string;
    invoiceType: InvoiceType | null;
    feeAmount: string | null;
    paymentMethod: PaymentMethod | null;
    currency: string | null;
    timezone: string | null;
    address: string | null;
    defaultZoomLink: string | null;
    facebook: string | null;
    whatsapp: string | null;
    twitter: string | null;
    skype: string | null;
    nationality: string | null;
    phone: string | null;
  }>
) => ({
  name: overrides?.name ?? "Test Parent",
  email: overrides?.email ?? `test_parent_${Date.now()}@test.com`,
  password: "TestPassword123!",
  phone: overrides?.phone ?? "+1234567890",
  invoiceType: overrides?.invoiceType ?? InvoiceType.Monthly,
  feeAmount: overrides?.feeAmount ?? "500.00",
  paymentMethod: overrides?.paymentMethod ?? PaymentMethod.BankAccount,
  currency: overrides?.currency ?? "USD",
  timezone: overrides?.timezone ?? "America/Chicago",
  address: overrides?.address ?? "123 Main St",
  defaultZoomLink: overrides?.defaultZoomLink ?? "https://zoom.us/j/1234567890",
  facebook: overrides?.facebook ?? "facebook.com/testparent",
  whatsapp: overrides?.whatsapp ?? "+1234567890",
  twitter: overrides?.twitter ?? "@testparent",
  skype: overrides?.skype ?? "testparent",
  nationality: overrides?.nationality ?? "US",
});

describe("Parent Onboarding GraphQL API", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let superAdminUserId = "";

  test("provision super admin for onboarding tests", async () => {
    const adminToken = await loginDemoUser("academy_admin");
    const sa = await provisionTestSuperAdmin(adminToken, "parOnboard");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;
  });

  test("Academy Admin can create parent with billing", async () => {
    const token = await loginDemoUser("academy_admin");

    const result = await authenticatedRequest(token, "mutate", createParentMutationDocument, {
      input: createFullParentInput({
        name: "GraphQL Test Parent",
        email: `graphql_parent_${Date.now()}@test.com`,
      }),
    });

    if (!result.createParent) throw new Error("createParent is null");
    expect(result.createParent.userId).toBeDefined();
    expect(result.createParent.parentId).toBeDefined();
    expect(result.createParent.invoiceType).toBe("MONTHLY");
    expect(result.createParent.currency).toBe("USD");
  });

  test("Super Admin can create parent", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", createParentMutationDocument, {
      input: createMinimalParentInput({
        name: "Super Admin Parent",
        email: `super_parent_${Date.now()}@test.com`,
      }),
    });

    if (!result.createParent) throw new Error("createParent is null");
    expect(result.createParent.userId).toBeDefined();
  });

  test("Teacher denied creating parent", async () => {
    await assertOperationDenied("teacher_default", "mutate", createParentMutationDocument, {
      input: createMinimalParentInput(),
    });
  });

  test("Unauthenticated denied creating parent", async () => {
    const { testClient } = await import("./testClient");

    const result = await testClient.mutate({
      mutation: createParentMutationDocument,
      variables: {
        input: createMinimalParentInput(),
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
