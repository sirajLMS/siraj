import type {
  MeetingConnectionTestMode as GqlMeetingConnectionTestMode,
  MeetingIntegrationConnectedAccountFieldsFragment,
  MeetingIntegrationProviderFieldsFragment,
  MeetingIntegrationProviderSlug,
  TestMeetingConnectionResultFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export type { MeetingIntegrationProviderSlug };
export type MeetingConnectionTestMode = GqlMeetingConnectionTestMode;

export type TestMeetingConnectionResult = {
  readonly ok: NonNullable<TestMeetingConnectionResultFieldsFragment["ok"]>;
  readonly latencyMs: NonNullable<TestMeetingConnectionResultFieldsFragment["latencyMs"]>;
  readonly mode: NonNullable<TestMeetingConnectionResultFieldsFragment["mode"]>;
  readonly testJoinUrl: TestMeetingConnectionResultFieldsFragment["testJoinUrl"];
  readonly deleted: TestMeetingConnectionResultFieldsFragment["deleted"];
  readonly upstreamResponseSummary: NonNullable<TestMeetingConnectionResultFieldsFragment["upstreamResponseSummary"]>;
  readonly errorCode: TestMeetingConnectionResultFieldsFragment["errorCode"];
  readonly errorMessage: TestMeetingConnectionResultFieldsFragment["errorMessage"];
  readonly rawUpstreamPayload: Record<string, unknown> | null;
  readonly requiredScopes: readonly string[] | null;
  readonly grantedScopes: readonly string[] | null;
};

export type MeetingIntegrationProviderSummary = {
  readonly id: NonNullable<MeetingIntegrationProviderFieldsFragment["id"]>;
  readonly slug: MeetingIntegrationProviderSlug;
  readonly kind: NonNullable<MeetingIntegrationProviderFieldsFragment["kind"]>;
  readonly credentialsHealthy: NonNullable<MeetingIntegrationProviderFieldsFragment["credentialsHealthy"]>;
  readonly lastTestedAt: Date | null;
  readonly connectedTeacherCount: NonNullable<MeetingIntegrationProviderFieldsFragment["connectedTeacherCount"]>;
  readonly reauthNeededCount: NonNullable<MeetingIntegrationProviderFieldsFragment["reauthNeededCount"]>;
  readonly endpoints: NonNullable<MeetingIntegrationProviderFieldsFragment["endpoints"]>;
};

export type MeetingIntegrationConnectedAccount = {
  readonly id: NonNullable<MeetingIntegrationConnectedAccountFieldsFragment["id"]>;
  readonly userId: NonNullable<MeetingIntegrationConnectedAccountFieldsFragment["userId"]>;
  readonly name: MeetingIntegrationConnectedAccountFieldsFragment["name"];
  readonly email: MeetingIntegrationConnectedAccountFieldsFragment["email"];
  readonly connectedAt: Date | null;
  readonly expiresAt: Date | null;
  readonly lastRefreshedAt: Date | null;
  readonly status: NonNullable<MeetingIntegrationConnectedAccountFieldsFragment["status"]>;
  readonly scopes?: readonly string[];
};

/**
 * Provider accordion row targeted by the revoke-confirmation dialog. Carried in
 * the meeting-integrations Zustand store so the dialog state survives tier
 * switches (React unmounts one tier and mounts the other during resize).
 */
export type RevokeTarget = {
  readonly account: MeetingIntegrationConnectedAccount;
  readonly providerSlug: MeetingIntegrationProviderSlug;
};

export type MeetingIntegrationsViewModel = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly locale: "en" | "ar";
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly canEdit: boolean;
  readonly providers: readonly MeetingIntegrationProviderSummary[];

  readonly expandedSlug: MeetingIntegrationProviderSlug | null;
  readonly onExpandedSlugChange: (slug: MeetingIntegrationProviderSlug | null) => void;

  readonly connectedAccountsByProvider: Readonly<
    Partial<Record<MeetingIntegrationProviderSlug, readonly MeetingIntegrationConnectedAccount[]>>
  >;
  readonly loadingAccountsFor: MeetingIntegrationProviderSlug | null;

  readonly testingFor: MeetingIntegrationProviderSlug | null;
  readonly lastTestResultByProvider: Readonly<
    Record<MeetingIntegrationProviderSlug, TestMeetingConnectionResult | null>
  >;

  readonly revokingFor: { userId: string; providerSlug: MeetingIntegrationProviderSlug } | null;
  readonly metadataDialogAccount: MeetingIntegrationConnectedAccount | null;
  readonly metadataDialogProviderSlug: MeetingIntegrationProviderSlug | null;

  // Revoke-confirmation dialog state (Zustand-backed so it survives tier switches)
  readonly revokeTarget?: RevokeTarget | null;
  readonly onRevokeRequest?: (
    account: MeetingIntegrationConnectedAccount,
    providerSlug: MeetingIntegrationProviderSlug
  ) => void;
  readonly onRevokeCancel?: () => void;

  readonly runTest: (providerSlug: MeetingIntegrationProviderSlug, mode: MeetingConnectionTestMode) => Promise<void>;
  readonly revokeAccount: (userId: string, providerSlug: MeetingIntegrationProviderSlug) => Promise<void>;
  readonly onMetadataDialogOpen: (
    account: MeetingIntegrationConnectedAccount,
    providerSlug: MeetingIntegrationProviderSlug
  ) => void;
  readonly onMetadataDialogClose: () => void;

  // Connect-provider OAuth flow (wired in Task 29)
  readonly connectingFor: MeetingIntegrationProviderSlug | null;
  readonly connectErrorFor: Readonly<Partial<Record<MeetingIntegrationProviderSlug, string | null>>>;
  readonly connectProvider: (providerSlug: MeetingIntegrationProviderSlug) => void;

  // Cross-navigation to teacher profile meeting configs (wired in Task 29)
  readonly navigateToProfile: () => void;
  readonly canViewProfile: boolean;

  readonly refresh: () => Promise<void>;
};

/**
 * Props for the tier-specific ConnectedAccountsTable views (desktop + mobile).
 * Derived from the parent `MeetingIntegrationsViewModel` — each per-provider
 * accordion passes a slice that couples the provider slug, its accounts array,
 * and the label/permission/handler surface the table needs.
 */
export type ConnectedAccountsTableProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly accounts: readonly MeetingIntegrationConnectedAccount[];
  readonly loading: boolean;
  readonly providerSlug: MeetingIntegrationProviderSlug;
  readonly canEdit: boolean;
  readonly revokingFor: { userId: string; providerSlug: MeetingIntegrationProviderSlug } | null;
  readonly onRevokeRequest: (
    account: MeetingIntegrationConnectedAccount,
    providerSlug: MeetingIntegrationProviderSlug
  ) => void;
  readonly onMetadataDialogOpen: (
    account: MeetingIntegrationConnectedAccount,
    providerSlug: MeetingIntegrationProviderSlug
  ) => void;
};
