import type { OAuthFlowLabels } from "@/shared/locale/types/dashboard/oauth-flow";

export const dashboardOAuthFlowEn: OAuthFlowLabels = {
  connectingTo: (provider: string) => `Connecting to ${provider}…`,
  redirectingToProvider: (provider: string) => `Redirecting to ${provider}…`,
  connectionSuccessful: "Connection successful!",
  connectionFailed: "Connection failed. Please try again.",
  tokenExpired: "Your session has expired.",
  tokenExpiringSoon: "Your session will expire soon.",
  reconnectNow: "Reconnect now",
  remindMeLater: "Remind me later",
  statusConnected: "Connected",
  statusNotConnected: "Not connected",
  statusExpiring: "Expiring",
  statusExpired: "Expired",
  expiresInDays: (days: number) => `Expires in ${days} day${days === 1 ? "" : "s"}`,
  statusAriaLabel: "OAuth connection status",
};
