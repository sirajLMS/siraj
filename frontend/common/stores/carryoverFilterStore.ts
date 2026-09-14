"use client";

import { create } from "zustand";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";

/**
 * Closed set of paid-status filter values shown by the filter bar radio group.
 * The GraphQL `CarryoverFilter.paidStatus` input is a plain `String`; "Both"
 * and a missing filter both mean "all rows" on the server.
 */
export type CarryoverPaidStatusFilter = "Paid" | "Unpaid" | "Both";

/** Rows per server page on first load; mirrors the `carryoverBalances` resolver default. */
const CARRYOVER_DEFAULT_PAGE_SIZE = 50;

/** Page-size choices offered by the carryover list pager. */
export const CARRYOVER_PAGE_SIZE_OPTIONS: readonly number[] = [25, 50, 100];

/**
 * Filter, pagination, and bulk-selection state for the carryover balance list.
 *
 * `search` holds the raw text exactly as typed; consumers debounce it before
 * issuing the GraphQL query, so the store never blocks keystrokes.
 */
export interface CarryoverFilterState {
  /** Teacher UUID filter (null = all teachers). */
  teacherId: string | null;
  /**
   * Selected teacher option exactly as the autocomplete presented it; kept so
   * the filter chip re-renders the teacher's display name after a viewport
   * tier switch, when only the store survives.
   */
  teacherOption: PersonOption | null;
  /** Paid-status radio filter; "Both" shows every row. */
  paidStatus: CarryoverPaidStatusFilter;
  /** Inclusive from-date lower bound (ISO date, YYYY-MM-DD). */
  dateFrom: string | null;
  /** Inclusive to-date upper bound (ISO date, YYYY-MM-DD). */
  dateTo: string | null;
  /** Whether rows belonging to disabled teachers are included (default off). */
  includeDisabledTeachers: boolean;
  /** Free-text search as typed; consumers debounce before querying. */
  search: string;
  /** Server page index (0-based). */
  page: number;
  /** Rows per server page. */
  pageSize: number;
  /** Ids of the rows currently checked for bulk actions (Bulk To Expense / Bulk Delete). */
  selectedIds: readonly string[];
}

interface CarryoverFilterStore extends CarryoverFilterState {
  /** Sets the teacher filter from the autocomplete option (or clears both halves when null) and returns to page 0. */
  setTeacher: (teacher: PersonOption | null) => void;
  setPaidStatus: (paidStatus: CarryoverPaidStatusFilter) => void;
  setDateFrom: (dateFrom: string | null) => void;
  setDateTo: (dateTo: string | null) => void;
  setIncludeDisabledTeachers: (includeDisabledTeachers: boolean) => void;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  /** Adds the id when unchecked and removes it when checked. */
  toggleSelected: (id: string) => void;
  /** Empties the bulk-selection set. */
  clearSelection: () => void;
  /**
   * Clears every filter, returns to the first page, and drops the selection
   * (rows may leave the result set, so stale bulk-action ids must not survive),
   * while keeping the chosen page size.
   */
  clearFilters: () => void;
  /** Restores the pristine store, including the default page size. */
  reset: () => void;
}

const DEFAULT_FILTERS = {
  teacherId: null,
  teacherOption: null,
  paidStatus: "Both",
  dateFrom: null,
  dateTo: null,
  includeDisabledTeachers: false,
  search: "",
} as const;

function defaultState(): CarryoverFilterState {
  return {
    ...DEFAULT_FILTERS,
    page: 0,
    pageSize: CARRYOVER_DEFAULT_PAGE_SIZE,
    selectedIds: [],
  };
}

function toNonNegativePage(page: number): number {
  if (!Number.isFinite(page)) return 0;
  return Math.max(0, Math.trunc(page));
}

function toPositivePageSize(pageSize: number): number {
  if (!Number.isFinite(pageSize)) return CARRYOVER_DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.trunc(pageSize));
}

export const useCarryoverFilterStore = create<CarryoverFilterStore>(set => ({
  ...defaultState(),
  setTeacher: teacher => set({ teacherOption: teacher, teacherId: teacher?.id ?? null, page: 0 }),
  setPaidStatus: paidStatus => set({ paidStatus, page: 0 }),
  setDateFrom: dateFrom => set({ dateFrom, page: 0 }),
  setDateTo: dateTo => set({ dateTo, page: 0 }),
  setIncludeDisabledTeachers: includeDisabledTeachers => set({ includeDisabledTeachers, page: 0 }),
  setSearch: search => set({ search, page: 0 }),
  setPage: page => set({ page: toNonNegativePage(page) }),
  setPageSize: pageSize => set({ pageSize: toPositivePageSize(pageSize), page: 0 }),
  toggleSelected: id =>
    set(state => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter(selectedId => selectedId !== id)
        : [...state.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),
  clearFilters: () => set({ ...DEFAULT_FILTERS, page: 0, selectedIds: [] }),
  reset: () => set(defaultState()),
}));
