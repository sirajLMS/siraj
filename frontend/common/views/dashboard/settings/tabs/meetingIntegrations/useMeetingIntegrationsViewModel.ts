"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useEffect, useMemo } from "react";
import type { MeetingConnectionTestMode } from "@/frontend/common/graphql/generated/gql/graphql-types";
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
    slug: (provider.slug as ViewModelProviderSlug) ?? "zoom",
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
    mode: (result.mode as TestMeetingConnectionResult["mode"]) ?? "VALIDATE_CONFIG",
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
    status: (account.status as MeetingIntegrationConnectedAccount["status"]) ?? "CONNECTED",
  };
}

interface UseMeetingIntegrationsStoreAccess {
  expandedSlug: ViewModelProviderSlug | null;
  loadingAccountsFor: ViewModelProviderSlug | null;
  connectedAccountsByProvider: Readonly<Record<ViewModelProviderSlug, readonly MeetingIntegrationConnectedAccount[]>>;
  testingFor: ViewModelProviderSlug | null;
  lastTestResultByProvider: Readonly<Record<ViewModelProviderSlug, TestMeetingConnectionResult | null>>;
  revokingFor: { userId: string; providerSlug: ViewModelProviderSlug } | null;
  metadataDialogAccount: MeetingIntegrationConnectedAccount | null;
  metadataDialogProviderSlug: ViewModelProviderSlug | null;
  setExpandedSlug: (slug: ViewModelProviderSlug | null) => void;
  setLoadingAccountsFor: (slug: ViewModelProviderSlug | null) => void;
  setConnectedAccounts: (slug: ViewModelProviderSlug, accounts: readonly MeetingIntegrationConnectedAccount[]) => void;
  setTestingFor: (slug: ViewModelProviderSlug | null) => void;
  setLastTestResult: (slug: ViewModelProviderSlug, result: TestMeetingConnectionResult | null) => void;
  setRevokingFor: (value: { userId: string; providerSlug: ViewModelProviderSlug } | null) => void;
  setMetadataDialogAccount: (account: MeetingIntegrationConnectedAccount | null) => void;
  setMetadataDialogProviderSlug: (slug: ViewModelProviderSlug | null) => void;
}

function useMeetingIntegrationsStoreValues(): UseMeetingIntegrationsStoreAccess {
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

  return {
    expandedSlug,
    loadingAccountsFor,
    connectedAccountsByProvider,
    testingFor,
    lastTestResultByProvider,
    revokingFor,
    metadataDialogAccount,
    metadataDialogProviderSlug,
    setExpandedSlug,
    setLoadingAccountsFor,
    setConnectedAccounts,
    setTestingFor,
    setLastTestResult,
    setRevokingFor,
    setMetadataDialogAccount,
    setMetadataDialogProviderSlug,
  };
}

interface RunTestDeps {
  testConnection: ReturnType<typeof useMutation>[0];
  notifications: ReturnType<typeof useNotifications>;
  labels: SettingsMeetingIntegrationsLabels;
}

