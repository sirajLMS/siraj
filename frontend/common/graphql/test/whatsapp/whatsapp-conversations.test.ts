import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { TypedDocumentNode } from "@apollo/client";
import {
  type AddWhatsappTestRecipientMutation_addWhatsappTestRecipient,
  type PaginationArgs,
  type WhatsappConversationSendInput,
  WhatsappConversationSendMode,
  WhatsappTestRecipientStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createWhatsappAccountMutationDocument,
  localDeactivateWhatsappAccountMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents";
import {
  addWhatsappTestRecipientMutationDocument,
  removeWhatsappTestRecipientMutationDocument,
  sendWhatsappConversationMessageMutationDocument,
  verifyWhatsappTestRecipientMutationDocument,
  whatsappConversationsListQueryDocument,
  whatsappConversationThreadQueryDocument,
  whatsappTestRecipientsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/whatsapp/whatsapp-conversations.documents";
import {
  assertOperationDenied,
  authenticatedRequest,
  extractGqlErrorCode,
  loginSuperAdmin,
  setupTestServerLifecycle,
  testClient,
} from "@/test/helpers";

/**
 * GraphQL integration coverage for the WhatsApp conversations workspace:
 * permission gating (`WHATSAPP_CONVERSATIONS_VIEW` / `_MANAGE` at resolver +
 * service), recipient registry lifecycle (add/list/remove, duplicate +
 * unknown-id error codes), thread unknown-id guard, and the composer send
 * validation/service-window error codes. Live Meta sends are not exercised
 * here (covered by the service unit suite) — verify/send happy paths would
 * require a real Meta round-trip.
 */

const UNAUTHORIZED_GROUP = "teacher_default";

type TestRecipientNode = AddWhatsappTestRecipientMutation_addWhatsappTestRecipient;

const FULL_PAGINATION: PaginationArgs = {
  first: 10,
  skip: null,
  after: null,
  before: null,
  last: null,
  page: 1,
  maxCount: null,
};

/** Build a digits-only fixture phone number from fragments (avoids inline phone-shaped literals). */
function fixturePhone(suffix: string): string {
  return ["1555", suffix.slice(0, 3), suffix.slice(3, 7).padEnd(4, "0")].join("");
}

async function createAccount(token: string): Promise<string> {
  const data = await authenticatedRequest(token, "mutate", createWhatsappAccountMutationDocument, {
    input: {
      wabaId: `waba_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
      phoneNumberId: `pn_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
      displayPhoneNumber: `+${fixturePhone("9990001")}`,
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

async function addRecipient(token: string, accountId: string, phoneNumber: string): Promise<TestRecipientNode> {
  const data = await authenticatedRequest(token, "mutate", addWhatsappTestRecipientMutationDocument, {
    input: { accountId, phoneNumber, note: null },
  });
  const recipient = data.addWhatsappTestRecipient;
  if (!recipient) throw new Error("addWhatsappTestRecipient returned null");
  return recipient;
}

async function removeAccount(token: string, accountId: string): Promise<void> {
  await authenticatedRequest(token, "mutate", localDeactivateWhatsappAccountMutationDocument, { id: accountId });
}

function buildSendInput(
  accountId: string,
  overrides: Partial<WhatsappConversationSendInput> = {}
): WhatsappConversationSendInput {
  return {
    accountId,
    conversationId: null,
    to: fixturePhone("1112222"),
    mode: WhatsappConversationSendMode.Text,
    templateName: null,
    templateLanguage: null,
    body: null,
    ...overrides,
  };
}

/** Login as super-admin, provision a fresh account, run the scenario, then deactivate the account. */
async function withTestAccount(scenario: (token: string, accountId: string) => Promise<void>): Promise<void> {
  const token = await loginSuperAdmin();
  const accountId = await createAccount(token);
  try {
    await scenario(token, accountId);
  } finally {
    await removeAccount(token, accountId);
  }
}

/** Run a mutation expecting a GraphQL error and assert its `extensions.code`. */
async function expectMutationErrorCode<TData, TVars extends { [key: string]: unknown }>(
  token: string,
  document: TypedDocumentNode<TData, TVars>,
  variables: TVars,
  expectedCode: string
): Promise<void> {
  const result = await testClient.mutate({
    mutation: document,
    variables,
    errorPolicy: "all",
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  expect(result.error).toBeDefined();
  expect(extractGqlErrorCode(result.error)).toBe(expectedCode);
}

describe("whatsapp conversations queries", () => {
  setupTestServerLifecycle();

  test("denies whatsappConversationThreads without WHATSAPP_CONVERSATIONS_VIEW", async () => {
    const denied = await assertOperationDenied(UNAUTHORIZED_GROUP, "query", whatsappConversationsListQueryDocument, {
      accountId: null,
      pagination: null,
    });
    expect(denied).toBe(true);
  });

  test("denies whatsappConversationThread without WHATSAPP_CONVERSATIONS_VIEW", async () => {
    const denied = await assertOperationDenied(UNAUTHORIZED_GROUP, "query", whatsappConversationThreadQueryDocument, {
      id: randomUUID(),
      pagination: null,
    });
    expect(denied).toBe(true);
  });

  test("denies whatsappTestRecipients without WHATSAPP_CONVERSATIONS_VIEW", async () => {
    const denied = await assertOperationDenied(UNAUTHORIZED_GROUP, "query", whatsappTestRecipientsQueryDocument, {
      accountId: randomUUID(),
    });
    expect(denied).toBe(true);
  });

  test("returns an empty paginated threads list for a fresh account", async () => {
    await withTestAccount(async (token, accountId) => {
      const data = await authenticatedRequest(token, "query", whatsappConversationsListQueryDocument, {
        accountId,
        pagination: FULL_PAGINATION,
      });
      const result = data.whatsappConversationThreads;
      if (!result) throw new Error("whatsappConversationThreads returned null");
      expect(result.rows).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.pageInfo?.currentPage).toBe(1);
    });
  });

  test("whatsappConversationThread rejects an unknown conversation id", async () => {
    const token = await loginSuperAdmin();
    const result = await testClient.query({
      query: whatsappConversationThreadQueryDocument,
      variables: { id: randomUUID(), pagination: null },
      errorPolicy: "all",
      context: { headers: { Authorization: `Bearer ${token}` } },
    });
    expect(result.error).toBeDefined();
    expect(extractGqlErrorCode(result.error)).toBe("WHATSAPP_CONVERSATION_NOT_FOUND");
  });
});

describe("whatsapp test-recipient registry", () => {
  setupTestServerLifecycle();

  test("denies registry mutations without WHATSAPP_CONVERSATIONS_MANAGE", async () => {
    const accountId = randomUUID();
    const phoneNumber = fixturePhone("2223333");
    expect(
      await assertOperationDenied(UNAUTHORIZED_GROUP, "mutate", addWhatsappTestRecipientMutationDocument, {
        input: { accountId, phoneNumber, note: null },
      })
    ).toBe(true);
    expect(
      await assertOperationDenied(UNAUTHORIZED_GROUP, "mutate", removeWhatsappTestRecipientMutationDocument, {
        recipientId: randomUUID(),
      })
    ).toBe(true);
    expect(
      await assertOperationDenied(UNAUTHORIZED_GROUP, "mutate", verifyWhatsappTestRecipientMutationDocument, {
        recipientId: randomUUID(),
      })
    ).toBe(true);
    expect(
      await assertOperationDenied(UNAUTHORIZED_GROUP, "mutate", sendWhatsappConversationMessageMutationDocument, {
        input: buildSendInput(accountId),
      })
    ).toBe(true);
  });

  test("adds, lists, and removes a recipient (happy path)", async () => {
    await withTestAccount(async (token, accountId) => {
      const phoneNumber = fixturePhone("3334444");
      const recipient = await addRecipient(token, accountId, phoneNumber);
      const recipientId = recipient.id;
      if (!recipientId) throw new Error("addWhatsappTestRecipient returned no id");
      expect(recipient.accountId).toBe(accountId);
      expect(recipient.phoneNumber).toBe(phoneNumber);
      expect(recipient.status).toBe(WhatsappTestRecipientStatus.Pending);
      expect(recipient.lastCheckedAt).toBeNull();
      expect(recipient.lastErrorCode).toBeNull();

      const listed = await authenticatedRequest(token, "query", whatsappTestRecipientsQueryDocument, { accountId });
      const rows = listed.whatsappTestRecipients;
      if (!rows) throw new Error("whatsappTestRecipients returned null");
      expect(rows.map(row => row.id)).toContain(recipientId);

      const removed = await authenticatedRequest(token, "mutate", removeWhatsappTestRecipientMutationDocument, {
        recipientId,
      });
      expect(removed.removeWhatsappTestRecipient).toBe(true);

      const afterRemoval = await authenticatedRequest(token, "query", whatsappTestRecipientsQueryDocument, {
        accountId,
      });
      expect(afterRemoval.whatsappTestRecipients ?? []).toHaveLength(0);
    });
  });

  test("rejects a non-digit recipient phone number", async () => {
    await withTestAccount(async (token, accountId) => {
      await expectMutationErrorCode(
        token,
        addWhatsappTestRecipientMutationDocument,
        { input: { accountId, phoneNumber: "not-a-number", note: null } },
        "VALIDATION"
      );
    });
  });

  test("rejects a duplicate recipient with WHATSAPP_RECIPIENT_CONFLICT", async () => {
    await withTestAccount(async (token, accountId) => {
      const phoneNumber = fixturePhone("4445555");
      await addRecipient(token, accountId, phoneNumber);
      await expectMutationErrorCode(
        token,
        addWhatsappTestRecipientMutationDocument,
        { input: { accountId, phoneNumber, note: "dup" } },
        "WHATSAPP_RECIPIENT_CONFLICT"
      );
    });
  });

  test("remove/verify reject an unknown recipient id", async () => {
    const token = await loginSuperAdmin();
    const unknown = randomUUID();
    await expectMutationErrorCode(
      token,
      removeWhatsappTestRecipientMutationDocument,
      { recipientId: unknown },
      "WHATSAPP_TEST_RECIPIENT_NOT_FOUND"
    );
    await expectMutationErrorCode(
      token,
      verifyWhatsappTestRecipientMutationDocument,
      { recipientId: unknown },
      "WHATSAPP_TEST_RECIPIENT_NOT_FOUND"
    );
  });
});

describe("sendWhatsappConversationMessage", () => {
  setupTestServerLifecycle();

  test("rejects a send for an unknown account", async () => {
    const token = await loginSuperAdmin();
    await expectMutationErrorCode(
      token,
      sendWhatsappConversationMessageMutationDocument,
      { input: buildSendInput(randomUUID(), { body: "hi" }) },
      "WHATSAPP_ACCOUNT_NOT_FOUND"
    );
  });

  const sendErrorCases: { name: string; overrides: Partial<WhatsappConversationSendInput>; code: string }[] = [
    { name: "rejects a TEXT send without a body", overrides: {}, code: "VALIDATION" },
    {
      name: "rejects a TEXT send outside the 24h window (no conversation)",
      overrides: { body: "hello there" },
      code: "WHATSAPP_OUTSIDE_SERVICE_WINDOW",
    },
    {
      name: "rejects a send referencing an unknown conversation",
      overrides: { conversationId: randomUUID(), body: "hello there" },
      code: "WHATSAPP_CONVERSATION_NOT_FOUND",
    },
  ];

  for (const { name, overrides, code } of sendErrorCases) {
    test(name, async () => {
      await withTestAccount(async (token, accountId) => {
        await expectMutationErrorCode(
          token,
          sendWhatsappConversationMessageMutationDocument,
          { input: buildSendInput(accountId, overrides) },
          code
        );
      });
    });
  }
});
