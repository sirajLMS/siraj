import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { createMobileStoryMeta } from "@/frontend/common/stories";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date/MobileAppDatePicker";

function MobileAppDatePickerStory({
  label = "Select Date",
  initialValue = null,
}: Readonly<{ label?: string; initialValue?: Date | null }>) {
  const [value, setValue] = useState<Date | null>(initialValue);

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <MobileAppDatePicker label={label} value={value} onChange={setValue} />
    </Box>
  );
}

const meta: Meta<typeof MobileAppDatePickerStory> = {
  ...createMobileStoryMeta(MobileAppDatePickerStory, "UI/AppDatePicker/Mobile"),
  args: {
    label: "Select Date",
  },
};

export default meta;
type Story = StoryObj<typeof MobileAppDatePickerStory>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    initialValue: new Date("2024-06-15"),
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    label: "اختر التاريخ",
  },
};
