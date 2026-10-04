"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import type { WhatsappConversationsListQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  whatsappAccountsQueryDocument,
  whatsappConversationsListQueryDocument,
  whatsappConversationThreadQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  PAGE_SIZE,
  POLL_INTERVAL_MS,
  THREAD_PAGE_SIZE,
  WHATSAPP_TIMESTAMP_OPTIONS,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.constants";
import { buildPaginationArgs } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.helpers";
import { useAppLocale } from "@/shared/locale/localeContext";

/** True when the tab is hidden; polling pauses and Apollo resumes it on return. */
function useDocumentHidden(): boolean {
  return useSyncExternalStore(
    onStoreChange => {
      document.addEventListener("visibilitychange", onStoreChange);
      return () => document.removeEventListener("visibilitychange", onStoreChange);
    },
    () => document.hidden,
    () => false
  );
}

/**
 * Render-safe "now" for service-window math — a mount-time snapshot is the
 * lint-sanctioned pattern (Date.now() during render trips the purity rule).
 * The 30s poll keeps the underlying latest-inbound timestamp fresh; Meta
 * remains the authoritative gate and rejects an actually-closed window with
 * WHATSAPP_OUTSIDE_SERVICE_WINDOW, which is mapped in the errors sibling.
 */
export function useRenderTimeSnapshot(): number {
  const [snapshot] = useState(() => Date.now());
  return snapshot;
}

/**
 * Keeps the list page anchored to the server-reported total: records each
 * payload's totalCount and re-anchors the page filter to the last existing
 * page when the total shrinks below it.
 */
export function useSyncListPage(
  data: WhatsappConversationsListQuery | undefined,
  requestedPage: number,
  setPage: (page: number) => void,
  noteTotalCount: (totalCount: number) => void
) {
  useEffect(() => {
    const totalCount = data?.whatsappConversationThreads?.totalCount;
    if (totalCount === null || totalCount === undefined) {
      return;
    }
    noteTotalCount(totalCount);
    const lastPage = Math.max(0, Math.ceil(totalCount / PAGE_SIZE) - 1);
    if (requestedPage > lastPage) {
      setPage(lastPage);
    }
  }, [data, requestedPage, setPage, noteTotalCount]);
}

/**
 * Polling interval for the list/thread: paused while the tab is hidden.
 * Thread fetching skips until a conversation is open.
 */
export function useWorkspaceQueries(accountId: string | null, page: number, selectedConversationId: string | null) {
  const hidden = useDocumentHidden();
  const pollInterval = hidden ? 0 : POLL_INTERVAL_MS;
  const accountsQuery = useQuery(whatsappAccountsQueryDocument);
  const conversationsQuery = useQuery(whatsappConversationsListQueryDocument, {
    variables: { accountId, pagination: buildPaginationArgs(page, PAGE_SIZE) },
    pollInterval,
    fetchPolicy: "cache-and-network",
  });
  const threadQuery = useQuery(whatsappConversationThreadQueryDocument, {
    variables: { id: selectedConversationId ?? "", pagination: buildPaginationArgs(0, THREAD_PAGE_SIZE) },
    skip: selectedConversationId === null,
    pollInterval,
    fetchPolicy: "cache-and-network",
  });
  return { accountsQuery, conversationsQuery, threadQuery };
}

export function useWhatsappTimestampFormatter() {
  const locale = useAppLocale();
  return useCallback(
    (iso: string | null) => {
      if (!iso) {
        return "";
      }
      const localeTag = locale === "ar" ? "ar" : "en";
      return getDateTimeFormatter(localeTag, WHATSAPP_TIMESTAMP_OPTIONS).format(new Date(iso));
    },
    [locale]
  );
}
