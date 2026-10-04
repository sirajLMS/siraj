import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";
import type {
  MeetingConfigLinkedClassInstancesLabels,
  MeetingConfigReauthNeededLabels,
} from "@/shared/locale/types/ui";

export const reauthLabels: MeetingConfigReauthNeededLabels = {
  reauthNeededTitle: "Re-authentication Required",
  reauthNeededMessage: "One or more meeting providers need you to reconnect.",
  reconnectButton: "Reconnect",
  reauthExpiringSoon: "expiring soon",
  reauthExpired: "expired",
  reconnectRequiredBadge: "Reconnect required",
  remindLater: "Remind me later",
  reconnectAllButton: "Reconnect All",
};

export const linkedLabels: MeetingConfigLinkedClassInstancesLabels = {
  viewBookingsLink: "View bookings",
  linkedClassInstancesTitle: "Linked class instances",
  linkedClassInstancesEmpty: "No class instances linked to this meeting config.",
  urlPendingBadge: "URL pending",
  classInstanceTitle: "Untitled class instance",
  startTime: "Start time",
  meetingUrl: "Meeting URL",
};

export const connectAccountLabels: ProfileNotificationsLabels["connectAccount"] = {
  connectButton: "Connect",
  connectingLabel: "Connecting…",
  connectedAs: (email: string) => `Connected as ${email}`,
  disconnectButton: "Disconnect",
  disconnectConfirmTitle: "Disconnect provider?",
  disconnectConfirm:
    "Are you sure you want to disconnect this provider? You will need to reconnect it to use it again.",
  confirmDisconnect: "Disconnect",
  cancel: "Cancel",
  reconnectButton: "Reconnect",
  reconnectCallout: "Reconnect required",
  statusConnected: "Connected",
  statusExpiring: "Expiring soon",
  statusExpired: "Expired",
  statusDisconnected: "Not connected",
};

export const autoGenLabels: ProfileNotificationsLabels["autoGeneration"] = {
  title: "Auto-Generated Meeting URLs",
  onSave: "Automatically generates a meeting URL when you save the meeting config.",
  preview: "Previews the generated URL before the class starts.",
  booking: "Generates a fresh URL when a booking is confirmed.",
  learnMore: "Learn more",
  learnLess: "Show less",
  summary: "Siraj auto-generates meeting URLs so you never have to copy/paste links again.",
  createConfig: "Create config",
  step1Title: "Connect",
  step1Description: "Connect a meeting provider (Zoom, Google Meet) under Integrations.",
  step2Title: "Create config",
  step2Description: "Create a meeting config and enable the Auto-Generated toggle.",
  step3Title: "Auto-generate at booking",
  step3Description: "A fresh URL is generated automatically when a booking is confirmed.",
};
