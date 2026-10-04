import { create } from "zustand";
import type { ClassSession, StudentHistoryMetrics } from "@/frontend/common/views/dashboard/students/history/types";
import { AttendanceStatus } from "@/shared/constants/attendance-status.enum";

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

function buildClassSession(id: string, dayOfMonth: number, overrides: Partial<ClassSession>): ClassSession {
  return {
    id,
    dayOfMonth,
    title: "Islamic History",
    time: "08:00 AM",
    duration: 90,
    status: AttendanceStatus.PRESENT,
    instructor: "Dr. Ahmed",
    timeSlot: "08:00 AM - 09:30 AM",
    room: "Room 101",
    notes: "Good participation.",
    ...overrides,
  };
}

const MOCK_CLASSES: Record<number, ClassSession> = {
  2: buildClassSession("c1", 2, {}),
  3: buildClassSession("c2", 3, {
    title: "Advanced Calculus",
    time: "10:30 AM",
    duration: 120,
    instructor: "Prof. Sarah",
    timeSlot: "10:30 AM - 12:30 PM",
    room: "Room 202",
    notes: "Completed exercises.",
  }),
  4: buildClassSession("c3", 4, {
    title: "Modern Arabic Lit",
    time: "01:00 PM",
    duration: 60,
    status: AttendanceStatus.ABSENT,
    instructor: "Dr. Ali",
    timeSlot: "01:00 PM - 02:00 PM",
    room: "Room 303",
    notes: "Missed class.",
  }),
  7: buildClassSession("c4", 7, {
    title: "Physics Lab: Mechanics",
    duration: 150,
    instructor: "Dr. Samir Al-Kouri",
    timeSlot: "09:00 AM - 11:30 AM",
    room: "Lab 4-B (Science Block)",
    notes:
      "Focus on experimental error analysis in kinetic motion. Ahmad demonstrated strong proficiency in using the laser gate measuring devices today.",
  }),
  9: buildClassSession("c5", 9, {
    title: "Ethics & Philo",
    time: "11:00 AM",
    instructor: "Prof. Omar",
    timeSlot: "11:00 AM - 12:30 PM",
    room: "Room 105",
    notes: "Engaged in discussion.",
  }),
  10: buildClassSession("c6", 10, {}),
  14: buildClassSession("c7", 14, {
    title: "Physics Lab",
    duration: 150,
    instructor: "Dr. Samir Al-Kouri",
    timeSlot: "09:00 AM - 11:30 AM",
    room: "Lab 4-B",
    notes: "Lab work completed.",
  }),
  15: buildClassSession("c8", 15, {
    title: "Physics Lab",
    instructor: "Dr. Samir Al-Kouri",
    timeSlot: "09:00 AM - 10:30 AM",
    room: "Lab 4-B",
    notes: "Advanced Mechanics",
  }),
  16: buildClassSession("c9", 16, {
    title: "Advanced Calculus",
    time: "10:30 AM",
    duration: 120,
    instructor: "Prof. Sarah",
    timeSlot: "10:30 AM - 12:30 PM",
    room: "Room 202",
    notes: "Completed exercises.",
  }),
  21: buildClassSession("c10", 21, {
    title: "Ethics & Philo",
    time: "11:00 AM",
    instructor: "Prof. Omar",
    timeSlot: "11:00 AM - 12:30 PM",
    room: "Room 105",
    status: AttendanceStatus.LATE,
    notes: "Arrived 15 mins late.",
  }),
  24: buildClassSession("c11", 24, {
    title: "Modern Arabic Lit",
    time: "01:00 PM",
    duration: 60,
    instructor: "Dr. Ali",
    timeSlot: "01:00 PM - 02:00 PM",
    room: "Room 303",
    notes: "Good reading.",
  }),
  28: buildClassSession("c12", 28, {
    title: "Physics Lab",
    duration: 150,
    instructor: "Dr. Samir Al-Kouri",
    timeSlot: "09:00 AM - 11:30 AM",
    room: "Lab 4-B",
    notes: "Lab work completed.",
  }),
  30: buildClassSession("c13", 30, {}),
};

export const useMockStudentHistoryStore = create<MockStudentHistoryState>(set => ({
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
