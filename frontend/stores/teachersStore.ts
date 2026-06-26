import { create } from "zustand";
import type { TeacherDirectoryRow, TeacherMetrics } from "@/frontend/views/dashboard/teachers/home/types";

interface TeachersState {
  readonly metrics: TeacherMetrics;
  readonly rows: readonly TeacherDirectoryRow[];
  readonly totalTeachers: number;
  readonly searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useTeachersStore = create<TeachersState>(set => ({
  metrics: { activated: 0, deactivated: 0 },
  rows: [],
  totalTeachers: 0,
  searchQuery: "",
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
}));
