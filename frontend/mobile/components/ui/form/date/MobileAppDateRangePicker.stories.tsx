import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileAppDateRangePicker } from "@/frontend/mobile/components/ui/form/date/MobileAppDateRangePicker";

function MobileAppDateRangePickerStory({
  initialFrom = "2024-01-15",
  initialTo = "2024-01-20",
}: Readonly<{ initialFrom?: string; initialTo?: string }>) {
  const [fromDate, setFromDate] = useState(initialFrom);
  const [toDate, setToDate] = useState(initialTo);

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <MobileAppDateRangePicker
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

const meta: Meta<typeof MobileAppDateRangePickerStory> = {
  title: "UI/AppDateRangePicker/Mobile",
  component: MobileAppDateRangePickerStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobileAppDateRangePickerStory>;

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
