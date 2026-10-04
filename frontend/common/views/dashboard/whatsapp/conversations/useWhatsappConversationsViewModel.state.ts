"use client";

import { useCallback, useState } from "react";
import { WhatsappConversationSendMode } from "@/frontend/common/graphql/generated/gql/graphql";
import { useRecipientDialogState } from "@/frontend/common/views/dashboard/whatsapp/__shared__";

function useSelectionFilters() {
  const [accountId, setAccountIdState] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [initiating, setInitiating] = useState(false);

  const onAccountChange = useCallback((nextAccountId: string) => {
    setAccountIdState(nextAccountId);
    setSearch("");
    setPage(0);
    setSelectedConversationId(null);
    setInitiating(false);
  }, []);
  const onSearchChange = useCallback((value: string) => setSearch(value), []);
  const onSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setInitiating(false);
  }, []);
  const onCloseThread = useCallback(() => setSelectedConversationId(null), []);

  return {
    accountId,
    setAccountId: setAccountIdState,
    search,
    page,
    setPage,
    selectedConversationId,
    setSelectedConversationId,
    initiating,
    setInitiating,
    onAccountChange,
    onSearchChange,
    onSelectConversation,
    onCloseThread,
  };
}

export type ConversationsFiltersState = ReturnType<typeof useSelectionFilters>;

function useComposerState() {
  const [mode, setModeState] = useState<WhatsappConversationSendMode>(WhatsappConversationSendMode.Text);
  const [textBody, setTextBody] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateLanguage, setTemplateLanguage] = useState("");
  const [recipientSelection, setRecipientSelection] = useState("");
  const [customRecipient, setCustomRecipient] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const resetComposer = useCallback(() => {
    setModeState(WhatsappConversationSendMode.Text);
    setTextBody("");
    setTemplateName("");
    setTemplateLanguage("");
    setRecipientSelection("");
    setCustomRecipient("");
    setSendError(null);
  }, []);

  return {
    mode,
    onModeChange: setModeState,
    textBody,
    setTextBody,
    templateName,
    setTemplateName,
    templateLanguage,
    setTemplateLanguage,
    recipientSelection,
    setRecipientSelection,
    customRecipient,
    setCustomRecipient,
    sendError,
    setSendError,
    resetComposer,
  };
}

export type ComposerState = ReturnType<typeof useComposerState>;

export type RecipientDialogsState = ReturnType<typeof useRecipientDialogState>;

/** One call bundling the shared workspace state the conversation stacks consume. */
export function useConversationsState() {
  const filters = useSelectionFilters();
  const composer = useComposerState();
  const dialogs = useRecipientDialogState();
  const [serverTotalCount, setServerTotalCount] = useState<number | null>(null);
  return { filters, composer, dialogs, serverTotalCount, setServerTotalCount };
}
