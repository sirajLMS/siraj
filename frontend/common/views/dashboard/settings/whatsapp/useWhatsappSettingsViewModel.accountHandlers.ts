"use client";

import type { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappSettingsLabels } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  localDeactivateAccountAction,
  updateAccountAction,
  updatePurposeAction,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.actions";
import type {
  buildUpdateInput,
  SnackbarShow,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.helpers";
import {
  validateDisplayName,
  validatePurpose,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation";

interface UseWhatsappPurposeHandlerArgs {
  updatePurpose: (opts: { variables: { accountId: string; purpose: WhatsappAccountPurpose } }) => Promise<unknown>;
  refetchAccounts: () => Promise<unknown>;
  labels: Pick<WhatsappSettingsLabels["page"], "purposeUpdated" | "purposeUpdateFailed">;
  showSnackbar: SnackbarShow;
  setUpdatingId: (value: string | null) => void;
}

export function useWhatsappPurposeHandler({
  updatePurpose,
  refetchAccounts,
  labels,
  showSnackbar,
  setUpdatingId,
}: UseWhatsappPurposeHandlerArgs) {
  const handleUpdatePurpose = async (accountId: string, purpose: WhatsappAccountPurpose) => {
    const purposeError = validatePurpose(purpose);
    if (purposeError !== null) {
      return;
    }
    setUpdatingId(accountId);
    try {
      await updatePurposeAction(accountId, purpose, updatePurpose, refetchAccounts, labels, showSnackbar);
    } finally {
      setUpdatingId(null);
    }
  };

  return handleUpdatePurpose;
}

interface UseWhatsappEditNameHandlerArgs {
  updateAccount: (opts: { variables: { id: string; input: ReturnType<typeof buildUpdateInput> } }) => Promise<unknown>;
  refetchAccounts: () => Promise<unknown>;
  notifications: WhatsappSettingsLabels["notifications"];
  showSnackbar: SnackbarShow;
  closeDialog: () => void;
  setMutationError: (value: string | null) => void;
  setUpdatingId: (value: string | null) => void;
}

export function useWhatsappEditNameHandler({
  updateAccount,
  refetchAccounts,
  notifications,
  showSnackbar,
  closeDialog,
  setMutationError,
  setUpdatingId,
}: UseWhatsappEditNameHandlerArgs) {
  const handleEditName = async (accountId: string, displayName: string) => {
    const displayNameError = validateDisplayName(displayName);
    if (displayNameError !== null) {
      setMutationError(displayNameError);
      return;
    }
    setUpdatingId(accountId);
    setMutationError(null);
    try {
      await updateAccountAction(accountId, displayName, updateAccount, refetchAccounts, notifications, showSnackbar);
      closeDialog();
    } catch {
      setMutationError(notifications.saveError);
    } finally {
      setUpdatingId(null);
    }
  };

  return handleEditName;
}

interface UseWhatsappLocalDeactivateHandlerArgs {
  localDeactivateAccount: (opts: { variables: { id: string } }) => Promise<unknown>;
  refetchAccounts: () => Promise<unknown>;
  notifications: WhatsappSettingsLabels["notifications"];
  showSnackbar: SnackbarShow;
  closeDialog: () => void;
  setLocalDeactivatingId: (value: string | null) => void;
}

export function useWhatsappLocalDeactivateHandler({
  localDeactivateAccount,
  refetchAccounts,
  notifications,
  showSnackbar,
  closeDialog,
  setLocalDeactivatingId,
}: UseWhatsappLocalDeactivateHandlerArgs) {
  const handleLocalDeactivate = async (accountId: string) => {
    setLocalDeactivatingId(accountId);
    try {
      await localDeactivateAccountAction(
        accountId,
        localDeactivateAccount,
        refetchAccounts,
        notifications,
        showSnackbar
      );
      closeDialog();
    } finally {
      setLocalDeactivatingId(null);
    }
  };

  return handleLocalDeactivate;
}
