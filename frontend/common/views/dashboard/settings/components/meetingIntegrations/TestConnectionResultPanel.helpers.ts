import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TestConnectionState } from "@/frontend/common/views/dashboard/settings/types/meeting-ui.types";
import type { TestMeetingConnectionResult } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

const marketplaceUrls: Partial<Record<MeetingIntegrationProviderSlug, string>> = {
  [MeetingIntegrationProviderSlug.Zoom]: "https://marketplace.zoom.us/",
  [MeetingIntegrationProviderSlug.GoogleMeet]: "https://console.cloud.google.com/",
  [MeetingIntegrationProviderSlug.MicrosoftTeams]: "https://entra.microsoft.com/",
};

export function getMarketplaceUrl(slug: MeetingIntegrationProviderSlug): string | null {
  return marketplaceUrls[slug] ?? null;
}

export function deriveState(testing: boolean, result: TestMeetingConnectionResult | null): TestConnectionState {
  if (testing) return "testing";
  if (result === null) return "idle";
  return result.ok ? "success" : "failure";
}
