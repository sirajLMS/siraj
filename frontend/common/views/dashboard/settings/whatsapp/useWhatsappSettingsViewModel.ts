"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import {
  createWhatsappAccountMutationDocument,
  deleteWhatsappAccountMutationDocument,
  isUserWhatsappOptInQueryDocument,
  isWhatsappConfiguredQueryDocument,
  setUserWhatsappOptInMutationDocument,
  setWhatsappAccessTokenMutationDocument,
  setWhatsappTwoStepPinMutationDocument,
  syncWhatsappAccountsFromMetaMutationDocument,
  updateWhatsappAccountMutationDocument,
  whatsappAccountsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type {
  WhatsappCreateInput,
  WhatsappDialogState,
  WhatsappSettingsLabels,
  WhatsappSettingsViewModel,
  WhatsappSnackbar,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  validateAccessToken,
  validateDisplayName,
  validatePhoneNumberId,
  validateTwoStepPin,
  validateWabaId,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation";
import { CURRENT_USER } from "@/shared/constants/whatsapp-current-user";
import { Translation, useAppTranslation } from "@/shared/locale";

// ─── Types ───────────────────────────────────────────────────────────

interface SyncFromMetaResult {
  data?: { syncWhatsappAccountsFromMeta?: { accounts?: unknown[] | null } };
}

function isSyncFromMetaResult(value: unknown): value is SyncFromMetaResult {
  return (
    typeof value === "object" &&
    value !== null &&
    ("data" in value ? typeof value.data === "object" || value.data === undefined : true)
  );
}

type SnackbarShow = (message: string, severity: "success" | "error") => void;

// ─── Mutation action functions (pure async helpers) ──────────────────

async function deleteAccountAction(
  id: string,
  deleteAccount: (opts: { variables: { id: string } }) => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  try {
    await deleteAccount({ variables: { id } });
    await refetchAccounts();
    showSnackbar(labels.deleteSuccess, "success");
  } catch (error) {
    logger.error("Failed to delete WhatsApp account", { error });
    showSnackbar(labels.deleteError, "error");
  }
}

async function setAccessTokenAction(
  id: string,
  accessToken: string,
  setAccessToken: (opts: { variables: { id: string; accessToken: string } }) => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  try {
    await setAccessToken({ variables: { id, accessToken } });
    await refetchAccounts();
    showSnackbar(labels.saveSuccess, "success");
  } catch (error) {
    logger.error("Failed to set WhatsApp access token", { error });
    showSnackbar(labels.saveError, "error");
  }
}

async function setTwoStepPinAction(
  id: string,
  twoStepPin: string,
  setTwoStepPin: (opts: { variables: { id: string; twoStepPin: string } }) => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  try {
    await setTwoStepPin({ variables: { id, twoStepPin } });
    await refetchAccounts();
    showSnackbar(labels.saveSuccess, "success");
  } catch (error) {
    logger.error("Failed to set WhatsApp two-step PIN", { error });
    showSnackbar(labels.saveError, "error");
  }
}

async function syncFromMetaAction(
  syncFromMeta: () => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  setSyncing: (value: boolean) => void,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  setSyncing(true);
  try {
    const rawResult = await syncFromMeta();
    const result: SyncFromMetaResult = isSyncFromMetaResult(rawResult) ? rawResult : {};
    const accountsResult = result.data?.syncWhatsappAccountsFromMeta?.accounts;
    await refetchAccounts();
    if (accountsResult && accountsResult.length > 0) {
      showSnackbar(labels.syncSuccess, "success");
    } else {
      showSnackbar(labels.syncNoChange, "success");
    }
  } catch (error) {
    logger.error("Failed to sync from Meta", { error });
    showSnackbar(labels.syncError, "error");
  } finally {
    setSyncing(false);
  }
}

async function toggleOptInAction(
  enabled: boolean,
  setOptIn: (opts: { variables: { userId: string; enabled: boolean; source: string } }) => Promise<unknown>,
  refetchOptIn: () => Promise<unknown>,
  setOptInLoading: (value: boolean) => void,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  setOptInLoading(true);
  try {
    await setOptIn({ variables: { userId: CURRENT_USER, enabled, source: "graphql" } });
    await refetchOptIn();
    showSnackbar(labels.optInSuccess, "success");
  } catch (error) {
    logger.error("Failed to toggle WhatsApp opt-in", { error });
    showSnackbar(labels.optInError, "error");
  } finally {
    setOptInLoading(false);
  }
}

// ─── Hooks: queries, mutations, derived data ──────────────────────────

function useWhatsappQueries() {
  const accountsQuery = useQuery(whatsappAccountsQueryDocument);
  const optInQuery = useQuery(isUserWhatsappOptInQueryDocument, {
    variables: { userId: CURRENT_USER },
  });
  const configuredQuery = useQuery(isWhatsappConfiguredQueryDocument);

  return { accountsQuery, optInQuery, configuredQuery };
}

function useWhatsappMutations() {
  const [deleteAccount] = useMutation(deleteWhatsappAccountMutationDocument);
  const [setAccessToken] = useMutation(setWhatsappAccessTokenMutationDocument);
  const [setTwoStepPin] = useMutation(setWhatsappTwoStepPinMutationDocument);
  const [syncFromMeta, syncResult] = useMutation(syncWhatsappAccountsFromMetaMutationDocument);
  const [setOptIn] = useMutation(setUserWhatsappOptInMutationDocument);
  const [createAccount] = useMutation(createWhatsappAccountMutationDocument);
  const [updateAccount] = useMutation(updateWhatsappAccountMutationDocument);

  return {
    deleteAccount,
    setAccessToken,
    setTwoStepPin,
    syncFromMeta,
    syncResult,
    setOptIn,
    createAccount,
    updateAccount,
  };
}

function useDerivedWhatsappData(
  queries: ReturnType<typeof useWhatsappQueries>,
  mutations: ReturnType<typeof useWhatsappMutations>
) {
  const { accountsQuery, optInQuery, configuredQuery } = queries;
  const { syncResult } = mutations;

  const accounts = accountsQuery.data?.whatsappAccounts ?? [];
  const templates = syncResult.data?.syncWhatsappAccountsFromMeta?.templates ?? [];
  const loading = accountsQuery.loading;
  const queryError = !!accountsQuery.error;
  const isOptedIn = optInQuery.data?.isUserWhatsappOptIn ?? false;
  const isConfigured = configuredQuery.data?.isWhatsappConfigured ?? false;

  return { accounts, templates, loading, queryError, isOptedIn, isConfigured };
}

// ─── Dialog state hook ───────────────────────────────────────────────

function useWhatsappDialogs() {
  const [dialogState, setDialogState] = useState<WhatsappDialogState>({ type: null });
  const [mutationError, setMutationError] = useState<string | null>(null);

  const openCreateDialog = useCallback(() => {
    setMutationError(null);
    setDialogState({ type: "create" });
  }, []);

  const openEditNameDialog = useCallback((accountId: string, displayName: string) => {
    setMutationError(null);
    setDialogState({ type: "editName", accountId, displayName });
  }, []);

  const openEditTokenDialog = useCallback((accountId: string) => {
    setMutationError(null);
    setDialogState({ type: "editToken", accountId });
  }, []);

  const openEditPinDialog = useCallback((accountId: string) => {
    setMutationError(null);
    setDialogState({ type: "editPin", accountId });
  }, []);

  const openDeleteConfirmDialog = useCallback((accountId: string, displayName: string) => {
    setMutationError(null);
    setDialogState({ type: "deleteConfirm", accountId, displayName });
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
    openDeleteConfirmDialog,
    closeDialog,
  };
}

// ─── Snackbar hook ────────────────────────────────────────────────────

function useWhatsappSnackbar() {
  const [snackbar, setSnackbar] = useState<WhatsappSnackbar>(null);

  const showSnackbar = useCallback<SnackbarShow>((message, severity) => {
    setSnackbar({ message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(null);
  }, []);

  return { snackbar, showSnackbar, closeSnackbar };
}

// ─── Handlers hook ────────────────────────────────────────────────────

interface WhatsappHandlersArgs {
  mutations: ReturnType<typeof useWhatsappMutations>;
  queries: ReturnType<typeof useWhatsappQueries>;
  labels: WhatsappSettingsLabels;
  showSnackbar: SnackbarShow;
  closeDialog: () => void;
  setMutationError: (value: string | null) => void;
}

function buildCreateInput(input: WhatsappCreateInput) {
  return {
    displayName: { en: input.displayName },
    phoneNumberId: input.phoneNumberId,
    wabaId: input.wabaId,
    displayPhoneNumber: null,
    isActive: null,
    portfolioMessagingLimitTier: null,
    qualityRating: null,
    throughputLevel: null,
  };
}

function buildUpdateInput(displayName: string) {
  return {
    displayName: { en: displayName },
    displayPhoneNumber: null,
    isActive: null,
    portfolioMessagingLimitTier: null,
    qualityRating: null,
    throughputLevel: null,
  };
}

async function createAccountAction(
  input: WhatsappCreateInput,
  createAccount: (opts: { variables: { input: ReturnType<typeof buildCreateInput> } }) => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  try {
    await createAccount({ variables: { input: buildCreateInput(input) } });
    await refetchAccounts();
    showSnackbar(labels.saveSuccess, "success");
  } catch (error) {
    logger.error("Failed to create WhatsApp account", { error });
    showSnackbar(labels.saveError, "error");
    throw error;
  }
}

async function updateAccountAction(
  accountId: string,
  displayName: string,
  updateAccount: (opts: { variables: { id: string; input: ReturnType<typeof buildUpdateInput> } }) => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  try {
    await updateAccount({ variables: { id: accountId, input: buildUpdateInput(displayName) } });
    await refetchAccounts();
    showSnackbar(labels.saveSuccess, "success");
  } catch (error) {
    logger.error("Failed to update WhatsApp account", { error });
    showSnackbar(labels.saveError, "error");
    throw error;
  }
}

function useWhatsappCreateHandler({
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
      if (displayNameError !== null) {
        setMutationError(displayNameError);
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

function useWhatsappUpdateDeleteHandlers({
  mutations,
  queries,
  labels,
  showSnackbar,
  closeDialog,
  setMutationError,
}: WhatsappHandlersArgs) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const handleDelete = useWhatsappDeleteHandler({
    deleteAccount: mutations.deleteAccount,
    refetchAccounts: queries.accountsQuery.refetch,
    notifications: labels.notifications,
    showSnackbar,
    closeDialog,
    setDeletingId,
  });

  return { deletingId, updatingId, handleEditName, handleDelete };
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

function useWhatsappEditNameHandler({
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

interface UseWhatsappDeleteHandlerArgs {
  deleteAccount: (opts: { variables: { id: string } }) => Promise<unknown>;
  refetchAccounts: () => Promise<unknown>;
  notifications: WhatsappSettingsLabels["notifications"];
  showSnackbar: SnackbarShow;
  closeDialog: () => void;
  setDeletingId: (value: string | null) => void;
}

function useWhatsappDeleteHandler({
  deleteAccount,
  refetchAccounts,
  notifications,
  showSnackbar,
  closeDialog,
  setDeletingId,
}: UseWhatsappDeleteHandlerArgs) {
  const handleDelete = async (accountId: string) => {
    setDeletingId(accountId);
    try {
      await deleteAccountAction(accountId, deleteAccount, refetchAccounts, notifications, showSnackbar);
      closeDialog();
    } finally {
      setDeletingId(null);
    }
  };

  return handleDelete;
}

function useWhatsappUtilityHandlers({
  mutations,
  queries,
  labels,
  showSnackbar,
}: Pick<WhatsappHandlersArgs, "mutations" | "queries" | "labels" | "showSnackbar">) {
  const [syncing, setSyncing] = useState(false);
  const [optInLoading, setOptInLoading] = useState(false);

  const handleSubmitToken = useCallback(
    async (accountId: string, token: string) => {
      await setAccessTokenAction(
        accountId,
        token,
        mutations.setAccessToken,
        queries.accountsQuery.refetch,
        labels.notifications,
        showSnackbar
      );
    },
    [mutations, queries, labels, showSnackbar]
  );

  const handleSubmitPin = useCallback(
    async (accountId: string, pin: string) => {
      await setTwoStepPinAction(
        accountId,
        pin,
        mutations.setTwoStepPin,
        queries.accountsQuery.refetch,
        labels.notifications,
        showSnackbar
      );
    },
    [mutations, queries, labels, showSnackbar]
  );

  const handleSync = useCallback(async () => {
    await syncFromMetaAction(
      mutations.syncFromMeta,
      queries.accountsQuery.refetch,
      setSyncing,
      labels.notifications,
      showSnackbar
    );
  }, [mutations, queries, labels, showSnackbar]);

  const handleToggleOptIn = useCallback(
    async (optedIn: boolean) => {
      await toggleOptInAction(
        optedIn,
        mutations.setOptIn,
        queries.optInQuery.refetch,
        setOptInLoading,
        labels.notifications,
        showSnackbar
      );
    },
    [mutations, queries, labels, showSnackbar]
  );

  return { syncing, optInLoading, handleSubmitToken, handleSubmitPin, handleSync, handleToggleOptIn };
}

// ─── Labels hook ─────────────────────────────────────────────────────

function useWhatsappLabels(whatsappLabels: WhatsappSettingsLabels["page"]): WhatsappSettingsLabels {
  return useMemo<WhatsappSettingsLabels>(
    () => ({
      page: whatsappLabels,
      notifications: {
        syncSuccess: whatsappLabels.syncSuccess,
        syncNoChange: whatsappLabels.syncNoChange,
        syncError: whatsappLabels.syncError,
        deleteSuccess: whatsappLabels.deleteSuccess,
        deleteError: whatsappLabels.deleteError,
        saveSuccess: whatsappLabels.saveSuccess,
        saveError: whatsappLabels.saveError,
        optInSuccess: whatsappLabels.optInEnabled,
        optInError: whatsappLabels.optInError,
      },
    }),
    [whatsappLabels]
  );
}

// ─── Refetch helpers ─────────────────────────────────────────────────

function useRefetchers(queries: ReturnType<typeof useWhatsappQueries>) {
  const refetchAccounts = useCallback(() => {
    void queries.accountsQuery.refetch();
  }, [queries]);
  const refetchTemplates = useCallback(() => {
    void queries.accountsQuery.refetch();
  }, [queries]);
  return { refetchAccounts, refetchTemplates };
}

// ─── Return builder ──────────────────────────────────────────────────

interface WhatsappViewModelParts {
  labels: WhatsappSettingsLabels;
  accounts: ReturnType<typeof useDerivedWhatsappData>["accounts"];
  templates: ReturnType<typeof useDerivedWhatsappData>["templates"];
  loading: boolean;
  queryError: boolean;
  isOptedIn: boolean;
  isConfigured: boolean;
  createHandler: ReturnType<typeof useWhatsappCreateHandler>;
  updateDeleteHandlers: ReturnType<typeof useWhatsappUpdateDeleteHandlers>;
  utilityHandlers: ReturnType<typeof useWhatsappUtilityHandlers>;
  dialogState: WhatsappDialogState;
  mutationError: string | null;
  snackbar: WhatsappSnackbar;
  closeSnackbar: () => void;
  openCreateDialog: () => void;
  openEditNameDialog: (accountId: string, displayName: string) => void;
  openEditTokenDialog: (accountId: string) => void;
  openEditPinDialog: (accountId: string) => void;
  openDeleteConfirmDialog: (accountId: string, displayName: string) => void;
  closeDialog: () => void;
  refetchAccounts: () => void;
  refetchTemplates: () => void;
  editingTokenForId: string | null;
  editingPinForId: string | null;
}

function buildWhatsappViewModel(p: WhatsappViewModelParts): WhatsappSettingsViewModel {
  return {
    labels: p.labels,
    accounts: p.accounts,
    templates: p.templates,
    loading: p.loading,
    queryError: p.queryError,
    isOptedIn: p.isOptedIn,
    isConfigured: p.isConfigured,
    creating: p.createHandler.creating,
    deletingId: p.updateDeleteHandlers.deletingId,
    updatingId: p.updateDeleteHandlers.updatingId,
    syncingId: p.utilityHandlers.syncing ? "all" : null,
    editingTokenForId: p.editingTokenForId,
    editingPinForId: p.editingPinForId,
    syncing: p.utilityHandlers.syncing,
    optInLoading: p.utilityHandlers.optInLoading,
    mutationError: p.mutationError,
    snackbar: p.snackbar,
    closeSnackbar: p.closeSnackbar,
    validateDisplayName,
    validatePhoneNumberId,
    validateWabaId,
    validateAccessToken,
    validateTwoStepPin,
    dialogState: p.dialogState,
    openCreateDialog: p.openCreateDialog,
    openEditNameDialog: p.openEditNameDialog,
    openEditTokenDialog: p.openEditTokenDialog,
    openEditPinDialog: p.openEditPinDialog,
    openDeleteConfirmDialog: p.openDeleteConfirmDialog,
    closeDialog: p.closeDialog,
    handleCreate: p.createHandler.handleCreate,
    handleEditName: p.updateDeleteHandlers.handleEditName,
    handleDelete: p.updateDeleteHandlers.handleDelete,
    handleSubmitToken: p.utilityHandlers.handleSubmitToken,
    handleSubmitPin: p.utilityHandlers.handleSubmitPin,
    handleSync: p.utilityHandlers.handleSync,
    handleToggleOptIn: p.utilityHandlers.handleToggleOptIn,
    refetchAccounts: p.refetchAccounts,
    refetchTemplates: p.refetchTemplates,
    onDeleteAccount: p.updateDeleteHandlers.handleDelete,
    onSetAccessToken: p.utilityHandlers.handleSubmitToken,
    onSetTwoStepPin: p.utilityHandlers.handleSubmitPin,
    onSyncFromMeta: p.utilityHandlers.handleSync,
    onToggleOptIn: p.utilityHandlers.handleToggleOptIn,
    onDismissSnackbar: p.closeSnackbar,
  };
}

// ─── Main ViewModel hook ─────────────────────────────────────────────

/**
 * KNOWN LIMITATION — Templates persistence:
 * The backend `whatsappTemplates` query resolver does NOT exist (see Task 3 outcome).
 * Templates are only available from the `syncWhatsappAccountsFromMeta` mutation result.
 * `refetchTemplates` triggers `refetchAccounts()` — this does NOT re-fetch templates
 * from the server because no `whatsappTemplates` query exists. Templates persist only
 * for the lifetime of the Apollo cache entry from the last sync mutation.
 * Backend resolver creation is out of scope for this frontend-only plan (Task 9 dependency).
 */
// ─── Snackbar + editing derivation ────────────────────────────────────

function useWhatsappSnackbarAndEditing(
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

// ─── Handlers hook ──────────────────────────────────────────────────

function useWhatsappHandlers(
  args: Pick<
    WhatsappHandlersArgs,
    "mutations" | "queries" | "labels" | "showSnackbar" | "closeDialog" | "setMutationError"
  >
) {
  const createHandler = useWhatsappCreateHandler(args);
  const updateDeleteHandlers = useWhatsappUpdateDeleteHandlers(args);
  const utilityHandlers = useWhatsappUtilityHandlers(args);
  return { createHandler, updateDeleteHandlers, utilityHandlers };
}

// ─── Main hook ─────────────────────────────────────────────────────

export function useWhatsappSettingsViewModel(): WhatsappSettingsViewModel {
  const whatsappLabels = useAppTranslation(Translation.Whatsapp);
  const queries = useWhatsappQueries();
  const mutations = useWhatsappMutations();

  const labels = useWhatsappLabels(whatsappLabels);
  const { accounts, templates, loading, queryError, isOptedIn, isConfigured } = useDerivedWhatsappData(
    queries,
    mutations
  );
  const { snackbar, showSnackbar, closeSnackbar: dismissSnackbar } = useWhatsappSnackbar();
  const {
    dialogState,
    mutationError,
    setMutationError,
    openCreateDialog,
    openEditNameDialog,
    openEditTokenDialog,
    openEditPinDialog,
    openDeleteConfirmDialog,
    closeDialog,
  } = useWhatsappDialogs();

  const { createHandler, updateDeleteHandlers, utilityHandlers } = useWhatsappHandlers({
    mutations,
    queries,
    labels,
    showSnackbar,
    closeDialog,
    setMutationError,
  });
  const { refetchAccounts, refetchTemplates } = useRefetchers(queries);
  const { closeSnackbar, editingTokenForId, editingPinForId } = useWhatsappSnackbarAndEditing(
    dismissSnackbar,
    setMutationError,
    dialogState
  );

  return buildWhatsappViewModel({
    labels,
    accounts,
    templates,
    loading,
    isOptedIn,
    isConfigured,
    queryError,
    createHandler,
    updateDeleteHandlers,
    utilityHandlers,
    dialogState,
    mutationError,
    snackbar,
    closeSnackbar,
    openCreateDialog,
    openEditNameDialog,
    openEditTokenDialog,
    openEditPinDialog,
    openDeleteConfirmDialog,
    closeDialog,
    refetchAccounts,
    refetchTemplates,
    editingTokenForId,
    editingPinForId,
  });
}
