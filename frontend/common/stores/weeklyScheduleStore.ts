"use client";

import { create } from "zustand";
import { getTodayScheduleFilterDate } from "@/frontend/common/utils/scheduleFilterDate";

export interface WeeklyScheduleState {
  readonly selectedWeekDate: string;
  readonly clearDialogOpen: boolean;
  /**
   * Class instance id whose per-item delete confirmation dialog is open.
   * `null` when no dialog is open. Distinct from `clearDialogOpen`, which
   * drives the clear-whole-schedule dialog.
   */
  readonly deleteConfirmClassInstanceId: string | null;
  /** Day filter for the day-scoped schedule list. */
  readonly selectedDay: string;
  setSelectedWeekDate: (date: string) => void;
  setClearDialogOpen: (open: boolean) => void;
  openDeleteConfirm: (classInstanceId: string) => void;
  closeDeleteConfirm: () => void;
  /**
   * Closes the per-item delete confirmation dialog and returns the confirmed
   * class instance id, or `null` when no dialog was open.
   */
  confirmDeleteClassInstance: () => string | null;
  setSelectedDay: (day: string) => void;
  /** Lazily initializes selectedWeekDate on first access. Idempotent. */
  readonly ensureSelectedWeekDate: () => void;
}

export const useWeeklyScheduleStore = create<WeeklyScheduleState>((set, get) => ({
  selectedWeekDate: "",
  clearDialogOpen: false,
  deleteConfirmClassInstanceId: null,
  selectedDay: "monday",
  ensureSelectedWeekDate: () => {
    if (get().selectedWeekDate === "") {
      set({ selectedWeekDate: getTodayScheduleFilterDate() });
    }
  },
  setSelectedWeekDate: (date: string) => {
    set({ selectedWeekDate: date });
  },
  setClearDialogOpen: (open: boolean) => {
    set({ clearDialogOpen: open });
  },
  openDeleteConfirm: (classInstanceId: string) => {
    set({ deleteConfirmClassInstanceId: classInstanceId });
  },
  closeDeleteConfirm: () => {
    set({ deleteConfirmClassInstanceId: null });
  },
  confirmDeleteClassInstance: () => {
    const classInstanceId = get().deleteConfirmClassInstanceId;
    set({ deleteConfirmClassInstanceId: null });
    return classInstanceId;
  },
  setSelectedDay: (day: string) => {
    set({ selectedDay: day });
  },
}));
