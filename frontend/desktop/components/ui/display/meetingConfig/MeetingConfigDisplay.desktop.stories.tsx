import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EffectiveMeetingSource } from "@/frontend/common/types/meeting-class-config.graphql.types";
import type { DesktopMeetingConfigDisplayData } from "@/frontend/desktop/components/ui/display/meetingConfig";
import { DesktopMeetingConfigDisplay } from "@/frontend/desktop/components/ui/display/meetingConfig/MeetingConfigDisplay.desktop";

const sampleConfig: DesktopMeetingConfigDisplayData = {
  id: "cfg-1",
  label: "Personal Zoom",
  isDefault: true,
  providerSlug: "zoom",
  providerName: { en: "Zoom", ar: "زووم" },
  meetingId: "123-456-789",
  source: EffectiveMeetingSource.Teacher,
  details: {
    meetingUrl: "https://zoom.us/j/123456789",
    username: "teacher@example.com",
    tenantId: "tenant-abc",
  },
  hasSecret: true,
  masked: false,
};

const meta: Meta<typeof DesktopMeetingConfigDisplay> = {
  title: "UI/MeetingConfigDisplay/Desktop",
  component: DesktopMeetingConfigDisplay,
  tags: ["ai-generated"],
  decorators: [
    Story => (
      <Box sx={{ p: 2, maxWidth: 560 }}>
        <Story />
      </Box>
    ),
  ],
  args: {
    config: sampleConfig,
    showSource: false,
    compact: false,
  },
};

export default meta;
type Story = StoryObj<typeof DesktopMeetingConfigDisplay>;

export const Default: Story = {};

export const WithSource: Story = {
  args: {
    showSource: true,
  },
};

export const MaskedCompact: Story = {
  args: {
    compact: true,
    config: {
      ...sampleConfig,
      masked: true,
      isDefault: false,
    },
  },
};

export const Empty: Story = {
  args: {
    config: {
      id: "cfg-empty",
      details: null,
      providerName: null,
      providerSlug: null,
      label: null,
    },
  },
};

export const RTL: Story = {
  globals: { locale: "ar" },
  args: {
    showSource: true,
  },
};
