import { create } from "zustand";

export interface WeeklyScheduleState {
  readonly selectedWeekDate: string;
  setSelectedWeekDate: (date: string) => void;
}

export const useWeeklyScheduleStore = create<WeeklyScheduleState>(set => ({
  selectedWeekDate: new Date().toISOString().split("T")[0],
  setSelectedWeekDate: (date: string) => {
    set({ selectedWeekDate: date });
  },
}));
