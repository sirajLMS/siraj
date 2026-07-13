import { create } from "zustand";

export interface StudentHistoryState {
  readonly currentMonth: Date;
  readonly selectedDay: number | null;
  readonly selectedWeek: number;
  setSelectedDay: (day: number | null) => void;
  setCurrentMonth: (date: Date) => void;
  setSelectedWeek: (week: number) => void;
}

export const useStudentHistoryStore = create<StudentHistoryState>(set => ({
  currentMonth: new Date(),
  selectedDay: null,
  selectedWeek: 1,

  setSelectedDay: day => {
    set({ selectedDay: day });
  },
  setCurrentMonth: date => {
    set({ currentMonth: date, selectedDay: null, selectedWeek: 1 });
  },
  setSelectedWeek: week => {
    set({ selectedWeek: week });
  },
}));
