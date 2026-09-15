"use client";

import { create } from "zustand";
import type { ClassSession } from "@/frontend/common/views/dashboard/students/history/types";

interface StudentHistoryMonthBounds {
  readonly year: number;
  readonly month: number;
}

export interface StudentHistoryState {
  /** Student the current selection belongs to; selections re-scope when it changes. */
  readonly studentId: string;
  readonly year: number;
  /** 1-based month number (January = 1). */
  readonly month: number;
  readonly selectedWeek: number;
  readonly selectedDay: number | null;
  /** Day-of-month → class session map currently displayed across both viewport tiers. */
  readonly classes: Readonly<Partial<Record<number, ClassSession>>>;
  readonly selectWeek: (week: number) => void;
  readonly selectDay: (day: number | null) => void;
  readonly setClasses: (classes: Readonly<Partial<Record<number, ClassSession>>>) => void;
  /** Steps back one month unless the result would fall before the enrollment month. */
  readonly prevMonth: (enrollment?: StudentHistoryMonthBounds) => void;
  /** Steps forward one month unless the result would fall after the latest month. */
  readonly nextMonth: (latest?: StudentHistoryMonthBounds) => void;
  /** Re-scopes every selection to a student, starting at the given month (defaults to now). */
  readonly resetForStudent: (studentId: string, month?: StudentHistoryMonthBounds) => void;
}

function isAtOrBefore(year: number, month: number, bounds: StudentHistoryMonthBounds): boolean {
  return year < bounds.year || (year === bounds.year && month <= bounds.month);
}

function isAtOrAfter(year: number, month: number, bounds: StudentHistoryMonthBounds): boolean {
  return year > bounds.year || (year === bounds.year && month >= bounds.month);
}

const INITIAL_YEAR = new Date().getFullYear();
const INITIAL_MONTH = new Date().getMonth() + 1;

export const useStudentHistoryStore = create<StudentHistoryState>((set, get) => ({
  studentId: "",
  year: INITIAL_YEAR,
  month: INITIAL_MONTH,
  selectedWeek: 1,
  selectedDay: null,
  classes: {},

  selectWeek: week => set({ selectedWeek: week }),
  selectDay: day => set({ selectedDay: day }),
  setClasses: classes => set({ classes }),

  prevMonth: enrollment => {
    const { year, month } = get();
    if (enrollment && isAtOrBefore(year, month, enrollment)) return;
    const stepped = month > 1 ? { year, month: month - 1 } : { year: year - 1, month: 12 };
    set({ ...stepped, selectedDay: null, selectedWeek: 1 });
  },

  nextMonth: latest => {
    const { year, month } = get();
    if (latest && isAtOrAfter(year, month, latest)) return;
    const stepped = month < 12 ? { year, month: month + 1 } : { year: year + 1, month: 1 };
    set({ ...stepped, selectedDay: null, selectedWeek: 1 });
  },

  resetForStudent: (studentId, month) => {
    const now = new Date();
    set({
      studentId,
      year: month?.year ?? now.getFullYear(),
      month: month?.month ?? now.getMonth() + 1,
      selectedWeek: 1,
      selectedDay: null,
    });
  },
}));
