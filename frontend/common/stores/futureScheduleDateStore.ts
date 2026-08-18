"use client";

import { create } from "zustand";

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
      set({ selectedDate: new Date().toISOString().split("T")[0] });
    }
  },
  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },
}));
