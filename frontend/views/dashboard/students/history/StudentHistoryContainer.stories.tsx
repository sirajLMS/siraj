import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { create } from "zustand";
import type {
  ClassSession as StoreClassSession,
  StudentHistoryMetrics as StoreStudentHistoryMetrics,
} from "@/frontend/stores/studentHistoryStore";
import { StudentHistoryView } from "./StudentHistoryView";
import type { ClassSession, StudentHistoryMetrics } from "./types";

interface MockStudentHistoryState {
  readonly studentName: string;
  readonly currentMonth: Date;
  readonly metrics: StoreStudentHistoryMetrics;
  readonly classes: Readonly<Partial<Record<number, StoreClassSession>>>;
  readonly selectedDay: number | null;
  readonly selectedWeek: number;
  setSelectedDay: (day: number | null) => void;
  setCurrentMonth: (date: Date) => void;
  setSelectedWeek: (week: number) => void;
}

const MOCK_METRICS: StoreStudentHistoryMetrics = {
  totalClasses: 42,
  attendanceRate: 98,
  hoursStudied: 84.5,
  performance: "A-",
};

const MOCK_CLASSES: Record<number, StoreClassSession> = {
  2: {
    id: "c1",
    day: 2,
    title: "Islamic History",
    time: "08:00 AM",
    duration: "1.5h",
    status: "present",
    instructor: "Dr. Ahmed",
    timeSlot: "08:00 AM - 09:30 AM",
    room: "Room 101",
    notes: "Good participation.",
  },
  3: {
    id: "c2",
    day: 3,
    title: "Advanced Calculus",
    time: "10:30 AM",
    duration: "2.0h",
    status: "present",
    instructor: "Prof. Sarah",
    timeSlot: "10:30 AM - 12:30 PM",
    room: "Room 202",
    notes: "Completed exercises.",
  },
  4: {
    id: "c3",
    day: 4,
    title: "Modern Arabic Lit",
    time: "01:00 PM",
    duration: "1.0h",
    status: "absent",
    instructor: "Dr. Ali",
    timeSlot: "01:00 PM - 02:00 PM",
    room: "Room 303",
    notes: "Missed class.",
  },
  7: {
    id: "c4",
    day: 7,
    title: "Physics Lab: Mechanics",
    time: "09:00 AM",
    duration: "2.5h",
    status: "present",
    instructor: "Dr. Samir Al-Kouri",
    timeSlot: "09:00 AM - 11:30 AM",
    room: "Lab 4-B (Science Block)",
    notes:
      "Focus on experimental error analysis in kinetic motion. Ahmad demonstrated strong proficiency in using the laser gate measuring devices today.",
  },
  9: {
    id: "c5",
    day: 9,
    title: "Ethics & Philo",
    time: "11:00 AM",
    duration: "1.5h",
    status: "present",
    instructor: "Prof. Omar",
    timeSlot: "11:00 AM - 12:30 PM",
    room: "Room 105",
    notes: "Engaged in discussion.",
  },
  10: {
    id: "c6",
    day: 10,
    title: "Islamic History",
    time: "08:00 AM",
    duration: "1.5h",
    status: "present",
    instructor: "Dr. Ahmed",
    timeSlot: "08:00 AM - 09:30 AM",
    room: "Room 101",
    notes: "Good participation.",
  },
  14: {
    id: "c7",
    day: 14,
    title: "Physics Lab",
    time: "09:00 AM",
    duration: "2.5h",
    status: "present",
    instructor: "Dr. Samir Al-Kouri",
    timeSlot: "09:00 AM - 11:30 AM",
    room: "Lab 4-B",
    notes: "Lab work completed.",
  },
  15: {
    id: "c8",
    day: 15,
    title: "Physics Lab",
    time: "09:00 AM",
    duration: "1.5h",
    status: "present",
    instructor: "Dr. Samir Al-Kouri",
    timeSlot: "09:00 AM - 10:30 AM",
    room: "Lab 4-B",
    notes: "Advanced Mechanics",
  },
  16: {
    id: "c9",
    day: 16,
    title: "Advanced Calculus",
    time: "10:30 AM",
    duration: "2.0h",
    status: "present",
    instructor: "Prof. Sarah",
    timeSlot: "10:30 AM - 12:30 PM",
    room: "Room 202",
    notes: "Completed exercises.",
  },
  21: {
    id: "c10",
    day: 21,
    title: "Ethics & Philo",
    time: "11:00 AM",
    duration: "1.5h",
    status: "late",
    instructor: "Prof. Omar",
    timeSlot: "11:00 AM - 12:30 PM",
    room: "Room 105",
    notes: "Arrived 15 mins late.",
  },
  24: {
    id: "c11",
    day: 24,
    title: "Modern Arabic Lit",
    time: "01:00 PM",
    duration: "1.0h",
    status: "present",
    instructor: "Dr. Ali",
    timeSlot: "01:00 PM - 02:00 PM",
    room: "Room 303",
    notes: "Good reading.",
  },
  28: {
    id: "c12",
    day: 28,
    title: "Physics Lab",
    time: "09:00 AM",
    duration: "2.5h",
    status: "present",
    instructor: "Dr. Samir Al-Kouri",
    timeSlot: "09:00 AM - 11:30 AM",
    room: "Lab 4-B",
    notes: "Lab work completed.",
  },
  30: {
    id: "c13",
    day: 30,
    title: "Islamic History",
    time: "08:00 AM",
    duration: "1.5h",
    status: "present",
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
