import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DateNavigator } from "@/frontend/common/components/ui/filter/DateNavigator";

function DateNavigatorStory({ initialValue = "2024-01-15" }: Readonly<{ initialValue?: string }>) {
  const [date, setDate] = useState(initialValue);

  return (
    <Box sx={{ width: 600, p: 2 }}>
      <DateNavigator
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

const meta: Meta<typeof DateNavigatorStory> = {
  title: "UI/Filter/DateNavigator",
  component: DateNavigatorStory,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DateNavigatorStory>;

export const Default: Story = {};

export const TodaySelected: Story = {
  render: () => {
    const today = new Date();
    const todayValue = today.toISOString().slice(0, 10);
    return <DateNavigatorStory initialValue={todayValue} />;
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  render: () => <DateNavigatorStory initialValue="2024-06-10" />,
};
