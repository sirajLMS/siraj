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
import type {
  WhatsappConversationRow,
  WhatsappInboxAccountOption,
  WhatsappInboxViewModel,
  WhatsappMessageRow,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import { getPurposeLabel } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappPurposeOptions";
import { Translation, useAppTranslation } from "@/shared/locale";
import { useAppLocale } from "@/shared/locale/localeContext";

const PAGE_SIZE = 20;
const THREAD_PAGE_SIZE = 50;
const POLL_INTERVAL_MS = 30_000;
const WHATSAPP_TIMESTAMP_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

/**
 * Page-index convention: the VM keeps the 0-based page expected by the shared
 * list pagination (`ListPaginationOptions` / DataGrid) and translates to
 * GraphQL `first`/`skip` — the same contract every other server-paginated
 * view uses. All pagination args must be present — MockLink matches variables
 * exactly.
 */
function buildPaginationArgs(page: number, pageSize: number) {
  return { first: pageSize, skip: page * pageSize, after: null, before: null, last: null, page: null, maxCount: null };
}

type WhatsappAccountRow = NonNullable<WhatsappAccountsQuery["whatsappAccounts"]>[number];

function resolveAccountLabel(account: WhatsappAccountRow, locale: string): string {
  if (account.displayPhoneNumber) {
    return account.displayPhoneNumber;
  }
  const localized = account.displayName?.[locale === "ar" ? "ar" : "en"];
  return localized ?? account.displayName?.en ?? account.wabaId ?? "";
}

function buildAccountOptions(rows: WhatsappAccountsQuery["whatsappAccounts"], locale: string) {
  const options: WhatsappInboxAccountOption[] = [];
  for (const row of rows ?? []) {
    if (row.id && row.isActive) {
      options.push({ id: row.id, label: resolveAccountLabel(row, locale), syncStatus: row.syncStatus ?? null });
    }
  }
  return options;
}

/** Server-written failure-reason code for history decline on the paired phone. */
const HISTORY_DECLINED_REASON = "historyDeclined";

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
/** Filter/search/selection state — resets the (0-based) page on filter changes. */
function useInboxFilters() {
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

function isConversationRow(row: { id: string | null }): row is WhatsappConversationRow {
  return row.id !== null;
}

function isMessageRow(row: { id: string | null }): row is WhatsappMessageRow {
  return row.id !== null;
}

function buildConversationSearchRows(rows: readonly WhatsappConversationRow[], search: string) {
  const needle = search.trim().toLowerCase();
  if (!needle) {
    return rows;
  }
  return rows.filter(row =>
    [row.displayName, row.username, row.waId, row.lastMessagePreview].some(field =>
      field ? field.toLowerCase().includes(needle) : false
    )
  );
}

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
function useInboxQueries(filters: InboxFilters) {
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
export function useWhatsappInboxViewModel(): WhatsappInboxViewModel {
  const labels = useAppTranslation(Translation.WhatsappInbox);
  const whatsappLabels = useAppTranslation(Translation.Whatsapp);
  const locale = useAppLocale();
  const filters = useInboxFilters();
  const { accountsQuery, conversationsQuery, threadQuery } = useInboxQueries(filters);

  const accounts = useMemo(
    () => buildAccountOptions(accountsQuery.data?.whatsappAccounts ?? null, locale),
    [accountsQuery.data, locale]
  );

  const filteredAccount = useMemo(
    () => accounts.find(option => option.id === filters.accountFilter) ?? null,
    [accounts, filters.accountFilter]
  );
  const historyDeclined = useHistoryDeclined(filteredAccount?.id ?? null, filteredAccount?.syncStatus ?? null);

  const pageRows = useMemo(
    () => (conversationsQuery.data?.whatsappConversations?.rows ?? []).filter(isConversationRow),
    [conversationsQuery.data]
  );
  const conversations = useMemo(
    () => buildConversationSearchRows(pageRows, filters.search),
    [pageRows, filters.search]
  );
  const totalCount = conversationsQuery.data?.whatsappConversations?.totalCount ?? 0;
  /**
   * Clamp the 0-based page into the real page range so a stale page index
   * (e.g. after the filtered total shrinks) can never render "Page 2 of 1".
   */
  const lastPage = Math.max(0, Math.ceil(totalCount / PAGE_SIZE) - 1);
  const page = Math.min(filters.page, lastPage);

  const selectedConversation = useMemo(
    () => pageRows.find(row => row.id === filters.selectedConversationId) ?? null,
    [pageRows, filters.selectedConversationId]
  );

  const threadMessages = useMemo(
    () => (threadQuery.data?.whatsappConversationMessages?.rows ?? []).filter(isMessageRow),
    [threadQuery.data]
  );

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

  const onRetry = useCallback(() => {
    void conversationsQuery.refetch();
  }, [conversationsQuery]);

  return {
    labels,
    accounts,
    conversations,
    totalCount,
    loading: conversationsQuery.loading,
    queryError: conversationsQuery.error !== undefined,
    historyDeclined,
    accountFilter: filters.accountFilter,
    search: filters.search,
    page,
    pageSize: PAGE_SIZE,
    selectedConversation,
    threadMessages,
    threadLoading: threadQuery.loading,
    threadError: threadQuery.error !== undefined,
    onAccountFilterChange: filters.onAccountFilterChange,
    onSearchChange: filters.onSearchChange,
    onPageChange: filters.setPage,
    onSelectConversation: filters.onSelectConversation,
    onCloseThread: filters.onCloseThread,
    onRetry,
    formatTimestamp,
    purposeLabel,
  };
}
