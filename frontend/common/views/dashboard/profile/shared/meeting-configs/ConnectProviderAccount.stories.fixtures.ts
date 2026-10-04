import type { ConnectProviderAccountLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/connectProviderAccount.types";

export const storyNoop = () => {};

export const connectProviderAccountStoryLabels = {
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
} satisfies ConnectProviderAccountLabels;
