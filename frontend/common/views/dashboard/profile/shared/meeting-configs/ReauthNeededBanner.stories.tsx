import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReauthNeededBanner } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner";
import type { MeetingConfigReauthNeededLabels } from "@/shared/locale/types/ui";

const meta = {
  title: "Views/dashboard/profile/shared/meeting-configs/ReauthNeededBanner",
  component: ReauthNeededBanner,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof ReauthNeededBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: MeetingConfigReauthNeededLabels = {
  reauthNeededTitle: "Re-authentication Required",
  reauthNeededMessage: "One or more meeting providers need you to reconnect.",
  reconnectButton: "Reconnect",
  reauthExpiringSoon: "expiring soon",
  reauthExpired: "expired",
  reconnectRequiredBadge: "Reconnect required",
  remindLater: "Remind me later",
  reconnectAllButton: "Reconnect All",
};

const noop = () => {};

export const SingleProviderExpiringSoon: Story = {
  args: {
    labels,
    onReconnect: noop,
    onDismiss: noop,
    reauthProviders: [{ slug: "zoom", name: "Zoom", expiryState: "expiring_soon" }],
  },
};

export const SingleProviderExpired: Story = {
  args: {
    labels,
    onReconnect: noop,
    onDismiss: noop,
    reauthProviders: [{ slug: "google_meet", name: "Google Meet", expiryState: "expired" }],
  },
};

export const MultipleProviders: Story = {
  args: {
    labels,
    onReconnect: noop,
    onReconnectAll: noop,
    onDismiss: noop,
    reauthProviders: [
      { slug: "zoom", name: "Zoom", expiryState: "expiring_soon" },
      { slug: "google_meet", name: "Google Meet", expiryState: "expired" },
      { slug: "microsoft_teams", name: "Microsoft Teams" },
    ],
  },
};

export const MultipleProvidersExpiringSoon: Story = {
  args: {
    labels,
    onReconnect: noop,
    onReconnectAll: noop,
    onDismiss: noop,
    reauthProviders: [
      { slug: "zoom", name: "Zoom", expiryState: "expiring_soon" },
      { slug: "google_meet", name: "Google Meet", expiryState: "expiring_soon" },
    ],
  },
};

export const NoProviders: Story = {
  args: {
    labels,
    onReconnect: noop,
    reauthProviders: [],
  },
};
