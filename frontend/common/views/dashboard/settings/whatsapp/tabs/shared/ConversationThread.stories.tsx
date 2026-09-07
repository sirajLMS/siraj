import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { WhatsappMessageDirection } from "@/frontend/common/graphql/generated/gql/graphql";
import { ConversationThread } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/ConversationThread";
import type { WhatsappMessageRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import { whatsappInboxEn } from "@/shared/locale/en/whatsappInbox";

function at(daysAgo: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function message(overrides: Partial<WhatsappMessageRow> & Pick<WhatsappMessageRow, "id">): WhatsappMessageRow {
  return {
    conversationId: "conv-1",
    accountId: "wacc-1",
    wamid: null,
    direction: WhatsappMessageDirection.Inbound,
    type: "text",
    content: "",
    status: "DELIVERED",
    mediaPlaceholder: false,
    mediaId: null,
    mediaMime: null,
    mediaSha256: null,
    phase: null,
    chunkOrder: null,
    sentAt: null,
    editedAt: null,
    revokedAt: null,
    createdAt: at(1, 9, 0),
    ...overrides,
  };
}

const formatTimestamp = (iso: string | null) =>
  iso === null ? "" : new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));

const meta = {
  title: "Views/dashboard/settings/whatsapp/tabs/shared/ConversationThread",
  component: ConversationThread,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    title: "Layla Hassan",
    subtitle: "+966 50 987 6543",
    labels: whatsappInboxEn,
    loading: false,
    formatTimestamp,
  },
} satisfies Meta<typeof ConversationThread>;

export default meta;
type Story = StoryObj<typeof meta>;

const mixedMessages: WhatsappMessageRow[] = [
  message({
    id: "m-1",
    direction: WhatsappMessageDirection.Inbound,
    content: "As-salamu alaykum, is there a seat in the Saturday Quran circle?",
    sentAt: at(1, 18, 4),
  }),
  message({
    id: "m-2",
    direction: WhatsappMessageDirection.Echo,
    content: "Wa alaykum as-salam! Yes — the 10:00 circle still has two seats.",
    sentAt: at(1, 18, 7),
    editedAt: at(1, 18, 9),
  }),
  message({
    id: "m-3",
    direction: WhatsappMessageDirection.ApiOutbound,
    content: "Reminder: your child Layla has Quran class today at 16:00.",
    sentAt: at(0, 9, 30),
  }),
  message({
    id: "m-4",
    direction: WhatsappMessageDirection.Inbound,
    content: "You cannot see this anymore",
    revokedAt: at(0, 10, 2),
    sentAt: at(0, 10, 1),
  }),
  message({
    id: "m-5",
    direction: WhatsappMessageDirection.Inbound,
    type: "image",
    content: null,
    mediaPlaceholder: true,
    sentAt: at(0, 10, 5),
  }),
];

export const MixedThread: Story = {
  name: "Mixed directions, edited / revoked / media-expired, day separators",
  args: { messages: mixedMessages, onBack: fn() },
};

export const Loading: Story = {
  args: { messages: [], loading: true },
};

export const Empty: Story = {
  args: { messages: [] },
};
