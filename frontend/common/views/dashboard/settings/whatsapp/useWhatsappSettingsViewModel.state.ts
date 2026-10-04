"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import { isEmbeddedSignupSupported } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup";
import type {
  WhatsappDialogState,
  WhatsappSnackbar,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { SnackbarShow } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.helpers";

/** Dialog state hook: every opener clears the previous mutation error before switching dialogs. */
export function useWhatsappDialogs() {
  const [dialogState, setDialogState] = useState<WhatsappDialogState>({ type: null });
  const [mutationError, setMutationError] = useState<string | null>(null);

  const openCreateDialog = useCallback(() => {
    setMutationError(null);
    setDialogState({ type: "create" });
  }, []);

  const openEditNameDialog = useCallback((accountId: string, displayName: string, purpose: WhatsappAccountPurpose) => {
    setMutationError(null);
    setDialogState({ type: "editName", accountId, displayName, purpose });
  }, []);

  const openEditTokenDialog = useCallback((accountId: string) => {
    setMutationError(null);
    setDialogState({ type: "editToken", accountId });
  }, []);

  const openEditPinDialog = useCallback((accountId: string) => {
    setMutationError(null);
    setDialogState({ type: "editPin", accountId });
  }, []);

  const openLocalDeactivateConfirmDialog = useCallback((accountId: string, displayName: string) => {
    setMutationError(null);
    setDialogState({ type: "localDeactivateConfirm", accountId, displayName });
  }, []);

  const openManageRecipientsDialog = useCallback((accountId: string) => {
    setMutationError(null);
    setDialogState({ type: "manageRecipients", accountId });
  }, []);

  const openEmbeddedSignupDialog = useCallback(() => {
    setMutationError(null);
    setDialogState({ type: "embeddedSignup" });
  }, []);

  const closeDialog = useCallback(() => {
    setMutationError(null);
    setDialogState({ type: null });
  }, []);

  return {
    dialogState,
    mutationError,
    setMutationError,
    openCreateDialog,
    openEditNameDialog,
    openEditTokenDialog,
    openEditPinDialog,
    openLocalDeactivateConfirmDialog,
    openManageRecipientsDialog,
    openEmbeddedSignupDialog,
    closeDialog,
  };
}

/** Module-level stable references for the `useSyncExternalStore` reads below. */
const NOOP_SUBSCRIBE = () => () => {};
const SERVER_SNAPSHOT_TRUE = () => true;

export function useWhatsappSnackbar() {
  const [snackbar, setSnackbar] = useState<WhatsappSnackbar>(null);

  const showSnackbar = useCallback<SnackbarShow>((message, severity) => {
    setSnackbar({ message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(null);
  }, []);

  return { snackbar, showSnackbar, closeSnackbar };
}

/**
 * Mounted-state availability check: Meta's FB SDK rejects `FB.login` on plain
 * HTTP pages, so the embedded-signup entry points surface a blocked state
 * instead of launching. `useSyncExternalStore` keeps the server HTML and the
 * first client render consistent (server snapshot reports supported).
 */
export function useEmbeddedSignupBlocked(): boolean {
  return !useSyncExternalStore(NOOP_SUBSCRIBE, isEmbeddedSignupSupported, SERVER_SNAPSHOT_TRUE);
}

/** Snackbar dismissal also clears the dialog-scoped mutation error; derives which token/Pin editor is open. */
export function useWhatsappSnackbarAndEditing(
  dismissSnackbar: () => void,
  setMutationError: (value: string | null) => void,
  dialogState: ReturnType<typeof useWhatsappDialogs>["dialogState"]
) {
  const closeSnackbar = useCallback(() => {
    dismissSnackbar();
    setMutationError(null);
  }, [dismissSnackbar, setMutationError]);
  const editingTokenForId = dialogState.type === "editToken" ? (dialogState.accountId ?? null) : null;
  const editingPinForId = dialogState.type === "editPin" ? (dialogState.accountId ?? null) : null;
  return { closeSnackbar, editingTokenForId, editingPinForId };
}
