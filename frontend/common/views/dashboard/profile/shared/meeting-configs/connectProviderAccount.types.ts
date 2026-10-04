import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export type ConnectProviderAccountLabels = Pick<
  ProfileNotificationsLabels["connectAccount"],
  | "connectButton"
  | "connectingLabel"
  | "connectedAs"
  | "disconnectButton"
  | "reconnectButton"
  | "reconnectCallout"
  | "statusConnected"
  | "statusExpiring"
  | "statusExpired"
  | "statusDisconnected"
>;
