import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import {
  MobileMeetingConfigList,
  type MobileMeetingConfigListItem,
} from "@/frontend/mobile/components/ui/display/meetingConfig/MeetingConfigList.mobile";

const mockProvider = {
  id: "prov-zoom",
  slug: "zoom",
  name: { en: "Zoom", ar: "زووم" },
  description: { en: "Zoom meetings", ar: "اجتماعات زووم" },
  instructions: null,
  urlAllowlist: ["zoom.us"],
  urlExample: "https://zoom.us/j/123456789",
  logoUrl: null,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  fieldSchema: {
    requiresMeetingUrl: true,
    supportsUsername: true,
    supportsPassword: true,
    supportsTenantId: false,
  },
};

const sampleConfigs: MobileMeetingConfigListItem[] = [
  {
    id: "cfg-1",
    userId: "user-1",
    providerId: "prov-zoom",
    label: "Personal Zoom",
    isDefault: true,
    hasSecret: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    details: {
      meetingUrl: "https://zoom.us/j/123456789",
      username: "teacher@example.com",
      tenantId: null,
    },
    provider: mockProvider,
  },
  {
    id: "cfg-2",
    userId: "user-1",
    providerId: "prov-gmeet",
    label: "Backup Meet",
    isDefault: false,
    hasSecret: false,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    details: {
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      username: null,
      tenantId: null,
    },
    provider: {
      ...mockProvider,
      id: "prov-gmeet",
      slug: "google-meet",
      name: { en: "Google Meet", ar: "جوجل ميت" },
      urlAllowlist: ["meet.google.com"],
      urlExample: "https://meet.google.com/abc-defg-hij",
      fieldSchema: {
        requiresMeetingUrl: true,
        supportsUsername: false,
        supportsPassword: false,
        supportsTenantId: false,
      },
    },
  },
];

const meta: Meta<typeof MobileMeetingConfigList> = {
  title: "UI/MeetingConfigList/Mobile",
  component: MobileMeetingConfigList,
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
    configs: sampleConfigs,
    title: "Meeting configs",
    loading: false,
  },
};

export default meta;
type Story = StoryObj<typeof MobileMeetingConfigList>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    onEditAction: fn(),
    onSetDefaultAction: fn(),
    onDeleteAction: fn(),
  },
};

export const Loading: Story = {
  args: {
    configs: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    configs: [],
    loading: false,
  },
};

export const RTL: Story = {
  globals: { locale: "ar" },
  args: {
    onEditAction: fn(),
    onSetDefaultAction: fn(),
    onDeleteAction: fn(),
  },
};
