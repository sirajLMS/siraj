import { create } from "zustand";

export interface TeacherDirectoryState {
  readonly searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useTeacherDirectoryStore = create<TeacherDirectoryState>(set => ({
  searchQuery: "",
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
}));
