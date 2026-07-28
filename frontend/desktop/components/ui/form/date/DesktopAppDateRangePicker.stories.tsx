import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DesktopAppDateRangePicker } from "@/frontend/desktop/components/ui/form/date/DesktopAppDateRangePicker";

function DesktopAppDateRangePickerStory({
  initialFrom = "2024-01-15",
  initialTo = "2024-01-20",
}: Readonly<{ initialFrom?: string; initialTo?: string }>) {
  const [fromDate, setFromDate] = useState(initialFrom);
  const [toDate, setToDate] = useState(initialTo);

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <DesktopAppDateRangePicker
        fromDate={fromDate}
        toDate={toDate}
        onChange={(nextFrom, nextTo) => {
          setFromDate(nextFrom);
          setToDate(nextTo);
        }}
        label="Date Range"
        fromLabel="From"
        toLabel="To"
      />
    </Box>
  );
}

const meta: Meta<typeof DesktopAppDateRangePickerStory> = {
  title: "UI/AppDateRangePicker/Desktop",
  component: DesktopAppDateRangePickerStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof DesktopAppDateRangePickerStory>;

export const Default: Story = {};

export const EmptyRange: Story = {
  args: {
    initialFrom: "",
    initialTo: "",
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    initialFrom: "2024-06-10",
    initialTo: "2024-06-15",
  },
};
