"use client";

import { create } from "zustand";

/**
 * Student history month/week/day selection store.
 *
 * NOTE: This store intentionally does NOT use the `persist` middleware. The
 * `currentMonth` field holds a `Date` object (non-serializable) which would be
 * destroyed by `JSON.stringify` on rehydration. Per the AGENTS.md serialization
 * rules (Strategy 1: Non-persisted store), keeping the store in-memory only is
 * the accepted mitigation — state survives SPA navigation / tier switches but
 * resets to defaults on hard page refresh. Do NOT add `persist` here without
 * first converting `currentMonth` to an ISO string and updating all consumers.
 */
export interface StudentHistoryState {
  readonly currentMonth: Date | null;
  readonly selectedDay: number | null;
  readonly selectedWeek: number;
  setSelectedDay: (day: number | null) => void;
  setCurrentMonth: (date: Date) => void;
  setSelectedWeek: (week: number) => void;
  /** Lazily initializes currentMonth on first access. Idempotent. */
  ensureCurrentMonth: () => void;
}

export const useStudentHistoryStore = create<StudentHistoryState>((set, get) => ({
  currentMonth: null,
  selectedDay: null,
  selectedWeek: 1,

  ensureCurrentMonth: () => {
    if (get().currentMonth === null) {
      set({ currentMonth: new Date() });
    }
  },
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
