import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReconnectAllActionLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ReconnectAllAction";
import { ReconnectAllAction } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ReconnectAllAction";
import type { ReauthProvider } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.types";

const meta = {
  title: "Views/dashboard/profile/shared/meeting-configs/ReconnectAllAction",
  component: ReconnectAllAction,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof ReconnectAllAction>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: ReconnectAllActionLabels = {
  reconnectAllWithCount: (count: number) => `Reconnect all (${count})`,
  reconnectingProgress: (current: number, total: number) => `Reconnecting ${current} of ${total}…`,
  reconnectedProviders: (count: number) => `Reconnected ${count} provider(s).`,
  reconnectFailedProviders: (count: number) => `Failed to reconnect ${count} provider(s).`,
  reconnectAllAriaLabel: "Reconnect all meeting providers",
};

const noop = () => {};

const PROVIDERS: readonly ReauthProvider[] = [
  { slug: "zoom", name: "Zoom", expiryState: "expired" },
  { slug: "google_meet", name: "Google Meet", expiryState: "expiring_soon" },
  { slug: "microsoft_teams", name: "Microsoft Teams", expiryState: "expired" },
];

const TWO_PROVIDERS: readonly ReauthProvider[] = [
  { slug: "zoom", name: "Zoom", expiryState: "expired" },
  { slug: "google_meet", name: "Google Meet", expiryState: "expiring_soon" },
];

async function alwaysSucceeds(): Promise<boolean> {
  return true;
}

async function alwaysFails(): Promise<boolean> {
  return false;
}

export const ThreeProvidersSucceed: Story = {
  args: {
    providers: PROVIDERS,
    labels,
    onReconnectProvider: alwaysSucceeds,
    onComplete: noop,
  },
};

export const TwoProviders: Story = {
  args: {
    providers: TWO_PROVIDERS,
    labels,
    onReconnectProvider: alwaysSucceeds,
    onComplete: noop,
  },
};

export const AllFail: Story = {
  args: {
    providers: PROVIDERS,
    labels,
    onReconnectProvider: alwaysFails,
    onComplete: noop,
  },
};

export const MixedResults: Story = {
  args: {
    providers: PROVIDERS,
    labels,
    onReconnectProvider: async (slug: string) => slug !== "zoom",
    onComplete: noop,
  },
};

export const AllVariants: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: 480 }}>
      <Typography variant="caption">Three providers — all succeed</Typography>
      <ReconnectAllAction
        providers={PROVIDERS}
        labels={labels}
        onReconnectProvider={alwaysSucceeds}
        onComplete={noop}
      />
      <Typography variant="caption">Two providers</Typography>
      <ReconnectAllAction
        providers={TWO_PROVIDERS}
        labels={labels}
        onReconnectProvider={alwaysSucceeds}
        onComplete={noop}
      />
    </Stack>
  ),
};
