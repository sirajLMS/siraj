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

const defaultLabels = {
  connectButton: "Connect",
  connectingLabel: "Connecting...",
  connectedAs: (email: string) => `Connected as ${email}`,
  disconnectButton: "Disconnect",
  reconnectButton: "Reconnect",
  reconnectCallout: "Reconnect your account",
  statusConnected: "Connected",
  statusExpiring: "Expiring",
  statusExpired: "Expired",
  statusDisconnected: "Not connected",
};

export const Disconnected: Story = {
  args: {
    labels: defaultLabels,
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "disconnected",
    onConnect: noop,
    onReconnect: noop,
    onDisconnect: noop,
  },
};

export const DisconnectedGoogleMeet: Story = {
  args: {
    labels: defaultLabels,
    providerSlug: "google_meet",
    providerName: "Google Meet",
    connectionState: "disconnected",
    onConnect: noop,
    onReconnect: noop,
    onDisconnect: noop,
  },
};

export const Connecting: Story = {
  args: {
    labels: defaultLabels,
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "connecting",
    onConnect: noop,
    onReconnect: noop,
    onDisconnect: noop,
  },
};

export const Connected: Story = {
  args: {
    labels: defaultLabels,
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "connected",
    connectedEmail: "[EMAIL_REDACTED]",
    onConnect: noop,
    onReconnect: noop,
    onDisconnect: noop,
  },
};

export const ConnectedMicrosoftTeams: Story = {
  args: {
    labels: defaultLabels,
    providerSlug: "microsoft_teams",
    providerName: "Microsoft Teams",
    connectionState: "connected",
    connectedEmail: "[EMAIL_REDACTED]",
    onConnect: noop,
    onReconnect: noop,
    onDisconnect: noop,
  },
};

export const ConnectedWithoutEmail: Story = {
  args: {
    labels: defaultLabels,
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "connected",
    onConnect: noop,
    onReconnect: noop,
    onDisconnect: noop,
  },
};

export const Expiring: Story = {
  args: {
    labels: defaultLabels,
    providerSlug: "google_meet",
    providerName: "Google Meet",
    connectionState: "expiring",
    connectedEmail: "[EMAIL_REDACTED]",
    onConnect: noop,
    onReconnect: noop,
    onDisconnect: noop,
  },
};

export const Expired: Story = {
  args: {
    labels: defaultLabels,
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "expired",
    onConnect: noop,
    onReconnect: noop,
    onDisconnect: noop,
  },
};

export const DisconnectedWithLoading: Story = {
  args: {
    labels: defaultLabels,
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "disconnected",
    loading: true,
    onConnect: noop,
    onReconnect: noop,
    onDisconnect: noop,
  },
};

export const ConnectedWithLoading: Story = {
  args: {
    labels: defaultLabels,
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "connected",
    connectedEmail: "[EMAIL_REDACTED]",
    loading: true,
    onConnect: noop,
    onReconnect: noop,
    onDisconnect: noop,
  },
};

export const ExpiringWithReconnectLoading: Story = {
  args: {
    labels: defaultLabels,
    providerSlug: "zoom",
    providerName: "Zoom",
    connectionState: "expiring",
    connectedEmail: "[EMAIL_REDACTED]",
    loading: true,
    onConnect: noop,
    onReconnect: noop,
    onDisconnect: noop,
  },
};
