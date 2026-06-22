import { create } from "zustand";

interface StudentDirectoryState {
  readonly searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useStudentDirectoryStore = create<StudentDirectoryState>(set => ({
  searchQuery: "",
  setSearchQuery: query => set({ searchQuery: query }),
}));
