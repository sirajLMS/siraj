import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OAuthConnectionStatusBadge } from "@/frontend/common/components/ui/display/meetingConfig/OAuthConnectionStatusBadge";

const meta = {
  title: "Components/ui/display/meetingConfig/OAuthConnectionStatusBadge",
  component: OAuthConnectionStatusBadge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof OAuthConnectionStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

const FUTURE_ISO = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
const SOON_ISO = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
const PAST_ISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

export const Connected: Story = {
  args: { status: "connected" },
};

export const ConnectedWithExpiry: Story = {
  args: { status: "connected", expiresAt: FUTURE_ISO },
};

export const ExpiringSoon: Story = {
  args: { status: "expiring", expiresAt: SOON_ISO },
};

export const Expired: Story = {
  args: { status: "expired", expiresAt: PAST_ISO },
};

export const Disconnected: Story = {
  args: { status: "disconnected" },
};
