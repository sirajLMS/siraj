"use client";

import { useMutation } from "@apollo/client/react";
import {
  addWhatsappTestRecipientMutationDocument,
  removeWhatsappTestRecipientMutationDocument,
  verifyWhatsappTestRecipientMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import type { WhatsappRecipientViewRow } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import { E164_SHAPE } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.constants";
import {
  mapDomainError,
  mapSendError,
  RECIPIENT_ADD_ERROR_TABLE,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.errors";
import {
  digitsOnly,
  withVar,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.helpers";
import type { RecipientDialogsState } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.state";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";

interface RegistryAddActionParams {
  readonly labels: WhatsappConversationsLabels;
  readonly errorLabels: ErrorsLabels;
  readonly dialogs: RecipientDialogsState;
  readonly selectedAccount: { readonly id: string } | null;
  readonly refetch: () => Promise<unknown>;
}

/** Registry add flow: mutation, phone validation, and error copy mapping. */
export function useConversationsRegistryAddAction({
  labels,
  errorLabels,
  dialogs,
  selectedAccount,
  refetch,
}: Readonly<RegistryAddActionParams>) {
  const [addRecipient, addState] = useMutation(addWhatsappTestRecipientMutationDocument, { errorPolicy: "none" });

  const onSubmitAddRecipient = async () => {
    if (!selectedAccount) {
      return;
    }
    dialogs.setAddError(null);
    try {
      await addRecipient({
        variables: {
          input: {
            accountId: selectedAccount.id,
            phoneNumber: digitsOnly(dialogs.addPhone),
            note: dialogs.addNote.trim() === "" ? null : dialogs.addNote.trim(),
          },
        },
      });
      dialogs.closeAdd();
      await refetch();
    } catch (error) {
      dialogs.setAddError(
        mapDomainError(
          error,
          RECIPIENT_ADD_ERROR_TABLE,
          errorLabels,
          labels.recipientAddFailed,
          "WhatsApp test recipient add failed"
        )
      );
    }
  };

  return {
    addRecipientPhoneValid: E164_SHAPE.test(dialogs.addPhone),
    addRecipientBusy: addState.loading,
    onSubmitAddRecipient,
  };
}

interface RegistryMutationsParams {
  readonly labels: WhatsappConversationsLabels;
  readonly errorLabels: ErrorsLabels;
  readonly dialogs: RecipientDialogsState;
  readonly recipientRows: readonly WhatsappRecipientViewRow[];
  readonly refetch: () => Promise<unknown>;
}

/** Registry remove/verify flows and the removal confirmation copy. */
export function useConversationsRegistryMutations({
  labels,
  errorLabels,
  dialogs,
  recipientRows,
  refetch,
}: Readonly<RegistryMutationsParams>) {
  const [removeRecipient, removeState] = useMutation(removeWhatsappTestRecipientMutationDocument, {
    errorPolicy: "none",
  });
  const [verifyRecipient] = useMutation(verifyWhatsappTestRecipientMutationDocument, { errorPolicy: "none" });

  const onConfirmRemoveRecipient = async () => {
    const target = dialogs.removeTarget;
    if (!target) {
      return;
    }
    try {
      await removeRecipient({ variables: { recipientId: target.id } });
      dialogs.setRemoveTarget(null);
      await refetch();
    } catch (error) {
      dialogs.setNotice(mapSendError(error, errorLabels));
    }
  };

  const onVerifyRecipient = async (recipientId: string) => {
    dialogs.setVerifyingId(recipientId);
    dialogs.setNotice(null);
    try {
      await verifyRecipient({ variables: { recipientId } });
      await refetch();
    } catch (error) {
      dialogs.setNotice(mapSendError(error, errorLabels));
    } finally {
      dialogs.setVerifyingId(null);
    }
  };

  const onAskRemoveRecipient = (recipientId: string) => {
    dialogs.setRemoveTarget(recipientRows.find(row => row.id === recipientId) ?? null);
  };

  const removeRecipientConfirmText = dialogs.removeTarget
    ? withVar(labels.removeRecipientConfirm, "phone", dialogs.removeTarget.phoneNumber)
    : "";

  return {
    removeRecipientBusy: removeState.loading,
    removeRecipientConfirmText,
    onAskRemoveRecipient,
    onCloseRemoveRecipient: () => dialogs.setRemoveTarget(null),
    onConfirmRemoveRecipient,
    onVerifyRecipient,
  };
}
