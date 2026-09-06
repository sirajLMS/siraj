import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { WhatsappAccountPurpose, WhatsappSyncStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createWhatsappAccountMutationDocument,
  deleteWhatsappAccountMutationDocument,
  setWhatsappAccessTokenMutationDocument,
  updateWhatsappAccountMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents";
import {
  updateWhatsappAccountPurposeMutationDocument,
  whatsappConversationMessagesQueryDocument,
  whatsappConversationsQueryDocument,
  whatsappSyncStatusQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/whatsapp/whatsapp-inbox.documents";
import {
  assertOperationDenied,
  authenticatedRequest,
  expectMutationError,
  extractGqlErrorCode,
  loginSuperAdmin,
  setupTestServerLifecycle,
  testClient,
} from "@/test/helpers";

/**
 * GraphQL integration coverage for the WhatsApp inbox surface: permission
 * gating (`WHATSAPP_INBOX_VIEW` at resolver + service), conversation
 * ownership guard (unknown thread id), pagination envelope, the
 * purpose-assignment mutation lifecycle, and the sync-overview query.
 */

const INBOX_VIEWER_DENIAL_GROUP = "teacher_default";

async function createInactiveAccount(token: string, wabaId: string): Promise<string> {
  const data = await authenticatedRequest(token, "mutate", createWhatsappAccountMutationDocument, {
    input: {
      wabaId,
      phoneNumberId: `pn_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
      displayPhoneNumber: "+15550001234",
      displayName: null,
      qualityRating: null,
      portfolioMessagingLimitTier: null,
      throughputLevel: null,
      purpose: null,
      isActive: true,
    },
  });
  const accountId = data.createWhatsappAccount?.id;
  if (!accountId) throw new Error("createWhatsappAccount returned no id");
  return accountId;
}

// No credentials exist for a fresh account → create forces isActive=false.
async function activateAccount(superAdminToken: string, accountId: string): Promise<void> {
  await authenticatedRequest(superAdminToken, "mutate", setWhatsappAccessTokenMutationDocument, {
    id: accountId,
    accessToken: "tok_test_a",
  });
  await authenticatedRequest(superAdminToken, "mutate", updateWhatsappAccountMutationDocument, {
    id: accountId,
    input: {
      displayPhoneNumber: "+15550001234",
      displayName: null,
      qualityRating: null,
      portfolioMessagingLimitTier: null,
      throughputLevel: null,
      isActive: true,
    },
  });
}

describe("WhatsApp inbox queries", () => {
  setupTestServerLifecycle();

  test("denies whatsappConversations without WHATSAPP_INBOX_VIEW", async () => {
    const denied = await assertOperationDenied(INBOX_VIEWER_DENIAL_GROUP, "query", whatsappConversationsQueryDocument, {
      accountId: null,
      pagination: null,
    });
    expect(denied).toBe(true);
  });

  test("denies whatsappSyncStatus without WHATSAPP_INBOX_VIEW", async () => {
    const denied = await assertOperationDenied(INBOX_VIEWER_DENIAL_GROUP, "query", whatsappSyncStatusQueryDocument, {
      accountId: randomUUID(),
    });
    expect(denied).toBe(true);
  });
  test("returns an empty paginated conversation list for a fresh account", async () => {
    const superAdminToken = await loginSuperAdmin();
    const accountId = await createInactiveAccount(
      superAdminToken,
      `waba_${randomUUID().replaceAll("-", "").slice(0, 12)}`
    );
    try {
      const data = await authenticatedRequest(superAdminToken, "query", whatsappConversationsQueryDocument, {
        accountId,
        pagination: { first: 10, skip: null, after: null, before: null, last: null, page: 1, maxCount: null },
      });
      const result = data.whatsappConversations;
      if (!result) throw new Error("whatsappConversations returned null");
      expect(result.rows).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.pageInfo?.total).toBe(0);
      expect(result.pageInfo?.currentPage).toBe(1);
      expect(result.pageInfo?.hasMorePages).toBe(false);
    } finally {
      await authenticatedRequest(superAdminToken, "mutate", deleteWhatsappAccountMutationDocument, { id: accountId });
    }
  });

  test("whatsappConversationMessages rejects an unknown conversationId (ownership guard)", async () => {
    const superAdminToken = await loginSuperAdmin();
    const result = await testClient.query({
      query: whatsappConversationMessagesQueryDocument,
      variables: {
        conversationId: randomUUID(),
        pagination: { first: 5, skip: null, after: null, before: null, last: null, page: null, maxCount: null },
      },
      errorPolicy: "all",
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
    });
    expect(result.error).toBeDefined();
    expect(extractGqlErrorCode(result.error)).toBe("WHATSAPP_CONVERSATION_NOT_FOUND");
  });

  test("whatsappSyncStatus returns the account overview", async () => {
    const superAdminToken = await loginSuperAdmin();
    const accountId = await createInactiveAccount(
      superAdminToken,
      `waba_${randomUUID().replaceAll("-", "").slice(0, 12)}`
    );
    try {
      const data = await authenticatedRequest(superAdminToken, "query", whatsappSyncStatusQueryDocument, { accountId });
      const overview = data.whatsappSyncStatus;
      if (!overview) throw new Error("whatsappSyncStatus returned null");
      expect(overview.accountId).toBe(accountId);
      expect(overview.syncStatus).toBe(WhatsappSyncStatus.NotStarted);
      expect(overview.syncProgress).toBe(0);
      expect(overview.requests).toHaveLength(0);
    } finally {
      await authenticatedRequest(superAdminToken, "mutate", deleteWhatsappAccountMutationDocument, { id: accountId });
    }
  });
});

describe("updateWhatsappAccountPurpose", () => {
  setupTestServerLifecycle();

  test("rejects purpose assignment on an inactive account", async () => {
    const superAdminToken = await loginSuperAdmin();
    const accountId = await createInactiveAccount(
      superAdminToken,
      `waba_${randomUUID().replaceAll("-", "").slice(0, 12)}`
    );
    try {
      await expectMutationError(
        superAdminToken,
        updateWhatsappAccountPurposeMutationDocument,
        { accountId, purpose: WhatsappAccountPurpose.Students },
        "whatsapp.purposeRequiresActive"
      );
      expect(superAdminToken).toBeTruthy();
    } finally {
      await authenticatedRequest(superAdminToken, "mutate", deleteWhatsappAccountMutationDocument, { id: accountId });
    }
  });

  test("denies purpose updates without WHATSAPP_CONFIG_MANAGE", async () => {
    const denied = await assertOperationDenied(
      INBOX_VIEWER_DENIAL_GROUP,
      "mutate",
      updateWhatsappAccountPurposeMutationDocument,
      { accountId: randomUUID(), purpose: WhatsappAccountPurpose.Students }
    );
    expect(denied).toBe(true);
  });

  test("assigns a purpose on an active account", async () => {
    const superAdminToken = await loginSuperAdmin();
    const accountId = await createInactiveAccount(
      superAdminToken,
      `waba_${randomUUID().replaceAll("-", "").slice(0, 12)}`
    );
    try {
      await activateAccount(superAdminToken, accountId);
      const data = await authenticatedRequest(superAdminToken, "mutate", updateWhatsappAccountPurposeMutationDocument, {
        accountId,
        purpose: WhatsappAccountPurpose.Students,
      });
      const updated = data.updateWhatsappAccountPurpose;
      if (!updated) throw new Error("updateWhatsappAccountPurpose returned null");
      expect(updated.id).toBe(accountId);
      expect(updated.isActive).toBe(true);
    } finally {
      await authenticatedRequest(superAdminToken, "mutate", deleteWhatsappAccountMutationDocument, { id: accountId });
    }
  });

  test("rejects purpose updates for a missing account", async () => {
    const superAdminToken = await loginSuperAdmin();
    const result = await testClient.mutate({
      mutation: updateWhatsappAccountPurposeMutationDocument,
      variables: { accountId: randomUUID(), purpose: WhatsappAccountPurpose.General },
      errorPolicy: "all",
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
    });
    expect(result.error).toBeDefined();
    expect(extractGqlErrorCode(result.error)).toBe("WHATSAPP_ACCOUNT_NOT_FOUND");
  });
});
