import {
  MeetingConnectionTestMode,
  type MeetingIntegrationConnectedAccountFieldsFragment,
  MeetingIntegrationConnectedAccountStatus,
  type MeetingIntegrationProviderFieldsFragment,
  MeetingIntegrationProviderSlug,
  type TestMeetingConnectionResultFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  MeetingIntegrationConnectedAccount,
  MeetingIntegrationProviderSummary,
  TestMeetingConnectionResult,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

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

export function mapProviderSummary(
  provider: MeetingIntegrationProviderFieldsFragment
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

export function mapTestResult(
  result: TestMeetingConnectionResultFieldsFragment | null | undefined
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

export function mapConnectedAccount(
  account: MeetingIntegrationConnectedAccountFieldsFragment
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
