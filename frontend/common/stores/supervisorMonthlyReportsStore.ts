"use client";

import { create } from "zustand";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";

export type MonthlyReportType = "teacher" | "student";

interface SupervisorMonthlyReportsState {
  readonly reportType: MonthlyReportType;
  readonly year: number;
  readonly month: number;
  readonly selectedTeacher: PersonOption | null;
  readonly studentSelection: PersonOption | null;
  readonly setReportType: (type: MonthlyReportType) => void;
  readonly setYear: (year: number) => void;
  readonly setMonth: (month: number) => void;
  readonly setSelectedTeacher: (teacher: PersonOption | null) => void;
  readonly setStudentSelection: (selection: PersonOption | null) => void;
  /** Lazily initializes year/month on first access. Idempotent. */
  readonly ensureYearMonth: () => void;
}

const SENTINEL_YEAR = 0;

export const useSupervisorMonthlyReportsStore = create<SupervisorMonthlyReportsState>((set, get) => ({
  reportType: "teacher",
  year: SENTINEL_YEAR,
  month: 0,
  selectedTeacher: null,
  studentSelection: null,
  ensureYearMonth: () => {
    if (get().year === SENTINEL_YEAR) {
      const now = new Date();
      set({ year: now.getFullYear(), month: now.getMonth() + 1 });
    }
  },
  setReportType: type => set({ reportType: type }),
  setYear: year => set({ year }),
  setMonth: month => set({ month }),
  setSelectedTeacher: teacher => set({ selectedTeacher: teacher }),
  setStudentSelection: selection => set({ studentSelection: selection }),
}));
