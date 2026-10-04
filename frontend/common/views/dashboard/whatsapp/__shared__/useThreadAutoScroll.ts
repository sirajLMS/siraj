"use client";

import { useAutoScrollToEnd } from "@/frontend/common/views/dashboard/whatsapp/conversations/useAutoScrollToEnd";

interface ThreadRowIdentifier {
  readonly id: string;
}

/**
 * Bottom-anchor auto-scroll for chat thread panes: derives the newest message
 * identifier from the message set and re-anchors the scroll container to its
 * end whenever new rows arrive.
 */
export function useThreadAutoScroll(
  messages: readonly ThreadRowIdentifier[],
  loading: boolean
): React.RefObject<HTMLElement | null> {
  const lastMessageId = messages.length > 0 ? (messages[messages.length - 1]?.id ?? null) : null;
  return useAutoScrollToEnd<HTMLElement>(lastMessageId, loading);
}
