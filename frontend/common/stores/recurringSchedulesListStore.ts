"use client";

import { create } from "zustand";

const DEFAULT_PAGE = 1;

interface RecurringSchedulesListState {
  /**
   * False until the first interaction or explicit initialization. While false, the
   * ViewModel derives page/search from URL params and props (matching the original
   * per-mount useState semantics); once true, the store is the single source of truth
   * and the state survives viewport tier switches.
   */
  readonly initialized: boolean;
  readonly currentPage: number;
  readonly searchValue: string;
  /** Seeds state from URL/defaults on first mount; a no-op once initialized. */
  initialize: (search: string, page: number) => void;
  setPage: (page: number) => void;
  /** Updates the search term and resets pagination to the first page. */
  applySearch: (search: string) => void;
}

export const useRecurringSchedulesListStore = create<RecurringSchedulesListState>(set => ({
  initialized: false,
  currentPage: DEFAULT_PAGE,
  searchValue: "",
  initialize: (search, page) =>
    set(state => (state.initialized ? {} : { initialized: true, searchValue: search, currentPage: page })),
  setPage: page => set({ initialized: true, currentPage: page }),
  applySearch: search => set({ initialized: true, searchValue: search, currentPage: DEFAULT_PAGE }),
}));
