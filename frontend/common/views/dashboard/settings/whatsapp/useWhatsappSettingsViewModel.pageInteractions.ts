"use client";

import { useCallback } from "react";
import { isEmbeddedSignupSupported } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup";
import type { WhatsappSettingsLabels } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { useWhatsappHandlers } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.handlers";
import {
  useRefetchers,
  type useWhatsappMutations,
  type useWhatsappQueries,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.hooks";
import {
  useWhatsappEmbeddedSignupHandler,
  useWhatsappUtilityHandlers,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.interactions";
import {
  useEmbeddedSignupBlocked,
  useWhatsappDialogs,
  useWhatsappSnackbar,
  useWhatsappSnackbarAndEditing,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.state";

/** Dialog/snackbar/handlers stack backing the settings tab's page interactions. */
export function useWhatsappPageInteractions(
  queries: ReturnType<typeof useWhatsappQueries>,
  mutations: ReturnType<typeof useWhatsappMutations>,
  labels: WhatsappSettingsLabels
) {
  const { snackbar, showSnackbar, closeSnackbar: dismissSnackbar } = useWhatsappSnackbar();
  const {
    dialogState,
    mutationError,
    setMutationError,
    openCreateDialog,
    openEditNameDialog,
    openEditTokenDialog,
    openEditPinDialog,
    openLocalDeactivateConfirmDialog,
    openManageRecipientsDialog,
    openEmbeddedSignupDialog: openEmbeddedSignupDialogRaw,
    closeDialog,
  } = useWhatsappDialogs();

  const embeddedSignupBlocked = useEmbeddedSignupBlocked();

  /**
   * Guarded opener: on plain HTTP the FB SDK throws before the dialog can do
   * anything, so every entry point (header connect, retry-setup) routes to a
   * translated snackbar instead of opening the dialog.
   */
  const openEmbeddedSignupDialog = useCallback(() => {
    if (!isEmbeddedSignupSupported()) {
      showSnackbar(labels.page.embeddedSignupRequiresHttps, "error");
      return;
    }
    openEmbeddedSignupDialogRaw();
  }, [labels.page, showSnackbar, openEmbeddedSignupDialogRaw]);

  const { createHandler, updateLocalDeactivateHandlers } = useWhatsappHandlers({
    mutations,
    queries,
    labels,
    showSnackbar,
    closeDialog,
    setMutationError,
  });
  const utilityHandlers = useWhatsappUtilityHandlers({ mutations, queries, labels, showSnackbar });
  const embeddedSignupHandler = useWhatsappEmbeddedSignupHandler({ mutations, queries, labels, showSnackbar });
  const { refetchAccounts, refetchTemplates } = useRefetchers(queries);
  const { closeSnackbar, editingTokenForId, editingPinForId } = useWhatsappSnackbarAndEditing(
    dismissSnackbar,
    setMutationError,
    dialogState
  );

  return {
    snackbar,
    dialogState,
    mutationError,
    closeSnackbar,
    openCreateDialog,
    openEditNameDialog,
    openEditTokenDialog,
    openEditPinDialog,
    openLocalDeactivateConfirmDialog,
    openManageRecipientsDialog,
    openEmbeddedSignupDialog,
    embeddedSignupBlocked,
    closeDialog,
    createHandler,
    updateLocalDeactivateHandlers,
    utilityHandlers,
    embeddedSignupHandler,
    refetchAccounts,
    refetchTemplates,
    editingTokenForId,
    editingPinForId,
  };
}
