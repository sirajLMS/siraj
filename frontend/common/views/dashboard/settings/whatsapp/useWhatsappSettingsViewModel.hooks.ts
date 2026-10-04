"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import {
  completeWhatsappEmbeddedSignupMutationDocument,
  createWhatsappAccountMutationDocument,
  isUserWhatsappOptInQueryDocument,
  localDeactivateWhatsappAccountMutationDocument,
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
import type { WhatsappSettingsLabels } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { CURRENT_USER } from "@/shared/constants/whatsapp-current-user";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";

export function useWhatsappQueries() {
  const accountsQuery = useQuery(whatsappAccountsQueryDocument);
  const optInQuery = useQuery(isUserWhatsappOptInQueryDocument, {
    variables: { userId: CURRENT_USER },
  });
  const configuredQuery = useQuery(whatsappConfigurationStatusQueryDocument);
  const allowedOriginsQuery = useQuery(whatsappEmbeddedSignupAllowedOriginsUrlQueryDocument);

  return { accountsQuery, optInQuery, configuredQuery, allowedOriginsQuery };
}

export function useWhatsappMutations() {
  const [localDeactivateAccount] = useMutation(localDeactivateWhatsappAccountMutationDocument);
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
    localDeactivateAccount,
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

export function useDerivedWhatsappData(
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

export function useWhatsappLabels(
  whatsappLabels: WhatsappLabels,
  conversationsLabels: Pick<WhatsappConversationsLabels, "testNumberBadge" | "manageRecipients">
): WhatsappSettingsLabels {
  return useMemo<WhatsappSettingsLabels>(
    () => ({
      page: { ...whatsappLabels, ...conversationsLabels },
      notifications: {
        syncSuccess: whatsappLabels.syncSuccess,
        syncSuccessWithCounts: whatsappLabels.syncSuccessWithCounts,
        syncNoChange: whatsappLabels.syncNoChange,
        syncError: whatsappLabels.syncError,
        localDeactivateSuccess: whatsappLabels.localDeactivateSuccess,
        localDeactivateError: whatsappLabels.localDeactivateError,
        saveSuccess: whatsappLabels.saveSuccess,
        saveError: whatsappLabels.saveError,
        optInSuccess: whatsappLabels.optInEnabled,
        optInError: whatsappLabels.optInError,
      },
    }),
    [whatsappLabels, conversationsLabels]
  );
}

/**
 * Refetch helpers for the settings tab. `refetchTemplates` delegates to the
 * accounts refetch because templates only exist inside the Apollo cache entry
 * written by the `syncWhatsappAccountsFromMeta` mutation — there is no
 * dedicated templates query on this tab, so the snapshot from the last sync
 * is what persists between syncs.
 */
export function useRefetchers(queries: ReturnType<typeof useWhatsappQueries>) {
  const refetchAccounts = useCallback(() => {
    void queries.accountsQuery.refetch();
  }, [queries]);
  const refetchTemplates = useCallback(() => {
    void queries.accountsQuery.refetch();
  }, [queries]);
  return { refetchAccounts, refetchTemplates };
}
