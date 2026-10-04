"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { whatsappTestRecipientsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { WhatsappConversationRow } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import { RECIPIENT_LIMIT } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.constants";
import {
  buildRecipientViewRow,
  isRecipientRow,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.helpers";
import {
  useConversationsRegistryAddAction,
  useConversationsRegistryMutations,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.registryActions";
import type { RecipientDialogsState } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.state";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";

interface ConversationsRegistryStackParams {
  readonly labels: WhatsappConversationsLabels;
  readonly selectedAccount: { readonly id: string } | null;
  readonly isTestAccount: boolean;
  readonly selectedConversation: WhatsappConversationRow | null;
  readonly formatTimestamp: (iso: string | null) => string;
}

/** The test-number recipient registry: its query and pre-shaped view rows. */
function useConversationsRegistryStack({
  labels,
  selectedAccount,
  isTestAccount,
  selectedConversation,
  formatTimestamp,
}: Readonly<ConversationsRegistryStackParams>) {
  const recipientsQuery = useQuery(whatsappTestRecipientsQueryDocument, {
    variables: { accountId: selectedAccount?.id ?? "" },
    skip: !isTestAccount || !selectedAccount,
    fetchPolicy: "cache-and-network",
  });

  const recipientRows = useMemo(
    () =>
      (recipientsQuery.data?.whatsappTestRecipients ?? [])
        .filter(isRecipientRow)
        .map(row => buildRecipientViewRow(row, labels, formatTimestamp)),
    [recipientsQuery.data, labels, formatTimestamp]
  );
  const registryTargetPhones = useMemo(() => recipientRows.map(row => row.phoneNumber), [recipientRows]);

  return {
    showRecipientPicker: selectedConversation === null,
    registryTargetOnly: isTestAccount,
    registryTargetPhones,
    recipientRows,
    recipientsLoading: isTestAccount && recipientsQuery.loading,
    recipientLimitReached: recipientRows.length >= RECIPIENT_LIMIT,
    refetchRecipients: recipientsQuery.refetch,
  };
}

interface ConversationsRegistrySliceParams {
  readonly labels: WhatsappConversationsLabels;
  readonly errorLabels: ErrorsLabels;
  readonly dialogs: RecipientDialogsState;
  readonly selectedAccount: { readonly id: string } | null;
  readonly isTestAccount: boolean;
  readonly selectedConversation: WhatsappConversationRow | null;
  readonly formatTimestamp: (iso: string | null) => string;
}

/** Bundles the registry query with its add/remove/verify action hooks. */
export function useConversationsRegistrySlice({
  labels,
  errorLabels,
  dialogs,
  selectedAccount,
  isTestAccount,
  selectedConversation,
  formatTimestamp,
}: Readonly<ConversationsRegistrySliceParams>) {
  const registryStack = useConversationsRegistryStack({
    labels,
    selectedAccount,
    isTestAccount,
    selectedConversation,
    formatTimestamp,
  });
  const registryAdd = useConversationsRegistryAddAction({
    labels,
    errorLabels,
    dialogs,
    selectedAccount,
    refetch: registryStack.refetchRecipients,
  });
  const registryMutations = useConversationsRegistryMutations({
    labels,
    errorLabels,
    dialogs,
    recipientRows: registryStack.recipientRows,
    refetch: registryStack.refetchRecipients,
  });
  return {
    ...registryStack,
    ...registryAdd,
    ...registryMutations,
    registryBusy: registryAdd.addRecipientBusy || registryMutations.removeRecipientBusy,
  };
}
