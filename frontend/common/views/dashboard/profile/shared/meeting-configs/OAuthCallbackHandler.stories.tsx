import { Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { OAuthCallbackHandlerLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler";
import { OAuthCallbackHandler } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler";

const meta = {
  title: "Views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler",
  component: OAuthCallbackHandler,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof OAuthCallbackHandler>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: OAuthCallbackHandlerLabels = {
  oauthCallbackSuccess: "Zoom account connected successfully.",
  oauthCallbackError: "Failed to connect the provider. Please try again.",
};

const logCallback = (_status: unknown, _provider: string, _error?: string) => {
  // Stories only demonstrate the labels/announcements; toast handling lives in the ViewModel.
};

export const Success: Story = {
  args: {
    labels,
    onCallbackDetected: logCallback,
  },
  render: () => (
    <Typography variant="caption">
      Component renders a screen-reader-only announcement region. Visit
      <code>?oauth_status=success&provider=zoom</code> before mount to trigger the success announcement.
    </Typography>
  ),
};

export const Error: Story = {
  args: {
    labels,
    onCallbackDetected: logCallback,
  },
  render: () => (
    <Typography variant="caption">
      Component renders a screen-reader-only announcement region. Visit
      <code>?oauth_status=error&provider=google_meet&error=access_denied</code> before mount.
    </Typography>
  ),
};

export const Idle: Story = {
  args: {
    labels,
    onCallbackDetected: logCallback,
  },
  render: () => (
    <Typography variant="caption">
      Idle state — no <code>oauth_status</code> param present. Component only listens for window focus events.
    </Typography>
  ),
};
