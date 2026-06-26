// cspell:disable
import { create } from "zustand";
import type { StudentDirectoryRowExtended } from "@/frontend/views/dashboard/students/home/types";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

interface StudentsState {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly StudentDirectoryRowExtended[];
  readonly totalStudents: number;
  readonly searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useStudentsStore = create<StudentsState>(set => ({
  metrics: [],
  rows: [],
  totalStudents: 0,
  searchQuery: "",
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
}));
