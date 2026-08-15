import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MeetingUrlStatusBadge } from "@/frontend/common/components/ui/display/meetingConfig/MeetingUrlStatusBadge";

const meta = {
  title: "Components/ui/display/meetingConfig/MeetingUrlStatusBadge",
  component: MeetingUrlStatusBadge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof MeetingUrlStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  args: { status: "pending" },
};

export const PendingSmall: Story = {
  args: { status: "pending", size: "small" },
};

export const Generated: Story = {
  args: { status: "generated" },
};

export const GeneratedSmall: Story = {
  args: { status: "generated", size: "small" },
};

export const Failed: Story = {
  args: { status: "failed" },
};

export const FailedSmall: Story = {
  args: { status: "failed", size: "small" },
};

export const Expired: Story = {
  args: { status: "expired" },
};

export const ExpiredSmall: Story = {
  args: { status: "expired", size: "small" },
};

export const WithTooltip: Story = {
  args: { status: "failed", tooltip: "Generation timed out — retry available" },
};
