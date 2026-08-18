"use client";

import { create } from "zustand";

const DEFAULT_PAGE_SIZE = 10;

export interface TeacherDirectoryState {
  readonly searchQuery: string;
  readonly page: number;
  readonly pageSize: number;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
}

export const useTeacherDirectoryStore = create<TeacherDirectoryState>(set => ({
  searchQuery: "",
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setSearchQuery: query => set({ searchQuery: query, page: 0 }),
  setPage: page => set({ page }),
}));
