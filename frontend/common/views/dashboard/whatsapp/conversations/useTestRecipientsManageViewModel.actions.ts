"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback } from "react";
import {
  addWhatsappTestRecipientMutationDocument,
  removeWhatsappTestRecipientMutationDocument,
  verifyWhatsappTestRecipientMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  describeRegistryError,
  phoneDigitsOnly,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useTestRecipientsManageViewModel.helpers";
import type { RecipientActionState } from "@/frontend/common/views/dashboard/whatsapp/conversations/useTestRecipientsManageViewModel.hooks";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";

interface RecipientRegistryActionsParams {
  readonly action: RecipientActionState;
  readonly accountId: string;
  readonly errorLabels: ErrorsLabels;
  readonly labels: WhatsappConversationsLabels;
  readonly refetch: () => Promise<unknown>;
}

/** Owns the add/remove/verify mutations and their re-fetch + failure handling. */
export function useRecipientRegistryActions({
  action,
  accountId,
  errorLabels,
  labels,
  refetch,
}: Readonly<RecipientRegistryActionsParams>) {
  const [addRecipient, addState] = useMutation(addWhatsappTestRecipientMutationDocument, { errorPolicy: "none" });
  const [removeRecipient, removeState] = useMutation(removeWhatsappTestRecipientMutationDocument, {
    errorPolicy: "none",
  });
  const [verifyRecipient] = useMutation(verifyWhatsappTestRecipientMutationDocument, { errorPolicy: "none" });

  const onSubmitAdd = useCallback(() => {
    void (async () => {
      action.setAddError(null);
      try {
        await addRecipient({
          variables: {
            input: {
              accountId,
              phoneNumber: phoneDigitsOnly(action.addPhone),
              note: action.addNote.trim() === "" ? null : action.addNote.trim(),
            },
          },
        });
        action.closeAdd();
        await refetch();
      } catch (error) {
        action.setAddError(describeRegistryError(error, errorLabels, labels.recipientAddFailed));
      }
    })();
  }, [accountId, action, addRecipient, refetch, errorLabels, labels]);

  const onConfirmRemove = useCallback(() => {
    const target = action.removeTarget;
    if (!target) {
      return;
    }
    void (async () => {
      try {
        await removeRecipient({ variables: { recipientId: target.id } });
        action.setRemoveTarget(null);
        await refetch();
      } catch (error) {
        action.setNotice(describeRegistryError(error, errorLabels, labels.recipientAddFailed));
      }
    })();
  }, [action, removeRecipient, refetch, errorLabels, labels]);

  const onVerify = useCallback(
    (recipientId: string) => {
      void (async () => {
        action.setVerifyingId(recipientId);
        action.setNotice(null);
        try {
          await verifyRecipient({ variables: { recipientId } });
          await refetch();
        } catch (error) {
          action.setNotice(describeRegistryError(error, errorLabels, labels.recipientAddFailed));
        } finally {
          action.setVerifyingId(null);
        }
      })();
    },
    [action, verifyRecipient, refetch, errorLabels, labels]
  );

  return { onSubmitAdd, onConfirmRemove, onVerify, busy: addState.loading || removeState.loading };
}
