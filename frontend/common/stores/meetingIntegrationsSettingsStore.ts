import { create } from "zustand";
import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  MeetingIntegrationConnectedAccount,
  TestMeetingConnectionResult,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

interface MeetingIntegrationsSettingsUiState {
  readonly expandedSlug: MeetingIntegrationProviderSlug | null;
  readonly loadingAccountsFor: MeetingIntegrationProviderSlug | null;
  readonly connectedAccountsByProvider: Readonly<
    Record<MeetingIntegrationProviderSlug, readonly MeetingIntegrationConnectedAccount[]>
  >;
  readonly testingFor: MeetingIntegrationProviderSlug | null;
  readonly lastTestResultByProvider: Readonly<Record<string, TestMeetingConnectionResult | null>>;
  readonly revokingFor: { userId: string; providerSlug: MeetingIntegrationProviderSlug } | null;
  readonly metadataDialogAccount: MeetingIntegrationConnectedAccount | null;
  readonly metadataDialogProviderSlug: MeetingIntegrationProviderSlug | null;
  readonly setExpandedSlug: (slug: MeetingIntegrationProviderSlug | null) => void;
  readonly setLoadingAccountsFor: (slug: MeetingIntegrationProviderSlug | null) => void;
  readonly setConnectedAccounts: (
    slug: MeetingIntegrationProviderSlug,
    accounts: readonly MeetingIntegrationConnectedAccount[]
  ) => void;
  readonly setTestingFor: (slug: MeetingIntegrationProviderSlug | null) => void;
  readonly setLastTestResult: (
    slug: MeetingIntegrationProviderSlug,
    result: TestMeetingConnectionResult | null
  ) => void;
  readonly setRevokingFor: (value: { userId: string; providerSlug: MeetingIntegrationProviderSlug } | null) => void;
  readonly setMetadataDialogAccount: (account: MeetingIntegrationConnectedAccount | null) => void;
  readonly setMetadataDialogProviderSlug: (slug: MeetingIntegrationProviderSlug | null) => void;
  readonly reset: () => void;
}

const initialState = {
  expandedSlug: MeetingIntegrationProviderSlug.Zoom as MeetingIntegrationProviderSlug | null,
  loadingAccountsFor: null as MeetingIntegrationProviderSlug | null,
  connectedAccountsByProvider: {} as Record<
    MeetingIntegrationProviderSlug,
    readonly MeetingIntegrationConnectedAccount[]
  >,
  testingFor: null as MeetingIntegrationProviderSlug | null,
  lastTestResultByProvider: {} as Record<string, TestMeetingConnectionResult | null>,
  revokingFor: null as { userId: string; providerSlug: MeetingIntegrationProviderSlug } | null,
  metadataDialogAccount: null as MeetingIntegrationConnectedAccount | null,
  metadataDialogProviderSlug: null as MeetingIntegrationProviderSlug | null,
};

export const useMeetingIntegrationsSettingsStore = create<MeetingIntegrationsSettingsUiState>(set => ({
  ...initialState,
  setExpandedSlug: slug => set({ expandedSlug: slug }),
  setLoadingAccountsFor: slug => set({ loadingAccountsFor: slug }),
  setConnectedAccounts: (slug, accounts) =>
    set(state => ({
      connectedAccountsByProvider: { ...state.connectedAccountsByProvider, [slug]: accounts },
    })),
  setTestingFor: slug => set({ testingFor: slug }),
  setLastTestResult: (slug, result) =>
    set(state => ({
      lastTestResultByProvider: { ...state.lastTestResultByProvider, [slug]: result },
    })),
  setRevokingFor: value => set({ revokingFor: value }),
  setMetadataDialogAccount: account => set({ metadataDialogAccount: account }),
  setMetadataDialogProviderSlug: slug => set({ metadataDialogProviderSlug: slug }),
  reset: () => set(initialState),
}));
