"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import { type WhatsappAccountsQuery, WhatsappSyncStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  whatsappAccountsQueryDocument,
  whatsappConversationMessagesQueryDocument,
  whatsappConversationsQueryDocument,
  whatsappSyncStatusQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  buildAccountOptions,
  buildPaginationArgs,
  PAGE_SIZE,
  POLL_INTERVAL_MS,
  THREAD_PAGE_SIZE,
  WHATSAPP_TIMESTAMP_OPTIONS,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappInboxViewModel.helpers";
import { getPurposeLabel } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappPurposeOptions";
import type { AppLocale } from "@/shared/locale";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Server-written failure-reason code for history decline on the paired phone. */
const HISTORY_DECLINED_REASON = "historyDeclined";

/** Filter/search/selection state — resets the (0-based) page on filter changes. */
export function useInboxFilters() {
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const onAccountFilterChange = useCallback((accountId: string | null) => {
    setAccountFilter(accountId);
    setPage(0);
    setSelectedConversationId(null);
  }, []);

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const onSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  const onCloseThread = useCallback(() => {
    setSelectedConversationId(null);
  }, []);

  return {
    accountFilter,
    search,
    page,
    setPage,
    selectedConversationId,
    onAccountFilterChange,
    onSearchChange,
    onSelectConversation,
    onCloseThread,
  };
}

type InboxFilters = ReturnType<typeof useInboxFilters>;

/**
 * Tracks `document.hidden`; polling passes a 0 poll interval while the tab is
 * hidden (matching the dashboard notification polling convention) and Apollo
 * resumes polling automatically when the tab becomes visible again.
 */
function useTabHidden(): boolean {
  const [hidden, setHidden] = useState(() => (typeof document === "undefined" ? false : document.hidden));
  useEffect(() => {
    const onVisibilityChange = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
  return hidden;
}

/** Conversations + thread queries with visibility-gated polling; thread skips until open. */
export function useInboxQueries(filters: InboxFilters) {
  const hidden = useTabHidden();
  const pollInterval = hidden ? 0 : POLL_INTERVAL_MS;
  const accountsQuery = useQuery(whatsappAccountsQueryDocument);
  const conversationsQuery = useQuery(whatsappConversationsQueryDocument, {
    variables: {
      accountId: filters.accountFilter,
      pagination: buildPaginationArgs(filters.page, PAGE_SIZE),
    },
    pollInterval,
    fetchPolicy: "cache-and-network",
  });
  const threadQuery = useQuery(whatsappConversationMessagesQueryDocument, {
    variables: {
      conversationId: filters.selectedConversationId ?? "",
      pagination: buildPaginationArgs(0, THREAD_PAGE_SIZE),
    },
    skip: filters.selectedConversationId === null,
    pollInterval,
    fetchPolicy: "cache-and-network",
  });
  return { accountsQuery, conversationsQuery, threadQuery };
}

/**
 * True when the filtered account's history sync failed because sharing was
 * declined on the paired phone. The account row only carries `syncStatus`;
 * the failure reason resolves through the per-account sync-status query,
 * fired lazily for a FAILED selection.
 */
function useHistoryDeclined(accountId: string | null, syncStatus: WhatsappSyncStatus | null) {
  const failed = accountId !== null && syncStatus === WhatsappSyncStatus.Failed;
  const query = useQuery(whatsappSyncStatusQueryDocument, {
    variables: { accountId: accountId ?? "" },
    skip: !failed,
  });
  return failed && query.data?.whatsappSyncStatus?.syncFailureReason === HISTORY_DECLINED_REASON;
}

/** Derives the active-account filter options plus the filtered account's history-decline flag. */
export function useWhatsappInboxAccounts(
  accountRows: WhatsappAccountsQuery["whatsappAccounts"],
  locale: AppLocale,
  accountFilter: string | null
) {
  const accounts = useMemo(() => buildAccountOptions(accountRows, locale), [accountRows, locale]);
  const filteredAccount = useMemo(
    () => accounts.find(option => option.id === accountFilter) ?? null,
    [accounts, accountFilter]
  );
  const historyDeclined = useHistoryDeclined(filteredAccount?.id ?? null, filteredAccount?.syncStatus ?? null);
  return { accounts, historyDeclined };
}

/** Locale-bound timestamp and message-purpose formatters shared by the inbox lists and thread. */
export function useWhatsappInboxFormatters(locale: AppLocale, whatsappLabels: WhatsappLabels) {
  const formatTimestamp = useCallback(
    (iso: string | null) => {
      if (!iso) {
        return "";
      }
      const localeTag = locale === "ar" ? "ar" : "en";
      return getDateTimeFormatter(localeTag, WHATSAPP_TIMESTAMP_OPTIONS).format(new Date(iso));
    },
    [locale]
  );

  const purposeLabel = useCallback(
    (purpose: string | null) => getPurposeLabel(whatsappLabels, purpose),
    [whatsappLabels]
  );

  return { formatTimestamp, purposeLabel };
}
