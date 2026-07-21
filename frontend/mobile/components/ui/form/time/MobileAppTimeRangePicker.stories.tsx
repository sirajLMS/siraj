import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileAppTimeRangePicker } from "@/frontend/mobile/components/ui/form/time/MobileAppTimeRangePicker";

function MobileAppTimeRangePickerStory({
  initialFrom = "09:00",
  initialTo = "10:30",
}: Readonly<{ initialFrom?: string; initialTo?: string }>) {
  const [fromTime, setFromTime] = useState(initialFrom);
  const [toTime, setToTime] = useState(initialTo);

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <MobileAppTimeRangePicker
        fromTime={fromTime}
        toTime={toTime}
        onChange={(nextFrom, nextTo) => {
          setFromTime(nextFrom);
          setToTime(nextTo);
        }}
        label="Time Range"
        fromLabel="From"
        toLabel="To"
      />
    </Box>
  );
}

const meta: Meta<typeof MobileAppTimeRangePickerStory> = {
  title: "UI/AppTimeRangePicker/Mobile",
  component: MobileAppTimeRangePickerStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobileAppTimeRangePickerStory>;

export const Default: Story = {};

export const EmptyRange: Story = {
  args: {
    initialFrom: "",
    initialTo: "",
  },
};

export const AfternoonSlot: Story = {
  args: {
    initialFrom: "14:00",
    initialTo: "15:30",
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    initialFrom: "13:00",
    initialTo: "14:30",
  },
};
