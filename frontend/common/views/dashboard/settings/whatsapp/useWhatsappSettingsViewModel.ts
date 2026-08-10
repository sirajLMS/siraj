"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import {
  deleteWhatsappAccountMutationDocument,
  isUserWhatsappOptInQueryDocument,
  isWhatsappConfiguredQueryDocument,
  setUserWhatsappOptInMutationDocument,
  setWhatsappAccessTokenMutationDocument,
  setWhatsappTwoStepPinMutationDocument,
  syncWhatsappAccountsFromMetaMutationDocument,
  whatsappAccountsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type {
  WhatsappSettingsLabels,
  WhatsappSettingsViewModel,
  WhatsappSnackbarState,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { CURRENT_USER } from "@/shared/constants/whatsapp-current-user";
import { Translation, useAppTranslation } from "@/shared/locale";

const DEFAULT_SNACKBAR: WhatsappSnackbarState = { open: false, message: "", severity: "success" };

type SnackbarShow = (message: string, severity: "success" | "error") => void;

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

  return { deleteAccount, setAccessToken, setTwoStepPin, syncFromMeta, syncResult, setOptIn };
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
  const isOptedIn = optInQuery.data?.isUserWhatsappOptIn ?? false;
  const isConfigured = configuredQuery.data?.isWhatsappConfigured ?? false;

  return { accounts, templates, loading, isOptedIn, isConfigured };
}

function useWhatsappCallbacks(
  queries: ReturnType<typeof useWhatsappQueries>,
  mutations: ReturnType<typeof useWhatsappMutations>,
  labels: WhatsappSettingsLabels,
  showSnackbar: SnackbarShow,
  setSyncing: (value: boolean) => void,
  setOptInLoading: (value: boolean) => void
) {
  const { accountsQuery, optInQuery } = queries;
  const { deleteAccount, setAccessToken, setTwoStepPin, syncFromMeta, setOptIn } = mutations;

  const onDeleteAccount = useCallback(
    (id: string) => deleteAccountAction(id, deleteAccount, accountsQuery.refetch, labels.notifications, showSnackbar),
    [deleteAccount, accountsQuery, labels.notifications, showSnackbar]
  );

  const onSetAccessToken = useCallback(
    (id: string, accessToken: string) =>
      setAccessTokenAction(id, accessToken, setAccessToken, accountsQuery.refetch, labels.notifications, showSnackbar),
    [setAccessToken, accountsQuery, labels.notifications, showSnackbar]
  );

  const onSetTwoStepPin = useCallback(
    (id: string, twoStepPin: string) =>
      setTwoStepPinAction(id, twoStepPin, setTwoStepPin, accountsQuery.refetch, labels.notifications, showSnackbar),
    [setTwoStepPin, accountsQuery, labels.notifications, showSnackbar]
  );

  const onSyncFromMeta = useCallback(
    () => syncFromMetaAction(syncFromMeta, accountsQuery.refetch, setSyncing, labels.notifications, showSnackbar),
    [syncFromMeta, accountsQuery, labels.notifications, showSnackbar, setSyncing]
  );

  const onToggleOptIn = useCallback(
    (enabled: boolean) =>
      toggleOptInAction(enabled, setOptIn, optInQuery.refetch, setOptInLoading, labels.notifications, showSnackbar),
    [setOptIn, optInQuery, labels.notifications, showSnackbar, setOptInLoading]
  );

  return { onDeleteAccount, onSetAccessToken, onSetTwoStepPin, onSyncFromMeta, onToggleOptIn };
}

export function useWhatsappSettingsViewModel(): WhatsappSettingsViewModel {
  const whatsappLabels = useAppTranslation(Translation.Whatsapp);
  const [snackbar, setSnackbar] = useState<WhatsappSnackbarState>(DEFAULT_SNACKBAR);
  const [syncing, setSyncing] = useState(false);
  const [optInLoading, setOptInLoading] = useState(false);

  const queries = useWhatsappQueries();
  const mutations = useWhatsappMutations();

  const labels = useMemo<WhatsappSettingsLabels>(
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

  const { accounts, templates, loading, isOptedIn, isConfigured } = useDerivedWhatsappData(queries, mutations);

  const showSnackbar = useCallback<SnackbarShow>((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const onDismissSnackbar = useCallback(() => {
    setSnackbar(DEFAULT_SNACKBAR);
  }, []);

  const { onDeleteAccount, onSetAccessToken, onSetTwoStepPin, onSyncFromMeta, onToggleOptIn } = useWhatsappCallbacks(
    queries,
    mutations,
    labels,
    showSnackbar,
    setSyncing,
    setOptInLoading
  );

  return {
    labels,
    accounts,
    templates,
    loading,
    syncing,
    optInLoading,
    isOptedIn,
    isConfigured,
    snackbar,
    onDeleteAccount,
    onSetAccessToken,
    onSetTwoStepPin,
    onSyncFromMeta,
    onToggleOptIn,
    onDismissSnackbar,
  };
}
