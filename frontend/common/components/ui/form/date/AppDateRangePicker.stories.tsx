import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { AppDateRangePicker } from "@/frontend/common/components/ui/form/date/AppDateRangePicker";

function AppDateRangePickerStory({
  initialFrom = "2024-01-15",
  initialTo = "2024-01-20",
}: Readonly<{ initialFrom?: string; initialTo?: string }>) {
  const [fromDate, setFromDate] = useState(initialFrom);
  const [toDate, setToDate] = useState(initialTo);

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <AppDateRangePicker
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

const meta: Meta<typeof AppDateRangePickerStory> = {
  title: "Form/AppDateRangePicker",
  component: AppDateRangePickerStory,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AppDateRangePickerStory>;

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
