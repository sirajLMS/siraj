"use client";

import { create } from "zustand";
import { getTodayScheduleFilterDate } from "@/frontend/common/utils/scheduleFilterDate";

export interface FutureScheduleDateState {
  readonly selectedDate: string;
  setSelectedDate: (date: string) => void;
  /** Lazily initializes selectedDate on first access. Idempotent. */
  readonly ensureSelectedDate: () => void;
}

export const useFutureScheduleDateStore = create<FutureScheduleDateState>((set, get) => ({
  selectedDate: "",
  ensureSelectedDate: () => {
    if (get().selectedDate === "") {
      set({ selectedDate: getTodayScheduleFilterDate() });
    }
  },
  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },
}));
