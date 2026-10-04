"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { whatsappTestRecipientsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { TestRecipientsPanelProps } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsPanel";
import { useRecipientRegistryActions } from "@/frontend/common/views/dashboard/whatsapp/conversations/useTestRecipientsManageViewModel.actions";
import {
  interpolateVar,
  RECIPIENT_LIMIT,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useTestRecipientsManageViewModel.helpers";
import {
  useRecipientActionState,
  useRecipientRows,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useTestRecipientsManageViewModel.hooks";
import { parsePhoneToE164 } from "@/shared/lib/phone";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * Self-contained recipients registry stack for the settings manage dialog:
 * own query + add/remove/verify mutations scoped to the given account, so the
 * settings card affordance works without mounting the `/whatsapp` workspace.
 */
export function useTestRecipientsManageViewModel(accountId: string): TestRecipientsPanelProps {
  const labels = useAppTranslation(Translation.WhatsappConversations);
  const errorLabels = useAppTranslation(Translation.Errors);
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.WhatsappConversationsManage);
  const action = useRecipientActionState();

  const recipientsQuery = useQuery(whatsappTestRecipientsQueryDocument, {
    variables: { accountId },
    fetchPolicy: "cache-and-network",
  });

  const rows = useRecipientRows(recipientsQuery.data?.whatsappTestRecipients, labels);

  /** Save stays disabled until the phone input parses to a complete number. */
  const addPhoneValid = useMemo(() => {
    if (action.addPhone.trim() === "") {
      return false;
    }
    return parsePhoneToE164(action.addPhone).valid;
  }, [action.addPhone]);

  const { onSubmitAdd, onConfirmRemove, onVerify, busy } = useRecipientRegistryActions({
    action,
    accountId,
    errorLabels,
    labels,
    refetch: recipientsQuery.refetch,
  });

  const onAskRemove = useCallback(
    (recipientId: string) => {
      action.setRemoveTarget(rows.find(row => row.id === recipientId) ?? null);
    },
    [action, rows]
  );

  const removeConfirmText = action.removeTarget
    ? interpolateVar(labels.removeRecipientConfirm, "phone", action.removeTarget.phoneNumber)
    : "";

  return {
    labels,
    bannerLabels: labels,
    canManage,
    rows,
    loading: recipientsQuery.loading,
    limitReached: rows.length >= RECIPIENT_LIMIT,
    notice: action.notice,
    verifyingRecipientId: action.verifyingId,
    addOpen: action.addOpen,
    addPhone: action.addPhone,
    addPhoneValid,
    addNote: action.addNote,
    addError: action.addError,
    busy,
    removeTarget: action.removeTarget,
    removeConfirmText,
    onOpenAdd: action.openAdd,
    onCloseAdd: action.closeAdd,
    onAddPhoneChange: action.setAddPhone,
    onAddNoteChange: action.setAddNote,
    onSubmitAdd,
    onAskRemove,
    onCloseRemove: () => action.setRemoveTarget(null),
    onConfirmRemove,
    onVerify,
  };
}
