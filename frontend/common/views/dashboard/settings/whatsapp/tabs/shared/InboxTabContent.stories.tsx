import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { WhatsappAccountPurpose, WhatsappSyncStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { InboxTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/InboxTabContent";
import type {
  WhatsappConversationRow,
  WhatsappInboxAccountOption,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import { whatsappInboxEn } from "@/shared/locale/en/whatsappInbox";

const accounts: readonly WhatsappInboxAccountOption[] = [
  { id: "wacc-1", label: "+966 55 123 4567", syncStatus: WhatsappSyncStatus.Complete },
  { id: "wacc-2", label: "+966 55 765 4321", syncStatus: WhatsappSyncStatus.Failed },
];

function conversation(
  overrides: Partial<WhatsappConversationRow> & Pick<WhatsappConversationRow, "id">
): WhatsappConversationRow {
  return {
    accountId: "wacc-1",
    waId: "966509876543",
    userId: null,
    username: null,
    displayName: "Layla Hassan",
    lastMessageAt: new Date().toISOString(),
    lastMessagePreview: "Reminder: Quran class today at 16:00.",
    accountPurpose: WhatsappAccountPurpose.General,
    createdAt: "2026-08-20T09:00:00.000Z",
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const conversations: WhatsappConversationRow[] = [
  conversation({ id: "conv-1" }),
  conversation({
    id: "conv-2",
    displayName: "Omar Nasser",
    waId: "966500111222",
    accountId: "wacc-2",
    lastMessagePreview: "Thank you, see you tomorrow.",
  }),
];

function ConversationList({ rows }: Readonly<{ rows: readonly WhatsappConversationRow[] }>) {
  return (
    <Stack spacing={1}>
      {rows.map(row => (
        <Typography key={row.id} variant="bodyMd">
          {row.displayName ?? row.waId} — {row.lastMessagePreview}
        </Typography>
      ))}
    </Stack>
  );
}

const meta = {
  title: "Views/dashboard/settings/whatsapp/tabs/shared/InboxTabContent",
  component: InboxTabContent,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    labels: whatsappInboxEn,
    accounts,
    accountFilter: null,
    search: "",
    queryError: false,
    conversations,
    loading: false,
    historyDeclined: false,
    totalCount: conversations.length,
    page: 1,
    pageSize: 20,
    selectedConversation: null,
    threadMessages: [],
    threadLoading: false,
    threadError: false,
    onAccountFilterChange: fn(),
    onSearchChange: fn(),
    onPageChange: fn(),
    onSelectConversation: fn(),
    onCloseThread: fn(),
    onRetry: fn(),
    formatTimestamp: (iso: string | null) => iso ?? "",
    purposeLabel: (purpose: string | null) => purpose ?? "",
  },
} satisfies Meta<typeof InboxTabContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithConversations: Story = {
  name: "List",
  render: args => (
    <InboxTabContent {...args}>
      <ConversationList rows={args.conversations} />
    </InboxTabContent>
  ),
};

export const Empty: Story = {
  name: "Empty inbox",
  args: { conversations: [], totalCount: 0 },
};

export const DeclinedHistorySyncBanner: Story = {
  name: "Declined history-sync banner (filtered number, no conversations)",
  args: {
    conversations: [],
    totalCount: 0,
    historyDeclined: true,
    accountFilter: "wacc-2",
  },
};

export const QueryError: Story = {
  name: "Load error with retry",
  args: { queryError: true, conversations: [], totalCount: 0 },
};
