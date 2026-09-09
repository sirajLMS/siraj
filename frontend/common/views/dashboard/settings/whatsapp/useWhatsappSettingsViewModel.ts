"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  completeWhatsappEmbeddedSignupMutationDocument,
  createWhatsappAccountMutationDocument,
  deleteWhatsappAccountMutationDocument,
  isUserWhatsappOptInQueryDocument,
  setUserWhatsappOptInMutationDocument,
  setWhatsappAccessTokenMutationDocument,
  setWhatsappTwoStepPinMutationDocument,
  syncWhatsappAccountsFromMetaMutationDocument,
  testWhatsappAccessTokenMutationDocument,
  updateWhatsappAccountMutationDocument,
  updateWhatsappAccountPurposeMutationDocument,
  whatsappAccountsQueryDocument,
  whatsappConfigurationStatusQueryDocument,
  whatsappEmbeddedSignupAllowedOriginsUrlQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  useWhatsappTokenTestStore,
  type WhatsappTokenTestState,
} from "@/frontend/common/stores/whatsappTokenTestStore";
import { logger } from "@/frontend/common/utils/logger";
import { isEmbeddedSignupSupported } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup";
import type {
  WhatsappCreateInput,
  WhatsappDialogState,
  WhatsappEmbeddedSignupPayload,
  WhatsappSettingsLabels,
  WhatsappSettingsViewModel,
  WhatsappSnackbar,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  validateAccessToken,
  validateDisplayName,
  validatePhoneNumberId,
  validatePurpose,
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

/** Extracts phoneNumberId values from the untyped sync-mutation account entries. */
function syncedAccountPhoneIds(accounts: unknown[] | null | undefined): string[] {
  if (!accounts) {
    return [];
  }
  return accounts.flatMap(account => {
    if (typeof account !== "object" || account === null) {
      return [];
    }
    const phoneNumberId: unknown = Reflect.get(account, "phoneNumberId");
    return typeof phoneNumberId === "string" ? [phoneNumberId] : [];
  });
}

/**
 * Runs the Meta sync and reports real outcome feedback: how many numbers Meta
 * returned and how many were newly added versus already managed. A bare
 * "success" misleads when the WABA has no numbers or all are already known.
 */
async function syncFromMetaAction(
  syncFromMeta: () => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  previousPhoneNumberIds: ReadonlySet<string>,
  setSyncing: (value: boolean) => void,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  setSyncing(true);
  try {
    const rawResult = await syncFromMeta();
    const result: SyncFromMetaResult = isSyncFromMetaResult(rawResult) ? rawResult : {};
    const syncedIds = syncedAccountPhoneIds(result.data?.syncWhatsappAccountsFromMeta?.accounts);
    await refetchAccounts();
    if (syncedIds.length > 0) {
      const addedCount = syncedIds.filter(id => !previousPhoneNumberIds.has(id)).length;
      showSnackbar(labels.syncSuccessWithCounts(syncedIds.length, addedCount), "success");
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
  const configuredQuery = useQuery(whatsappConfigurationStatusQueryDocument);
  const allowedOriginsQuery = useQuery(whatsappEmbeddedSignupAllowedOriginsUrlQueryDocument);

  return { accountsQuery, optInQuery, configuredQuery, allowedOriginsQuery };
}

function useWhatsappMutations() {
  const [deleteAccount] = useMutation(deleteWhatsappAccountMutationDocument);
  const [setAccessToken] = useMutation(setWhatsappAccessTokenMutationDocument);
  const [setTwoStepPin] = useMutation(setWhatsappTwoStepPinMutationDocument);
  const [testAccessToken] = useMutation(testWhatsappAccessTokenMutationDocument);
  const [syncFromMeta, syncResult] = useMutation(syncWhatsappAccountsFromMetaMutationDocument);
  const [setOptIn] = useMutation(setUserWhatsappOptInMutationDocument);
  const [createAccount] = useMutation(createWhatsappAccountMutationDocument);
  const [updateAccount] = useMutation(updateWhatsappAccountMutationDocument);
  const [updatePurpose] = useMutation(updateWhatsappAccountPurposeMutationDocument);
  const [completeEmbeddedSignup] = useMutation(completeWhatsappEmbeddedSignupMutationDocument);

  return {
    deleteAccount,
    setAccessToken,
    setTwoStepPin,
    testAccessToken,
    syncFromMeta,
    syncResult,
    setOptIn,
    createAccount,
    updateAccount,
    updatePurpose,
    completeEmbeddedSignup,
  };
}

function useDerivedWhatsappData(
  queries: ReturnType<typeof useWhatsappQueries>,
  mutations: ReturnType<typeof useWhatsappMutations>
) {
  const { accountsQuery, optInQuery, configuredQuery, allowedOriginsQuery } = queries;
  const { syncResult } = mutations;

  const accounts = accountsQuery.data?.whatsappAccounts ?? [];
  const templates = syncResult.data?.syncWhatsappAccountsFromMeta?.templates ?? [];
  const loading = accountsQuery.loading;
  const queryError = !!accountsQuery.error;
  const isOptedIn = optInQuery.data?.isUserWhatsappOptIn ?? false;
  const configurationStatus = configuredQuery.data?.whatsappConfigurationStatus ?? null;
  const isConfigured = configurationStatus?.isConfigured ?? false;
  const missingEnvKeys = configurationStatus?.missingEnvKeys ?? [];
  const embeddedSignupAllowedOriginsUrl = allowedOriginsQuery.data?.whatsappEmbeddedSignupAllowedOriginsUrl ?? null;

  return {
    accounts,
    templates,
    loading,
    queryError,
    isOptedIn,
    isConfigured,
    missingEnvKeys,
    embeddedSignupAllowedOriginsUrl,
  };
}

/**
 * Tooltip reason shown on the disabled "Sync from Meta" action: the busy
 * label during a sync, the missing-env-keys hint when no account or env
 * bootstrap can serve Meta sync, and no tooltip when the action is enabled.
 */
function resolveSyncDisabledReason(
  syncing: boolean,
  isConfigured: boolean,
  missingEnvKeys: readonly string[],
  whatsappLabels: WhatsappSettingsLabels["page"]
): string | undefined {
  if (syncing) return whatsappLabels.syncFromMetaBusy;
  if (!isConfigured) return whatsappLabels.syncFromMetaUnavailable(missingEnvKeys.join(", "));
  return undefined;
}

// ─── Dialog state hook ───────────────────────────────────────────────

function useWhatsappDialogs() {
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

  const openDeleteConfirmDialog = useCallback((accountId: string, displayName: string) => {
    setMutationError(null);
    setDialogState({ type: "deleteConfirm", accountId, displayName });
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
    openDeleteConfirmDialog,
    openEmbeddedSignupDialog,
    closeDialog,
  };
}

// ─── Snackbar hook ────────────────────────────────────────────────────

/** Module-level stable references for the `useSyncExternalStore` reads below. */
const NOOP_SUBSCRIBE = () => () => {};
const SERVER_SNAPSHOT_TRUE = () => true;

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

/**
 * Mounted-state availability check: Meta's FB SDK rejects `FB.login` on plain
 * HTTP pages, so the embedded-signup entry points surface a blocked state
 * instead of launching. `useSyncExternalStore` keeps the server HTML and the
 * first client render consistent (server snapshot reports supported).
 */
function useEmbeddedSignupBlocked(): boolean {
  return !useSyncExternalStore(NOOP_SUBSCRIBE, isEmbeddedSignupSupported, SERVER_SNAPSHOT_TRUE);
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
    purpose: input.purpose,
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

async function updatePurposeAction(
  accountId: string,
  purpose: WhatsappAccountPurpose,
  updatePurpose: (opts: { variables: { accountId: string; purpose: WhatsappAccountPurpose } }) => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  labels: Pick<WhatsappSettingsLabels["page"], "purposeUpdated" | "purposeUpdateFailed">,
  showSnackbar: SnackbarShow
): Promise<void> {
  try {
    await updatePurpose({ variables: { accountId, purpose } });
    await refetchAccounts();
    showSnackbar(labels.purposeUpdated, "success");
  } catch (error) {
    logger.error("Failed to update WhatsApp account purpose", { error });
    showSnackbar(labels.purposeUpdateFailed, "error");
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

  const handleUpdatePurpose = useWhatsappPurposeHandler({
    updatePurpose: mutations.updatePurpose,
    refetchAccounts: queries.accountsQuery.refetch,
    labels: labels.page,
    showSnackbar,
    setUpdatingId,
  });

  return { deletingId, updatingId, handleEditName, handleUpdatePurpose, handleDelete };
}

interface UseWhatsappPurposeHandlerArgs {
  updatePurpose: (opts: { variables: { accountId: string; purpose: WhatsappAccountPurpose } }) => Promise<unknown>;
  refetchAccounts: () => Promise<unknown>;
  labels: Pick<WhatsappSettingsLabels["page"], "purposeUpdated" | "purposeUpdateFailed">;
  showSnackbar: SnackbarShow;
  setUpdatingId: (value: string | null) => void;
}

function useWhatsappPurposeHandler({
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

// ─── Embedded signup handler ─────────────────────────────────────────

function useWhatsappEmbeddedSignupHandler({
  mutations,
  queries,
  labels,
  showSnackbar,
}: Pick<WhatsappHandlersArgs, "mutations" | "queries" | "labels" | "showSnackbar">) {
  const [embeddedSignupSubmitting, setEmbeddedSignupSubmitting] = useState(false);

  const handleEmbeddedSignupComplete = useCallback(
    async (payload: WhatsappEmbeddedSignupPayload) => {
      setEmbeddedSignupSubmitting(true);
      try {
        await mutations.completeEmbeddedSignup({
          variables: {
            input: {
              code: payload.code,
              wabaId: payload.wabaId,
              phoneNumberId: payload.phoneNumberId ?? null,
              businessId: payload.businessId ?? null,
            },
          },
        });
        await queries.accountsQuery.refetch();
        showSnackbar(labels.page.embeddedSignupSuccessTitle, "success");
      } catch (error) {
        logger.error("Failed to complete WhatsApp embedded signup", { error });
        showSnackbar(labels.notifications.saveError, "error");
        // Rethrow — the dialog maps a rejected completion onto its error phase.
        throw error;
      } finally {
        setEmbeddedSignupSubmitting(false);
      }
    },
    [mutations, queries, labels, showSnackbar]
  );

  return { embeddedSignupSubmitting, handleEmbeddedSignupComplete };
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
    // Snapshot the known numbers before syncing so the snackbar can report
    // how many were newly added versus already managed.
    const previousPhoneNumberIds = new Set(
      (queries.accountsQuery.data?.whatsappAccounts ?? [])
        .map(account => account.phoneNumberId)
        .filter((phoneNumberId): phoneNumberId is string => typeof phoneNumberId === "string" && phoneNumberId !== "")
    );
    await syncFromMetaAction(
      mutations.syncFromMeta,
      queries.accountsQuery.refetch,
      previousPhoneNumberIds,
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

// ─── Token test handler ──────────────────────────────────────────────

function useWhatsappTokenTestHandler(mutations: ReturnType<typeof useWhatsappMutations>) {
  const setTokenTest = useWhatsappTokenTestStore(store => store.setTokenTest);

  const handleTestToken = useCallback(
    async (accountId: string, token: string): Promise<WhatsappTokenTestState> => {
      try {
        const { data } = await mutations.testAccessToken({ variables: { id: accountId, accessToken: token } });
        const result = data?.testWhatsappAccessToken;
        const passed = result?.isValid === true && result?.isConnected === true;
        const state: WhatsappTokenTestState = passed ? "success" : "failed";
        setTokenTest(accountId, token, state);
        return state;
      } catch (error) {
        logger.error("Failed to test WhatsApp access token", { error });
        setTokenTest(accountId, token, "failed");
        return "failed";
      }
    },
    [mutations, setTokenTest]
  );

  return { handleTestToken };
}

// ─── Labels hook ─────────────────────────────────────────────────────

function useWhatsappLabels(whatsappLabels: WhatsappSettingsLabels["page"]): WhatsappSettingsLabels {
  return useMemo<WhatsappSettingsLabels>(
    () => ({
      page: whatsappLabels,
      notifications: {
        syncSuccess: whatsappLabels.syncSuccess,
        syncSuccessWithCounts: whatsappLabels.syncSuccessWithCounts,
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
  esConfigId: string | null;
  esAppId: string | null;
  embeddedSignupAllowedOriginsUrl: string | null;
  accounts: ReturnType<typeof useDerivedWhatsappData>["accounts"];
  templates: ReturnType<typeof useDerivedWhatsappData>["templates"];
  loading: boolean;
  queryError: boolean;
  isOptedIn: boolean;
  isConfigured: boolean;
  syncDisabledReason: string | undefined;
  createHandler: ReturnType<typeof useWhatsappCreateHandler>;
  updateDeleteHandlers: ReturnType<typeof useWhatsappUpdateDeleteHandlers>;
  utilityHandlers: ReturnType<typeof useWhatsappUtilityHandlers>;
  embeddedSignupHandler: ReturnType<typeof useWhatsappEmbeddedSignupHandler>;
  dialogState: WhatsappDialogState;
  mutationError: string | null;
  snackbar: WhatsappSnackbar;
  closeSnackbar: () => void;
  openCreateDialog: () => void;
  openEditNameDialog: (accountId: string, displayName: string, purpose: WhatsappAccountPurpose) => void;
  openEditTokenDialog: (accountId: string) => void;
  openEditPinDialog: (accountId: string) => void;
  openDeleteConfirmDialog: (accountId: string, displayName: string) => void;
  openEmbeddedSignupDialog: () => void;
  embeddedSignupBlocked: boolean;
  closeDialog: () => void;
  refetchAccounts: () => void;
  refetchTemplates: () => void;
  editingTokenForId: string | null;
  editingPinForId: string | null;
  handleTestToken: (accountId: string, token: string) => Promise<WhatsappTokenTestState>;
  tokenTestStates: Readonly<Record<string, Readonly<Record<string, WhatsappTokenTestState>>>>;
}

function buildWhatsappViewModel(p: WhatsappViewModelParts): WhatsappSettingsViewModel {
  return {
    labels: p.labels,
    esConfigId: p.esConfigId,
    esAppId: p.esAppId,
    embeddedSignupAllowedOriginsUrl: p.embeddedSignupAllowedOriginsUrl,
    embeddedSignupSubmitting: p.embeddedSignupHandler.embeddedSignupSubmitting,
    openEmbeddedSignupDialog: p.openEmbeddedSignupDialog,
    embeddedSignupBlocked: p.embeddedSignupBlocked,
    handleEmbeddedSignupComplete: p.embeddedSignupHandler.handleEmbeddedSignupComplete,
    accounts: p.accounts,
    templates: p.templates,
    loading: p.loading,
    queryError: p.queryError,
    isOptedIn: p.isOptedIn,
    isConfigured: p.isConfigured,
    syncDisabledReason: p.syncDisabledReason,
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
    validatePurpose,
    dialogState: p.dialogState,
    openCreateDialog: p.openCreateDialog,
    openEditNameDialog: p.openEditNameDialog,
    openEditTokenDialog: p.openEditTokenDialog,
    openEditPinDialog: p.openEditPinDialog,
    openDeleteConfirmDialog: p.openDeleteConfirmDialog,
    closeDialog: p.closeDialog,
    handleCreate: p.createHandler.handleCreate,
    handleEditName: p.updateDeleteHandlers.handleEditName,
    handleUpdatePurpose: p.updateDeleteHandlers.handleUpdatePurpose,
    handleDelete: p.updateDeleteHandlers.handleDelete,
    handleSubmitToken: p.utilityHandlers.handleSubmitToken,
    handleSubmitPin: p.utilityHandlers.handleSubmitPin,
    handleTestToken: p.handleTestToken,
    tokenTestStates: p.tokenTestStates,
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

// ─── Page-interaction state hook (dialog/snackbar/handlers stack) ────

function useWhatsappPageInteractions(
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
    openDeleteConfirmDialog,
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

  const { createHandler, updateDeleteHandlers, utilityHandlers } = useWhatsappHandlers({
    mutations,
    queries,
    labels,
    showSnackbar,
    closeDialog,
    setMutationError,
  });
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
    openDeleteConfirmDialog,
    openEmbeddedSignupDialog,
    embeddedSignupBlocked,
    closeDialog,
    createHandler,
    updateDeleteHandlers,
    utilityHandlers,
    embeddedSignupHandler,
    refetchAccounts,
    refetchTemplates,
    editingTokenForId,
    editingPinForId,
  };
}

// ─── Main hook ─────────────────────────────────────────────────────

export function useWhatsappSettingsViewModel(props?: {
  esConfigId?: string | null;
  esAppId?: string | null;
}): WhatsappSettingsViewModel {
  const esConfigId = props?.esConfigId ?? null;
  const esAppId = props?.esAppId ?? null;
  const whatsappLabels = useAppTranslation(Translation.Whatsapp);
  const queries = useWhatsappQueries();
  const mutations = useWhatsappMutations();
  const { handleTestToken } = useWhatsappTokenTestHandler(mutations);
  const tokenTestStates = useWhatsappTokenTestStore(store => store.tokenTests);

  const labels = useWhatsappLabels(whatsappLabels);
  const {
    accounts,
    templates,
    loading,
    queryError,
    isOptedIn,
    isConfigured,
    missingEnvKeys,
    embeddedSignupAllowedOriginsUrl,
  } = useDerivedWhatsappData(queries, mutations);
  const page = useWhatsappPageInteractions(queries, mutations, labels);
  const syncDisabledReason = resolveSyncDisabledReason(
    page.utilityHandlers.syncing,
    isConfigured,
    missingEnvKeys,
    whatsappLabels
  );

  return buildWhatsappViewModel({
    labels,
    esConfigId,
    esAppId,
    embeddedSignupAllowedOriginsUrl,
    accounts,
    templates,
    loading,
    isOptedIn,
    isConfigured,
    syncDisabledReason,
    queryError,
    createHandler: page.createHandler,
    updateDeleteHandlers: page.updateDeleteHandlers,
    utilityHandlers: page.utilityHandlers,
    embeddedSignupHandler: page.embeddedSignupHandler,
    dialogState: page.dialogState,
    mutationError: page.mutationError,
    snackbar: page.snackbar,
    closeSnackbar: page.closeSnackbar,
    openCreateDialog: page.openCreateDialog,
    openEditNameDialog: page.openEditNameDialog,
    openEditTokenDialog: page.openEditTokenDialog,
    openEditPinDialog: page.openEditPinDialog,
    openDeleteConfirmDialog: page.openDeleteConfirmDialog,
    openEmbeddedSignupDialog: page.openEmbeddedSignupDialog,
    embeddedSignupBlocked: page.embeddedSignupBlocked,
    closeDialog: page.closeDialog,
    refetchAccounts: page.refetchAccounts,
    refetchTemplates: page.refetchTemplates,
    editingTokenForId: page.editingTokenForId,
    editingPinForId: page.editingPinForId,
    handleTestToken,
    tokenTestStates,
  });
}
