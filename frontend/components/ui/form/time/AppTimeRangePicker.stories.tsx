import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AppTimeRangePicker } from "@/frontend/components/ui/form/time/AppTimeRangePicker";

function AppTimeRangePickerStory({
  initialFrom = "09:00",
  initialTo = "10:30",
}: Readonly<{ initialFrom?: string; initialTo?: string }>) {
  const [fromTime, setFromTime] = useState(initialFrom);
  const [toTime, setToTime] = useState(initialTo);

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <AppTimeRangePicker
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

const meta: Meta<typeof AppTimeRangePickerStory> = {
  title: "Form/AppTimeRangePicker",
  component: AppTimeRangePickerStory,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AppTimeRangePickerStory>;

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
