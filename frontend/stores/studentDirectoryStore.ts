import { create } from "zustand";
import type { StudentFilterArgs } from "@/frontend/graphql/generated/gql/graphql-types";

const DEFAULT_PAGE_SIZE = 10;

interface StudentDirectoryState {
  readonly searchQuery: string;
  readonly page: number;
  readonly pageSize: number;
  readonly filterArgs: StudentFilterArgs | null;
  readonly filterPanelOpen: boolean;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  setFilterArgs: (args: StudentFilterArgs) => void;
  setFilterPanelOpen: (open: boolean) => void;
  clearFilters: () => void;
}

export const useStudentDirectoryStore = create<StudentDirectoryState>(set => ({
  searchQuery: "",
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  filterArgs: null,
  filterPanelOpen: false,
  setSearchQuery: query => set({ searchQuery: query, page: 0 }),
  setPage: page => set({ page }),
  setFilterArgs: args => set({ filterArgs: args, page: 0 }),
  setFilterPanelOpen: open => set({ filterPanelOpen: open }),
  clearFilters: () => set({ filterArgs: null, page: 0, filterPanelOpen: false }),
}));
