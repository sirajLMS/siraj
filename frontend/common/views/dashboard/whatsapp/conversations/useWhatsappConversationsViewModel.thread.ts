"use client";

import { useMemo } from "react";
import {
  type WhatsappConversationThreadQuery,
  WhatsappMessageDirection,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappConversationRow } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import { SERVICE_WINDOW_MS } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.constants";
import {
  formatWindowRemaining,
  isMessageRow,
  withVar,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.helpers";
import {
  useRenderTimeSnapshot,
  useWhatsappTimestampFormatter,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.hooks";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";

interface ConversationsThreadQueryHandle {
  readonly data: WhatsappConversationThreadQuery | undefined;
  readonly loading: boolean;
  readonly error?: unknown;
  readonly refetch: () => Promise<unknown>;
}

interface ConversationsThreadStackParams {
  readonly labels: WhatsappConversationsLabels;
  readonly locale: string;
  readonly threadQuery: ConversationsThreadQueryHandle;
  readonly selectedConversation: WhatsappConversationRow | null;
}

/** The open thread: messages, the 24h service-window state, and its hints. */
export function useConversationsThreadStack({
  labels,
  locale,
  threadQuery,
  selectedConversation,
}: Readonly<ConversationsThreadStackParams>) {
  const threadMessages = useMemo(
    () => (threadQuery.data?.whatsappConversationThread?.messages?.rows ?? []).filter(isMessageRow),
    [threadQuery.data]
  );

  const formatTimestamp = useWhatsappTimestampFormatter();

  const latestInboundMs = useMemo(() => {
    let latest: number | null = null;
    for (const message of threadMessages) {
      if (message.direction === WhatsappMessageDirection.Inbound && message.sentAt) {
        const time = new Date(message.sentAt).getTime();
        if (Number.isFinite(time) && (latest === null || time > latest)) {
          latest = time;
        }
      }
    }
    return latest;
  }, [threadMessages]);

  const nowMs = useRenderTimeSnapshot();

  const windowRemainingMs = latestInboundMs !== null ? latestInboundMs + SERVICE_WINDOW_MS - nowMs : 0;
  const windowOpen = selectedConversation !== null && windowRemainingMs > 0;

  const windowStatusHint = useMemo(() => {
    if (!selectedConversation) {
      return "";
    }
    if (windowOpen) {
      return withVar(labels.windowOpenHint, "duration", formatWindowRemaining(windowRemainingMs, locale));
    }
    return labels.windowClosedHint;
  }, [selectedConversation, windowOpen, windowRemainingMs, labels, locale]);

  const threadLastActivityText = selectedConversation?.lastMessageAt
    ? withVar(labels.lastMessageAt, "date", formatTimestamp(selectedConversation.lastMessageAt))
    : "";

  return {
    threadMessages,
    threadLoading: threadQuery.loading,
    threadError: threadQuery.error !== undefined,
    threadLastActivityText,
    windowOpen,
    windowStatusHint,
    formatTimestamp,
  };
}
