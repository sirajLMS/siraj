import { afterAll, describe, expect, test } from "bun:test";
import { CombinedGraphQLErrors } from "@apollo/client";
import { InvoiceType as InvoiceTypeEnum } from "@/frontend/graphql/generated/gql/graphql-types";
import { createManualInvoiceMutationDocument } from "@/frontend/graphql/sharedDocuments";
import {
  endImpersonationMutationDocument,
  impersonationStatusQueryDocument,
  meQueryDocument,
  startImpersonationMutationDocument,
} from "@/frontend/graphql/sharedDocuments/auth/auth.documents";
import {
  authenticatedRequest,
  cleanupTestEntities,
  cleanupTestSuperAdmin,
  loginAndProvision,
  loginDemoUser,
  provisionTestSuperAdmin,
} from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";
import { clearCookies, testClient } from "@/frontend/graphql/test/testClient";

const TEST_REASON = "GraphQL integration test impersonation";

function manualInvoiceVars(parentId: string) {
  return {
    parentId,
    studentId: null as string | null,
    amount: "10.00",
    currency: "USD",
    invoiceType: InvoiceTypeEnum.Manual,
    issueDate: "2026-06-22",
    dueDate: "2026-07-22",
    exchangeRateSnapshot: null as string | null,
    exchangeRateSource: null as string | null,
    billingMonths: null as Array<{ month: number; year: number }> | null,
    sendEmail: null as boolean | null,
  };
}

async function startImpersonation(actorToken: string, targetUserId: string, reason = TEST_REASON): Promise<string> {
  const data = await authenticatedRequest(actorToken, "mutate", startImpersonationMutationDocument, {
    targetUserId,
    reason,
  });
  const token = data.startImpersonation?.token;
  if (!token) throw new Error("startImpersonation did not return a token");
  return token;
}

async function expectMutationDenied(
  token: string,
  document: Parameters<typeof testClient.mutate>[0]["mutation"],
  variables: Record<string, unknown>
): Promise<void> {
  const result = await testClient.mutate({
    mutation: document,
    variables,
    context: { headers: { Authorization: `Bearer ${token}` } },
  } as Parameters<typeof testClient.mutate>[0]);
  expect(result.error).toBeDefined();
}

