import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql";
import { MeetingProviderCredentialForm } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm";
import { createMeetingIntegrationLabelsMock } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks";
import type { MeetingIntegrationProviderSummary } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const meta = {
  title: "Views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm",
  component: MeetingProviderCredentialForm,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof MeetingProviderCredentialForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: SettingsMeetingIntegrationsLabels = createMeetingIntegrationLabelsMock();

const zoomProvider: MeetingIntegrationProviderSummary = {
  id: "p1",
  slug: MeetingIntegrationProviderSlug.Zoom,
  kind: "oauth",
  credentialsHealthy: true,
  lastTestedAt: new Date("2026-07-30T10:00:00Z"),
  connectedTeacherCount: 5,
  reauthNeededCount: 0,
  endpoints: ["https://zoom.us/oauth", "https://zoom.us/api/v2"],
};

const googleMeetProvider: MeetingIntegrationProviderSummary = {
  id: "p2",
  slug: MeetingIntegrationProviderSlug.GoogleMeet,
  kind: "service-account",
  credentialsHealthy: false,
  lastTestedAt: null,
  connectedTeacherCount: 3,
  reauthNeededCount: 2,
  endpoints: ["https://www.googleapis.com/calendar/v3"],
};

const microsoftTeamsProvider: MeetingIntegrationProviderSummary = {
  id: "p3",
  slug: MeetingIntegrationProviderSlug.MicrosoftTeams,
  kind: "oauth",
  credentialsHealthy: true,
  lastTestedAt: new Date("2026-08-01T08:00:00Z"),
  connectedTeacherCount: 8,
  reauthNeededCount: 1,
  endpoints: ["https://graph.microsoft.com/v1.0"],
};

export const ZoomHealthy: Story = {
  args: { provider: zoomProvider, labels },
};

export const GoogleMeetUnhealthy: Story = {
  args: { provider: googleMeetProvider, labels },
};

export const MicrosoftTeams: Story = {
  args: { provider: microsoftTeamsProvider, labels },
};
