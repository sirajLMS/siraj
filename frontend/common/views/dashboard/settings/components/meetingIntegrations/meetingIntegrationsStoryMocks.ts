import { MeetingIntegrationProviderSlug as MeetingIntegrationProviderSlugEnum } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  connectedAccountFixtures,
  emptyAccountsByProvider,
  emptyTestResultsByProvider,
  googleMeetErrorResult,
  metadataDialogAccount,
  providerSummaries,
  zoomSuccessResult,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks.fixtures";
import type {
  MeetingIntegrationConnectedAccount,
  MeetingIntegrationProviderSlug,
  MeetingIntegrationProviderSummary,
  MeetingIntegrationsViewModel,
  TestMeetingConnectionResult,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { dashboardSettingsMeetingIntegrationsEn } from "@/shared/locale/en/dashboard/settings/meeting-integrations";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const ZOOM = MeetingIntegrationProviderSlugEnum.Zoom;
const GOOGLE_MEET = MeetingIntegrationProviderSlugEnum.GoogleMeet;

export function createMeetingIntegrationLabelsMock(): SettingsMeetingIntegrationsLabels {
  return dashboardSettingsMeetingIntegrationsEn;
}

export function createProvidersMock(): readonly MeetingIntegrationProviderSummary[] {
  return providerSummaries;
}

export function createConnectedAccountsMock(): readonly MeetingIntegrationConnectedAccount[] {
  return connectedAccountFixtures;
}

export function createViewModelMock(
  overrides: Partial<MeetingIntegrationsViewModel> & { labels: SettingsMeetingIntegrationsLabels }
): MeetingIntegrationsViewModel {
  return {
    labels: overrides.labels,
    locale: "en",
    loading: overrides.loading ?? false,
    error: overrides.error ?? undefined,
    providers: overrides.providers ?? createProvidersMock(),
    expandedSlug: overrides.expandedSlug ?? null,
    onExpandedSlugChange: overrides.onExpandedSlugChange ?? (() => {}),
    connectedAccountsByProvider: overrides.connectedAccountsByProvider ?? emptyAccountsByProvider,
    loadingAccountsFor: overrides.loadingAccountsFor ?? null,
    testingFor: overrides.testingFor ?? null,
    lastTestResultByProvider: overrides.lastTestResultByProvider ?? emptyTestResultsByProvider,
    canEdit: overrides.canEdit ?? true,
    revokingFor: overrides.revokingFor ?? null,
    metadataDialogAccount: overrides.metadataDialogAccount ?? null,
    metadataDialogProviderSlug: overrides.metadataDialogProviderSlug ?? null,
    runTest: overrides.runTest ?? (async () => {}),
    revokeAccount: overrides.revokeAccount ?? (async () => {}),
    onMetadataDialogOpen: overrides.onMetadataDialogOpen ?? (() => {}),
    onMetadataDialogClose: overrides.onMetadataDialogClose ?? (() => {}),
    connectingFor: overrides.connectingFor ?? null,
    connectErrorFor: overrides.connectErrorFor ?? {},
    connectProvider: overrides.connectProvider ?? (() => {}),
    navigateToProfile: overrides.navigateToProfile ?? (() => {}),
    canViewProfile: overrides.canViewProfile ?? true,
    refresh: overrides.refresh ?? (async () => {}),
  };
}

function zoomAccountsRecord(
  accounts: readonly MeetingIntegrationConnectedAccount[]
): Record<MeetingIntegrationProviderSlug, readonly MeetingIntegrationConnectedAccount[]> {
  return { ...emptyAccountsByProvider, [ZOOM]: accounts };
}

function singleTestResultRecord(
  slug: MeetingIntegrationProviderSlug,
  result: TestMeetingConnectionResult
): Record<MeetingIntegrationProviderSlug, TestMeetingConnectionResult | null> {
  return { ...emptyTestResultsByProvider, [slug]: result };
}

export function createViewModelDefault(
  labels: SettingsMeetingIntegrationsLabels,
  providers: readonly MeetingIntegrationProviderSummary[]
): MeetingIntegrationsViewModel {
  return createViewModelMock({ labels, providers, expandedSlug: ZOOM });
}

export function createViewModelConnected(
  labels: SettingsMeetingIntegrationsLabels,
  providers: readonly MeetingIntegrationProviderSummary[],
  connectedAccounts: readonly MeetingIntegrationConnectedAccount[]
): MeetingIntegrationsViewModel {
  return createViewModelMock({
    labels,
    providers,
    expandedSlug: ZOOM,
    connectedAccountsByProvider: zoomAccountsRecord(connectedAccounts),
  });
}

export function createViewModelTestResult(
  labels: SettingsMeetingIntegrationsLabels,
  providers: readonly MeetingIntegrationProviderSummary[]
): MeetingIntegrationsViewModel {
  return createViewModelMock({
    labels,
    providers,
    expandedSlug: ZOOM,
    lastTestResultByProvider: singleTestResultRecord(ZOOM, zoomSuccessResult),
  });
}

export function createViewModelError(
  labels: SettingsMeetingIntegrationsLabels,
  providers: readonly MeetingIntegrationProviderSummary[]
): MeetingIntegrationsViewModel {
  return createViewModelMock({
    labels,
    providers,
    expandedSlug: GOOGLE_MEET,
    lastTestResultByProvider: singleTestResultRecord(GOOGLE_MEET, googleMeetErrorResult),
  });
}

export function createViewModelMetadataOpen(
  labels: SettingsMeetingIntegrationsLabels,
  providers: readonly MeetingIntegrationProviderSummary[],
  connectedAccounts: readonly MeetingIntegrationConnectedAccount[]
): MeetingIntegrationsViewModel {
  return createViewModelMock({
    labels,
    providers,
    expandedSlug: ZOOM,
    connectedAccountsByProvider: zoomAccountsRecord(connectedAccounts),
    metadataDialogAccount,
    metadataDialogProviderSlug: ZOOM,
  });
}
