import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { MeetingConfigDisplayData as MobileMeetingConfigDisplayData } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { EffectiveMeetingSource } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileMeetingConfigDisplay } from "@/frontend/mobile/components/ui/display/meetingConfig/MeetingConfigDisplay.mobile";

const sampleConfig: MobileMeetingConfigDisplayData = {
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

const meta: Meta<typeof MobileMeetingConfigDisplay> = {
  title: "UI/MeetingConfigDisplay/Mobile",
  component: MobileMeetingConfigDisplay,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
  decorators: [
    Story => (
      <Box sx={{ p: 2, maxWidth: 375 }}>
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
type Story = StoryObj<typeof MobileMeetingConfigDisplay>;

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
