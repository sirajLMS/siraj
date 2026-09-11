import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { type ReactNode, useEffect, useReducer } from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import {
  AppPermission,
  type WhatsappAccountsQuery,
  WhatsappLimitTier,
  WhatsappMessageDirection,
  WhatsappOnboardingMode,
  WhatsappQualityRating,
  WhatsappSyncStatus,
  WhatsappTestRecipientStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  whatsappAccountsQueryDocument,
  whatsappConversationsListQueryDocument,
  whatsappConversationThreadQueryDocument,
  whatsappTestRecipientsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { seedPermissions } from "@/frontend/common/stories";
import { WhatsappConversationsContainer } from "@/frontend/common/views/dashboard/whatsapp/conversations/WhatsappConversationsContainer";
import { whatsappConversationsEn } from "@/shared/locale/en/whatsappConversations";

const REGULAR_ACCOUNT_ID = "acc-regular";
const TEST_ACCOUNT_ID = "acc-test";
const CONVERSATION_ID = "conv-1";
const REGISTRY_PHONE = ["1", "555", "010", "0123"].join("");

const LIST_PAGINATION = { first: 20, skip: 0, after: null, before: null, last: null, page: null, maxCount: null };
const THREAD_PAGINATION = { first: 50, skip: 0, after: null, before: null, last: null, page: null, maxCount: null };

type WhatsappAccountMockRow = NonNullable<WhatsappAccountsQuery["whatsappAccounts"]>[number];

function makeAccount(id: string, overrides: Partial<WhatsappAccountMockRow> = {}): WhatsappAccountMockRow {
  return {
    id,
    wabaId: "waba-1",
    phoneNumberId: "phone-1",
    displayPhoneNumber: ["966", "55", "123", "4567"].join(""),
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

function conversationRow(id: string, accountId: string) {
  return {
    __typename: "WhatsappConversation",
    id,
    accountId,
    waId: "966501234567",
    userId: null,
    username: null,
    displayName: "Layla Hassan",
    lastMessageAt: new Date().toISOString(),
    lastMessagePreview: "Reminder: class moved to 16:00.",
    accountPurpose: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
  };
}

function messageRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    __typename: "WhatsappMessage",
    id,
    conversationId: CONVERSATION_ID,
    accountId: REGULAR_ACCOUNT_ID,
    wamid: null,
    direction: WhatsappMessageDirection.Inbound,
    type: "text",
    content: "Salam, can we move the class?",
    status: "delivered",
    mediaPlaceholder: false,
    mediaId: null,
    mediaMime: null,
    mediaSha256: null,
    phase: null,
    chunkOrder: null,
    sentAt: new Date().toISOString(),
    editedAt: null,
    revokedAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function recipientRow(id: string) {
  return {
    __typename: "WhatsappTestRecipient",
    id,
    accountId: TEST_ACCOUNT_ID,
    phoneNumber: REGISTRY_PHONE,
    status: WhatsappTestRecipientStatus.Pending,
    note: null,
    lastCheckedAt: null,
    lastErrorCode: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
}

function listMock(accountId: string | null, rows: readonly unknown[]): MockLink.MockedResponse {
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

function accountsMock(rows: readonly WhatsappAccountMockRow[]): MockLink.MockedResponse {
  return {
    request: { query: whatsappAccountsQueryDocument },
    result: { data: { whatsappAccounts: rows.map(row => ({ __typename: "WhatsappAccount", ...row })) } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

const regularAccount = makeAccount(REGULAR_ACCOUNT_ID);
const testAccount = makeAccount(TEST_ACCOUNT_ID, { isTestNumber: true, displayName: { en: "Test number" } });

/**
 * Mock set for one workspace state: accounts, the list fired before and after
 * the default-account selection effect, and the opened-thread query. The
 * recipients query only fires while a test number is selected.
 */
function workspaceMocks(account: WhatsappAccountMockRow, includeRecipients: boolean): MockLink.MockedResponse[] {
  const conversation = conversationRow(CONVERSATION_ID, account.id ?? "");
  const mocks: MockLink.MockedResponse[] = [
    accountsMock([account]),
    listMock(null, [conversation]),
    listMock(account.id, [conversation]),
    threadMock(),
  ];
  if (includeRecipients) {
    mocks.push(recipientsMock());
  }
  return mocks;
}

interface ConversationsStoryProvidersProps {
  readonly permissions: readonly AppPermission[];
  readonly mocks: readonly MockLink.MockedResponse[];
  readonly children: ReactNode;
}

/**
 * Seeds the workspace permissions and mounts the container against mocked
 * GraphQL documents. The re-seed on mount wins over the Storybook-wide user
 * store seed that the preview decorator applies after the first paint.
 */
function ConversationsStoryProviders({ permissions, mocks, children }: Readonly<ConversationsStoryProvidersProps>) {
  const [, forcePaint] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    const timer = setTimeout(() => {
      seedPermissions([...permissions]);
      forcePaint();
    }, 0);
    return () => clearTimeout(timer);
  }, [permissions]);
  return <MockedProvider mocks={[...mocks]}>{children}</MockedProvider>;
}

const meta = {
  title: "Views/dashboard/whatsapp/conversations/WhatsappConversationsContainer",
  component: WhatsappConversationsContainer,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  // Play functions assert English copy; pin the locale global so they hold under
  // the preview's default `ar` locale.
  globals: { locale: "en" },
} satisfies Meta<typeof WhatsappConversationsContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const MANAGE_PERMISSIONS = [AppPermission.WhatsappConversationsView, AppPermission.WhatsappConversationsManage];

export const HappyPath: Story = {
  name: "Happy path (account + conversations + thread)",
  decorators: [
    Story => (
      <ConversationsStoryProviders permissions={MANAGE_PERMISSIONS} mocks={workspaceMocks(regularAccount, false)}>
        <Story />
      </ConversationsStoryProviders>
    ),
  ],
  play: async ({ canvas }) => {
    const row = await canvas.findByRole("button", { name: /Layla Hassan/ }, { timeout: 5000 });
    await userEvent.click(row);
    await canvas.findByText("Salam, can we move the class?", undefined, { timeout: 5000 });
  },
};

export const NoAccounts: Story = {
  name: "Empty (no accounts onboarded)",
  decorators: [
    Story => (
      <ConversationsStoryProviders permissions={MANAGE_PERMISSIONS} mocks={[accountsMock([]), listMock(null, [])]}>
        <Story />
      </ConversationsStoryProviders>
    ),
  ],
  play: async ({ canvas }) => {
    await canvas.findByText(whatsappConversationsEn.noAccountsTitle);
  },
};

export const NewConversation: Story = {
  name: "New conversation initiation (template-locked composer)",
  decorators: [
    Story => (
      <ConversationsStoryProviders
        permissions={MANAGE_PERMISSIONS}
        mocks={[accountsMock([regularAccount]), listMock(null, []), listMock(REGULAR_ACCOUNT_ID, [])]}
      >
        <Story />
      </ConversationsStoryProviders>
    ),
  ],
  play: async ({ canvas }) => {
    const action = await canvas.findByRole(
      "button",
      { name: whatsappConversationsEn.newConversation },
      { timeout: 5000 }
    );
    // The preview-wide user-store seed briefly locks the header while the
    // story's permission re-seed settles; wait until the action is interactive.
    await waitFor(() => {
      if (!(action instanceof HTMLButtonElement) || !action.checkVisibility() || action.disabled) {
        throw new Error("New-conversation action is not interactive yet");
      }
    });
    await userEvent.click(action);
    await canvas.findByText(whatsappConversationsEn.newConversationTitle);
    await canvas.findByText(whatsappConversationsEn.newConversationSubtitle);
    await canvas.findByPlaceholderText(whatsappConversationsEn.templateNamePlaceholder);
  },
};

export const TestNumberAccount: Story = {
  name: "Test number (banner + recipient registry)",
  decorators: [
    Story => (
      <ConversationsStoryProviders permissions={MANAGE_PERMISSIONS} mocks={workspaceMocks(testAccount, true)}>
        <Story />
      </ConversationsStoryProviders>
    ),
  ],
  play: async ({ canvas }) => {
    await canvas.findByText(whatsappConversationsEn.testNumberBannerTitle);
    await canvas.findByText(whatsappConversationsEn.recipientsTitle);
    await canvas.findByText(REGISTRY_PHONE);
  },
};

export const ViewOnlyPermission: Story = {
  name: "View-only permission (composer locked)",
  decorators: [
    Story => (
      <ConversationsStoryProviders
        permissions={[AppPermission.WhatsappConversationsView]}
        mocks={workspaceMocks(testAccount, true)}
      >
        <Story />
      </ConversationsStoryProviders>
    ),
  ],
  play: async ({ canvas }) => {
    // Covers the read-only chrome; the disabled send button itself is asserted
    // deterministically by the container component test (Happy DOM).
    await canvas.findByText(whatsappConversationsEn.readOnlyBadge, undefined, { timeout: 5000 });
    await expect(canvas.queryByRole("button", { name: whatsappConversationsEn.recipientAdd })).toBeNull();
    await expect(canvas.queryByRole("button", { name: whatsappConversationsEn.recipientVerify })).toBeNull();
  },
};
