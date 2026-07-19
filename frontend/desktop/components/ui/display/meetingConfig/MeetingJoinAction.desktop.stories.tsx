import { Box, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { DesktopMeetingJoinAction } from "@/frontend/desktop/components/ui/display/meetingConfig/MeetingJoinAction.desktop";

const mockMeeting: EffectiveMeetingFieldsFragment = {
  joinUrl: "https://meet.example.com/abc-123",
  providerSlug: "zoom",
  providerName: { en: "Zoom", ar: "زووم" },
  logoUrl: null,
  meetingId: "123-456-789",
  source: "class",
  configId: "cfg-1",
  providerId: "prov-1",
};

const meta: Meta<typeof DesktopMeetingJoinAction> = {
  title: "UI/MeetingJoinAction/Desktop",
  component: DesktopMeetingJoinAction,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof DesktopMeetingJoinAction>;

export const Default: Story = {
  render: () => (
    <Box sx={{ p: 2, width: 320 }}>
      <DesktopMeetingJoinAction joinUrl="https://meet.example.com/abc-123" meeting={mockMeeting} />
    </Box>
  ),
};

export const ButtonVariant: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <DesktopMeetingJoinAction
        joinUrl="https://meet.example.com/abc-123"
        meeting={mockMeeting}
        variant="button"
        label="Join meeting"
      />
    </Box>
  ),
};

export const IconVariant: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <DesktopMeetingJoinAction joinUrl="https://meet.example.com/abc-123" meeting={mockMeeting} variant="icon" />
    </Box>
  ),
};

export const SetupRequired: Story = {
  render: () => (
    <Box sx={{ p: 2, width: 480 }}>
      <DesktopMeetingJoinAction emptyRole="teacher" setupHref="/dashboard/profile/meeting" />
    </Box>
  ),
};

export const DisabledIcon: Story = {
  render: () => (
    <Stack sx={{ p: 2 }}>
      <DesktopMeetingJoinAction variant="icon" disabled />
    </Stack>
  ),
};
