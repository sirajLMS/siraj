import { afterAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import {
  CurrencyCode,
  IanaTimezone,
  ManagerAccountType,
  type ManagerOnboardingInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createManagerMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  assertOperationDenied,
  authenticatedRequest,
  cleanupTestSuperAdmin,
  loginDemoUser,
  provisionTestSuperAdmin,
} from "@/frontend/common/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";
import { testClient } from "@/frontend/common/graphql/test/testClient";

const buildManagerInput = (
  overrides: Partial<ManagerOnboardingInput> & {
    name: string;
    email: string;
    accountType: ManagerAccountType;
  }
): ManagerOnboardingInput => ({
  name: overrides.name,
  email: overrides.email,
  password: overrides.password ?? `Pwd_${randomUUID()}`,
  accountType: overrides.accountType,
  avatarUrl: overrides.avatarUrl ?? null,
  displayCurrency: overrides.displayCurrency ?? null,
  phone: overrides.phone ?? null,
  timezone: overrides.timezone ?? null,
});

const assertManagerCreationDenied = async (scope: string, emailPrefix: string): Promise<boolean> => {
  return await assertOperationDenied(scope, "mutate", createManagerMutationDocument, {
    input: buildManagerInput({
      name: "Denied Manager",
      email: `${emailPrefix}_${Date.now()}@test.com`,
      accountType: ManagerAccountType.Manager,
      avatarUrl: null,
      displayCurrency: null,
      phone: null,
      timezone: null,
    }),
  });
};

describe("Manager Onboarding GraphQL API", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let superAdminUserId = "";

  test("provision super admin for onboarding tests", async () => {
    // createTestSuperAdmin requires superAdmin scope, so use demoLogin("super_admin")
    const existingSaToken = await loginDemoUser("super_admin");
    const sa = await provisionTestSuperAdmin(existingSaToken, "mgrOnboard");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;

    expect(superAdminToken).toBeTruthy();
    expect(superAdminUserId).toBeTruthy();
  });

  test("Super Admin can create manager with manager type (all optional fields provided)", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", createManagerMutationDocument, {
      input: buildManagerInput({
        name: "GraphQL Test Manager",
        email: `graphql_manager_${Date.now()}@test.com`,
        accountType: ManagerAccountType.Manager,
        avatarUrl: "https://example.com/avatar.png",
        displayCurrency: CurrencyCode.Usd,
        phone: "+201000000000",
        timezone: IanaTimezone.AfricaCairo,
      }),
    });

    if (!result.createManager) throw new Error("createManager is null");
    expect(result.createManager.userId).toBeDefined();
    expect(result.createManager.staffProfileId).toBeDefined();
    expect(result.createManager.assignedGroupSlug).toBe("academy_admin");
  });

  test("Super Admin can create manager with supervisor type (optional fields as null)", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", createManagerMutationDocument, {
      input: buildManagerInput({
        name: "GraphQL Test Supervisor",
        email: `graphql_supervisor_${Date.now()}@test.com`,
        accountType: ManagerAccountType.Supervisor,
        avatarUrl: null,
        displayCurrency: null,
        phone: null,
        timezone: null,
      }),
    });

    if (!result.createManager) throw new Error("createManager is null");
    expect(result.createManager.assignedGroupSlug).toBe("supervisor_default");
  });

  test("Admin denied creating manager", async () => {
    const denied = await assertManagerCreationDenied("academy_admin", "denied_admin");
    expect(denied).toBe(true);
  });

  test("Teacher denied creating manager", async () => {
    const denied = await assertManagerCreationDenied("teacher_default", "denied_teacher");
    expect(denied).toBe(true);
  });

  test("Unauthenticated denied creating manager", async () => {
    const result = await testClient.mutate({
      mutation: createManagerMutationDocument,
      variables: {
        input: buildManagerInput({
          name: "Unauthenticated Manager",
          email: `unauth_manager_${Date.now()}@test.com`,
          accountType: ManagerAccountType.Manager,
          avatarUrl: null,
          displayCurrency: null,
          phone: null,
          timezone: null,
        }),
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
