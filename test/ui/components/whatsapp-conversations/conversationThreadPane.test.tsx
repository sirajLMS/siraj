import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { WhatsappMessageDirection } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  ConversationThreadPaneShared,
  type ConversationThreadPaneSharedProps,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationThreadPaneShared";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import {
  CONTACT_NAME,
  CONTACT_WA_ID,
  INBOUND_TEXT,
  makeMessageRow,
  OUTBOUND_TEXT,
} from "@/test/ui/components/whatsapp-conversations/whatsappConversationsFixtures";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.WhatsappConversations, locale);
const inboxLabels = readTranslation(Translation.WhatsappInbox, locale);

function makeProps(overrides: Partial<ConversationThreadPaneSharedProps> = {}): ConversationThreadPaneSharedProps {
  return {
    labels,
    inboxLabels,
    title: CONTACT_NAME,
    subtitle: CONTACT_WA_ID,
    lastActivityText: "",
    messages: [],
    loading: false,
    formatTimestamp: iso => iso ?? "",
    ...overrides,
  };
}

describe("ConversationThreadPaneShared — message bubbles", () => {
  afterEach(cleanup);

  test("renders inbound and outbound bubbles with translated direction labels", () => {
    const messages = [
      makeMessageRow("msg-1", "2026-09-10T10:00:00.000Z"),
      makeMessageRow("msg-2", "2026-09-10T10:05:00.000Z", {
        direction: WhatsappMessageDirection.ApiOutbound,
        content: OUTBOUND_TEXT,
      }),
    ];
    renderWithWrapper(<ConversationThreadPaneShared {...makeProps({ messages })} />, { locale });

    expect(screen.getByText(INBOUND_TEXT)).toBeVisible();
    expect(screen.getByText(inboxLabels.directionInbound)).toBeVisible();
    expect(screen.getByText(OUTBOUND_TEXT)).toBeVisible();
    expect(screen.getByText(inboxLabels.directionApiOutbound)).toBeVisible();

    const inboundBubble = screen.getByText(INBOUND_TEXT).closest("div");
    const outboundBubble = screen.getByText(OUTBOUND_TEXT).closest("div");
    expect(inboundBubble?.parentElement).toHaveStyle("justify-content: flex-start");
    expect(outboundBubble?.parentElement).toHaveStyle("justify-content: flex-end");
  });

  test("renders the empty-thread copy when no messages exist", () => {
    renderWithWrapper(<ConversationThreadPaneShared {...makeProps()} />, { locale });
    expect(screen.getByText(labels.threadMessagesEmpty)).toBeVisible();
  });

  test("renders header title, subtitle and last-activity line", () => {
    const lastActivityText = "آخر نشاط 10:00";
    renderWithWrapper(<ConversationThreadPaneShared {...makeProps({ lastActivityText })} />, { locale });
    expect(screen.getByText(CONTACT_NAME)).toBeVisible();
    expect(screen.getByText(lastActivityText)).toBeVisible();
  });

  test("revoked message shows the revoked marker instead of its text", () => {
    const messages = [makeMessageRow("msg-1", "2026-09-10T10:00:00.000Z", { revokedAt: "2026-09-10T11:00:00.000Z" })];
    renderWithWrapper(<ConversationThreadPaneShared {...makeProps({ messages })} />, { locale });
    expect(screen.getByText(inboxLabels.messageRevoked)).toBeVisible();
    expect(screen.queryByText(INBOUND_TEXT)).toBeNull();
  });

  test("back button fires the close handler", () => {
    const onBack = mock(() => {});
    renderWithWrapper(<ConversationThreadPaneShared {...makeProps({ onBack })} />, { locale });
    fireEvent.click(screen.getByRole("button", { name: inboxLabels.back }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test("omits the back button when no back handler is provided (split-pane layouts)", () => {
    renderWithWrapper(<ConversationThreadPaneShared {...makeProps()} />, { locale });
    expect(screen.queryByRole("button", { name: inboxLabels.back })).toBeNull();
  });

  test("docks the composer slot under the message list", () => {
    renderWithWrapper(
      <ConversationThreadPaneShared {...makeProps({ composer: <div data-testid="composer-slot" /> })} />,
      { locale }
    );
    expect(screen.getByTestId("composer-slot")).toBeVisible();
  });
});
