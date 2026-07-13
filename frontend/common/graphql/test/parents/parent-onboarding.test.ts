import { afterAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import {
  CurrencyCode,
  IanaTimezone,
  InvoiceType,
  PaymentDirection,
  PaymentMethodType,
  type UserPaymentMethodInitialInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createParentMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  authenticatedRequest,
  cleanupTestSuperAdmin,
  loginDemoUser,
  provisionTestSuperAdmin,
} from "@/frontend/common/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";

const createMinimalParentInput = (
  overrides?: Partial<{
    name: string;
    email: string;
  }>
) => ({
  name: overrides?.name ?? "Test Parent",
  email: overrides?.email ?? `test_parent_${Date.now()}@test.com`,
  password: `Pwd_${randomUUID()}`,
  phone: null,
  invoiceType: null,
  feeAmount: null,
  initialPayinMethod: null,
  currency: null,
  timezone: IanaTimezone.Utc,
  address: null,
  facebook: null,
  nationality: null,
  twitter: null,
  whatsapp: null,
});

const createFullParentInput = (
  overrides?: Partial<{
    name: string;
    email: string;
    invoiceType: InvoiceType | null;
    feeAmount: string | null;
    initialPayinMethod: UserPaymentMethodInitialInput | null;
    currency: CurrencyCode | null;
    timezone: IanaTimezone | null;
    address: string | null;
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
  password: `Pwd_${randomUUID()}`,
  phone: overrides?.phone ?? "+1234567890",
  invoiceType: overrides?.invoiceType ?? InvoiceType.Monthly,
  feeAmount: overrides?.feeAmount ?? "500.00",
  initialPayinMethod: overrides?.initialPayinMethod ?? {
    type: PaymentMethodType.BankTransfer,
    direction: PaymentDirection.Payin,
    isDefault: true,
    label: "Primary bank",
    details: {
      iban: "EG123456789012345678901234",
      bankName: "Test Bank",
      beneficiaryName: "Test Parent",
      swiftBic: null,
      accountNumber: null,
      routingNumber: null,
      note: null,
      walletId: null,
      phone: null,
      paymentLinkId: null,
      url: null,
      onlineAccountId: null,
      identifier: null,
    },
  },
  currency: overrides?.currency ?? CurrencyCode.Usd,
  timezone: overrides?.timezone ?? IanaTimezone.AmericaChicago,
  address: overrides?.address ?? "123 Main St",
  facebook: overrides?.facebook ?? "facebook.com/testparent",
  whatsapp: overrides?.whatsapp ?? "+1234567890",
  twitter: overrides?.twitter ?? "@testparent",
  nationality: overrides?.nationality ?? "US",
});

describe("Parent Onboarding GraphQL API", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let superAdminUserId = "";

  test("provision super admin for onboarding tests", async () => {
    // createTestSuperAdmin requires superAdmin scope, so use demoLogin("super_admin")
    const existingSaToken = await loginDemoUser("super_admin");
    const sa = await provisionTestSuperAdmin(existingSaToken, "parOnboard");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;
    expect(superAdminToken).toBeTruthy();
    expect(superAdminUserId).toBeTruthy();
  });

  test("Admin can create parent with billing", async () => {
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
    expect(result.createParent.currency).toBe(CurrencyCode.Usd);
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
    const token = await loginDemoUser("teacher_default");
    const { testClient } = await import("@/frontend/common/graphql/test/testClient");

    const result = await testClient.mutate({
      mutation: createParentMutationDocument,
      variables: {
        input: createMinimalParentInput(),
      },
      context: { headers: { Authorization: `Bearer ${token}` } },
      errorPolicy: "all",
    });

    expect(result.error).toBeDefined();
  });

  test("Unauthenticated denied creating parent", async () => {
    const { testClient } = await import("@/frontend/common/graphql/test/testClient");

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
