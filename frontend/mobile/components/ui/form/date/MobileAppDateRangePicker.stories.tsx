import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
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
