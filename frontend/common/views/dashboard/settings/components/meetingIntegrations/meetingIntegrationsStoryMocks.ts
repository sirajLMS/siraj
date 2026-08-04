import {
  MeetingIntegrationConnectedAccountStatus,
  MeetingIntegrationProviderSlug as MeetingIntegrationProviderSlugEnum,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  MeetingIntegrationConnectedAccount,
  MeetingIntegrationProviderSlug,
  MeetingIntegrationProviderSummary,
  MeetingIntegrationsViewModel,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const ZOOM = MeetingIntegrationProviderSlugEnum.Zoom;
const GOOGLE_MEET = MeetingIntegrationProviderSlugEnum.GoogleMeet;

function createProviderLabels() {
  return {
    zoom: "Zoom",
    googleMeet: "Google Meet",
    microsoftTeams: "Microsoft Teams",
  };
}

function createCredentialFormLabels() {
  return {
    title: "Credentials",
    noFields: "No credential fields for this provider.",
    save: "Save",
    saving: "Saving…",
    revert: "Revert",
    showValue: "Show value",
    hideValue: "Hide value",
    emptyValue: "Not set",
  };
}

function createColumnLabels() {
  return {
    name: "Name",
    email: "Email",
    connectedAt: "Connected At",
    expiresAt: "Expires At",
    status: "Status",
    actions: "Actions",
  };
}

function createStatusLabels() {
  return {
    connected: "Connected",
    expiringSoon: "Expiring Soon",
    reauthNeeded: "Re-auth Needed",
    revoked: "Revoked",
  };
}

function createActionLabels() {
  return {
    viewMetadata: "View Details",
    revoke: "Revoke",
    revokeConfirm: "Are you sure you want to revoke access for this account?",
    revokeConfirmTitle: "Revoke Access",
    cancel: "Cancel",
    confirmRevoke: "Revoke",
  };
}

function createMetadataLabels() {
  return {
    title: "Account Details",
    scopes: "Scopes",
    expiry: "Expiry",
    connectedAt: "Connected At",
    lastRefreshed: "Last Refreshed",
    requiredScopes: "Required Scopes",
    grantedScopes: "Granted Scopes",
    noScopes: "No scopes available",
    provider: "Provider",
    email: "Connected Email",
  };
}

function createTestPanelLabels() {
  return {
    rawResponse: "Raw Response",
    copyUrl: "Copy URL",
    copied: "Copied!",
    marketplaceHint: "Configure in provider marketplace",
  };
}

function createNotificationLabels() {
  return {
    testSuccess: "Connection test completed successfully.",
    testError: "Connection test failed.",
    revokeSuccess: "Access revoked successfully.",
    revokeError: "Failed to revoke access.",
    saveSuccess: "Settings saved successfully.",
    saveError: "Failed to save settings.",
  };
}

function createTopLevelLabels() {
  return {
    description: "Manage meeting integrations for zoom, Google Meet, and Microsoft Teams.",
    loading: "Loading...",
    loadError: "Failed to load meeting integrations.",
    providersConfigured: "Providers Configured",
    credentialsHealthy: "Credentials Healthy",
    teachersConnected: "Teachers Connected",
    reauthNeeded: "Re-auth Needed",
    lastTested: "Last Tested",
    neverTested: "Never tested",
    endpoints: "Endpoints",
    testConnection: "Test Connection",
    validateConfig: "Validate Config",
    generateAndDelete: "Generate & Delete",
    runTest: "Run Test",
    testing: "Testing...",
    testResult: "Result",
    testSuccess: "Success",
    testFailure: "Failed",
    joinUrl: "Join URL",
    deleted: "Deleted",
    notDeleted: "Not Deleted",
    latency: "Latency",
    errorCode: "Error Code",
    errorMessage: "Error Message",
    rawPayload: "Raw Payload",
    connectedAccounts: "Connected Accounts",
    noConnectedAccounts: "No connected accounts found.",
  };
}

export function createMeetingIntegrationLabelsMock(): SettingsMeetingIntegrationsLabels {
  return {
    ...createTopLevelLabels(),
    provider: createProviderLabels(),
    credentialForm: createCredentialFormLabels(),
    columns: createColumnLabels(),
    status: createStatusLabels(),
    actions: createActionLabels(),
    metadata: createMetadataLabels(),
    testPanel: createTestPanelLabels(),
    notifications: createNotificationLabels(),
  };
}

export function createProvidersMock(): readonly MeetingIntegrationProviderSummary[] {
  return [
    {
      id: "p1",
      slug: MeetingIntegrationProviderSlugEnum.Zoom,
      kind: "oauth",
      credentialsHealthy: true,
      lastTestedAt: new Date("2026-07-30T10:00:00Z"),
      connectedTeacherCount: 5,
      reauthNeededCount: 0,
      endpoints: ["https://zoom.us/oauth", "https://zoom.us/api/v2"],
    },
    {
      id: "p2",
      slug: MeetingIntegrationProviderSlugEnum.GoogleMeet,
      kind: "service-account",
      credentialsHealthy: false,
      lastTestedAt: null,
      connectedTeacherCount: 3,
      reauthNeededCount: 2,
      endpoints: ["https://www.googleapis.com/calendar/v3"],
    },
    {
      id: "p3",
      slug: MeetingIntegrationProviderSlugEnum.MicrosoftTeams,
      kind: "oauth",
      credentialsHealthy: true,
      lastTestedAt: new Date("2026-08-01T08:00:00Z"),
      connectedTeacherCount: 8,
      reauthNeededCount: 1,
      endpoints: ["https://graph.microsoft.com/v1.0"],
    },
  ];
}

export function createConnectedAccountsMock(): readonly MeetingIntegrationConnectedAccount[] {
  return [
    {
      id: "a1",
      userId: "user1",
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      connectedAt: new Date("2026-06-15T09:00:00Z"),
      expiresAt: new Date("2026-09-15T09:00:00Z"),
      lastRefreshedAt: new Date("2026-08-01T03:00:00Z"),
      status: MeetingIntegrationConnectedAccountStatus.Connected,
    },
    {
      id: "a2",
      userId: "user2",
      name: "Fatima Ali",
      email: "fatima@example.com",
      connectedAt: new Date("2026-05-01T12:00:00Z"),
      expiresAt: new Date("2026-08-05T12:00:00Z"),
      lastRefreshedAt: new Date("2026-07-28T12:00:00Z"),
      status: MeetingIntegrationConnectedAccountStatus.ExpiringSoon,
    },
    {
      id: "a3",
      userId: "user3",
      name: "Omar Saeed",
      email: "omar@example.com",
      connectedAt: new Date("2026-03-10T14:00:00Z"),
      expiresAt: new Date("2026-06-10T14:00:00Z"),
      lastRefreshedAt: new Date("2026-06-10T14:00:00Z"),
      status: MeetingIntegrationConnectedAccountStatus.ReauthNeeded,
    },
  ];
}

export function createViewModelMock(
  overrides: Partial<MeetingIntegrationsViewModel> & { labels: SettingsMeetingIntegrationsLabels }
): MeetingIntegrationsViewModel {
  const emptyRecord = {} as Readonly<
    Record<MeetingIntegrationProviderSlug, readonly MeetingIntegrationConnectedAccount[]>
  >;
  return {
    labels: overrides.labels,
    locale: "en",
    loading: overrides.loading ?? false,
    error: overrides.error ?? undefined,
    providers: overrides.providers ?? createProvidersMock(),
    expandedSlug: overrides.expandedSlug ?? null,
    onExpandedSlugChange: overrides.onExpandedSlugChange ?? (() => {}),
    connectedAccountsByProvider: overrides.connectedAccountsByProvider ?? emptyRecord,
    loadingAccountsFor: overrides.loadingAccountsFor ?? null,
    testingFor: overrides.testingFor ?? null,
    lastTestResultByProvider: overrides.lastTestResultByProvider ?? ({} as never),
    revokingFor: overrides.revokingFor ?? null,
    metadataDialogAccount: overrides.metadataDialogAccount ?? null,
    metadataDialogProviderSlug: overrides.metadataDialogProviderSlug ?? null,
    runTest: overrides.runTest ?? (async () => {}),
    revokeAccount: overrides.revokeAccount ?? (async () => {}),
    onMetadataDialogOpen: overrides.onMetadataDialogOpen ?? (() => {}),
    onMetadataDialogClose: overrides.onMetadataDialogClose ?? (() => {}),
    refresh: overrides.refresh ?? (async () => {}),
  };
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
    connectedAccountsByProvider: { [ZOOM]: connectedAccounts } as never,
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
    lastTestResultByProvider: {
      [ZOOM]: {
        ok: true,
        latencyMs: 245,
        mode: "VALIDATE_CONFIG",
        testJoinUrl: "https://zoom.us/j/123456789?******",
        deleted: null,
        upstreamResponseSummary: "200 OK — scopes verified",
        errorCode: null,
        errorMessage: null,
        rawUpstreamPayload: { token_type: "bearer", scope: "user:write:admin meeting:write" },
        requiredScopes: ["user:write:admin", "meeting:write"],
        grantedScopes: ["user:write:admin", "meeting:write", "user:read"],
      },
    } as never,
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
    lastTestResultByProvider: {
      [GOOGLE_MEET]: {
        ok: false,
        latencyMs: 1200,
        mode: "VALIDATE_CONFIG",
        testJoinUrl: null,
        deleted: null,
        upstreamResponseSummary: "401 Unauthorized",
        errorCode: "INVALID_CREDENTIALS",
        errorMessage: "The provided service account credentials are invalid or expired.",
        rawUpstreamPayload: { error: "invalid_grant", error_description: "Token has been expired or revoked." },
        requiredScopes: null,
        grantedScopes: null,
      },
    } as never,
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
    connectedAccountsByProvider: { [ZOOM]: connectedAccounts } as never,
    metadataDialogAccount: {
      id: "a1",
      userId: "user1",
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      connectedAt: new Date("2026-06-15T09:00:00Z"),
      expiresAt: new Date("2026-09-15T09:00:00Z"),
      lastRefreshedAt: new Date("2026-08-01T03:00:00Z"),
      status: MeetingIntegrationConnectedAccountStatus.Connected,
    },
    metadataDialogProviderSlug: ZOOM,
  });
}
