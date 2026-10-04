"use client";

import { useMemo } from "react";
import {
  WhatsappConversationSendMode,
  type WhatsappConversationsListQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { PAGE_SIZE } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.constants";
import { isConversationRow } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.helpers";
import { useSyncListPage } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.hooks";
import type {
  ComposerState,
  ConversationsFiltersState,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.state";

interface ConversationsListQueryHandle {
  readonly data: WhatsappConversationsListQuery | undefined;
  readonly loading: boolean;
  readonly error?: unknown;
  readonly refetch: () => Promise<unknown>;
}

interface ConversationsListStackParams {
  readonly filters: ConversationsFiltersState;
  readonly composer: ComposerState;
  readonly conversationsQuery: ConversationsListQueryHandle;
  readonly noteTotalCount: (totalCount: number) => void;
}

/** The conversation list: search filtering, page anchoring, and row selection. */
export function useConversationsListStack({
  filters,
  composer,
  conversationsQuery,
  noteTotalCount,
}: Readonly<ConversationsListStackParams>) {
  const pageRows = useMemo(
    () => (conversationsQuery.data?.whatsappConversationThreads?.rows ?? []).filter(isConversationRow),
    [conversationsQuery.data]
  );
  const conversations = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    if (!needle) {
      return pageRows;
    }
    return pageRows.filter(row =>
      [row.displayName, row.username, row.waId, row.lastMessagePreview].some(field =>
        field ? field.toLowerCase().includes(needle) : false
      )
    );
  }, [pageRows, filters.search]);

  const totalCount = conversationsQuery.data?.whatsappConversationThreads?.totalCount ?? 0;
  const lastPage = Math.max(0, Math.ceil(totalCount / PAGE_SIZE) - 1);
  const conversationsPage = Math.min(filters.page, lastPage);
  useSyncListPage(conversationsQuery.data, filters.page, filters.setPage, noteTotalCount);

  const selectedConversation = useMemo(
    () => pageRows.find(row => row.id === filters.selectedConversationId) ?? null,
    [pageRows, filters.selectedConversationId]
  );

  // Initiation defaults to template mode (a brand-new thread has no open 24h
  // window), but the text toggle stays switchable: the window state is
  // advisory only and Meta is the authoritative gate.
  const onStartNewConversation = () => {
    filters.onCloseThread();
    filters.setInitiating(true);
    composer.resetComposer();
    composer.onModeChange(WhatsappConversationSendMode.Template);
  };

  const onRetryConversations = () => {
    void conversationsQuery.refetch();
  };

  return {
    search: filters.search,
    onSearchChange: filters.onSearchChange,
    conversations,
    conversationsLoading: conversationsQuery.loading,
    conversationsError: conversationsQuery.error !== undefined,
    conversationsPage,
    conversationsPageSize: PAGE_SIZE,
    conversationsTotalCount: totalCount,
    onConversationsPageChange: filters.setPage,
    onRetryConversations,
    selectedConversation,
    onSelectConversation: filters.onSelectConversation,
    onCloseThread: filters.onCloseThread,
    isInitiating: filters.initiating,
    onStartNewConversation,
  };
}
