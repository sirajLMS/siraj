import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useRef } from "react";
import type { MeetingIntegrationConnectedAccountFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { meetingIntegrationConnectedAccountsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/meeting-integrations.documents";
import { useMeetingIntegrationsSettingsStore } from "@/frontend/common/stores/meetingIntegrationsSettingsStore";
import { mapConnectedAccount } from "@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel.helpers";
import type {
  MeetingIntegrationConnectedAccount,
  TestMeetingConnectionResult,
  MeetingIntegrationProviderSlug as ViewModelProviderSlug,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

export interface UseMeetingIntegrationsStoreAccess {
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

export function useMeetingIntegrationsStoreValues(): UseMeetingIntegrationsStoreAccess {
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

export function useConnectedAccountsSync(
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
        .filter((account): account is MeetingIntegrationConnectedAccountFieldsFragment => account != null)
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
