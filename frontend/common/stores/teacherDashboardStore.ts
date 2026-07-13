import { create } from "zustand";

export type TeacherDashboardMode = "standard" | "active";

const DEFAULT_PAGE_SIZE = 10;

export interface TeacherDashboardUIState {
  readonly mode: TeacherDashboardMode;
  readonly filterDate: string;
  readonly page: number;
  readonly pageSize: number;
  readonly setMode: (mode: TeacherDashboardMode) => void;
  readonly setFilterDate: (date: string) => void;
  readonly setPage: (page: number) => void;
}

const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const useTeacherDashboardStore = create<TeacherDashboardUIState>(set => ({
  mode: "standard",
  filterDate: getTodayString(),
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setMode: mode => set({ mode }),
  setFilterDate: filterDate => set({ filterDate, page: 0 }),
  setPage: page => set({ page }),
}));
