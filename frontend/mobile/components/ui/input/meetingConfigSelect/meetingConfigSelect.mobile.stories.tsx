import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { MeetingConfigSelectOption } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import {
  MeetingConfigSelectMobile,
  type MeetingConfigSelectProps,
} from "@/frontend/mobile/components/ui/input/meetingConfigSelect/meetingConfigSelect.mobile";

const mockOptions: MeetingConfigSelectOption[] = [
  {
    id: "config-1",
    label: "Main classroom",
    isDefault: true,
    provider: {
      id: "provider-zoom",
      slug: "zoom",
      name: { en: "Zoom", ar: "زووم" },
      description: null,
      instructions: null,
      urlAllowlist: ["zoom.us"],
      urlExample: "https://zoom.us/j/123456789",
      logoUrl: null,
      fieldSchema: {
        requiresMeetingUrl: true,
        supportsUsername: true,
        supportsPassword: true,
        supportsTenantId: null,
      },
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  },
  {
    id: "config-2",
    label: "Backup room",
    isDefault: false,
    provider: {
      id: "provider-gmeet",
      slug: "google-meet",
      name: { en: "Google Meet", ar: "جوجل ميت" },
      description: null,
      instructions: null,
      urlAllowlist: ["meet.google.com"],
      urlExample: "https://meet.google.com/abc-defg-hij",
      logoUrl: null,
      fieldSchema: {
        requiresMeetingUrl: true,
        supportsUsername: false,
        supportsPassword: false,
        supportsTenantId: null,
      },
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  },
];

function MeetingConfigSelectStory({
  initialValue = mockOptions[0] ?? null,
  ...props
}: Readonly<
  Partial<Omit<MeetingConfigSelectProps, "value" | "onChangeAction" | "options">> & {
    initialValue?: MeetingConfigSelectOption | null;
  }
>) {
  const [value, setValue] = useState<MeetingConfigSelectOption | null>(initialValue);

  return (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <MeetingConfigSelectMobile options={mockOptions} value={value} onChangeAction={setValue} {...props} />
    </Box>
  );
}

const meta: Meta<typeof MeetingConfigSelectStory> = {
  title: "UI/MeetingConfigSelect/Mobile",
  component: MeetingConfigSelectStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MeetingConfigSelectStory>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    initialValue: null,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const AllowEmpty: Story = {
  args: {
    initialValue: null,
    allowEmpty: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
};
