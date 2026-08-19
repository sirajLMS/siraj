import { afterAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { AccountStatus, type GeneralUserCreateInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  endImpersonationMutationDocument,
  meQueryDocument,
  startImpersonationMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { createGeneralUserMutationDocument } from "@/frontend/common/graphql/sharedDocuments/users/general-user-create.documents";
import {
  assertOperationDenied,
  authenticatedRequest,
  cleanupTestSuperAdmin,
  clearCookies,
  loginDemoUser,
  loginUser,
  provisionTestSuperAdmin,
  setupTestServerLifecycle,
  TEST_USER_PASSWORD,
  testClient,
} from "@/test/helpers";

function buildGeneralUserInput(
  overrides: Partial<GeneralUserCreateInput> & {
    name: string;
    email: string;
    password: string;
    groupSlug: string;
  }
): GeneralUserCreateInput {
  return {
    name: overrides.name,
    email: overrides.email,
    password: overrides.password,
    groupSlug: overrides.groupSlug,
    phone: overrides.phone ?? null,
    status: overrides.status ?? null,
  };
}

/**
 * Builds a complete `GeneralUserCreateInput` with all required fields, then
 * deletes one required field to simulate a missing-field scenario for
 * GraphQL validation tests. The field is genuinely absent so the GraphQL
 * server rejects the mutation.
 */
function buildInputMissingField(field: keyof GeneralUserCreateInput): Record<string, unknown> {
  const input: Record<string, unknown> = {
    name: "Validation Test User",
    email: `genuser_validation_${Date.now()}@test.com`,
    password: `TestPass-${randomUUID().slice(0, 8)}!`,
    groupSlug: STAFF_DEFAULT_GROUP,
    phone: null,
    status: null,
  };
  delete input[field];
  return input;
}

const STAFF_DEFAULT_GROUP = "staff_default";

/** Unique email generator to avoid collisions across test cases */
function uniqueEmail(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomUUID().slice(0, 8)}@test.com`;
}

/** Minimal input builder — defaults all optional fields to null */
function buildMinimalInput(name: string, groupSlug = STAFF_DEFAULT_GROUP): GeneralUserCreateInput {
  return buildGeneralUserInput({
    name,
    email: uniqueEmail("genuser"),
    password: `TestPass-${randomUUID().slice(0, 8)}!`,
    groupSlug,
    phone: null,
    status: null,
  });
}

/** Type guard: narrows an unknown value to a record with string keys */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Asserts a createGeneralUser result has the expected shape */
function assertCreateResult(created: unknown, expectedName: string): void {
  if (!isRecord(created)) throw new Error("createGeneralUser returned null");
  if (typeof created.id === "undefined") throw new Error("Result missing id");

  const user = created.user;
  if (!isRecord(user)) throw new Error("Result missing user");
  if (typeof user.id === "undefined") throw new Error("Result missing user.id");
  expect(user.name).toBe(expectedName);
  expect(created.assignedGroupSlug).toBe(STAFF_DEFAULT_GROUP);
}

describe("createGeneralUser GraphQL Mutation", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let superAdminUserId = "";
  let seedSuperAdminToken = "";
  let superAdminEmail = "";
  let targetUserId = "";

  test("provision super admin for general-user-create tests", async () => {
    // Get a target user ID for the impersonation test FIRST — log in as teacher,
    // query me, then clear cookies so the SA session is clean for provisioning
    clearCookies();
    const teacherToken = await loginDemoUser("teacher_default");
    const meResult = await testClient.query({
      query: meQueryDocument,
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });
    targetUserId = meResult.data?.me?.id ?? "";
    if (!targetUserId) throw new Error("Failed to get teacher user ID for impersonation");

    // Now provision the test super admin — loginUser sets SA session cookies
    clearCookies();
    const existingSaToken = await loginDemoUser("super_admin");
    const sa = await provisionTestSuperAdmin(existingSaToken, "genUserCreate");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;
    superAdminEmail = sa.email;
    seedSuperAdminToken = existingSaToken;

    expect(superAdminToken).toBeTruthy();
    expect(superAdminUserId).toBeTruthy();
  });

  // ─── 1. Successful mutation ──────────────────────────────────────────

  test("super admin creates general user with all fields — returns result with user and assignedGroupSlug", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", createGeneralUserMutationDocument, {
      input: buildGeneralUserInput({
        name: "GraphQL Test User",
        email: uniqueEmail("genuser_full"),
        password: `TestPass-${randomUUID().slice(0, 8)}!`,
        groupSlug: STAFF_DEFAULT_GROUP,
        phone: "+201000000000",
        status: AccountStatus.Activated,
      }),
    });

    assertCreateResult(result.createGeneralUser, "GraphQL Test User");
  });

  test("super admin creates general user with minimal fields (optional fields null) — succeeds", async () => {
    const result = await authenticatedRequest(superAdminToken, "mutate", createGeneralUserMutationDocument, {
      input: buildMinimalInput("Minimal GeneralUser"),
    });

    assertCreateResult(result.createGeneralUser, "Minimal GeneralUser");
  });

  // ─── 2. Unauthorized — no token ──────────────────────────────────────

  test("unauthenticated request without token — denied (UNAUTHENTICATED)", async () => {
    clearCookies();
    const result = await testClient.mutate({
      mutation: createGeneralUserMutationDocument,
      variables: { input: buildMinimalInput("Unauthenticated User") },
      errorPolicy: "all",
    });

    expect(result.error).toBeDefined();
    expect(result.data?.createGeneralUser).toBeFalsy();
  });

  // ─── 3. Forbidden — user without STAFF_CREATE ─────────────────────────

  test("teacher (no STAFF_CREATE permission) — denied (FORBIDDEN)", async () => {
    const denied = await assertOperationDenied("teacher_default", "mutate", createGeneralUserMutationDocument, {
      input: buildMinimalInput("Teacher Created User"),
    });

    expect(denied).toBe(true);
  });

  test("parent (no STAFF_CREATE permission) — denied (FORBIDDEN)", async () => {
    const denied = await assertOperationDenied("parent_default", "mutate", createGeneralUserMutationDocument, {
      input: buildMinimalInput("Parent Created User"),
    });

    expect(denied).toBe(true);
  });

  // ─── 4. Impersonation rejection ──────────────────────────────────────

  test("super admin impersonating another user — createGeneralUser rejected (notImpersonating guard)", async () => {
    if (!superAdminToken || !targetUserId || !superAdminEmail) throw new Error("Missing setup data");

    // Restore the SA session cookies that were overwritten by the
    // loginDemoUser calls in the forbidden tests above (tests 3-4)
    clearCookies();
    superAdminToken = await loginUser(superAdminEmail, TEST_USER_PASSWORD);

    // Start impersonation as super admin — SA session cookies now match the token
    const impersonationData = await authenticatedRequest(
      superAdminToken,
      "mutate",
      startImpersonationMutationDocument,
      { targetUserId, reason: "test impersonation for general user create" }
    );
    const impersonationToken = impersonationData.startImpersonation?.token;
    if (!impersonationToken) throw new Error("Failed to start impersonation");

    // Attempt createGeneralUser while impersonating — should be denied
    const result = await testClient.mutate({
      mutation: createGeneralUserMutationDocument,
      variables: { input: buildMinimalInput("Impersonated User") },
      context: { headers: { Authorization: `Bearer ${impersonationToken}` } },
      errorPolicy: "all",
    });

    expect(result.error).toBeDefined();
    expect(result.data?.createGeneralUser).toBeFalsy();

    // End impersonation to clean up
    try {
      await testClient.mutate({
        mutation: endImpersonationMutationDocument,
        context: { headers: { Authorization: `Bearer ${impersonationToken}` } },
      });
    } catch {
      // Best-effort cleanup
    }
  });

  // ─── 5. Input validation — missing required fields ────────────────────

  test("missing required name field — GraphQL validation error", async () => {
    const result = await testClient.mutate({
      mutation: createGeneralUserMutationDocument,
      variables: { input: buildInputMissingField("name") },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
      errorPolicy: "all",
    } as Parameters<typeof testClient.mutate>[0]);

    expect(result.error).toBeDefined();
  });

  test("missing required email field — GraphQL validation error", async () => {
    const result = await testClient.mutate({
      mutation: createGeneralUserMutationDocument,
      variables: { input: buildInputMissingField("email") },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
      errorPolicy: "all",
    } as Parameters<typeof testClient.mutate>[0]);

    expect(result.error).toBeDefined();
  });

  test("missing required password field — GraphQL validation error", async () => {
    const result = await testClient.mutate({
      mutation: createGeneralUserMutationDocument,
      variables: { input: buildInputMissingField("password") },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
      errorPolicy: "all",
    } as Parameters<typeof testClient.mutate>[0]);

    expect(result.error).toBeDefined();
  });

  test("missing required groupSlug field — GraphQL validation error", async () => {
    const result = await testClient.mutate({
      mutation: createGeneralUserMutationDocument,
      variables: { input: buildInputMissingField("groupSlug") },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
      errorPolicy: "all",
    } as Parameters<typeof testClient.mutate>[0]);

    expect(result.error).toBeDefined();
  });

  afterAll(async () => {
    if (seedSuperAdminToken && superAdminUserId) {
      await cleanupTestSuperAdmin(seedSuperAdminToken, superAdminUserId);
    }
  });
});
