import { create } from "zustand";

export type TeacherDashboardMode = "standard" | "active";

export interface TeacherDashboardUIState {
  readonly mode: TeacherDashboardMode;
  readonly filterDate: string;
  readonly setMode: (mode: TeacherDashboardMode) => void;
  readonly setFilterDate: (date: string) => void;
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
  setMode: mode => set({ mode }),
  setFilterDate: filterDate => set({ filterDate }),
}));
