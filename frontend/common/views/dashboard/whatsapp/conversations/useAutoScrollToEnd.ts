"use client";

import { useEffect, useRef } from "react";

/**
 * Bottom-anchor auto-scroll for chat thread containers. Re-anchors the scroll
 * container to its end whenever the message set changes — but only when the
 * user is already near the bottom, so reading history is never interrupted.
 * A fresh mount / thread switch always starts "near bottom" (scrollTop = 0
 * over short content), so the newest bubble is visible immediately.
 */
export function useAutoScrollToEnd<T extends HTMLElement>(
  lastMessageId: string | null,
  loading: boolean
): React.RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const anchoredToIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }
    // Skip re-anchoring when the newest message is already anchored (a poll
    // replay with no new rows must not scroll) and when the user has scrolled
    // up to read history.
    if (anchoredToIdRef.current === lastMessageId) {
      return;
    }
    const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 120;
    if (!nearBottom) {
      anchoredToIdRef.current = lastMessageId;
      return;
    }
    container.scrollTop = container.scrollHeight;
    anchoredToIdRef.current = lastMessageId;
  }, [lastMessageId, loading]);

  return containerRef;
}
