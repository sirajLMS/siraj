"use client";

import { useCallback, useMemo } from "react";
import type { WhatsappInboxViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";
import {
  buildConversationSearchRows,
  isConversationRow,
  isMessageRow,
  PAGE_SIZE,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappInboxViewModel.helpers";
import {
  useInboxFilters,
  useInboxQueries,
  useWhatsappInboxAccounts,
  useWhatsappInboxFormatters,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappInboxViewModel.hooks";
import { Translation, useAppTranslation } from "@/shared/locale";
import { useAppLocale } from "@/shared/locale/localeContext";

export function useWhatsappInboxViewModel(): WhatsappInboxViewModel {
  const labels = useAppTranslation(Translation.WhatsappInbox);
  const whatsappLabels = useAppTranslation(Translation.Whatsapp);
  const locale = useAppLocale();
  const filters = useInboxFilters();
  const { accountsQuery, conversationsQuery, threadQuery } = useInboxQueries(filters);
  const { accounts, historyDeclined } = useWhatsappInboxAccounts(
    accountsQuery.data?.whatsappAccounts ?? null,
    locale,
    filters.accountFilter
  );

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

  const { formatTimestamp, purposeLabel } = useWhatsappInboxFormatters(locale, whatsappLabels);

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
