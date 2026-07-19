import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DateNavigatorDesktop } from "@/frontend/desktop/components/ui/filter/dateNavigator.desktop";

function DateNavigatorDesktopStory({ initialValue = "2024-01-15" }: Readonly<{ initialValue?: string }>) {
  const [date, setDate] = useState(initialValue);

  return (
    <Box sx={{ width: 600, p: 2 }}>
      <DateNavigatorDesktop
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

const meta: Meta<typeof DateNavigatorDesktopStory> = {
  title: "UI/DateNavigator/Desktop",
  component: DateNavigatorDesktopStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof DateNavigatorDesktopStory>;

export const Default: Story = {};

export const TodaySelected: Story = {
  render: () => {
    const today = new Date();
    const todayValue = today.toISOString().slice(0, 10);
    return <DateNavigatorDesktopStory initialValue={todayValue} />;
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  render: () => <DateNavigatorDesktopStory initialValue="2024-06-10" />,
};
