import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CopyMeetingUrlButton } from "@/frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton";

const meta = {
  title: "Components/ui/display/meetingConfig/CopyMeetingUrlButton",
  component: CopyMeetingUrlButton,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof CopyMeetingUrlButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_URL = "https://zoom.us/j/123456789";

export const IconVariant: Story = {
  args: { meetingUrl: SAMPLE_URL, variant: "icon" },
};

export const ButtonVariant: Story = {
  args: { meetingUrl: SAMPLE_URL, variant: "button" },
};

export const TextVariant: Story = {
  args: { meetingUrl: SAMPLE_URL, variant: "text" },
};

export const Small: Story = {
  args: { meetingUrl: SAMPLE_URL, size: "small" },
};

export const Large: Story = {
  args: { meetingUrl: SAMPLE_URL, size: "large" },
};

export const Disabled: Story = {
  args: { meetingUrl: SAMPLE_URL, disabled: true },
};

export const WithCustomTooltip: Story = {
  args: { meetingUrl: SAMPLE_URL, tooltipLabel: "Copy the meeting link" },
};

export const AllVariants: Story = {
  args: { meetingUrl: SAMPLE_URL },
  render: () => (
    <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
      <Typography variant="caption">Icon</Typography>
      <CopyMeetingUrlButton meetingUrl={SAMPLE_URL} variant="icon" />
      <Typography variant="caption">Button</Typography>
      <CopyMeetingUrlButton meetingUrl={SAMPLE_URL} variant="button" />
      <Typography variant="caption">Text</Typography>
      <CopyMeetingUrlButton meetingUrl={SAMPLE_URL} variant="text" />
    </Stack>
  ),
};
