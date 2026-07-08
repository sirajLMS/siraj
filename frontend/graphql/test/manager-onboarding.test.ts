import { afterAll, describe, expect, test } from "bun:test";
import { ManagerAccountType } from "@/frontend/graphql/generated/gql/graphql-types";
import { createManagerMutationDocument } from "@/frontend/graphql/sharedDocuments/manager-onboarding.documents";
import {
  assertOperationDenied,
  authenticatedRequest,
  cleanupTestSuperAdmin,
  loginDemoUser,
  provisionTestSuperAdmin,
} from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";

const createMinimalManagerInput = (
  overrides?: Partial<{
    name: string;
    email: string;
    accountType: ManagerAccountType;
  }>
) => ({
  name: overrides?.name ?? "Test Manager",
  email: overrides?.email ?? `test_manager_${Date.now()}@test.com`,
  password: "TestPassword123!",
  accountType: overrides?.accountType ?? ManagerAccountType.Manager,
  phone: null,
});

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
  });

  test("Super Admin can create manager with admin type", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", createManagerMutationDocument, {
      input: createMinimalManagerInput({
        name: "GraphQL Test Admin",
        email: `graphql_admin_${Date.now()}@test.com`,
        accountType: ManagerAccountType.Admin,
      }),
    });

    if (!result.createManager) throw new Error("createManager is null");
    expect(result.createManager.userId).toBeDefined();
    expect(result.createManager.staffProfileId).toBeDefined();
    expect(result.createManager.assignedGroupSlug).toBe("academy_admin");
  });

  test("Super Admin can create manager with manager type", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", createManagerMutationDocument, {
      input: createMinimalManagerInput({
        name: "GraphQL Test Manager",
        email: `graphql_manager_${Date.now()}@test.com`,
      }),
    });

    if (!result.createManager) throw new Error("createManager is null");
    expect(result.createManager.assignedGroupSlug).toBe("staff_default");
  });

  test("Admin denied creating manager", async () => {
    await assertOperationDenied("academy_admin", "mutate", createManagerMutationDocument, {
      input: createMinimalManagerInput(),
    });
  });

  test("Teacher denied creating manager", async () => {
    await assertOperationDenied("teacher_default", "mutate", createManagerMutationDocument, {
      input: createMinimalManagerInput(),
    });
  });

  test("Unauthenticated denied creating manager", async () => {
    const { testClient } = await import("./testClient");

    const result = await testClient.mutate({
      mutation: createManagerMutationDocument,
      variables: {
        input: createMinimalManagerInput(),
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
