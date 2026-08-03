"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useEffect, useMemo } from "react";
import type {
  MeetingConnectionTestMode,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import {
  adminRevokeMeetingProviderTokenMutationDocument,
  meetingIntegrationConnectedAccountsQueryDocument,
  testMeetingProviderConnectionMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/meeting-integrations.documents";
import { useMeetingIntegrationProvidersQuery } from "@/frontend/common/hooks/settings";
import { useMeetingIntegrationsSettingsStore } from "@/frontend/common/stores/meetingIntegrationsSettingsStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  MeetingIntegrationConnectedAccount,
  MeetingIntegrationProviderSummary,
  MeetingIntegrationsViewModel,
  TestMeetingConnectionResult,
  MeetingIntegrationProviderSlug as ViewModelProviderSlug,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

function mapProviderSummary(
  provider: Operations.MeetingIntegrationProviderFieldsFragment
): MeetingIntegrationProviderSummary {
  return {
    id: provider.id ?? "",
    slug: (provider.slug ?? "zoom") as ViewModelProviderSlug,
    kind: provider.kind ?? "unknown",
    credentialsHealthy: provider.credentialsHealthy ?? false,
    lastTestedAt: provider.lastTestedAt ? new Date(provider.lastTestedAt) : null,
    connectedTeacherCount: provider.connectedTeacherCount ?? 0,
    reauthNeededCount: provider.reauthNeededCount ?? 0,
    endpoints: provider.endpoints ?? [],
  };
}

function mapTestResult(
  result: Operations.TestMeetingConnectionResultFieldsFragment | null | undefined
): TestMeetingConnectionResult | null {
  if (!result) {
    return null;
  }

  return {
    ok: result.ok ?? false,
    latencyMs: result.latencyMs ?? 0,
    mode: (result.mode ?? "VALIDATE_CONFIG") as MeetingConnectionTestMode,
    testJoinUrl: result.testJoinUrl,
    deleted: result.deleted,
    upstreamResponseSummary: result.upstreamResponseSummary ?? "",
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
    rawUpstreamPayload: (result.rawUpstreamPayload as Record<string, unknown> | null) ?? null,
    requiredScopes: result.requiredScopes ?? null,
    grantedScopes: result.grantedScopes ?? null,
  };
}

function mapConnectedAccount(
  account: Operations.MeetingIntegrationConnectedAccountFieldsFragment
): MeetingIntegrationConnectedAccount {
  return {
    id: account.id ?? "",
    userId: account.userId ?? "",
    name: account.name,
    email: account.email,
    connectedAt: account.connectedAt ? new Date(account.connectedAt) : null,
    expiresAt: account.expiresAt ? new Date(account.expiresAt) : null,
    lastRefreshedAt: account.lastRefreshedAt ? new Date(account.lastRefreshedAt) : null,
    status: (account.status ?? "CONNECTED") as MeetingIntegrationConnectedAccount["status"],
  };
}

export function useMeetingIntegrationsViewModel(): MeetingIntegrationsViewModel {
  const labels = useAppTranslation(
    Translation.Dashboard.SettingsMeetingIntegrations
  ) as SettingsMeetingIntegrationsLabels;
  const locale = useAppLocale();
  const notifications = useNotifications();

  const expandedSlug = useMeetingIntegrationsSettingsStore(state => state.expandedSlug);
  const loadingAccountsFor = useMeetingIntegrationsSettingsStore(state => state.loadingAccountsFor);
  const connectedAccountsByProvider = useMeetingIntegrationsSettingsStore(state => state.connectedAccountsByProvider);
  const testingFor = useMeetingIntegrationsSettingsStore(state => state.testingFor);
  const lastTestResultByProvider = useMeetingIntegrationsSettingsStore(state => state.lastTestResultByProvider);
  const revokingFor = useMeetingIntegrationsSettingsStore(state => state.revokingFor);
  const metadataDialogAccount = useMeetingIntegrationsSettingsStore(state => state.metadataDialogAccount);
  const metadataDialogProviderSlug = useMeetingIntegrationsSettingsStore(state => state.metadataDialogProviderSlug);
  const setExpandedSlug = useMeetingIntegrationsSettingsStore(state => state.setExpandedSlug);
  const setLoadingAccountsFor = useMeetingIntegrationsSettingsStore(state => state.setLoadingAccountsFor);
  const setConnectedAccounts = useMeetingIntegrationsSettingsStore(state => state.setConnectedAccounts);
  const setTestingFor = useMeetingIntegrationsSettingsStore(state => state.setTestingFor);
  const setLastTestResult = useMeetingIntegrationsSettingsStore(state => state.setLastTestResult);
  const setRevokingFor = useMeetingIntegrationsSettingsStore(state => state.setRevokingFor);
  const setMetadataDialogAccount = useMeetingIntegrationsSettingsStore(state => state.setMetadataDialogAccount);
  const setMetadataDialogProviderSlug = useMeetingIntegrationsSettingsStore(
    state => state.setMetadataDialogProviderSlug
  );

  const { data, loading, error, refetch } = useMeetingIntegrationProvidersQuery();

  const providers = useMemo(() => (data?.meetingIntegrationProviders ?? []).map(mapProviderSummary), [data]);

  // Fire one connected-accounts query for the currently-expanded provider (stateful useQuery, skip until expanded).
  const { data: connectedAccountsData, loading: connectedAccountsLoading } = useQuery(
    meetingIntegrationConnectedAccountsQueryDocument,
    {
      fetchPolicy: "cache-and-network",
      skip: expandedSlug === null,
      variables: { providerSlug: expandedSlug ?? "zoom" },
    }
  );

  useEffect(() => {
    if (expandedSlug === null) {
      return;
    }

    if (connectedAccountsLoading) {
      setLoadingAccountsFor(expandedSlug);
      return;
    }

    const accounts = (connectedAccountsData?.meetingIntegrationConnectedAccounts ?? [])
      .filter((account): account is Operations.MeetingIntegrationConnectedAccountFieldsFragment => account != null)
      .map(mapConnectedAccount);

    setConnectedAccounts(expandedSlug, accounts);
    setLoadingAccountsFor(null);
  }, [
    connectedAccountsData?.meetingIntegrationConnectedAccounts,
    connectedAccountsLoading,
    expandedSlug,
    setLoadingAccountsFor,
    setConnectedAccounts,
  ]);

  const [testConnection] = useMutation(testMeetingProviderConnectionMutationDocument);
  const [revokeToken] = useMutation(adminRevokeMeetingProviderTokenMutationDocument);

  const runTest = useCallback(
    async (providerSlug: ViewModelProviderSlug, mode: MeetingConnectionTestMode) => {
      setTestingFor(providerSlug);

      try {
        const { data: testData } = await testConnection({
          variables: {
            input: {
              providerSlug: providerSlug as MeetingIntegrationProviderSlug,
              mode: mode as MeetingConnectionTestMode,
            },
          },
        });

        const result = mapTestResult(testData?.testMeetingProviderConnection);
        setLastTestResult(providerSlug, result);

        if (result?.ok) {
          notifications.show(labels.notifications.testSuccess, { severity: "success" });
        } else {
          notifications.show(labels.notifications.testError, { severity: "error" });
        }
      } catch (testError) {
        logger.error("Failed to test meeting provider connection", { providerSlug, error: testError });
        setLastTestResult(providerSlug, {
          ok: false,
          latencyMs: 0,
          mode,
          testJoinUrl: null,
          deleted: null,
          upstreamResponseSummary: "",
          errorCode: "TEST_FAILED",
          errorMessage: testError instanceof Error ? testError.message : String(testError),
          rawUpstreamPayload: null,
          requiredScopes: null,
          grantedScopes: null,
        });
        notifications.show(labels.notifications.testError, { severity: "error" });
      } finally {
        setTestingFor(null);
      }
    },
    [
      labels.notifications.testError,
      labels.notifications.testSuccess,
      notifications,
      setLastTestResult,
      setTestingFor,
      testConnection,
    ]
  );

  const revokeAccount = useCallback(
    async (userId: string, providerSlug: ViewModelProviderSlug) => {
      setRevokingFor({ userId, providerSlug });

      try {
        await revokeToken({
          variables: {
            input: {
              providerSlug: providerSlug as MeetingIntegrationProviderSlug,
              userId,
            },
          },
        });
        await refetch();
        notifications.show(labels.notifications.revokeSuccess, { severity: "success" });
      } catch (revokeError) {
        logger.error("Failed to revoke meeting provider token", { userId, providerSlug, error: revokeError });
        notifications.show(labels.notifications.revokeError, { severity: "error" });
      } finally {
        setRevokingFor(null);
      }
    },
    [
      labels.notifications.revokeError,
      labels.notifications.revokeSuccess,
      notifications,
      refetch,
      revokeToken,
      setRevokingFor,
    ]
  );

  const onMetadataDialogOpen = useCallback(
    (account: MeetingIntegrationConnectedAccount, providerSlug: ViewModelProviderSlug) => {
      setMetadataDialogAccount(account);
      setMetadataDialogProviderSlug(providerSlug);
    },
    [setMetadataDialogAccount, setMetadataDialogProviderSlug]
  );

  const onMetadataDialogClose = useCallback(() => {
    setMetadataDialogAccount(null);
    setMetadataDialogProviderSlug(null);
  }, [setMetadataDialogAccount, setMetadataDialogProviderSlug]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    labels,
    locale,
    loading,
    error: error ?? undefined,
    providers,
    expandedSlug,
    onExpandedSlugChange: setExpandedSlug,
    connectedAccountsByProvider,
    loadingAccountsFor,
    testingFor,
    lastTestResultByProvider,
    revokingFor,
    metadataDialogAccount,
    metadataDialogProviderSlug,
    runTest,
    revokeAccount,
    onMetadataDialogOpen,
    onMetadataDialogClose,
    refresh,
  };
}
