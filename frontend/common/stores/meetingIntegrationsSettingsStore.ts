"use client";

import { create } from "zustand";
import {
  AppPermission,
  type MeetingIntegrationConnectedAccountStatus,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  CredentialFormMode,
  TestConnectionResult,
} from "@/frontend/common/views/dashboard/settings/types/meeting-ui.types";
import type {
  MeetingIntegrationConnectedAccount,
  MeetingIntegrationProviderSummary,
  TestMeetingConnectionResult,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

/**
 * Permission enum member that gates the cross-navigation `ProfileLinkCallout`
 * on the settings meeting-integrations tab. Exported so the ViewModel (Task 29)
 * can seed `canViewProfile` via `useUserStore(s => s.hasPermission(MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION))`
 * without duplicating the enum value as a bare string literal.
 */
export const MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION = AppPermission.SettingsEditMeetingIntegrations;

interface MeetingIntegrationsSettingsUiState {
  readonly expandedSlug: MeetingIntegrationProviderSlug | null;
  readonly loadingAccountsFor: MeetingIntegrationProviderSlug | null;
  readonly connectedAccountsByProvider: Readonly<
    Partial<Record<MeetingIntegrationProviderSlug, readonly MeetingIntegrationConnectedAccount[]>>
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

  // ---
  // New fields (Task 28)
  // ---

  /** Provider slug currently being tested (new canonical name for `testingFor`). */
  readonly testingProviderSlug: MeetingIntegrationProviderSlug | null;
  /** Connected account id currently being revoked (string id, decoupled from userId). */
  readonly revokingAccountId: string | null;
  /** Provider slug currently initiating the OAuth connect flow from the settings tab. */
  readonly connectingProviderSlug: MeetingIntegrationProviderSlug | null;
  /** Error messages keyed by provider slug for the connect flow. */
  readonly connectErrorFor: Readonly<Partial<Record<MeetingIntegrationProviderSlug, string | null>>>;
  /** Last test-connection result shared across the panel (nullable until a test completes). */
  readonly testConnectionResult: TestConnectionResult | null;
  /** Account id targeted by the TokenMetadataDialog (resolved to an account object by the ViewModel). */
  readonly metadataDialogAccountId: string | null;
  /** Provider summary currently loaded into the credential form dialog (create/edit). */
  readonly credentialFormProvider: MeetingIntegrationProviderSummary | null;
  /** Whether the credential form dialog is creating or editing credentials. */
  readonly credentialFormMode: CredentialFormMode;
  /** Whether the current user may see the cross-navigation ProfileLinkCallout.
   * Seeded by the ViewModel via `useUserStore(s => s.hasPermission(MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION))`.
   * Defaults to `false` (deny by default) and is re-checked whenever the user/session changes.
   */
  readonly canViewProfile: boolean;

  readonly setTestingProviderSlug: (slug: MeetingIntegrationProviderSlug | null) => void;
  readonly setRevokingAccountId: (accountId: string | null) => void;
  readonly setConnectingProviderSlug: (slug: MeetingIntegrationProviderSlug | null) => void;
  readonly setConnectErrorFor: (slug: MeetingIntegrationProviderSlug, error: string | null) => void;
  readonly setTestConnectionResult: (result: TestConnectionResult | null) => void;
  readonly setMetadataDialogAccountId: (accountId: string | null) => void;
  readonly setCredentialFormProvider: (provider: MeetingIntegrationProviderSummary | null) => void;
  readonly setCredentialFormMode: (mode: CredentialFormMode) => void;
  readonly setCanViewProfile: (value: boolean) => void;

  /**
   * Connected-accounts table filter state, keyed by provider so each accordion
   * section keeps its own search/status filter across viewport-tier switches.
   */
  readonly connectedAccountsSearchByProvider: Readonly<Partial<Record<MeetingIntegrationProviderSlug, string>>>;
  readonly connectedAccountsStatusFilterByProvider: Readonly<
    Partial<Record<MeetingIntegrationProviderSlug, MeetingIntegrationConnectedAccountStatus | "all">>
  >;
  readonly setConnectedAccountsSearch: (slug: MeetingIntegrationProviderSlug, search: string) => void;
  readonly setConnectedAccountsStatusFilter: (
    slug: MeetingIntegrationProviderSlug,
    status: MeetingIntegrationConnectedAccountStatus | "all"
  ) => void;
}

const initialState = {
  expandedSlug: MeetingIntegrationProviderSlug.Zoom as MeetingIntegrationProviderSlug | null,
  loadingAccountsFor: null as MeetingIntegrationProviderSlug | null,
  connectedAccountsByProvider: {} as Partial<
    Record<MeetingIntegrationProviderSlug, readonly MeetingIntegrationConnectedAccount[]>
  >,
  testingFor: null as MeetingIntegrationProviderSlug | null,
  lastTestResultByProvider: {} as Record<string, TestMeetingConnectionResult | null>,
  revokingFor: null as { userId: string; providerSlug: MeetingIntegrationProviderSlug } | null,
  metadataDialogAccount: null as MeetingIntegrationConnectedAccount | null,
  metadataDialogProviderSlug: null as MeetingIntegrationProviderSlug | null,

  // New fields (Task 28)
  testingProviderSlug: null as MeetingIntegrationProviderSlug | null,
  revokingAccountId: null as string | null,
  connectingProviderSlug: null as MeetingIntegrationProviderSlug | null,
  connectErrorFor: {} as Partial<Record<MeetingIntegrationProviderSlug, string | null>>,
  testConnectionResult: null as TestConnectionResult | null,
  metadataDialogAccountId: null as string | null,
  credentialFormProvider: null as MeetingIntegrationProviderSummary | null,
  credentialFormMode: "create" as CredentialFormMode,
  canViewProfile: false as boolean,

  connectedAccountsSearchByProvider: {} as Partial<Record<MeetingIntegrationProviderSlug, string>>,
  connectedAccountsStatusFilterByProvider: {} as Partial<
    Record<MeetingIntegrationProviderSlug, MeetingIntegrationConnectedAccountStatus | "all">
  >,
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

  // New setters (Task 28)
  setTestingProviderSlug: slug => set({ testingProviderSlug: slug }),
  setRevokingAccountId: id => set({ revokingAccountId: id }),
  setConnectingProviderSlug: slug => set({ connectingProviderSlug: slug }),
  setConnectErrorFor: (slug, error) =>
    set(state => ({
      connectErrorFor: { ...state.connectErrorFor, [slug]: error },
    })),
  setTestConnectionResult: result => set({ testConnectionResult: result }),
  setMetadataDialogAccountId: id => set({ metadataDialogAccountId: id }),
  setCredentialFormProvider: provider => set({ credentialFormProvider: provider }),
  setCredentialFormMode: mode => set({ credentialFormMode: mode }),
  setCanViewProfile: value => set({ canViewProfile: value }),

  setConnectedAccountsSearch: (slug, search) =>
    set(state => ({
      connectedAccountsSearchByProvider: { ...state.connectedAccountsSearchByProvider, [slug]: search },
    })),
  setConnectedAccountsStatusFilter: (slug, status) =>
    set(state => ({
      connectedAccountsStatusFilterByProvider: { ...state.connectedAccountsStatusFilterByProvider, [slug]: status },
    })),
}));
