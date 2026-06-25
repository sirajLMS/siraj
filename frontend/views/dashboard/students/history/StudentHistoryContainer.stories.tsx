import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { useStudentHistoryStore } from "@/frontend/stores/mockStudentHistoryStore";
import { StudentHistoryView } from "./StudentHistoryView";
import type { ClassSession, StudentHistoryMetrics } from "./types";

function MockStudentHistoryContainer() {
  const store = useStudentHistoryStore();
  const [currentMonth, setCurrentMonth] = useState<Date>(store.currentMonth);
  const [selectedWeek, setSelectedWeek] = useState<number>(store.selectedWeek);

  // Map store structure to View structures
  const metrics: StudentHistoryMetrics = {
    totalClasses: store.metrics.totalClasses,
    attendanceRate: store.metrics.attendanceRate,
    hoursStudied: store.metrics.hoursStudied,
    performance: 85,
  };

  const classes: Record<number, ClassSession> = {};
  Object.entries(store.classes).forEach(([dayStr, c]) => {
    if (c) {
      const day = Number(dayStr);
      let durationMinutes = 60;
      if (c.duration.endsWith("h")) {
        durationMinutes = Math.round(Number.parseFloat(c.duration.replace("h", "")) * 60);
      } else if (c.duration.endsWith("m")) {
        durationMinutes = Number.parseInt(c.duration.replace("m", ""), 10);
      }

      classes[day] = {
        id: c.id,
        dayOfMonth: day,
        title: c.title,
        time: c.time,
        duration: durationMinutes,
        status: c.status,
        instructor: c.instructor,
        timeSlot: c.timeSlot,
        room: c.room,
        notes: c.notes,
      };
    }
  });

  return (
    <StudentHistoryView
      studentName={store.studentName}
      currentMonth={currentMonth}
      metrics={metrics}
      classes={classes}
      selectedWeek={selectedWeek}
      onSelectWeek={setSelectedWeek}
      onMonthChange={setCurrentMonth}
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
