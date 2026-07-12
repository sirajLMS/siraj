import { create } from "zustand";

export interface WeeklyScheduleState {
  readonly selectedWeekDate: string;
  readonly clearDialogOpen: boolean;
  setSelectedWeekDate: (date: string) => void;
  setClearDialogOpen: (open: boolean) => void;
}

export const useWeeklyScheduleStore = create<WeeklyScheduleState>(set => ({
  selectedWeekDate: new Date().toISOString().split("T")[0],
  clearDialogOpen: false,
  setSelectedWeekDate: (date: string) => {
    set({ selectedWeekDate: date });
  },
  setClearDialogOpen: (open: boolean) => {
    set({ clearDialogOpen: open });
  },
}));
