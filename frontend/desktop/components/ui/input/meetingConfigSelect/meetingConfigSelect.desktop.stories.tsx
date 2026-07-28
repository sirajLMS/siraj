import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  MeetingConfigSelectDesktop,
  type MeetingConfigSelectOption,
  type MeetingConfigSelectProps,
} from "@/frontend/desktop/components/ui/input/meetingConfigSelect/meetingConfigSelect.desktop";

const mockOptions: MeetingConfigSelectOption[] = [
  {
    id: "config-1",
    label: "Main classroom",
    isDefault: true,
    provider: {
      id: "provider-zoom",
      slug: "zoom",
      name: { en: "Zoom", ar: "زووم" },
      logoUrl: null,
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
      logoUrl: null,
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
    <Box sx={{ width: 400, p: 2 }}>
      <MeetingConfigSelectDesktop options={mockOptions} value={value} onChangeAction={setValue} {...props} />
    </Box>
  );
}

const meta: Meta<typeof MeetingConfigSelectStory> = {
  title: "UI/MeetingConfigSelect/Desktop",
  component: MeetingConfigSelectStory,
  tags: ["ai-generated"],
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
