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
}

function defaultYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

const initial = defaultYearMonth();

export const useSupervisorMonthlyReportsStore = create<SupervisorMonthlyReportsState>(set => ({
  reportType: "teacher",
  year: initial.year,
  month: initial.month,
  selectedTeacher: null,
  studentSelection: null,
  setReportType: type => set({ reportType: type }),
  setYear: year => set({ year }),
  setMonth: month => set({ month }),
  setSelectedTeacher: teacher => set({ selectedTeacher: teacher }),
  setStudentSelection: selection => set({ studentSelection: selection }),
}));
