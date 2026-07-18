import { create } from "zustand";

export interface StudentPortalHistoryState {
  readonly year: number;
  readonly month: number;
  readonly selectedDay: number | null;
  readonly selectedWeek: number;
  readonly subjectFilter: string;
  readonly statusFilter: string;
  readonly setYearMonth: (year: number, month: number) => void;
  readonly goPrevMonth: () => void;
  readonly goNextMonth: () => void;
  readonly setSelectedDay: (day: number | null) => void;
  readonly setSelectedWeek: (week: number) => void;
  readonly setSubjectFilter: (subject: string) => void;
  readonly setStatusFilter: (status: string) => void;
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

const now = new Date();

export const useStudentPortalHistoryStore = create<StudentPortalHistoryState>(set => ({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  selectedDay: null,
  selectedWeek: 1,
  subjectFilter: "",
  statusFilter: "",

  setYearMonth: (year, month) => set({ year, month, selectedDay: null, selectedWeek: 1 }),
  goPrevMonth: () =>
    set(state => {
      const next = shiftMonth(state.year, state.month, -1);
      return { ...next, selectedDay: null, selectedWeek: 1 };
    }),
  goNextMonth: () =>
    set(state => {
      const next = shiftMonth(state.year, state.month, 1);
      return { ...next, selectedDay: null, selectedWeek: 1 };
    }),
  setSelectedDay: day => set({ selectedDay: day }),
  setSelectedWeek: week => set({ selectedWeek: week }),
  setSubjectFilter: subjectFilter => set({ subjectFilter }),
  setStatusFilter: statusFilter => set({ statusFilter }),
}));
