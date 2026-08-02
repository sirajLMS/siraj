import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConnectProviderAccount } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ConnectProviderAccount";

const meta = {
  title: "Views/dashboard/profile/shared/meeting-configs/ConnectProviderAccount",
  component: ConnectProviderAccount,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof ConnectProviderAccount>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

export const Disconnected: Story = {
  args: {
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "disconnected",
    onConnect: noop,
    onDisconnect: noop,
  },
};

export const DisconnectedGoogleMeet: Story = {
  args: {
    providerSlug: "google_meet",
    providerName: "Google Meet",
    connectionState: "disconnected",
    onConnect: noop,
    onDisconnect: noop,
  },
};

export const Connecting: Story = {
  args: {
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "connecting",
    onConnect: noop,
    onDisconnect: noop,
  },
};

export const Connected: Story = {
  args: {
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "connected",
    connectedEmail: "ahmed@example.com",
    onConnect: noop,
    onDisconnect: noop,
  },
};

export const ConnectedMicrosoftTeams: Story = {
  args: {
    providerSlug: "microsoft_teams",
    providerName: "Microsoft Teams",
    connectionState: "connected",
    connectedEmail: "fatima@example.com",
    onConnect: noop,
    onDisconnect: noop,
  },
};

export const ConnectedWithoutEmail: Story = {
  args: {
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "connected",
    onConnect: noop,
    onDisconnect: noop,
  },
};

export const ReauthNeeded: Story = {
  args: {
    providerSlug: "google_meet",
    providerName: "Google Meet",
    connectionState: "reauthNeeded",
    onConnect: noop,
    onDisconnect: noop,
  },
};

export const DisconnectedWithLoading: Story = {
  args: {
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "disconnected",
    loading: true,
    onConnect: noop,
    onDisconnect: noop,
  },
};

export const ConnectedWithLoading: Story = {
  args: {
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "connected",
    connectedEmail: "ahmed@example.com",
    loading: true,
    onConnect: noop,
    onDisconnect: noop,
  },
};
