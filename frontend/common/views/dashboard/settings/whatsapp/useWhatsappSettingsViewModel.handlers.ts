"use client";

import { useCallback, useState } from "react";
import type {
  WhatsappCreateInput,
  WhatsappSettingsLabels,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  useWhatsappEditNameHandler,
  useWhatsappLocalDeactivateHandler,
  useWhatsappPurposeHandler,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.accountHandlers";
import { createAccountAction } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.actions";
import type { SnackbarShow } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.helpers";
import type {
  useWhatsappMutations,
  useWhatsappQueries,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.hooks";
import {
  validateDisplayName,
  validatePurpose,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation";

export interface WhatsappHandlersArgs {
  mutations: ReturnType<typeof useWhatsappMutations>;
  queries: ReturnType<typeof useWhatsappQueries>;
  labels: WhatsappSettingsLabels;
  showSnackbar: SnackbarShow;
  closeDialog: () => void;
  setMutationError: (value: string | null) => void;
}

export function useWhatsappCreateHandler({
  mutations,
  queries,
  labels,
  showSnackbar,
  closeDialog,
  setMutationError,
}: WhatsappHandlersArgs) {
  const [creating, setCreating] = useState(false);

  const handleCreate = useCallback(
    async (input: WhatsappCreateInput) => {
      const displayNameError = validateDisplayName(input.displayName);
      const purposeError = validatePurpose(input.purpose);
      if (displayNameError !== null || purposeError !== null) {
        setMutationError(displayNameError ?? purposeError);
        return;
      }
      setCreating(true);
      setMutationError(null);
      try {
        await createAccountAction(
          input,
          mutations.createAccount,
          queries.accountsQuery.refetch,
          labels.notifications,
          showSnackbar
        );
        closeDialog();
      } catch {
        setMutationError(labels.notifications.saveError);
      } finally {
        setCreating(false);
      }
    },
    [mutations, queries, labels, showSnackbar, closeDialog, setMutationError]
  );

  return { creating, handleCreate };
}

export function useWhatsappUpdateLocalDeactivateHandlers({
  mutations,
  queries,
  labels,
  showSnackbar,
  closeDialog,
  setMutationError,
}: WhatsappHandlersArgs) {
  const [localDeactivatingId, setLocalDeactivatingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleEditName = useWhatsappEditNameHandler({
    updateAccount: mutations.updateAccount,
    refetchAccounts: queries.accountsQuery.refetch,
    notifications: labels.notifications,
    showSnackbar,
    closeDialog,
    setMutationError,
    setUpdatingId,
  });

  const handleLocalDeactivate = useWhatsappLocalDeactivateHandler({
    localDeactivateAccount: mutations.localDeactivateAccount,
    refetchAccounts: queries.accountsQuery.refetch,
    notifications: labels.notifications,
    showSnackbar,
    closeDialog,
    setLocalDeactivatingId,
  });

  const handleUpdatePurpose = useWhatsappPurposeHandler({
    updatePurpose: mutations.updatePurpose,
    refetchAccounts: queries.accountsQuery.refetch,
    labels: labels.page,
    showSnackbar,
    setUpdatingId,
  });

  return { localDeactivatingId, updatingId, handleEditName, handleUpdatePurpose, handleLocalDeactivate };
}

export function useWhatsappHandlers(
  args: Pick<
    WhatsappHandlersArgs,
    "mutations" | "queries" | "labels" | "showSnackbar" | "closeDialog" | "setMutationError"
  >
) {
  const createHandler = useWhatsappCreateHandler(args);
  const updateLocalDeactivateHandlers = useWhatsappUpdateLocalDeactivateHandlers(args);
  return { createHandler, updateLocalDeactivateHandlers };
}
