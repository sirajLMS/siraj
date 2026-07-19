import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
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
  title: "UI/AppTimePicker/Mobile",
  component: MobileAppTimePickerStory,
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
