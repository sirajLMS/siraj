// cspell:disable
import { create } from "zustand";
import type { ParentDirectoryRow } from "@/frontend/views/dashboard/parents/types/directory";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

interface ParentsState {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly ParentDirectoryRow[];
  readonly totalParents: number;
  readonly searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useParentsStore = create<ParentsState>(set => ({
  metrics: [],
  rows: [],
  totalParents: 0,
  searchQuery: "",
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
}));
