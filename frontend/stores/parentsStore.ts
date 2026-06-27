import { create } from "zustand";
import type { ParentAccountStatus } from "@/frontend/views/dashboard/parents/types/directory";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

interface ParentsState {
  readonly metrics: readonly MetricItem[];
  readonly totalParents: number;
  readonly searchQuery: string;
  readonly page: number;
  readonly pageSize: number;
  readonly statusFilter: ParentAccountStatus | null;
  readonly filterPanelOpen: boolean;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  setStatusFilter: (status: ParentAccountStatus | null) => void;
  setFilterPanelOpen: (open: boolean) => void;
  resetFilters: () => void;
}

export const DEFAULT_PAGE_SIZE = 10;

export const useParentsStore = create<ParentsState>(set => ({
  metrics: [],
  totalParents: 0,
  searchQuery: "",
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  statusFilter: null,
  filterPanelOpen: false,
  setSearchQuery: (query: string) => {
    set({ searchQuery: query, page: 0 });
  },
  setPage: (page: number) => {
    set({ page });
  },
  setStatusFilter: (status: ParentAccountStatus | null) => {
    set({ statusFilter: status, page: 0 });
  },
  setFilterPanelOpen: (open: boolean) => {
    set({ filterPanelOpen: open });
  },
  resetFilters: () => {
    set({ searchQuery: "", statusFilter: null, page: 0 });
  },
}));
