"use client";

import { create } from "zustand";

export const SETTINGS_TIMEZONES_PAGE_SIZE = 25;

interface SettingsTimezonesState {
  readonly searchQuery: string;
  readonly debouncedSearch: string;
  readonly page: number;
  readonly setSearchQuery: (searchQuery: string) => void;
  readonly setDebouncedSearch: (debouncedSearch: string) => void;
  readonly setPage: (page: number) => void;
  readonly resetPage: () => void;
}

export const useSettingsTimezonesStore = create<SettingsTimezonesState>(set => ({
  searchQuery: "",
  debouncedSearch: "",
  page: 0,
  setSearchQuery: searchQuery => set({ searchQuery }),
  setDebouncedSearch: debouncedSearch => set({ debouncedSearch, page: 0 }),
  setPage: page => set({ page }),
  resetPage: () => set({ page: 0 }),
}));
