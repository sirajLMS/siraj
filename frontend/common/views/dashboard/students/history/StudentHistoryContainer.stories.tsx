import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { useMockStudentHistoryStore } from "@/frontend/common/views/dashboard/students/history/StudentHistoryContainer.stories.fixtures";
import { StudentHistoryView } from "@/frontend/common/views/dashboard/students/history/StudentHistoryView";
import { dashboardStudentHistoryEn } from "@/shared/locale/en/dashboard/students/history";

function printHandler() {
  globalThis.print();
}

function MockStudentHistoryContainer() {
  const store = useMockStudentHistoryStore();
  const [currentMonth, setCurrentMonth] = useState<Date>(store.currentMonth);
  const [selectedWeek, setSelectedWeek] = useState<number>(store.selectedWeek);
  const [selectedDay, setSelectedDay] = useState<number | null>(store.selectedDay);

  const handlePrevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(next);
  };

  return (
    <StudentHistoryView
      studentName={store.studentName}
      currentMonth={currentMonth}
      metrics={store.metrics}
      classes={store.classes}
      selectedWeek={selectedWeek}
      selectedDay={selectedDay}
      onSelectWeek={setSelectedWeek}
      onSelectDay={setSelectedDay}
      onPrevMonth={handlePrevMonth}
      onNextMonth={handleNextMonth}
      onPrint={printHandler}
      locale="en"
      labels={dashboardStudentHistoryEn}
      loading={false}
    />
  );
}

const meta: Meta<typeof MockStudentHistoryContainer> = {
  title: "Views/dashboard/students/history/StudentHistoryContainer",
  component: MockStudentHistoryContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockStudentHistoryContainer>;

export const Default: Story = {
  args: {},
};
