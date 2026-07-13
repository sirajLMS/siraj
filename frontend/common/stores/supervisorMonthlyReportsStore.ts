import { create } from "zustand";

export type MonthlyReportType = "teacher" | "student";

interface SupervisorMonthlyReportsState {
  readonly reportType: MonthlyReportType;
  readonly year: number;
  readonly month: number;
  readonly teacherId: string;
  readonly studentId: string;
  readonly setReportType: (type: MonthlyReportType) => void;
  readonly setYear: (year: number) => void;
  readonly setMonth: (month: number) => void;
  readonly setTeacherId: (id: string) => void;
  readonly setStudentId: (id: string) => void;
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
  teacherId: "",
  studentId: "",
  setReportType: type => set({ reportType: type }),
  setYear: year => set({ year }),
  setMonth: month => set({ month }),
  setTeacherId: id => set({ teacherId: id }),
  setStudentId: id => set({ studentId: id }),
}));
