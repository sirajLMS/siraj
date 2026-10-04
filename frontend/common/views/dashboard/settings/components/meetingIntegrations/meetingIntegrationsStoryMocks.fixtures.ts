import {
  MeetingConnectionTestMode,
  MeetingIntegrationConnectedAccountStatus,
  MeetingIntegrationProviderSlug as MeetingIntegrationProviderSlugEnum,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  MeetingIntegrationConnectedAccount,
  MeetingIntegrationProviderSlug,
  MeetingIntegrationProviderSummary,
  TestMeetingConnectionResult,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

const ZOOM = MeetingIntegrationProviderSlugEnum.Zoom;
const GOOGLE_MEET = MeetingIntegrationProviderSlugEnum.GoogleMeet;
const MICROSOFT_TEAMS = MeetingIntegrationProviderSlugEnum.MicrosoftTeams;

export const providerSummaries: readonly MeetingIntegrationProviderSummary[] = [
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

export const connectedAccountFixtures: readonly MeetingIntegrationConnectedAccount[] = [
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

export const metadataDialogAccount: MeetingIntegrationConnectedAccount = {
  id: "a1",
  userId: "user1",
  name: "Ahmed Hassan",
  email: "ahmed@example.com",
  connectedAt: new Date("2026-06-15T09:00:00Z"),
  expiresAt: new Date("2026-09-15T09:00:00Z"),
  lastRefreshedAt: new Date("2026-08-01T03:00:00Z"),
  status: MeetingIntegrationConnectedAccountStatus.Connected,
};

function emptyProviderRecord<T>(emptyValue: T): Record<MeetingIntegrationProviderSlug, T> {
  return {
    [ZOOM]: emptyValue,
    [GOOGLE_MEET]: emptyValue,
    [MICROSOFT_TEAMS]: emptyValue,
  };
}

export const emptyAccountsByProvider: Readonly<
  Record<MeetingIntegrationProviderSlug, readonly MeetingIntegrationConnectedAccount[]>
> = emptyProviderRecord<readonly MeetingIntegrationConnectedAccount[]>([]);

export const emptyTestResultsByProvider: Readonly<
  Record<MeetingIntegrationProviderSlug, TestMeetingConnectionResult | null>
> = emptyProviderRecord<TestMeetingConnectionResult | null>(null);

export const zoomSuccessResult: TestMeetingConnectionResult = {
  ok: true,
  latencyMs: 245,
  mode: MeetingConnectionTestMode.ValidateConfig,
  testJoinUrl: "https://zoom.us/j/123456789?******",
  deleted: null,
  upstreamResponseSummary: "200 OK — scopes verified",
  errorCode: null,
  errorMessage: null,
  rawUpstreamPayload: { token_type: "bearer", scope: "user:write:admin meeting:write" },
  requiredScopes: ["user:write:admin", "meeting:write"],
  grantedScopes: ["user:write:admin", "meeting:write", "user:read"],
};

export const googleMeetErrorResult: TestMeetingConnectionResult = {
  ok: false,
  latencyMs: 1200,
  mode: MeetingConnectionTestMode.ValidateConfig,
  testJoinUrl: null,
  deleted: null,
  upstreamResponseSummary: "401 Unauthorized",
  errorCode: "INVALID_CREDENTIALS",
  errorMessage: "The provided service account credentials are invalid or expired.",
  rawUpstreamPayload: { error: "invalid_grant", error_description: "Token has been expired or revoked." },
  requiredScopes: null,
  grantedScopes: null,
};
