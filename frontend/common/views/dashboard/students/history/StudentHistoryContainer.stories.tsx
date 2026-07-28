import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { create } from "zustand";
import { AttendanceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { StudentHistoryView } from "@/frontend/common/views/dashboard/students/history/StudentHistoryView";
import type { ClassSession, StudentHistoryMetrics } from "@/frontend/common/views/dashboard/students/history/types";

interface MockStudentHistoryState {
  readonly studentName: string;
  readonly currentMonth: Date;
  readonly metrics: StudentHistoryMetrics;
  readonly classes: Readonly<Partial<Record<number, ClassSession>>>;
  readonly selectedDay: number | null;
  readonly selectedWeek: number;
  setSelectedDay: (day: number | null) => void;
  setCurrentMonth: (date: Date) => void;
  setSelectedWeek: (week: number) => void;
}

const MOCK_METRICS: StudentHistoryMetrics = {
  totalClasses: 42,
  attendanceRate: 98,
  hoursStudied: 84.5,
  performance: 85,
};

const MOCK_CLASSES: Record<number, ClassSession> = {
  2: {
    id: "c1",
    dayOfMonth: 2,
    title: "Islamic History",
    time: "08:00 AM",
    duration: 90,
    status: AttendanceStatus.Present,
    instructor: "Dr. Ahmed",
    timeSlot: "08:00 AM - 09:30 AM",
    room: "Room 101",
    notes: "Good participation.",
  },
  3: {
    id: "c2",
    dayOfMonth: 3,
    title: "Advanced Calculus",
    time: "10:30 AM",
    duration: 120,
    status: AttendanceStatus.Present,
    instructor: "Prof. Sarah",
    timeSlot: "10:30 AM - 12:30 PM",
    room: "Room 202",
    notes: "Completed exercises.",
  },
  4: {
    id: "c3",
    dayOfMonth: 4,
    title: "Modern Arabic Lit",
    time: "01:00 PM",
    duration: 60,
    status: AttendanceStatus.Absent,
    instructor: "Dr. Ali",
    timeSlot: "01:00 PM - 02:00 PM",
    room: "Room 303",
    notes: "Missed class.",
  },
  7: {
    id: "c4",
    dayOfMonth: 7,
    title: "Physics Lab: Mechanics",
    time: "09:00 AM",
    duration: 150,
    status: AttendanceStatus.Present,
    instructor: "Dr. Samir Al-Kouri",
    timeSlot: "09:00 AM - 11:30 AM",
    room: "Lab 4-B (Science Block)",
    notes:
      "Focus on experimental error analysis in kinetic motion. Ahmad demonstrated strong proficiency in using the laser gate measuring devices today.",
  },
  9: {
    id: "c5",
    dayOfMonth: 9,
    title: "Ethics & Philo",
    time: "11:00 AM",
    duration: 90,
    status: AttendanceStatus.Present,
    instructor: "Prof. Omar",
    timeSlot: "11:00 AM - 12:30 PM",
    room: "Room 105",
    notes: "Engaged in discussion.",
  },
  10: {
    id: "c6",
    dayOfMonth: 10,
    title: "Islamic History",
    time: "08:00 AM",
    duration: 90,
    status: AttendanceStatus.Present,
    instructor: "Dr. Ahmed",
    timeSlot: "08:00 AM - 09:30 AM",
    room: "Room 101",
    notes: "Good participation.",
  },
  14: {
    id: "c7",
    dayOfMonth: 14,
    title: "Physics Lab",
    time: "09:00 AM",
    duration: 150,
    status: AttendanceStatus.Present,
    instructor: "Dr. Samir Al-Kouri",
    timeSlot: "09:00 AM - 11:30 AM",
    room: "Lab 4-B",
    notes: "Lab work completed.",
  },
  15: {
    id: "c8",
    dayOfMonth: 15,
    title: "Physics Lab",
    time: "09:00 AM",
    duration: 90,
    status: AttendanceStatus.Present,
    instructor: "Dr. Samir Al-Kouri",
    timeSlot: "09:00 AM - 10:30 AM",
    room: "Lab 4-B",
    notes: "Advanced Mechanics",
  },
  16: {
    id: "c9",
    dayOfMonth: 16,
    title: "Advanced Calculus",
    time: "10:30 AM",
    duration: 120,
    status: AttendanceStatus.Present,
    instructor: "Prof. Sarah",
    timeSlot: "10:30 AM - 12:30 PM",
    room: "Room 202",
    notes: "Completed exercises.",
  },
  21: {
    id: "c10",
    dayOfMonth: 21,
    title: "Ethics & Philo",
    time: "11:00 AM",
    duration: 90,
    status: AttendanceStatus.Late,
    instructor: "Prof. Omar",
    timeSlot: "11:00 AM - 12:30 PM",
    room: "Room 105",
    notes: "Arrived 15 mins late.",
  },
  24: {
    id: "c11",
    dayOfMonth: 24,
    title: "Modern Arabic Lit",
    time: "01:00 PM",
    duration: 60,
    status: AttendanceStatus.Present,
    instructor: "Dr. Ali",
    timeSlot: "01:00 PM - 02:00 PM",
    room: "Room 303",
    notes: "Good reading.",
  },
  28: {
    id: "c12",
    dayOfMonth: 28,
    title: "Physics Lab",
    time: "09:00 AM",
    duration: 150,
    status: AttendanceStatus.Present,
    instructor: "Dr. Samir Al-Kouri",
    timeSlot: "09:00 AM - 11:30 AM",
    room: "Lab 4-B",
    notes: "Lab work completed.",
  },
  30: {
    id: "c13",
    dayOfMonth: 30,
    title: "Islamic History",
    time: "08:00 AM",
    duration: 90,
    status: AttendanceStatus.Present,
    instructor: "Dr. Ahmed",
    timeSlot: "08:00 AM - 09:30 AM",
    room: "Room 101",
    notes: "Good participation.",
  },
};

const useMockStudentHistoryStore = create<MockStudentHistoryState>(set => ({
  studentName: "Ahmad Al-Farsi",
  currentMonth: new Date(2024, 9, 1),
  metrics: MOCK_METRICS,
  classes: MOCK_CLASSES,
  selectedDay: null,
  selectedWeek: 3,
  setSelectedDay: day => set({ selectedDay: day }),
  setCurrentMonth: date => set({ currentMonth: date }),
  setSelectedWeek: week => set({ selectedWeek: week }),
}));

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

  const handlePrint = () => {
    globalThis.print();
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
      onPrint={handlePrint}
      locale="en"
      labels={{} as never}
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
