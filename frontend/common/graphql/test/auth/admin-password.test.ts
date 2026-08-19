import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { CombinedGraphQLErrors } from "@apollo/client";
import { adminResetPasswordMutationDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import {
  assertOperationDenied,
  authenticatedRequest,
  cleanupTestSuperAdmin,
  loginAndProvision,
  provisionTestSuperAdmin,
  setupTestServerLifecycle,
  testClient,
} from "@/test/helpers";

const TEST_PREFIX = "admrst";

function generateTestPassword(): string {
  return `TestPass-${randomUUID().slice(0, 8)}!`;
}

function authContext(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

function expectForbidden(result: { error?: unknown }): void {
  expect(result.error).toBeDefined();
  expect(CombinedGraphQLErrors.is(result.error)).toBe(true);
}

function resetPasswordInput(userId: string, password: string) {
  return {
    input: {
      userId,
      newPassword: password,
      sendNotificationEmail: false,
    },
  };
}

function expectResetSuccess(
  result: { adminResetPassword: { success?: boolean | null; userId?: string | null } | null },
  expectedUserId: string
): void {
  expect(result.adminResetPassword).toBeDefined();
  expect(result.adminResetPassword?.success).toBe(true);
  expect(result.adminResetPassword?.userId).toBe(expectedUserId);
}

describe("adminResetPassword mutation", () => {
  setupTestServerLifecycle();

  let testPassword: string;
  let provisioned: Awaited<ReturnType<typeof loginAndProvision>>;
  let testSuperAdmin: { token: string; userId: string };

  beforeAll(async () => {
    testPassword = generateTestPassword();
    provisioned = await loginAndProvision(TEST_PREFIX);
    testSuperAdmin = await provisionTestSuperAdmin(provisioned.superAdminToken, TEST_PREFIX);
  });

  afterAll(async () => {
    if (testSuperAdmin?.userId) {
      await cleanupTestSuperAdmin(provisioned.superAdminToken, testSuperAdmin.userId);
    }
  });

  test("super admin can reset another user's password", async () => {
    const result = await authenticatedRequest(
      provisioned.superAdminToken,
      "mutate",
      adminResetPasswordMutationDocument,
      resetPasswordInput(provisioned.teacherUserId, testPassword)
    );

    expectResetSuccess(result, provisioned.teacherUserId);
  });

  test("provisioned test super admin can reset a user's password", async () => {
    const result = await authenticatedRequest(
      testSuperAdmin.token,
      "mutate",
      adminResetPasswordMutationDocument,
      resetPasswordInput(provisioned.parentUserId, testPassword)
    );

    expectResetSuccess(result, provisioned.parentUserId);
  });

  test("teacher (non-admin) is denied", async () => {
    const denied = await assertOperationDenied(
      "teacher_default",
      "mutate",
      adminResetPasswordMutationDocument,
      resetPasswordInput(provisioned.parentUserId, testPassword)
    );
    expect(denied).toBe(true);
  });

  test("parent (non-admin) is denied", async () => {
    const denied = await assertOperationDenied(
      "parent_default",
      "mutate",
      adminResetPasswordMutationDocument,
      resetPasswordInput(provisioned.teacherUserId, testPassword)
    );
    expect(denied).toBe(true);
  });

  test("super admin cannot reset own password via admin endpoint (FORBIDDEN)", async () => {
    const result = await testClient.mutate({
      mutation: adminResetPasswordMutationDocument,
      variables: resetPasswordInput(testSuperAdmin.userId, testPassword),
      context: authContext(testSuperAdmin.token),
    } as Parameters<typeof testClient.mutate>[0]);

    expectForbidden(result);
  });
});
