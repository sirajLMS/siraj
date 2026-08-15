import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  TokenExpiryWarning,
  type TokenExpiryWarningProps,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/TokenExpiryWarning";

const meta = {
  title: "Views/dashboard/profile/shared/meeting-configs/TokenExpiryWarning",
  component: TokenExpiryWarning,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof TokenExpiryWarning>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: TokenExpiryWarningProps["labels"] = {
  expiresInDays: (days: number) => `Expires in ${days} day(s)`,
  expiresInHours: (hours: number) => `Expires in ${hours} hour(s) — reconnect now!`,
  expired: "Token expired — reconnect required",
  reconnect: "Reconnect",
};

const noop = () => {};

const daysFromNow = (days: number): Date => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const hoursFromNow = (hours: number): Date => new Date(Date.now() + hours * 60 * 60 * 1000);
const pastDate = (): Date => new Date(Date.now() - 24 * 60 * 60 * 1000);

export const Warning7Days: Story = {
  args: {
    labels,
    providerName: "Zoom",
    expiresAt: daysFromNow(7),
    onReconnect: noop,
  },
};

export const Warning3Days: Story = {
  args: {
    labels,
    providerName: "Google Meet",
    expiresAt: daysFromNow(3),
    onReconnect: noop,
  },
};

export const Critical1Day: Story = {
  args: {
    labels,
    providerName: "Zoom",
    expiresAt: daysFromNow(1),
    onReconnect: noop,
  },
};

export const CriticalHours: Story = {
  args: {
    labels,
    providerName: "Microsoft Teams",
    expiresAt: hoursFromNow(4),
    onReconnect: noop,
  },
};

export const Expired: Story = {
  args: {
    labels,
    providerName: "Zoom",
    expiresAt: pastDate(),
    onReconnect: noop,
  },
};

export const Reconnecting: Story = {
  args: {
    labels,
    providerName: "Zoom",
    expiresAt: hoursFromNow(2),
    onReconnect: noop,
    reconnecting: true,
  },
};

export const NullExpiresAt: Story = {
  args: {
    labels,
    providerName: "Zoom",
    expiresAt: null,
    onReconnect: noop,
  },
  render: () => <Typography variant="caption">TokenExpiryWarning returns null when expiresAt is null.</Typography>,
};

export const AllStates: Story = {
  args: {
    labels,
    providerName: "Zoom",
    expiresAt: daysFromNow(7),
    onReconnect: noop,
  },
  render: () => (
    <Stack spacing={2} sx={{ width: 520 }}>
      <Typography variant="caption">Warning (7 days)</Typography>
      <TokenExpiryWarning labels={labels} providerName="Zoom" expiresAt={daysFromNow(7)} onReconnect={noop} />
      <Typography variant="caption">Critical (1 day)</Typography>
      <TokenExpiryWarning labels={labels} providerName="Zoom" expiresAt={daysFromNow(1)} onReconnect={noop} />
      <Typography variant="caption">Expired</Typography>
      <TokenExpiryWarning labels={labels} providerName="Google Meet" expiresAt={pastDate()} onReconnect={noop} />
      <Typography variant="caption">Reconnecting</Typography>
      <TokenExpiryWarning
        labels={labels}
        providerName="Microsoft Teams"
        expiresAt={hoursFromNow(4)}
        onReconnect={noop}
        reconnecting={true}
      />
    </Stack>
  ),
};
