import { create } from "zustand";

const DEFAULT_PAGE_SIZE = 10;

interface StudentDirectoryState {
  readonly searchQuery: string;
  readonly page: number;
  readonly pageSize: number;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
}

export const useStudentDirectoryStore = create<StudentDirectoryState>(set => ({
  searchQuery: "",
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setSearchQuery: query => set({ searchQuery: query, page: 0 }),
  setPage: page => set({ page }),
}));
