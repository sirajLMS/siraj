import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DateNavigatorMobile } from "@/frontend/mobile/components/ui/filter/dateNavigator.mobile";

function DateNavigatorMobileStory({ initialValue = "2024-01-15" }: Readonly<{ initialValue?: string }>) {
  const [date, setDate] = useState(initialValue);

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <DateNavigatorMobile
        dateValue={date}
        todayLabel="Today"
        previousDayLabel="Previous day"
        nextDayLabel="Next day"
        dateLabel="Pick a date"
        onDateChange={setDate}
      />
    </Box>
  );
}

const meta: Meta<typeof DateNavigatorMobileStory> = {
  title: "UI/DateNavigator/Mobile",
  component: DateNavigatorMobileStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile",
      viewports: {
        mobile: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobileLarge: {
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
type Story = StoryObj<typeof DateNavigatorMobileStory>;

export const Default: Story = {};

export const TodaySelected: Story = {
  render: () => {
    const today = new Date();
    const todayValue = today.toISOString().slice(0, 10);
    return <DateNavigatorMobileStory initialValue={todayValue} />;
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  render: () => <DateNavigatorMobileStory initialValue="2024-06-10" />,
};
