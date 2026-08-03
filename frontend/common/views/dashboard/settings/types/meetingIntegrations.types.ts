import type {
  MeetingConnectionTestMode as GqlMeetingConnectionTestMode,
  MeetingIntegrationConnectedAccountStatus,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export type { MeetingConnectionTestMode as GqlMeetingConnectionTestMode, MeetingIntegrationProviderSlug };
export type MeetingConnectionTestMode = GqlMeetingConnectionTestMode;
export type MeetingIntegrationConnectedAccountStatusType = MeetingIntegrationConnectedAccountStatus;

export type TestMeetingConnectionResult = {
  readonly ok: NonNullable<Operations.TestMeetingConnectionResultFieldsFragment["ok"]>;
  readonly latencyMs: NonNullable<Operations.TestMeetingConnectionResultFieldsFragment["latencyMs"]>;
  readonly mode: NonNullable<Operations.TestMeetingConnectionResultFieldsFragment["mode"]>;
  readonly testJoinUrl: Operations.TestMeetingConnectionResultFieldsFragment["testJoinUrl"];
  readonly deleted: Operations.TestMeetingConnectionResultFieldsFragment["deleted"];
  readonly upstreamResponseSummary: NonNullable<
    Operations.TestMeetingConnectionResultFieldsFragment["upstreamResponseSummary"]
  >;
  readonly errorCode: Operations.TestMeetingConnectionResultFieldsFragment["errorCode"];
  readonly errorMessage: Operations.TestMeetingConnectionResultFieldsFragment["errorMessage"];
  readonly rawUpstreamPayload: Record<string, unknown> | null;
  readonly requiredScopes: readonly string[] | null;
  readonly grantedScopes: readonly string[] | null;
};

export type MeetingIntegrationProviderSummary = {
  readonly id: NonNullable<Operations.MeetingIntegrationProviderFieldsFragment["id"]>;
  readonly slug: MeetingIntegrationProviderSlug;
  readonly kind: NonNullable<Operations.MeetingIntegrationProviderFieldsFragment["kind"]>;
  readonly credentialsHealthy: NonNullable<Operations.MeetingIntegrationProviderFieldsFragment["credentialsHealthy"]>;
  readonly lastTestedAt: Date | null;
  readonly connectedTeacherCount: NonNullable<
    Operations.MeetingIntegrationProviderFieldsFragment["connectedTeacherCount"]
  >;
  readonly reauthNeededCount: NonNullable<Operations.MeetingIntegrationProviderFieldsFragment["reauthNeededCount"]>;
  readonly endpoints: NonNullable<Operations.MeetingIntegrationProviderFieldsFragment["endpoints"]>;
};

export type MeetingIntegrationConnectedAccount = {
  readonly id: NonNullable<Operations.MeetingIntegrationConnectedAccountFieldsFragment["id"]>;
  readonly userId: NonNullable<Operations.MeetingIntegrationConnectedAccountFieldsFragment["userId"]>;
  readonly name: Operations.MeetingIntegrationConnectedAccountFieldsFragment["name"];
  readonly email: Operations.MeetingIntegrationConnectedAccountFieldsFragment["email"];
  readonly connectedAt: Date | null;
  readonly expiresAt: Date | null;
  readonly lastRefreshedAt: Date | null;
  readonly status: NonNullable<Operations.MeetingIntegrationConnectedAccountFieldsFragment["status"]>;
  readonly scopes?: readonly string[];
};

export type MeetingIntegrationsViewModel = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly locale: "en" | "ar";
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly providers: readonly MeetingIntegrationProviderSummary[];

  readonly expandedSlug: MeetingIntegrationProviderSlug | null;
  readonly onExpandedSlugChange: (slug: MeetingIntegrationProviderSlug | null) => void;

  readonly connectedAccountsByProvider: Readonly<
    Record<MeetingIntegrationProviderSlug, readonly MeetingIntegrationConnectedAccount[]>
  >;
  readonly loadingAccountsFor: MeetingIntegrationProviderSlug | null;

  readonly testingFor: MeetingIntegrationProviderSlug | null;
  readonly lastTestResultByProvider: Readonly<
    Record<MeetingIntegrationProviderSlug, TestMeetingConnectionResult | null>
  >;

  readonly revokingFor: { userId: string; providerSlug: MeetingIntegrationProviderSlug } | null;
  readonly metadataDialogAccount: MeetingIntegrationConnectedAccount | null;
  readonly metadataDialogProviderSlug: MeetingIntegrationProviderSlug | null;

  readonly runTest: (providerSlug: MeetingIntegrationProviderSlug, mode: MeetingConnectionTestMode) => Promise<void>;
  readonly revokeAccount: (userId: string, providerSlug: MeetingIntegrationProviderSlug) => Promise<void>;
  readonly onMetadataDialogOpen: (
    account: MeetingIntegrationConnectedAccount,
    providerSlug: MeetingIntegrationProviderSlug
  ) => void;
  readonly onMetadataDialogClose: () => void;

  readonly refresh: () => Promise<void>;
};
