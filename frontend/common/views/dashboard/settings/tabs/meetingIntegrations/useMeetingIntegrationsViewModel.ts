"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  AppPermission,
  MeetingConnectionTestMode,
  MeetingIntegrationConnectedAccountStatus,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { connectMeetingProviderOAuthMutationDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import {
  adminRevokeMeetingProviderTokenMutationDocument,
  meetingIntegrationConnectedAccountsQueryDocument,
  testMeetingProviderConnectionMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/meeting-integrations.documents";
import { useMeetingIntegrationProvidersQuery } from "@/frontend/common/hooks/settings";
import {
  MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION,
  useMeetingIntegrationsSettingsStore,
} from "@/frontend/common/stores/meetingIntegrationsSettingsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
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

function isMeetingIntegrationProviderSlug(value: string | null | undefined): value is MeetingIntegrationProviderSlug {
  return (
    value === MeetingIntegrationProviderSlug.Zoom ||
    value === MeetingIntegrationProviderSlug.GoogleMeet ||
    value === MeetingIntegrationProviderSlug.MicrosoftTeams
  );
}

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mapProviderSummary(
  provider: Operations.MeetingIntegrationProviderFieldsFragment
): MeetingIntegrationProviderSummary {
  return {
    id: provider.id ?? "",
    slug: isMeetingIntegrationProviderSlug(provider.slug) ? provider.slug : MeetingIntegrationProviderSlug.Zoom,
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
    mode: result.mode ?? MeetingConnectionTestMode.ValidateConfig,
    testJoinUrl: result.testJoinUrl,
    deleted: result.deleted,
    upstreamResponseSummary: result.upstreamResponseSummary ?? "",
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
    rawUpstreamPayload: isStringRecord(result.rawUpstreamPayload) ? result.rawUpstreamPayload : null,
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
    status: account.status ?? MeetingIntegrationConnectedAccountStatus.Connected,
  };
}

interface UseMeetingIntegrationsStoreAccess {
  expandedSlug: ViewModelProviderSlug | null;
  loadingAccountsFor: ViewModelProviderSlug | null;
  connectedAccountsByProvider: Readonly<
    Partial<Record<ViewModelProviderSlug, readonly MeetingIntegrationConnectedAccount[]>>
  >;
  testingFor: ViewModelProviderSlug | null;
  lastTestResultByProvider: Readonly<Record<ViewModelProviderSlug, TestMeetingConnectionResult | null>>;
  revokingFor: { userId: string; providerSlug: ViewModelProviderSlug } | null;
  metadataDialogAccount: MeetingIntegrationConnectedAccount | null;
  metadataDialogProviderSlug: ViewModelProviderSlug | null;
  connectingProviderSlug: ViewModelProviderSlug | null;
  connectErrorFor: Readonly<Partial<Record<ViewModelProviderSlug, string | null>>>;
  canViewProfile: boolean;
  setExpandedSlug: (slug: ViewModelProviderSlug | null) => void;
  setLoadingAccountsFor: (slug: ViewModelProviderSlug | null) => void;
  setConnectedAccounts: (slug: ViewModelProviderSlug, accounts: readonly MeetingIntegrationConnectedAccount[]) => void;
  setTestingFor: (slug: ViewModelProviderSlug | null) => void;
  setLastTestResult: (slug: ViewModelProviderSlug, result: TestMeetingConnectionResult | null) => void;
  setRevokingFor: (value: { userId: string; providerSlug: ViewModelProviderSlug } | null) => void;
  setMetadataDialogAccount: (account: MeetingIntegrationConnectedAccount | null) => void;
  setMetadataDialogProviderSlug: (slug: ViewModelProviderSlug | null) => void;
  setConnectingProviderSlug: (slug: ViewModelProviderSlug | null) => void;
  setConnectErrorFor: (slug: ViewModelProviderSlug, error: string | null) => void;
  setCanViewProfile: (value: boolean) => void;
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
  const connectingProviderSlug = useMeetingIntegrationsSettingsStore(state => state.connectingProviderSlug);
  const connectErrorFor = useMeetingIntegrationsSettingsStore(state => state.connectErrorFor);
  const canViewProfile = useMeetingIntegrationsSettingsStore(state => state.canViewProfile);
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
  const setConnectingProviderSlug = useMeetingIntegrationsSettingsStore(state => state.setConnectingProviderSlug);
  const setConnectErrorFor = useMeetingIntegrationsSettingsStore(state => state.setConnectErrorFor);
  const setCanViewProfile = useMeetingIntegrationsSettingsStore(state => state.setCanViewProfile);

  return {
    expandedSlug,
    loadingAccountsFor,
    connectedAccountsByProvider,
    testingFor,
    lastTestResultByProvider,
    revokingFor,
    metadataDialogAccount,
    metadataDialogProviderSlug,
    connectingProviderSlug,
    connectErrorFor,
    canViewProfile,
    setExpandedSlug,
    setLoadingAccountsFor,
    setConnectedAccounts,
    setTestingFor,
    setLastTestResult,
    setRevokingFor,
    setMetadataDialogAccount,
    setMetadataDialogProviderSlug,
    setConnectingProviderSlug,
    setConnectErrorFor,
    setCanViewProfile,
  };
}

interface ConnectProviderDeps {
  connectOAuth: ReturnType<typeof useMutation>[0];
  notifications: ReturnType<typeof useNotifications>;
  labels: SettingsMeetingIntegrationsLabels;
}

function buildConnectProvider(
  deps: ConnectProviderDeps,
  store: Pick<UseMeetingIntegrationsStoreAccess, "setConnectingProviderSlug" | "setConnectErrorFor">
) {
  const { connectOAuth, notifications, labels } = deps;

  return async (providerSlug: ViewModelProviderSlug) => {
    store.setConnectingProviderSlug(providerSlug);
    store.setConnectErrorFor(providerSlug, null);

    try {
      const returnPath = globalThis.window?.location?.pathname ?? "/";
      const { data } = await connectOAuth({
        variables: {
          input: {
            providerSlug,
            returnPath,
          },
        },
      });

      const authorizeUrl = data?.connectMeetingProviderOAuth?.authorizeUrl;
      if (authorizeUrl && globalThis.window) {
        globalThis.window.location.href = authorizeUrl;
        return;
      }

      // No authorizeUrl returned — treat as an error.
      const errorMsg = labels.connectProviderError;
      store.setConnectErrorFor(providerSlug, errorMsg);
      notifications.show(errorMsg, { severity: "error" });
    } catch (connectError) {
      logger.error("Failed to connect meeting provider OAuth", { providerSlug, error: connectError });
      const errorMsg = labels.connectProviderError;
      store.setConnectErrorFor(providerSlug, errorMsg);
      notifications.show(errorMsg, { severity: "error" });
    } finally {
      store.setConnectingProviderSlug(null);
    }
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
  store: Pick<
    UseMeetingIntegrationsStoreAccess,
    "connectedAccountsByProvider" | "setLoadingAccountsFor" | "setConnectedAccounts"
  >
): void {
  const { data: connectedAccountsData, loading: connectedAccountsLoading } = useQuery(
    meetingIntegrationConnectedAccountsQueryDocument,
    {
      fetchPolicy: "cache-and-network",
      skip: expandedSlug === null,
      variables: { providerSlug: expandedSlug ?? "zoom" },
    }
  );

  // Memoize the mapped accounts so the reference is stable across Apollo cache
  // ticks (cache-and-network returns new object refs even when content is
  // unchanged). Without this, the sync effect loops: data tick → set → re-render
  // → new data ref → set again → "Maximum update depth exceeded".
  const accounts = useMemo(
    () =>
      (connectedAccountsData?.meetingIntegrationConnectedAccounts ?? [])
        .filter((account): account is Operations.MeetingIntegrationConnectedAccountFieldsFragment => account != null)
        .map(mapConnectedAccount),
    [connectedAccountsData?.meetingIntegrationConnectedAccounts]
  );

  // Track the last accounts we wrote to the store so we only push when the
  // content actually changes — prevents the set → re-render → set loop.
  const lastSyncedRef = useRef<{ slug: ViewModelProviderSlug; signature: string } | null>(null);

  useEffect(() => {
    if (expandedSlug === null) {
      return;
    }

    if (connectedAccountsLoading) {
      store.setLoadingAccountsFor(expandedSlug);
      return;
    }

    // Build a stable content signature so we don't re-set identity-equal data.
    const signature = accounts
      .map(a => `${a.id}|${a.status}|${a.expiresAt?.getTime() ?? ""}|${a.lastRefreshedAt?.getTime() ?? ""}`)
      .join("\n");

    if (lastSyncedRef.current?.slug === expandedSlug && lastSyncedRef.current.signature === signature) {
      return;
    }

    lastSyncedRef.current = { slug: expandedSlug, signature };
    store.setConnectedAccounts(expandedSlug, accounts);
    store.setLoadingAccountsFor(null);
  }, [accounts, connectedAccountsLoading, expandedSlug, store]);
}

interface UseMeetingIntegrationsActionsParams {
  readonly store: ReturnType<typeof useMeetingIntegrationsStoreValues>;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly refetch: () => Promise<unknown>;
  readonly router: ReturnType<typeof useRouter>;
}

function useMeetingIntegrationsActions({
  store,
  notifications,
  labels,
  refetch,
  router,
}: UseMeetingIntegrationsActionsParams) {
  const [testConnection] = useMutation(testMeetingProviderConnectionMutationDocument);
  const [revokeToken] = useMutation(adminRevokeMeetingProviderTokenMutationDocument);
  const [connectOAuth] = useMutation(connectMeetingProviderOAuthMutationDocument);

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

  const connectProvider = useCallback(
    (providerSlug: ViewModelProviderSlug) =>
      buildConnectProvider({ connectOAuth, notifications, labels }, store)(providerSlug),
    [connectOAuth, notifications, labels, store]
  );

  const navigateToProfile = useCallback(() => {
    router.push("/profile?tab=meeting");
  }, [router]);

  return {
    runTest,
    revokeAccount,
    onMetadataDialogOpen,
    onMetadataDialogClose,
    refresh,
    connectProvider,
    navigateToProfile,
  };
}

export function useMeetingIntegrationsViewModel(): MeetingIntegrationsViewModel {
  const router = useRouter();
  const labels = useAppTranslation(Translation.Dashboard.SettingsMeetingIntegrations);
  const locale = useAppLocale();
  const notifications = useNotifications();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canEdit = hasPermission(AppPermission.SettingsEditMeetingIntegrations);

  const store = useMeetingIntegrationsStoreValues();
  const { data, loading, error, refetch } = useMeetingIntegrationProvidersQuery();
  const providers = useMemo(() => {
    const seen = new Set<string>();
    return (data?.meetingIntegrationProviders ?? [])
      .filter(provider => {
        if (provider.slug == null || seen.has(provider.slug)) {
          return false;
        }
        seen.add(provider.slug);
        return true;
      })
      .map(mapProviderSummary);
  }, [data]);

  useConnectedAccountsSync(store.expandedSlug, store);

  useEffect(() => {
    const permitted = hasPermission(MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION);
    if (store.canViewProfile !== permitted) {
      store.setCanViewProfile(permitted);
    }
  }, [hasPermission, store]);

  const actions = useMeetingIntegrationsActions({ store, notifications, labels, refetch, router });

  return {
    labels,
    locale,
    loading,
    error: error ?? undefined,
    canEdit,
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
    runTest: actions.runTest,
    revokeAccount: actions.revokeAccount,
    onMetadataDialogOpen: actions.onMetadataDialogOpen,
    onMetadataDialogClose: actions.onMetadataDialogClose,
    connectingFor: store.connectingProviderSlug,
    connectErrorFor: store.connectErrorFor,
    connectProvider: actions.connectProvider,
    navigateToProfile: actions.navigateToProfile,
    canViewProfile: store.canViewProfile,
    refresh: actions.refresh,
  };
}
