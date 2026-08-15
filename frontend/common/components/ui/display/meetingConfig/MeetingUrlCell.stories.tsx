import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MeetingUrlCell } from "@/frontend/common/components/ui/display/meetingConfig/MeetingUrlCell";

const meta = {
  title: "Components/ui/display/meetingConfig/MeetingUrlCell",
  component: MeetingUrlCell,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof MeetingUrlCell>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

const URL = "https://zoom.us/j/123456789";

export const Generated: Story = {
  args: {
    meetingUrl: URL,
    meetingUrlStatus: "generated",
    joinLabel: "Join",
    onJoin: noop,
  },
};

export const Pending: Story = {
  args: {
    meetingUrl: URL,
    meetingUrlStatus: "pending",
  },
};

export const Failed: Story = {
  args: {
    meetingUrl: URL,
    meetingUrlStatus: "failed",
    meetingUrlError: "Provider rate limit exceeded",
    onRetry: noop,
  },
};

export const Expired: Story = {
  args: {
    meetingUrl: URL,
    meetingUrlStatus: "expired",
  },
};

export const WithoutUrl: Story = {
  args: {
    meetingUrl: null,
    setupHref: "/dashboard/profile/meeting-configs",
  },
};

export const Compact: Story = {
  args: {
    meetingUrl: URL,
    meetingUrlStatus: "generated",
    joinLabel: "Join",
    onJoin: noop,
    compact: true,
  },
};

export const CompactWithoutUrl: Story = {
  args: {
    meetingUrl: null,
    compact: true,
    setupHref: "/dashboard/profile/meeting-configs",
  },
};

export const AllStates: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: 480 }}>
      <Typography variant="caption">Generated</Typography>
      <MeetingUrlCell meetingUrl={URL} meetingUrlStatus="generated" joinLabel="Join" onJoin={noop} />
      <Typography variant="caption">Pending</Typography>
      <MeetingUrlCell meetingUrl={URL} meetingUrlStatus="pending" />
      <Typography variant="caption">Failed with retry</Typography>
      <MeetingUrlCell meetingUrl={URL} meetingUrlStatus="failed" meetingUrlError="Rate limited" onRetry={noop} />
      <Typography variant="caption">Expired</Typography>
      <MeetingUrlCell meetingUrl={URL} meetingUrlStatus="expired" />
      <Typography variant="caption">No URL</Typography>
      <MeetingUrlCell meetingUrl={null} setupHref="/setup" />
    </Stack>
  ),
};
