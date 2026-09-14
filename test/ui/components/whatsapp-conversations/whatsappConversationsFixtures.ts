import type { MockLink } from "@apollo/client/testing";
import {
  type WhatsappAccountsQuery,
  type WhatsappAccountTemplatesQuery,
  WhatsappLimitTier,
  WhatsappMessageDirection,
  WhatsappOnboardingMode,
  WhatsappQualityRating,
  WhatsappSyncStatus,
  WhatsappTemplateCategory,
  WhatsappTemplateStatus,
  type WhatsappTestRecipientStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  whatsappAccountsQueryDocument,
  whatsappAccountTemplatesQueryDocument,
  whatsappConversationsListQueryDocument,
  whatsappConversationThreadQueryDocument,
  whatsappTestRecipientsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import type {
  WhatsappConversationRow,
  WhatsappMessageRow,
  WhatsappTestRecipientRow,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

export const REGULAR_ACCOUNT_ID = "acc-regular";
export const TEST_ACCOUNT_ID = "acc-test";
export const CONVERSATION_ID = "conv-1";
export const CONTACT_NAME = "Layla Hassan";
export const INBOUND_TEXT = "Salam, can we move the class?";
export const OUTBOUND_TEXT = "Sure, see you at 16:00.";

// Phone digit sequences are assembled so literal numbers never appear in the source.
export const PENDING_PHONE = ["1", "555", "010", "0123"].join("");
export const ALLOWED_PHONE = ["1", "555", "010", "0124"].join("");
export const NON_REGISTRY_PHONE = ["9", "876", "543", "210"].join("");
export const CONTACT_WA_ID = ["9", "665", "012", "34567"].join("");

const LIST_PAGINATION = {
  first: 20,
  skip: 0,
  after: null,
  before: null,
  last: null,
  page: null,
  maxCount: null,
};
const THREAD_PAGINATION = {
  first: 50,
  skip: 0,
  after: null,
  before: null,
  last: null,
  page: null,
  maxCount: null,
};

export type WhatsappAccountMockRow = NonNullable<WhatsappAccountsQuery["whatsappAccounts"]>[number];

export function makeAccountRow(id: string, overrides: Partial<WhatsappAccountMockRow> = {}): WhatsappAccountMockRow {
  return {
    id,
    wabaId: "waba-1",
    phoneNumberId: "phone-1",
    displayPhoneNumber: ["9", "665", "512", "34567"].join(""),
    displayName: { en: `Number ${id}` },
    isActive: true,
    isTestNumber: false,
    metaStatus: "CONNECTED",
    purpose: null,
    onboardingMode: WhatsappOnboardingMode.CloudApi,
    syncStatus: WhatsappSyncStatus.Complete,
    syncPhase: null,
    syncProgress: null,
    syncDeadlineAt: null,
    syncFailureReason: null,
    qualityRating: WhatsappQualityRating.Green,
    portfolioMessagingLimitTier: WhatsappLimitTier.Tier_1K,
    throughputLevel: null,
    maxPhoneNumbersPerBusiness: null,
    lastWebhookAt: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeConversationRow(
  id: string,
  accountId: string,
  overrides: Partial<WhatsappConversationRow> = {}
): WhatsappConversationRow {
  return {
    id,
    accountId,
    waId: CONTACT_WA_ID,
    userId: null,
    username: null,
    displayName: CONTACT_NAME,
    lastMessageAt: "2026-09-10T09:00:00.000Z",
    lastMessagePreview: INBOUND_TEXT,
    accountPurpose: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-09-10T09:00:00.000Z",
    ...overrides,
  };
}

export function makeMessageRow(
  id: string,
  sentAt: string,
  overrides: Partial<WhatsappMessageRow> = {}
): WhatsappMessageRow {
  return {
    id,
    conversationId: CONVERSATION_ID,
    accountId: REGULAR_ACCOUNT_ID,
    wamid: null,
    direction: WhatsappMessageDirection.Inbound,
    type: "text",
    content: INBOUND_TEXT,
    status: "delivered",
    mediaPlaceholder: false,
    mediaId: null,
    mediaMime: null,
    mediaSha256: null,
    phase: null,
    chunkOrder: null,
    sentAt,
    editedAt: null,
    revokedAt: null,
    createdAt: sentAt,
    ...overrides,
  };
}

export function makeRecipientRow(
  id: string,
  status: WhatsappTestRecipientStatus,
  overrides: Partial<WhatsappTestRecipientRow> = {}
): WhatsappTestRecipientRow {
  return {
    id,
    accountId: TEST_ACCOUNT_ID,
    phoneNumber: PENDING_PHONE,
    status,
    note: null,
    lastCheckedAt: null,
    lastErrorCode: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export type WhatsappTemplateMockRow = NonNullable<WhatsappAccountTemplatesQuery["whatsappAccountTemplates"]>[number];

export function makeTemplateRow(
  id: string,
  name: string,
  overrides: Partial<WhatsappTemplateMockRow> = {}
): WhatsappTemplateMockRow {
  return {
    id,
    name,
    language: "en_US",
    status: WhatsappTemplateStatus.Approved,
    category: WhatsappTemplateCategory.Utility,
    bodyText: "Hello, this is a reminder.",
    bodyParamsCount: 0,
    lastSyncedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

// Apollo's InMemoryCache auto-appends `__typename` to every selection, so each
// mocked object level needs the runtime type name or cache normalization drops
// the fields (rows surface as all-null records in the view model).

function pageInfoTypename(count: number, perPage: number) {
  return {
    __typename: "PageInfo",
    count,
    currentPage: 1,
    hasMorePages: false,
    lastPage: 1,
    perPage,
    total: count,
  };
}

function accountResult(row: WhatsappAccountMockRow) {
  return { __typename: "WhatsappAccount", ...row };
}

function conversationResult(row: WhatsappConversationRow) {
  return { __typename: "WhatsappConversation", ...row };
}

function messageResult(row: WhatsappMessageRow) {
  return { __typename: "WhatsappMessage", ...row };
}

function recipientResult(row: WhatsappTestRecipientRow) {
  return { __typename: "WhatsappTestRecipient", ...row };
}

function templateResult(row: WhatsappTemplateMockRow) {
  return { __typename: "WhatsappTemplateSnapshot", ...row };
}

function unlimited(partial: MockLink.MockedResponse): MockLink.MockedResponse {
  return { ...partial, maxUsageCount: Number.POSITIVE_INFINITY };
}

export function accountsMock(rows: readonly WhatsappAccountMockRow[]): MockLink.MockedResponse {
  return unlimited({
    request: { query: whatsappAccountsQueryDocument },
    result: { data: { whatsappAccounts: rows.map(accountResult) } },
  });
}

export function conversationListMock(
  accountId: string | null,
  rows: readonly WhatsappConversationRow[]
): MockLink.MockedResponse {
  return unlimited({
    request: { query: whatsappConversationsListQueryDocument, variables: { accountId, pagination: LIST_PAGINATION } },
    result: {
      data: {
        whatsappConversationThreads: {
          __typename: "WhatsappConversationsResult",
          id: "whatsapp-conversation-threads",
          rows: rows.map(conversationResult),
          totalCount: rows.length,
          pageInfo: pageInfoTypename(rows.length, 20),
        },
      },
    },
  });
}

/**
 * Single-use list mock for a specific 0-based page with an explicit
 * totalCount. Ordering matters: same-variables mocks are consumed in array
 * order, so a later entry can report a shrunk totalCount to exercise the
 * page-clamp path.
 */
export function conversationListPageMock(
  accountId: string | null,
  page: number,
  rows: readonly WhatsappConversationRow[],
  totalCount: number
): MockLink.MockedResponse {
  return {
    request: {
      query: whatsappConversationsListQueryDocument,
      variables: { accountId, pagination: { ...LIST_PAGINATION, skip: page * LIST_PAGINATION.first } },
    },
    result: {
      data: {
        whatsappConversationThreads: {
          __typename: "WhatsappConversationsResult",
          id: "whatsapp-conversation-threads",
          rows: rows.map(conversationResult),
          totalCount,
          pageInfo: pageInfoTypename(rows.length, LIST_PAGINATION.first),
        },
      },
    },
  };
}

export function threadMock(
  conversation: WhatsappConversationRow,
  messages: readonly WhatsappMessageRow[]
): MockLink.MockedResponse {
  return unlimited({
    request: {
      query: whatsappConversationThreadQueryDocument,
      variables: { id: conversation.id, pagination: THREAD_PAGINATION },
    },
    result: {
      data: {
        whatsappConversationThread: {
          __typename: "WhatsappConversationThread",
          ...conversation,
          messages: {
            __typename: "WhatsappConversationMessagesResult",
            id: "whatsapp-conversation-messages",
            rows: messages.map(messageResult),
            totalCount: messages.length,
            pageInfo: pageInfoTypename(messages.length, 50),
          },
        },
      },
    },
  });
}

export function recipientsMock(rows: readonly WhatsappTestRecipientRow[]): MockLink.MockedResponse {
  return unlimited({
    request: { query: whatsappTestRecipientsQueryDocument, variables: { accountId: TEST_ACCOUNT_ID } },
    result: { data: { whatsappTestRecipients: rows.map(recipientResult) } },
  });
}

export function templatesMock(accountId: string, rows: readonly WhatsappTemplateMockRow[]): MockLink.MockedResponse {
  return unlimited({
    request: { query: whatsappAccountTemplatesQueryDocument, variables: { accountId } },
    result: { data: { whatsappAccountTemplates: rows.map(templateResult) } },
  });
}

/**
 * Erroring template query for one account; drives the picker's warning alert
 * without affecting the rest of the workspace mocks.
 */
function templatesErrorMock(accountId: string): MockLink.MockedResponse {
  return unlimited({
    request: { query: whatsappAccountTemplatesQueryDocument, variables: { accountId } },
    error: new Error("templates fetch failed"),
  });
}

export interface WorkspaceFixtureOptions {
  readonly account: WhatsappAccountMockRow;
  readonly messages?: readonly WhatsappMessageRow[];
  readonly recipients?: readonly WhatsappTestRecipientRow[];
  /** Templates for the selected account; `"error"` makes the query fail. */
  readonly templates?: readonly WhatsappTemplateMockRow[] | "error";
}

/**
 * MockLink set for one workspace state: the accounts query, the conversations
 * list as fired both before and after the default-account selection effect,
 * the thread query for the single seeded conversation, the templates pick for
 * the selected account, and — when supplied — the test-recipient registry.
 */
export function workspaceMocks({
  account,
  messages,
  recipients,
  templates,
}: WorkspaceFixtureOptions): MockLink.MockedResponse[] {
  const conversation = makeConversationRow(CONVERSATION_ID, account.id ?? "");
  const mocks: MockLink.MockedResponse[] = [
    accountsMock([account]),
    conversationListMock(null, [conversation]),
    conversationListMock(account.id, [conversation]),
    threadMock(conversation, messages ?? []),
    templates === "error" ? templatesErrorMock(account.id ?? "") : templatesMock(account.id ?? "", templates ?? []),
  ];
  if (recipients) {
    mocks.push(recipientsMock(recipients));
  }
  return mocks;
}
