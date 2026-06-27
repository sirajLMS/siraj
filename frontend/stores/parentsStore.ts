import { create } from "zustand";
import type { ParentStatus } from "@/frontend/graphql/generated/gql/graphql-types";

interface ParentsState {
  readonly searchQuery: string;
  readonly page: number;
  readonly pageSize: number;
  readonly statusFilter: ParentStatus | null;
  readonly filterPanelOpen: boolean;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  setStatusFilter: (status: ParentStatus | null) => void;
  setFilterPanelOpen: (open: boolean) => void;
  resetFilters: () => void;
}

export const DEFAULT_PAGE_SIZE = 10;

export const useParentsStore = create<ParentsState>(set => ({
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
  setStatusFilter: (status: ParentStatus | null) => {
    set({ statusFilter: status, page: 0 });
  },
  setFilterPanelOpen: (open: boolean) => {
    set({ filterPanelOpen: open });
  },
  resetFilters: () => {
    set({ searchQuery: "", statusFilter: null, page: 0 });
  },
}));
