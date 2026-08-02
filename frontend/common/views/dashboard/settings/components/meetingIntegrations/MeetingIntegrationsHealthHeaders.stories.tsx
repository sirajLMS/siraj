import { Grid } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { MeetingIntegrationsHealthHeaders } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingIntegrationsHealthHeaders";
import {
  createMeetingIntegrationLabelsMock,
  createProvidersMock,
  createViewModelMock,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks";
import type { MeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const meta = {
  title: "Views/dashboard/settings/components/meetingIntegrations/MeetingIntegrationsHealthHeaders",
  component: MeetingIntegrationsHealthHeaders,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    Story => (
      <Grid container spacing={2} sx={{ width: 800 }}>
        <Story />
      </Grid>
    ),
  ],
} satisfies Meta<typeof MeetingIntegrationsHealthHeaders>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: SettingsMeetingIntegrationsLabels = createMeetingIntegrationLabelsMock();

const viewModelDefault: MeetingIntegrationsViewModel = createViewModelMock({
  labels,
  providers: createProvidersMock(),
});

const viewModelEmpty: MeetingIntegrationsViewModel = createViewModelMock({
  labels,
  providers: [],
});

const viewModelAllUnhealthy: MeetingIntegrationsViewModel = createViewModelMock({
  labels,
  providers: [
    {
      id: "p1",
      slug: MeetingIntegrationProviderSlug.Zoom,
      kind: "oauth",
      credentialsHealthy: false,
      lastTestedAt: null,
      connectedTeacherCount: 3,
      reauthNeededCount: 2,
      endpoints: ["https://zoom.us/api"],
    },
    {
      id: "p2",
      slug: MeetingIntegrationProviderSlug.GoogleMeet,
      kind: "oauth",
      credentialsHealthy: false,
      lastTestedAt: null,
      connectedTeacherCount: 1,
      reauthNeededCount: 1,
      endpoints: ["https://googleapis.com"],
    },
  ],
});

export const Default: Story = {
  args: { viewModel: viewModelDefault },
};

export const NoProviders: Story = {
  args: { viewModel: viewModelEmpty },
};

export const AllUnhealthy: Story = {
  args: { viewModel: viewModelAllUnhealthy },
};