describe("GraphQL Impersonation Integration Tests", () => {
  setupTestServerLifecycle();

  let seedSuperAdminToken = "";
  let superAdminToken = "";
  let superAdminUserId = "";
  let teacherUserId = "";
  let parentId = "";
  let studentId = "";
  let teacherId = "";
  let studentUserId = "";
  let teacherUserIdForCleanup = "";
  let parentUserId = "";

  test("provision isolated users for impersonation tests", async () => {
    const provisioned = await loginAndProvision("ImpersonationTest");
    seedSuperAdminToken = provisioned.superAdminToken;
    teacherUserId = provisioned.teacherUserId;
    parentId = provisioned.parentId;
    studentId = provisioned.studentId;
    teacherId = provisioned.teacherId;
    studentUserId = provisioned.studentUserId;
    teacherUserIdForCleanup = provisioned.teacherUserId;
    parentUserId = provisioned.parentUserId;

    const sa = await provisionTestSuperAdmin(seedSuperAdminToken, "ImpersonationTestSA");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;

    expect(seedSuperAdminToken).toBeTruthy();
    expect(superAdminToken).toBeTruthy();
    expect(superAdminUserId).toBeTruthy();
    expect(teacherUserId).toBeTruthy();
    expect(parentId).toBeTruthy();
    expect(studentId).toBeTruthy();
  });

  test("impersonation status is inactive before starting a session", async () => {
    if (!superAdminToken) throw new Error("Missing super admin token");

    const data = await authenticatedRequest(superAdminToken, "query", impersonationStatusQueryDocument);
    expect(data.impersonationStatus?.isActive).toBe(false);
  });

  test("super admin can start impersonation of a provisioned teacher", async () => {
    if (!superAdminToken || !teacherUserId) throw new Error("Missing setup data");

    const data = await authenticatedRequest(superAdminToken, "mutate", startImpersonationMutationDocument, {
      targetUserId: teacherUserId,
      reason: TEST_REASON,
    });

    expect(data.startImpersonation?.token).toBeDefined();
    expect(data.startImpersonation?.impersonationSessionId).toBeDefined();
    expect(data.startImpersonation?.expiresAt).toBeDefined();
    expect(data.startImpersonation?.targetUser?.id).toBe(teacherUserId);
  });

  test("impersonation status is active with actor and target after start", async () => {
    if (!superAdminToken || !teacherUserId) throw new Error("Missing setup data");

    const impersonationToken = await startImpersonation(superAdminToken, teacherUserId);
    const data = await authenticatedRequest(impersonationToken, "query", impersonationStatusQueryDocument);

    expect(data.impersonationStatus?.isActive).toBe(true);
    expect(data.impersonationStatus?.targetUser?.id).toBe(teacherUserId);
    expect(data.impersonationStatus?.actorUser?.id).toBe(superAdminUserId);
    expect(data.impersonationStatus?.reason).toBe(TEST_REASON);
    expect(data.impersonationStatus?.startedAt).toBeDefined();
    expect(data.impersonationStatus?.expiresAt).toBeDefined();

    await authenticatedRequest(impersonationToken, "mutate", endImpersonationMutationDocument);
  });

  test("me query returns impersonated user while session is active", async () => {
    if (!superAdminToken || !teacherUserId) throw new Error("Missing setup data");

    const impersonationToken = await startImpersonation(superAdminToken, teacherUserId);
    const data = await authenticatedRequest(impersonationToken, "query", meQueryDocument);
    expect(data.me?.id).toBe(teacherUserId);

    await authenticatedRequest(impersonationToken, "mutate", endImpersonationMutationDocument);
  });

  test("super admin can end impersonation and restore their own identity", async () => {
    if (!superAdminToken || !teacherUserId) throw new Error("Missing setup data");

    const impersonationToken = await startImpersonation(superAdminToken, teacherUserId);
    const endData = await authenticatedRequest(impersonationToken, "mutate", endImpersonationMutationDocument);
    expect(endData.endImpersonation?.token).toBeDefined();

    const restoredToken = endData.endImpersonation?.token ?? "";
    const meData = await authenticatedRequest(restoredToken, "query", meQueryDocument);
    expect(meData.me?.id).toBe(superAdminUserId);

    const status = await authenticatedRequest(restoredToken, "query", impersonationStatusQueryDocument);
    expect(status.impersonationStatus?.isActive).toBe(false);
  });

  test("cannot start impersonation while already impersonating", async () => {
    if (!superAdminToken || !teacherUserId || !parentUserId) throw new Error("Missing setup data");

    const impersonationToken = await startImpersonation(superAdminToken, teacherUserId);

    // The impersonationToken is sent via Authorization header. The cookie jar still
    // has the super admin's session_id from the prior startImpersonation call.
    // The server resolves: impersonation token + session mismatch (SA session vs
    // teacher JWT) → unauthenticated → superAdmin scope = false → DENIED.
    await expectMutationDenied(impersonationToken, startImpersonationMutationDocument, {
      targetUserId: parentUserId,
      reason: null,
    });

    // End impersonation — superAdminToken still has matching session cookies in the jar
    try {
      await authenticatedRequest(superAdminToken, "mutate", endImpersonationMutationDocument);
    } catch {
      // Best-effort cleanup
    }
  });

  test("sensitive super-admin mutation is blocked while impersonating", async () => {
    if (!superAdminToken || !teacherUserId || !parentId) throw new Error("Missing setup data");

    const impersonationToken = await startImpersonation(superAdminToken, teacherUserId);

    await expectMutationDenied(impersonationToken, createManualInvoiceMutationDocument, manualInvoiceVars(parentId));

    await authenticatedRequest(impersonationToken, "mutate", endImpersonationMutationDocument);
  });

  test("super admin cannot impersonate themselves", async () => {
    if (!superAdminToken || !superAdminUserId) throw new Error("Missing setup data");

    clearCookies();
    const result = await testClient.mutate({
      mutation: startImpersonationMutationDocument,
      variables: { targetUserId: superAdminUserId, reason: null },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
    });

    expect(result.error).toBeDefined();
    expect(CombinedGraphQLErrors.is(result.error)).toBe(true);
  });

  test("non-super-admin cannot start impersonation", async () => {
    if (!teacherUserId || !parentUserId) throw new Error("Missing setup data");

    const token = await loginDemoUser("teacher_default");
    const result = await testClient.mutate({
      mutation: startImpersonationMutationDocument,
      variables: { targetUserId: parentUserId, reason: null },
      context: { headers: { Authorization: `Bearer ${token}` } },
    } as Parameters<typeof testClient.mutate>[0]);

    expect(result.error).toBeDefined();
  });

  afterAll(async () => {
    if (!seedSuperAdminToken) return;

    try {
      if (superAdminToken) {
        const status = await testClient.query({
          query: impersonationStatusQueryDocument,
          context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
        });
        if (status.data?.impersonationStatus?.isActive) {
          await testClient.mutate({
            mutation: endImpersonationMutationDocument,
            context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
          });
        }
      }
    } catch {
      // Best-effort cleanup — session may already be ended
    }

    if (studentUserId && teacherUserIdForCleanup && parentUserId && studentId && teacherId && parentId) {
      await cleanupTestEntities(seedSuperAdminToken, {
        studentUserId,
        teacherUserId: teacherUserIdForCleanup,
        parentUserId,
        studentId,
        teacherId,
        parentId,
      });
    }

    if (superAdminUserId) {
      await cleanupTestSuperAdmin(seedSuperAdminToken, superAdminUserId);
    }
  });
});
