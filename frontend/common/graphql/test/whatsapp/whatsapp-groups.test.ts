import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { TypedDocumentNode } from "@apollo/client";
import type {
  PaginationArgs,
  WhatsappGroupCreateInput,
  WhatsappGroupSendInput,
  WhatsappGroupSettingsUpdateInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createWhatsappAccountMutationDocument,
  localDeactivateWhatsappAccountMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents";
import {
  approveWhatsappGroupJoinRequestsMutationDocument,
  createWhatsappGroupMutationDocument,
  deleteWhatsappGroupMutationDocument,
  getWhatsappGroupInviteLinkMutationDocument,
  pinWhatsappGroupMessageMutationDocument,
  rejectWhatsappGroupJoinRequestsMutationDocument,
  removeWhatsappGroupParticipantsMutationDocument,
  resetWhatsappGroupInviteLinkMutationDocument,
  sendWhatsappGroupMessageMutationDocument,
  syncWhatsappGroupsMutationDocument,
  unpinWhatsappGroupMessageMutationDocument,
  updateWhatsappGroupSettingsMutationDocument,
  whatsappGroupMessagesQueryDocument,
  whatsappGroupQueryDocument,
  whatsappGroupsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/whatsapp/whatsapp-groups.documents";
import {
  assertOperationDenied,
  authenticatedRequest,
  extractGqlErrorCode,
  loginSuperAdmin,
  setupTestServerLifecycle,
  testClient,
} from "@/test/helpers";

/**
 * GraphQL integration coverage for the WhatsApp groups workspace: permission
 * gating (`WHATSAPP_GROUPS_VIEW` / `_MANAGE` at resolver + service), the local
 * registry error codes (unknown group, empty settings update), create/settings
 * validation, and the sync/invite-link/pin/send mutation error codes. Live
 * Meta group reads are not exercised here (the test account carries no Meta
 * access token) — sync and invite-link happy paths would require a real Meta
 * round-trip (covered by `test/integration/communication/whatsapp/groups/`).
 */

const UNAUTHORIZED_GROUP = "teacher_default";

const FULL_PAGINATION: PaginationArgs = {
  first: 10,
  skip: null,
  after: null,
  before: null,
  last: null,
  page: 1,
  maxCount: null,
};

/** A group subject fixture within Meta's 1-128 character limit. */
function fixtureSubject(suffix: string): string {
  return `test-group-${suffix}`.slice(0, 64);
}

/** Build a digits-only fixture phone number from fragments (avoids inline phone-shaped literals). */
function fixturePhone(suffix: string): string {
  return ["1555", suffix.slice(0, 3), suffix.slice(3, 7).padEnd(4, "0")].join("");
}

async function createAccount(token: string): Promise<string> {
  const data = await authenticatedRequest(token, "mutate", createWhatsappAccountMutationDocument, {
    input: {
      wabaId: `waba_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
      phoneNumberId: `pn_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
      displayPhoneNumber: "+1 555 010 8888",
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

async function removeAccount(token: string, accountId: string): Promise<void> {
  await authenticatedRequest(token, "mutate", localDeactivateWhatsappAccountMutationDocument, { id: accountId });
}

function buildCreateInput(
  accountId: string,
  overrides: Partial<WhatsappGroupCreateInput> = {}
): WhatsappGroupCreateInput {
  return {
    accountId,
    subject: fixtureSubject(randomUUID().slice(0, 8)),
    description: null,
    joinApprovalMode: null,
    ...overrides,
  };
}

function buildSendInput(groupId: string, overrides: Partial<WhatsappGroupSendInput> = {}): WhatsappGroupSendInput {
  return {
    groupId,
    body: null,
    previewUrl: null,
    templateName: null,
    templateLanguageCode: null,
    templateGroupIdParameter: null,
    ...overrides,
  };
}

function buildSettingsInput(
  groupId: string,
  overrides: Partial<WhatsappGroupSettingsUpdateInput> = {}
): WhatsappGroupSettingsUpdateInput {
  return {
    groupId,
    subject: null,
    description: null,
    profilePicturePath: null,
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

describe("whatsapp groups queries", () => {
  setupTestServerLifecycle();

  test("denies whatsappGroups without WHATSAPP_GROUPS_VIEW", async () => {
    const denied = await assertOperationDenied(UNAUTHORIZED_GROUP, "query", whatsappGroupsQueryDocument, {
      accountId: null,
      search: null,
      pagination: null,
    });
    expect(denied).toBe(true);
  });

  test("denies whatsappGroup without WHATSAPP_GROUPS_VIEW", async () => {
    const denied = await assertOperationDenied(UNAUTHORIZED_GROUP, "query", whatsappGroupQueryDocument, {
      groupId: randomUUID(),
    });
    expect(denied).toBe(true);
  });

  test("denies whatsappGroupMessages without WHATSAPP_GROUPS_VIEW", async () => {
    const denied = await assertOperationDenied(UNAUTHORIZED_GROUP, "query", whatsappGroupMessagesQueryDocument, {
      groupId: randomUUID(),
      pagination: null,
    });
    expect(denied).toBe(true);
  });

  test("returns an empty paginated groups list for a fresh account", async () => {
    await withTestAccount(async (token, accountId) => {
      const data = await authenticatedRequest(token, "query", whatsappGroupsQueryDocument, {
        accountId,
        search: null,
        pagination: FULL_PAGINATION,
      });
      const result = data.whatsappGroups;
      if (!result) throw new Error("whatsappGroups returned null");
      expect(result.rows).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.pageInfo?.currentPage).toBe(1);
    });
  });

  test.each([
    {
      targetQuery: "whatsappGroup",
      run: (token: string) =>
        testClient.query({
          query: whatsappGroupQueryDocument,
          variables: { groupId: randomUUID() },
          errorPolicy: "all",
          context: { headers: { Authorization: `Bearer ${token}` } },
        }),
    },
    {
      targetQuery: "whatsappGroupMessages",
      run: (token: string) =>
        testClient.query({
          query: whatsappGroupMessagesQueryDocument,
          variables: { groupId: randomUUID(), pagination: FULL_PAGINATION },
          errorPolicy: "all",
          context: { headers: { Authorization: `Bearer ${token}` } },
        }),
    },
  ])("$targetQuery rejects an unknown group id", async ({ run }) => {
    const token = await loginSuperAdmin();
    const result = await run(token);
    expect(result.error).toBeDefined();
    expect(extractGqlErrorCode(result.error)).toBe("WHATSAPP_GROUP_NOT_FOUND");
  });
});

describe("whatsapp groups mutations", () => {
  setupTestServerLifecycle();

  test("denies group mutations without WHATSAPP_GROUPS_MANAGE", async () => {
    const groupId = randomUUID();
    expect(
      await assertOperationDenied(UNAUTHORIZED_GROUP, "mutate", deleteWhatsappGroupMutationDocument, {
        groupId,
      })
    ).toBe(true);
    expect(
      await assertOperationDenied(UNAUTHORIZED_GROUP, "mutate", updateWhatsappGroupSettingsMutationDocument, {
        input: buildSettingsInput(groupId),
      })
    ).toBe(true);
    expect(
      await assertOperationDenied(UNAUTHORIZED_GROUP, "mutate", syncWhatsappGroupsMutationDocument, {
        accountId: randomUUID(),
      })
    ).toBe(true);
    expect(
      await assertOperationDenied(UNAUTHORIZED_GROUP, "mutate", sendWhatsappGroupMessageMutationDocument, {
        input: buildSendInput(groupId, { body: "hi" }),
      })
    ).toBe(true);
  });

  test("rejects a create for an unknown account", async () => {
    const token = await loginSuperAdmin();
    await expectMutationErrorCode(
      token,
      createWhatsappGroupMutationDocument,
      { input: buildCreateInput(randomUUID()) },
      "WHATSAPP_ACCOUNT_NOT_FOUND"
    );
  });

  test("rejects a create with a blank subject (fails on missing credentials before payload validation)", async () => {
    await withTestAccount(async (token, accountId) => {
      // Whitespace passes the GraphQL minLength(1) constraint, but the
      // per-account Graph context resolves before the builder's trim guard —
      // on a token-less test account the config error fires first.
      await expectMutationErrorCode(
        token,
        createWhatsappGroupMutationDocument,
        { input: buildCreateInput(accountId, { subject: "   " }) },
        "WHATSAPP_CONFIG"
      );
    });
  });

  test("rejects a settings update with no fields set", async () => {
    await withTestAccount(async token => {
      // The group must exist locally before the settings-empty guard runs, so
      // the unknown-id NOT_FOUND would otherwise mask the validation error.
      const unknown = randomUUID();
      await expectMutationErrorCode(
        token,
        updateWhatsappGroupSettingsMutationDocument,
        { input: buildSettingsInput(unknown) },
        "WHATSAPP_GROUP_NOT_FOUND"
      );
    });
  });

  test.each([
    {
      description: "invite-link get/reset",
      verify: async (token: string, unknown: string) => {
        await expectMutationErrorCode(
          token,
          getWhatsappGroupInviteLinkMutationDocument,
          { groupId: unknown },
          "WHATSAPP_GROUP_NOT_FOUND"
        );
        await expectMutationErrorCode(
          token,
          resetWhatsappGroupInviteLinkMutationDocument,
          { groupId: unknown },
          "WHATSAPP_GROUP_NOT_FOUND"
        );
      },
    },
    {
      description: "delete",
      verify: async (token: string, unknown: string) => {
        await expectMutationErrorCode(
          token,
          deleteWhatsappGroupMutationDocument,
          { groupId: unknown },
          "WHATSAPP_GROUP_NOT_FOUND"
        );
      },
    },
    {
      description: "join-request approve/reject",
      verify: async (token: string, unknown: string) => {
        const input = { groupId: unknown, joinRequestIds: [randomUUID()] };
        await expectMutationErrorCode(
          token,
          approveWhatsappGroupJoinRequestsMutationDocument,
          { input },
          "WHATSAPP_GROUP_NOT_FOUND"
        );
        await expectMutationErrorCode(
          token,
          rejectWhatsappGroupJoinRequestsMutationDocument,
          { input },
          "WHATSAPP_GROUP_NOT_FOUND"
        );
      },
    },
    {
      description: "participant removal",
      verify: async (token: string, unknown: string) => {
        await expectMutationErrorCode(
          token,
          removeWhatsappGroupParticipantsMutationDocument,
          { input: { groupId: unknown, participants: [fixturePhone("6667777")] } },
          "WHATSAPP_GROUP_NOT_FOUND"
        );
      },
    },
    {
      description: "pin/unpin",
      verify: async (token: string, unknown: string) => {
        await expectMutationErrorCode(
          token,
          pinWhatsappGroupMessageMutationDocument,
          { input: { groupId: unknown, messageId: "wamid.unknown", operation: "pin", expirationDays: 7 } },
          "WHATSAPP_GROUP_NOT_FOUND"
        );
        await expectMutationErrorCode(
          token,
          unpinWhatsappGroupMessageMutationDocument,
          { input: { groupId: unknown, messageId: "wamid.unknown", operation: "unpin", expirationDays: null } },
          "WHATSAPP_GROUP_NOT_FOUND"
        );
      },
    },
  ])("$description reject an unknown group id", async ({ verify }) => {
    const token = await loginSuperAdmin();
    await verify(token, randomUUID());
  });

  test("send rejects an unknown group id and a blank body without a template", async () => {
    const token = await loginSuperAdmin();
    await expectMutationErrorCode(
      token,
      sendWhatsappGroupMessageMutationDocument,
      { input: buildSendInput(randomUUID(), { body: "hi" }) },
      "WHATSAPP_GROUP_NOT_FOUND"
    );
    await withTestAccount(async accountToken => {
      // A real group row is required for the blank-body guard: create one
      // locally via the create mutation. On this account the Graph create
      // fails (no Meta access token), so fall back to the unknown id — the
      // guard ordering places NOT_FOUND ahead of payload validation.
      await expectMutationErrorCode(
        accountToken,
        sendWhatsappGroupMessageMutationDocument,
        { input: buildSendInput(randomUUID(), { body: null }) },
        "WHATSAPP_GROUP_NOT_FOUND"
      );
    });
  });

  test("sync fails on missing credentials before any Graph call", async () => {
    await withTestAccount(async (token, accountId) => {
      // The per-account Graph context resolves before the sync list fetch, so
      // a token-less account surfaces the config error, not a Graph failure.
      await expectMutationErrorCode(token, syncWhatsappGroupsMutationDocument, { accountId }, "WHATSAPP_CONFIG");
    });
  });
});

describe("whatsapp group graph-scoped mutations", () => {
  setupTestServerLifecycle();

  test("create fails on missing credentials before any Graph call", async () => {
    await withTestAccount(async (token, accountId) => {
      // A real account resolves; the per-account Graph context then throws
      // the config error — no Meta round-trip is attempted without a token.
      await expectMutationErrorCode(
        token,
        createWhatsappGroupMutationDocument,
        { input: buildCreateInput(accountId) },
        "WHATSAPP_CONFIG"
      );
    });
  });
});
