import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
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
  title: "UI/AppDatePicker/Mobile",
  component: MobileAppDatePickerStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: {
        mobile1: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobile2: {
          name: "Mobile Large (414px)",
          styles: { width: "414px", height: "896px" },
        },
        tablet: {
          name: "Tablet (768px)",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop (1280px)",
          styles: { width: "1280px", height: "800px" },
        },
      },
    },
  },
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
