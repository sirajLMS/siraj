import { create } from "zustand";

export interface ClassSession {
  readonly id: string;
  readonly day: number;
  readonly title: string;
  readonly time: string;
  readonly duration: string;
  readonly status: "present" | "absent" | "late";
  readonly instructor: string;
  readonly timeSlot: string;
  readonly room: string;
  readonly notes: string;
}

export interface StudentHistoryMetrics {
  readonly totalClasses: number;
  readonly attendanceRate: number;
  readonly hoursStudied: number;
  readonly performance: string;
}

export interface StudentHistoryState {
  readonly currentMonth: Date;
  readonly selectedDay: number | null;
  readonly selectedWeek: number;
  setSelectedDay: (day: number | null) => void;
  setCurrentMonth: (date: Date) => void;
  setSelectedWeek: (week: number) => void;
}

export const useStudentHistoryStore = create<StudentHistoryState>(set => ({
  currentMonth: new Date(2024, 9, 1), // Oct 1, 2024
  selectedDay: null,
  selectedWeek: 3,

  setSelectedDay: day => {
    set({ selectedDay: day });
  },
  setCurrentMonth: date => {
    set({ currentMonth: date });
  },
  setSelectedWeek: week => {
    set({ selectedWeek: week });
  },
}));
