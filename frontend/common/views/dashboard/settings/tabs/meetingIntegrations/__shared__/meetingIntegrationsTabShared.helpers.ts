import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export function getProviderLabel(
  slug: MeetingIntegrationProviderSlug,
  labels: SettingsMeetingIntegrationsLabels
): string {
  switch (slug) {
    case MeetingIntegrationProviderSlug.Zoom:
      return labels.provider.zoom;
    case MeetingIntegrationProviderSlug.GoogleMeet:
      return labels.provider.googleMeet;
    case MeetingIntegrationProviderSlug.MicrosoftTeams:
      return labels.provider.microsoftTeams;
    default:
      return String(slug);
  }
}
