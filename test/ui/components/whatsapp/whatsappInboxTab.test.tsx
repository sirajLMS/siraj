import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { WhatsappAccountPurpose, WhatsappMessageDirection } from "@/frontend/common/graphql/generated/gql/graphql";
import { ConversationThread } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/ConversationThread";
import type {
  WhatsappConversationRow,
  WhatsappInboxViewModel,
  WhatsappMessageRow,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const en = readTranslation(Translation.WhatsappInbox, "en");
const ar = readTranslation(Translation.WhatsappInbox, "ar");

function makeConversationRow(id: string, overrides: Partial<WhatsappConversationRow> = {}): WhatsappConversationRow {
  return {
    id,
    accountId: "a1",
    waId: "+2010",
    userId: null,
    username: null,
    displayName: `Name ${id}`,
    lastMessageAt: "2026-01-01T10:00:00.000Z",
    lastMessagePreview: `p${id}`,
    accountPurpose: WhatsappAccountPurpose.Students,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeMessageRow(id: string, overrides: Partial<WhatsappMessageRow> = {}): WhatsappMessageRow {
  return {
    id,
    conversationId: "c1",
    accountId: "a1",
    wamid: null,
    direction: WhatsappMessageDirection.Inbound,
    type: "text",
    content: `m${id}`,
    status: "delivered",
    mediaPlaceholder: false,
    mediaId: null,
    mediaMime: null,
    mediaSha256: null,
    phase: null,
    chunkOrder: null,
    sentAt: "2026-01-01T10:00:00.000Z",
    editedAt: null,
    revokedAt: null,
    createdAt: "2026-01-01T10:00:00.000Z",
    ...overrides,
  };
}
const noop = () => {};

function makeInboxVm(overrides: Partial<WhatsappInboxViewModel> = {}): WhatsappInboxViewModel {
  return {
    labels: en,
    accounts: [{ id: "a1", label: "+2010", syncStatus: null }],
    conversations: [],
    totalCount: 0,
    loading: false,
    queryError: false,
    historyDeclined: false,
    accountFilter: null,
    search: "",
    page: 1,
    pageSize: 20,
    selectedConversation: null,
    threadMessages: [],
    threadLoading: false,
    threadError: false,
    onAccountFilterChange: noop,
    onSearchChange: noop,
    onPageChange: noop,
    onSelectConversation: noop,
    onCloseThread: noop,
    onRetry: noop,
    formatTimestamp: iso => iso ?? "",
    purposeLabel: purpose => (typeof purpose === "string" ? purpose : ""),
    ...overrides,
  };
}

describe("ConversationThread — message rendering", () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  test("renders text bubbles with direction markers", () => {
    renderWithWrapper(
      <ConversationThread
        title="n"
        subtitle="s"
        labels={en}
        loading={false}
        formatTimestamp={iso => iso ?? ""}
        messages={[makeMessageRow("m1"), makeMessageRow("m2", { direction: WhatsappMessageDirection.Echo })]}
      />,
      { locale: "en" }
    );
    expect(screen.getByText("mm1")).toBeTruthy();
    expect(screen.getByText("mm2")).toBeTruthy();
    expect(screen.getByText(en.directionInbound)).toBeTruthy();
    expect(screen.getByText(en.directionEcho)).toBeTruthy();
  });

  test("renders revoked marker, edited marker, and media-expired placeholder", () => {
    renderWithWrapper(
      <ConversationThread
        title="n"
        subtitle="s"
        labels={en}
        loading={false}
        formatTimestamp={iso => iso ?? ""}
        messages={[
          makeMessageRow("m1", { revokedAt: "2026-01-02T00:00:00.000Z" }),
          makeMessageRow("m2", { editedAt: "2026-01-02T00:00:00.000Z" }),
          makeMessageRow("m3", { content: null, mediaPlaceholder: true }),
        ]}
      />,
      { locale: "en" }
    );
    expect(screen.getByText(en.messageRevoked)).toBeTruthy();
    expect(screen.getByText(new RegExp(en.editedLabel))).toBeTruthy();
    expect(screen.getByText(en.mediaExpired)).toBeTruthy();
  });

  test("renders empty-thread copy and read-only notice", () => {
    renderWithWrapper(
      <ConversationThread
        title="n"
        subtitle="s"
        labels={en}
        loading={false}
        formatTimestamp={iso => iso ?? ""}
        messages={[]}
      />,
      { locale: "en" }
    );
    expect(screen.getByText(en.threadMessagesEmpty)).toBeTruthy();
    expect(screen.getByText(en.readOnlyNotice)).toBeTruthy();
  });
});

const { InboxTabMobile } = await import("@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/InboxTab.mobile");
const { InboxTabDesktop } = await import("@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/InboxTab.desktop");

async function renderTab(viewModel: WhatsappInboxViewModel, tier: "mobile" | "desktop", locale: "en" | "ar" = "en") {
  const Component = tier === "mobile" ? InboxTabMobile : InboxTabDesktop;
  return renderWithWrapper(<Component {...viewModel} />, { locale });
}

async function renderSelectedThreadTab(tier: "mobile" | "desktop") {
  const conversation = makeConversationRow("c1");
  return renderTab(
    makeInboxVm({
      conversations: [conversation],
      totalCount: 1,
      selectedConversation: conversation,
      threadMessages: [makeMessageRow("m1")],
    }),
    tier
  );
}

describe("InboxTabMobile — list and empty state", () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  test("renders conversation cards from the view model", async () => {
    await renderTab(makeInboxVm({ conversations: [makeConversationRow("c1")] }), "mobile");
    expect(await screen.findByText("Name c1")).toBeTruthy();
    expect(screen.getByText("pc1")).toBeTruthy();
  });

  test("renders the empty-state message when no conversations", async () => {
    await renderTab(makeInboxVm(), "mobile");
    await waitFor(() => {
      expect(screen.getByText(en.noConversations)).toBeTruthy();
    });
    expect(screen.getByText(en.emptyStateDescription)).toBeTruthy();
    expect(screen.getByText(en.readOnlyBannerTitle)).toBeTruthy();
    expect(screen.getByText(en.readOnlyNotice)).toBeTruthy();
  });

  test("renders the declined-sync banner and the declined empty-state block", async () => {
    await renderTab(makeInboxVm({ historyDeclined: true }), "mobile");
    expect(await screen.findByText(en.syncDeclinedTitle)).toBeTruthy();
    expect(screen.getByText(en.historyDeclinedNotice)).toBeTruthy();
    expect(screen.getByText(en.syncDeclinedEmptyTitle)).toBeTruthy();
    expect(screen.queryByText(en.noConversations)).toBeNull();
  });

  test("keeps the list visible below the declined banner when conversations exist", async () => {
    await renderTab(makeInboxVm({ historyDeclined: true, conversations: [makeConversationRow("c1")] }), "mobile");
    expect(await screen.findByText(en.syncDeclinedTitle)).toBeTruthy();
    expect(screen.getByText("Name c1")).toBeTruthy();
    expect(screen.queryByText(en.syncDeclinedEmptyTitle)).toBeNull();
  });

  test("opens the thread view when a conversation is selected", async () => {
    await renderSelectedThreadTab("mobile");
    expect(await screen.findByText("mm1")).toBeTruthy();
    expect(screen.getByText(en.readOnlyNotice)).toBeTruthy();
  });
});

describe("InboxTabDesktop — list + thread pane", () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  test("renders the conversations grid with contact and preview", async () => {
    await renderTab(makeInboxVm({ conversations: [makeConversationRow("c1")], totalCount: 1 }), "desktop");
    expect(await screen.findByText("Name c1")).toBeTruthy();
    expect(screen.getByText("pc1")).toBeTruthy();
  });

  test("renders the thread pane beside the list when a conversation is selected", async () => {
    await renderSelectedThreadTab("desktop");
    expect(await screen.findByText("mm1")).toBeTruthy();
  });
});

describe("InboxTab — RTL Arabic rendering", () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  test("Arabic labels render from the whatsappInbox namespace", async () => {
    await renderTab(makeInboxVm({ labels: ar }), "mobile", "ar");
    expect(screen.getByText(ar.title)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText(ar.noConversations)).toBeTruthy();
    });
  });
});
