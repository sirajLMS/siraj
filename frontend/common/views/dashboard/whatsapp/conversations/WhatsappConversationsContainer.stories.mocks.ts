import type { MockLink } from "@apollo/client/testing";
import { WhatsappMessageDirection } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  whatsappAccountsQueryDocument,
  whatsappAccountTemplatesQueryDocument,
  whatsappConversationsListQueryDocument,
  whatsappConversationThreadQueryDocument,
  whatsappTestRecipientsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  CONVERSATION_ID,
  conversationRow,
  messageRow,
  REGULAR_ACCOUNT_ID,
  recipientRow,
  TEST_ACCOUNT_ID,
  templateRow,
  type WhatsappAccountMockRow,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/WhatsappConversationsContainer.stories.fixtures";

const LIST_PAGINATION = { first: 20, skip: 0, after: null, before: null, last: null, page: null, maxCount: null };
const THREAD_PAGINATION = { first: 50, skip: 0, after: null, before: null, last: null, page: null, maxCount: null };

export function listMock(accountId: string | null, rows: readonly unknown[]): MockLink.MockedResponse {
  return {
    request: { query: whatsappConversationsListQueryDocument, variables: { accountId, pagination: LIST_PAGINATION } },
    result: {
      data: {
        whatsappConversationThreads: {
          __typename: "WhatsappConversationsResult",
          id: "whatsapp-conversation-threads",
          rows: [...rows],
          totalCount: rows.length,
          pageInfo: {
            __typename: "PageInfo",
            count: rows.length,
            currentPage: 1,
            hasMorePages: false,
            lastPage: 1,
            perPage: 20,
            total: rows.length,
          },
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

function threadMock(): MockLink.MockedResponse {
  return {
    request: {
      query: whatsappConversationThreadQueryDocument,
      variables: { id: CONVERSATION_ID, pagination: THREAD_PAGINATION },
    },
    result: {
      data: {
        whatsappConversationThread: {
          ...conversationRow(CONVERSATION_ID, REGULAR_ACCOUNT_ID),
          __typename: "WhatsappConversationThread",
          messages: {
            __typename: "WhatsappConversationMessagesResult",
            id: "whatsapp-conversation-messages",
            rows: [
              messageRow("msg-1"),
              messageRow("msg-2", {
                direction: WhatsappMessageDirection.ApiOutbound,
                content: "Sure, see you at 16:00.",
                accountId: REGULAR_ACCOUNT_ID,
              }),
            ],
            totalCount: 2,
            pageInfo: {
              __typename: "PageInfo",
              count: 2,
              currentPage: 1,
              hasMorePages: false,
              lastPage: 1,
              perPage: 50,
              total: 2,
            },
          },
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

function recipientsMock(): MockLink.MockedResponse {
  return {
    request: { query: whatsappTestRecipientsQueryDocument, variables: { accountId: TEST_ACCOUNT_ID } },
    result: { data: { whatsappTestRecipients: [recipientRow("rcp-1")] } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

export function templatesMock(accountId: string): MockLink.MockedResponse {
  return {
    request: { query: whatsappAccountTemplatesQueryDocument, variables: { accountId } },
    result: {
      data: {
        whatsappAccountTemplates: [
          { __typename: "WhatsappTemplateSnapshot", ...templateRow("tpl-1", "hello_world", 0) },
          { __typename: "WhatsappTemplateSnapshot", ...templateRow("tpl-2", "event_reminder", 0) },
          { __typename: "WhatsappTemplateSnapshot", ...templateRow("tpl-3", "order_update", 1) },
        ],
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

export function accountsMock(rows: readonly WhatsappAccountMockRow[]): MockLink.MockedResponse {
  return {
    request: { query: whatsappAccountsQueryDocument },
    result: { data: { whatsappAccounts: rows.map(row => ({ __typename: "WhatsappAccount", ...row })) } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

/**
 * Mock set for one workspace state: accounts, the list fired before and after
 * the default-account selection effect, the opened-thread query, and the
 * templates pick. The recipients query only fires while a test number is
 * selected.
 */
export function workspaceMocks(account: WhatsappAccountMockRow, includeRecipients: boolean): MockLink.MockedResponse[] {
  const conversation = conversationRow(CONVERSATION_ID, account.id ?? "");
  const mocks: MockLink.MockedResponse[] = [
    accountsMock([account]),
    listMock(null, [conversation]),
    listMock(account.id, [conversation]),
    threadMock(),
    templatesMock(account.id ?? ""),
  ];
  if (includeRecipients) {
    mocks.push(recipientsMock());
  }
  return mocks;
}
