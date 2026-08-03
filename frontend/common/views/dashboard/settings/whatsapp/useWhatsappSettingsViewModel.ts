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

export function useWhatsappSettingsViewModel(): WhatsappSettingsViewModel {
  const whatsappLabels = useAppTranslation(Translation.Whatsapp);
  const [snackbar, setSnackbar] = useState<WhatsappSnackbarState>(DEFAULT_SNACKBAR);
  const [syncing, setSyncing] = useState(false);
  const [optInLoading, setOptInLoading] = useState(false);

  const accountsQuery = useQuery(whatsappAccountsQueryDocument);
  const optInQuery = useQuery(isUserWhatsappOptInQueryDocument, {
    variables: { userId: CURRENT_USER },
  });
  const configuredQuery = useQuery(isWhatsappConfiguredQueryDocument);

  const [deleteAccount] = useMutation(deleteWhatsappAccountMutationDocument);
  const [setAccessToken] = useMutation(setWhatsappAccessTokenMutationDocument);
  const [setTwoStepPin] = useMutation(setWhatsappTwoStepPinMutationDocument);
  const [syncFromMeta, syncResult] = useMutation(syncWhatsappAccountsFromMetaMutationDocument);
  const [setOptIn] = useMutation(setUserWhatsappOptInMutationDocument);

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

  const accounts = accountsQuery.data?.whatsappAccounts ?? [];
  // Templates are only available after calling `syncWhatsappAccountsFromMeta`.
  // There is no separate GraphQL query for persisted templates — `whatsappAccountsQueryDocument`
  // fetches accounts only. This is a backend limitation: templates from a prior sync are not
  // persisted in a queryable form. Call `onSyncFromMeta` to populate templates.
  const templates = syncResult.data?.syncWhatsappAccountsFromMeta?.templates ?? [];
  const loading = accountsQuery.loading;
  const isOptedIn = optInQuery.data?.isUserWhatsappOptIn ?? false;
  const isConfigured = configuredQuery.data?.isWhatsappConfigured ?? false;

  const showSnackbar = useCallback((message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const onDismissSnackbar = useCallback(() => {
    setSnackbar(DEFAULT_SNACKBAR);
  }, []);

  const onDeleteAccount = useCallback(
    async (id: string) => {
      try {
        await deleteAccount({ variables: { id } });
        await accountsQuery.refetch();
        showSnackbar(labels.notifications.deleteSuccess, "success");
      } catch (error) {
        logger.error("Failed to delete WhatsApp account", { error });
        showSnackbar(labels.notifications.deleteError, "error");
      }
    },
    [deleteAccount, accountsQuery, labels.notifications.deleteSuccess, labels.notifications.deleteError, showSnackbar]
  );

  const onSetAccessToken = useCallback(
    async (id: string, accessToken: string) => {
      try {
        await setAccessToken({ variables: { id, accessToken } });
        await accountsQuery.refetch();
        showSnackbar(labels.notifications.saveSuccess, "success");
      } catch (error) {
        logger.error("Failed to set WhatsApp access token", { error });
        showSnackbar(labels.notifications.saveError, "error");
      }
    },
    [setAccessToken, accountsQuery, labels.notifications.saveSuccess, labels.notifications.saveError, showSnackbar]
  );

  const onSetTwoStepPin = useCallback(
    async (id: string, twoStepPin: string) => {
      try {
        await setTwoStepPin({ variables: { id, twoStepPin } });
        await accountsQuery.refetch();
        showSnackbar(labels.notifications.saveSuccess, "success");
      } catch (error) {
        logger.error("Failed to set WhatsApp two-step PIN", { error });
        showSnackbar(labels.notifications.saveError, "error");
      }
    },
    [setTwoStepPin, accountsQuery, labels.notifications.saveSuccess, labels.notifications.saveError, showSnackbar]
  );

  const onSyncFromMeta = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await syncFromMeta();
      const accountsResult = result.data?.syncWhatsappAccountsFromMeta?.accounts;
      await accountsQuery.refetch();
      if (accountsResult && accountsResult.length > 0) {
        showSnackbar(labels.notifications.syncSuccess, "success");
      } else {
        showSnackbar(labels.notifications.syncNoChange, "success");
      }
    } catch (error) {
      logger.error("Failed to sync from Meta", { error });
      showSnackbar(labels.notifications.syncError, "error");
    } finally {
      setSyncing(false);
    }
  }, [
    syncFromMeta,
    accountsQuery,
    labels.notifications.syncSuccess,
    labels.notifications.syncNoChange,
    labels.notifications.syncError,
    showSnackbar,
  ]);

  const onToggleOptIn = useCallback(
    async (enabled: boolean) => {
      setOptInLoading(true);
      try {
        await setOptIn({ variables: { userId: CURRENT_USER, enabled, source: "graphql" } });
        await optInQuery.refetch();
        showSnackbar(labels.notifications.optInSuccess, "success");
      } catch (error) {
        logger.error("Failed to toggle WhatsApp opt-in", { error });
        showSnackbar(labels.notifications.optInError, "error");
      } finally {
        setOptInLoading(false);
      }
    },
    [setOptIn, optInQuery, labels.notifications.optInSuccess, labels.notifications.optInError, showSnackbar]
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
