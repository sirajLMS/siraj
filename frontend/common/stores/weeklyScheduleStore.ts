"use client";

import { create } from "zustand";

export interface WeeklyScheduleState {
  readonly selectedWeekDate: string;
  readonly clearDialogOpen: boolean;
  setSelectedWeekDate: (date: string) => void;
  setClearDialogOpen: (open: boolean) => void;
  /** Lazily initializes selectedWeekDate on first access. Idempotent. */
  readonly ensureSelectedWeekDate: () => void;
}

export const useWeeklyScheduleStore = create<WeeklyScheduleState>((set, get) => ({
  selectedWeekDate: "",
  clearDialogOpen: false,
  ensureSelectedWeekDate: () => {
    if (get().selectedWeekDate === "") {
      set({ selectedWeekDate: new Date().toISOString().split("T")[0] });
    }
  },
  setSelectedWeekDate: (date: string) => {
    set({ selectedWeekDate: date });
  },
  setClearDialogOpen: (open: boolean) => {
    set({ clearDialogOpen: open });
  },
}));