function buildRunTest(
  deps: RunTestDeps,
  store: Pick<UseMeetingIntegrationsStoreAccess, "setTestingFor" | "setLastTestResult">
) {
  const { testConnection, notifications, labels } = deps;

  return async (providerSlug: ViewModelProviderSlug, mode: MeetingConnectionTestMode) => {
    store.setTestingFor(providerSlug);

    try {
      const { data: testData } = await testConnection({
        variables: {
          input: {
            providerSlug,
            mode,
          },
        },
      });

      const result = mapTestResult(testData?.testMeetingProviderConnection);
      store.setLastTestResult(providerSlug, result);

      if (result?.ok) {
        notifications.show(labels.notifications.testSuccess, { severity: "success" });
      } else {
        notifications.show(labels.notifications.testError, { severity: "error" });
      }
    } catch (testError) {
      logger.error("Failed to test meeting provider connection", { providerSlug, error: testError });
      store.setLastTestResult(providerSlug, {
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
      store.setTestingFor(null);
    }
  };
}

interface RevokeAccountDeps {
  revokeToken: ReturnType<typeof useMutation>[0];
  notifications: ReturnType<typeof useNotifications>;
  labels: SettingsMeetingIntegrationsLabels;
  refetch: () => Promise<unknown>;
}

function buildRevokeAccount(deps: RevokeAccountDeps, store: Pick<UseMeetingIntegrationsStoreAccess, "setRevokingFor">) {
  const { revokeToken, notifications, labels, refetch } = deps;

  return async (userId: string, providerSlug: ViewModelProviderSlug) => {
    store.setRevokingFor({ userId, providerSlug });

    try {
      await revokeToken({
        variables: {
          input: {
            providerSlug,
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
      store.setRevokingFor(null);
    }
  };
}

function useConnectedAccountsSync(
  expandedSlug: ViewModelProviderSlug | null,
  store: Pick<UseMeetingIntegrationsStoreAccess, "setLoadingAccountsFor" | "setConnectedAccounts">
): void {
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
      store.setLoadingAccountsFor(expandedSlug);
      return;
    }

    const accounts = (connectedAccountsData?.meetingIntegrationConnectedAccounts ?? [])
      .filter((account): account is Operations.MeetingIntegrationConnectedAccountFieldsFragment => account != null)
      .map(mapConnectedAccount);

    store.setConnectedAccounts(expandedSlug, accounts);
    store.setLoadingAccountsFor(null);
  }, [connectedAccountsData?.meetingIntegrationConnectedAccounts, connectedAccountsLoading, expandedSlug, store]);
}

export function useMeetingIntegrationsViewModel(): MeetingIntegrationsViewModel {
  const labels = useAppTranslation(
    Translation.Dashboard.SettingsMeetingIntegrations
  );
  const locale = useAppLocale();
  const notifications = useNotifications();

  const store = useMeetingIntegrationsStoreValues();

  const { data, loading, error, refetch } = useMeetingIntegrationProvidersQuery();

  const providers = useMemo(() => (data?.meetingIntegrationProviders ?? []).map(mapProviderSummary), [data]);

  useConnectedAccountsSync(store.expandedSlug, store);

  const [testConnection] = useMutation(testMeetingProviderConnectionMutationDocument);
  const [revokeToken] = useMutation(adminRevokeMeetingProviderTokenMutationDocument);

  const runTest = useCallback(
    (providerSlug: ViewModelProviderSlug, mode: MeetingConnectionTestMode) =>
      buildRunTest({ testConnection, notifications, labels }, store)(providerSlug, mode),
    [testConnection, notifications, labels, store]
  );

  const revokeAccount = useCallback(
    (userId: string, providerSlug: ViewModelProviderSlug) =>
      buildRevokeAccount({ revokeToken, notifications, labels, refetch }, store)(userId, providerSlug),
    [revokeToken, notifications, labels, refetch, store]
  );

  const onMetadataDialogOpen = useCallback(
    (account: MeetingIntegrationConnectedAccount, providerSlug: ViewModelProviderSlug) => {
      store.setMetadataDialogAccount(account);
      store.setMetadataDialogProviderSlug(providerSlug);
    },
    [store]
  );

  const onMetadataDialogClose = useCallback(() => {
    store.setMetadataDialogAccount(null);
    store.setMetadataDialogProviderSlug(null);
  }, [store]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    labels,
    locale,
    loading,
    error: error ?? undefined,
    providers,
    expandedSlug: store.expandedSlug,
    onExpandedSlugChange: store.setExpandedSlug,
    connectedAccountsByProvider: store.connectedAccountsByProvider,
    loadingAccountsFor: store.loadingAccountsFor,
    testingFor: store.testingFor,
    lastTestResultByProvider: store.lastTestResultByProvider,
    revokingFor: store.revokingFor,
    metadataDialogAccount: store.metadataDialogAccount,
    metadataDialogProviderSlug: store.metadataDialogProviderSlug,
    runTest,
    revokeAccount,
    onMetadataDialogOpen,
    onMetadataDialogClose,
    refresh,
  };
}
