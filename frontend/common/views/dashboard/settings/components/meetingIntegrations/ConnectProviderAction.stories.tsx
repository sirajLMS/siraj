import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  ConnectProviderAction,
  type ConnectProviderActionLabels,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectProviderAction";

const meta = {
  title: "Views/dashboard/settings/components/meetingIntegrations/ConnectProviderAction",
  component: ConnectProviderAction,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof ConnectProviderAction>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: ConnectProviderActionLabels = {
  connectProvider: "Connect",
  connecting: "Connecting…",
  connectProviderError: "Connection failed",
};

const noop = () => {};

export const Idle: Story = {
  args: {
    labels,
    providerSlug: MeetingIntegrationProviderSlug.Zoom,
    providerName: "Zoom",
    connecting: false,
    connectError: null,
    onConnect: noop,
  },
};

export const Connecting: Story = {
  args: {
    labels,
    providerSlug: MeetingIntegrationProviderSlug.Zoom,
    providerName: "Zoom",
    connecting: true,
    connectError: null,
    onConnect: noop,
  },
};

export const WithError: Story = {
  args: {
    labels,
    providerSlug: MeetingIntegrationProviderSlug.GoogleMeet,
    providerName: "Google Meet",
    connecting: false,
    connectError: "Authorization server returned 500. Try again.",
    onConnect: noop,
  },
};

export const GoogleMeet: Story = {
  args: {
    labels,
    providerSlug: MeetingIntegrationProviderSlug.GoogleMeet,
    providerName: "Google Meet",
    connecting: false,
    connectError: null,
    onConnect: noop,
  },
};

export const MicrosoftTeams: Story = {
  args: {
    labels,
    providerSlug: MeetingIntegrationProviderSlug.MicrosoftTeams,
    providerName: "Microsoft Teams",
    connecting: false,
    connectError: null,
    onConnect: noop,
  },
};

export const AllStates: Story = {
  args: {
    labels,
    providerSlug: MeetingIntegrationProviderSlug.Zoom,
    providerName: "Zoom",
    connecting: false,
    connectError: null,
    onConnect: noop,
  },
  render: () => (
    <Stack spacing={2} sx={{ width: 520 }}>
      <Typography variant="caption">Idle</Typography>
      <ConnectProviderAction
        labels={labels}
        providerSlug={MeetingIntegrationProviderSlug.Zoom}
        providerName="Zoom"
        connecting={false}
        connectError={null}
        onConnect={noop}
      />
      <Typography variant="caption">Connecting</Typography>
      <ConnectProviderAction
        labels={labels}
        providerSlug={MeetingIntegrationProviderSlug.Zoom}
        providerName="Zoom"
        connecting={true}
        connectError={null}
        onConnect={noop}
      />
      <Typography variant="caption">Error</Typography>
      <ConnectProviderAction
        labels={labels}
        providerSlug={MeetingIntegrationProviderSlug.GoogleMeet}
        providerName="Google Meet"
        connecting={false}
        connectError="Authorization server returned 500."
        onConnect={noop}
      />
    </Stack>
  ),
};
