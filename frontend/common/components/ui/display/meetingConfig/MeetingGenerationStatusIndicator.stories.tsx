import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MeetingGenerationStatusIndicator } from "@/frontend/common/components/ui/display/meetingConfig/MeetingGenerationStatusIndicator";

const meta = {
  title: "Components/ui/display/meetingConfig/MeetingGenerationStatusIndicator",
  component: MeetingGenerationStatusIndicator,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof MeetingGenerationStatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

const SAMPLE_URL = "https://zoom.us/j/987654321";
const EXPIRES_ISO = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

export const Pending: Story = {
  args: { status: "pending" },
};

export const Generated: Story = {
  args: {
    status: "success",
    url: SAMPLE_URL,
    expiresAt: EXPIRES_ISO,
    onCopyUrl: noop,
  },
};

export const Failed: Story = {
  args: {
    status: "failed",
    error: "Provider rate limit exceeded. Retry in a few minutes.",
    onRetry: noop,
  },
};

export const FailedWithoutDetails: Story = {
  args: { status: "failed" },
};

export const GeneratedWithoutUrl: Story = {
  args: { status: "success" },
};

export const AllStates: Story = {
  args: { status: "pending" },
  render: () => (
    <Stack spacing={3} sx={{ width: 520 }}>
      <Stack spacing={1}>
        <Typography variant="caption">Pending</Typography>
        <MeetingGenerationStatusIndicator status="pending" />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="caption">Generated</Typography>
        <MeetingGenerationStatusIndicator status="success" url={SAMPLE_URL} expiresAt={EXPIRES_ISO} onCopyUrl={noop} />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="caption">Failed with retry</Typography>
        <MeetingGenerationStatusIndicator status="failed" error="Provider rate limit exceeded." onRetry={noop} />
      </Stack>
    </Stack>
  ),
};
