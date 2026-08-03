import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
  DesktopMeetingConfigList,
  type DesktopMeetingConfigListItem,
} from "@/frontend/desktop/components/ui/display/meetingConfig/MeetingConfigList.desktop";

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
    supportsAutoGeneration: false,
    supportsUsername: true,
    supportsPassword: true,
    supportsTenantId: false,
  },
  providerKind: "manual",
};

const sampleConfigs: DesktopMeetingConfigListItem[] = [
  {
    id: "cfg-1",
    userId: "user-1",
    providerId: "prov-zoom",
    label: "Personal Zoom",
    isDefault: true,
    hasSecret: true,
    oauthTokenExpiresAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    details: {
      meetingUrl: "https://zoom.us/j/123456789",
      username: "teacher@example.com",
      tenantId: null,
    },
    providerMetadata: null,
    provider: mockProvider,
  },
  {
    id: "cfg-2",
    userId: "user-1",
    providerId: "prov-gmeet",
    label: "Backup Meet",
    isDefault: false,
    hasSecret: false,
    oauthTokenExpiresAt: null,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    details: {
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      username: null,
      tenantId: null,
    },
    providerMetadata: null,
    provider: {
      ...mockProvider,
      id: "prov-gmeet",
      slug: "google-meet",
      name: { en: "Google Meet", ar: "جوجل ميت" },
      urlAllowlist: ["meet.google.com"],
      urlExample: "https://meet.google.com/abc-defg-hij",
      fieldSchema: {
        requiresMeetingUrl: true,
        supportsAutoGeneration: false,
        supportsUsername: false,
        supportsPassword: false,
        supportsTenantId: false,
      },
      providerKind: "manual",
    },
  },
];

const meta: Meta<typeof DesktopMeetingConfigList> = {
  title: "UI/MeetingConfigList/Desktop",
  component: DesktopMeetingConfigList,
  tags: ["ai-generated"],
  decorators: [
    Story => (
      <Box sx={{ p: 2, maxWidth: 640 }}>
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
type Story = StoryObj<typeof DesktopMeetingConfigList>;

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
