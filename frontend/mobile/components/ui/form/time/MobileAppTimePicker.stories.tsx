import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { createMobileStoryMeta } from "@/frontend/common/stories";
import { MobileAppTimePicker } from "@/frontend/mobile/components/ui/form/time/MobileAppTimePicker";

const SAMPLE_AFTERNOON = new Date();
SAMPLE_AFTERNOON.setHours(14, 30, 0, 0);

function MobileAppTimePickerStory({
  label = "Select Time",
  initialValue = null,
}: Readonly<{ label?: string; initialValue?: Date | null }>) {
  const [value, setValue] = useState<Date | null>(initialValue);

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <MobileAppTimePicker label={label} value={value} onChange={setValue} />
    </Box>
  );
}

const meta: Meta<typeof MobileAppTimePickerStory> = {
  ...createMobileStoryMeta(MobileAppTimePickerStory, "UI/AppTimePicker/Mobile"),
  args: {
    label: "Select Time",
  },
};

export default meta;
type Story = StoryObj<typeof MobileAppTimePickerStory>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    initialValue: SAMPLE_AFTERNOON,
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    label: "اختر الوقت",
  },
};
