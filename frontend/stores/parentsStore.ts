// cspell:disable
import { create } from "zustand";
import type { ParentDirectoryRow } from "@/frontend/views/dashboard/parents/types/directory";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

interface ParentsState {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly ParentDirectoryRow[];
  readonly totalParents: number;
  readonly searchQuery: string;
  readonly page: number;
  readonly pageSize: number;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
}

export const DEFAULT_PAGE_SIZE = 10;

export const useParentsStore = create<ParentsState>(set => ({
  metrics: [],
  rows: [],
  totalParents: 0,
  searchQuery: "",
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setSearchQuery: (query: string) => {
    set({ searchQuery: query, page: 0 });
  },
  setPage: (page: number) => {
    set({ page });
  },
}));
