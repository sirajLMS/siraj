"use client";

import { useMemo } from "react";
import type { WhatsappConversationsViewModel } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import { useConversationsAccountsStack } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.accounts";
import {
  buildLabelsBySection,
  resolveListQueryPage,
  toComposerProps,
  toRegistryDialogProps,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.helpers";
import { useWorkspaceQueries } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.hooks";
import { useConversationsListStack } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.list";
import { useConversationsRegistrySlice } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.registry";
import {
  useConversationsSendAction,
  useConversationsSendStack,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.send";
import { useConversationsState } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.state";
import { useConversationsTemplatesStack } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.templates";
import { useConversationsThreadStack } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.thread";
import { Translation, useAppTranslation } from "@/shared/locale";
import { useAppLocale } from "@/shared/locale/localeContext";

export function useWhatsappConversationsViewModel(): WhatsappConversationsViewModel {
  const labels = useAppTranslation(Translation.WhatsappConversations);
  const inboxLabels = useAppTranslation(Translation.WhatsappInbox);
  const errorLabels = useAppTranslation(Translation.Errors);
  const locale = useAppLocale();

  const { filters, composer, dialogs, serverTotalCount, setServerTotalCount } = useConversationsState();
  const { accountsQuery, conversationsQuery, threadQuery } = useWorkspaceQueries(
    filters.accountId,
    resolveListQueryPage(filters.page, serverTotalCount),
    filters.selectedConversationId
  );

  const accountsStack = useConversationsAccountsStack({ accountsQuery, filters, composer, dialogs, locale });
  const listStack = useConversationsListStack({
    filters,
    composer,
    conversationsQuery,
    noteTotalCount: setServerTotalCount,
  });
  const threadStack = useConversationsThreadStack({
    labels,
    locale,
    threadQuery,
    selectedConversation: listStack.selectedConversation,
  });
  const registrySlice = useConversationsRegistrySlice({
    labels,
    errorLabels,
    dialogs,
    selectedAccount: accountsStack.selectedAccount,
    isTestAccount: accountsStack.isTestAccount,
    selectedConversation: listStack.selectedConversation,
    formatTimestamp: threadStack.formatTimestamp,
  });
  const templatesStack = useConversationsTemplatesStack({
    labels,
    composer,
    selectedAccount: accountsStack.selectedAccount,
  });
  const sendStack = useConversationsSendStack({
    errorLabels,
    canManage: accountsStack.canManage,
    composer,
    isTestAccount: accountsStack.isTestAccount,
    selectedAccount: accountsStack.selectedAccount,
    selectedConversation: listStack.selectedConversation,
  });
  const sendAction = useConversationsSendAction({
    errorLabels,
    composer,
    filters,
    selectedAccount: accountsStack.selectedAccount,
    selectedConversation: listStack.selectedConversation,
    conversationsRefetch: conversationsQuery.refetch,
    threadRefetch: threadQuery.refetch,
    composerMode: sendStack.composerMode,
    targetTo: sendStack.targetTo,
    sendDisabled: sendStack.sendDisabled,
  });

  const labelsBySection = useMemo(() => buildLabelsBySection(labels), [labels]);

  return {
    labelsBySection,
    inboxLabels,
    ...accountsStack,
    ...listStack,
    ...threadStack,
    ...toComposerProps(composer),
    ...toRegistryDialogProps(dialogs),
    ...templatesStack,
    ...registrySlice,
    ...sendStack,
    ...sendAction,
  };
}
