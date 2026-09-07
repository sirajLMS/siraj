"use client";

import { create } from "zustand";
import type { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";

/** Rows per server page on first load; mirrors the `expenses` resolver convention. */
export const EXPENSE_DEFAULT_PAGE_SIZE = 50;

/** Page-size choices offered by the expense list pager. */
export const EXPENSE_PAGE_SIZE_OPTIONS: readonly number[] = [25, 50, 100];

/**
 * Filter, pagination, and bulk-selection state for the expense ledger list.
 *
 * `title` holds the raw text exactly as typed; consumers debounce it before
 * issuing the GraphQL query, so the store never blocks keystrokes. Filter
 * fields mirror the `ExpenseFilter` GraphQL input one-to-one — no mapping
 * layer is needed when building query variables.
 */
export interface ExpenseFilterState {
  /** Free-text title filter as typed; consumers debounce before querying. */
  title: string;
  /** Selected expense-type filter values (empty = all types). */
  types: readonly ExpenseType[];
  /** Accounting month filter (YYYY-MM), null = all months. */
  expenseDate: string | null;
  /** Inclusive from-date lower bound on payment date (ISO date, YYYY-MM-DD). */
  paymentDateFrom: string | null;
  /** Inclusive to-date upper bound on payment date (ISO date, YYYY-MM-DD). */
  paymentDateTo: string | null;
  /** Whether soft-deleted expenses are included (default off). */
  includeDeleted: boolean;
  /** Server page index (0-based). */
  page: number;
  /** Rows per server page. */
  pageSize: number;
  /** Ids of the rows currently checked for bulk actions (Bulk Delete). */
  selectedIds: readonly string[];
}

interface ExpenseFilterStore extends ExpenseFilterState {
  setTitle: (title: string) => void;
  setTypes: (types: readonly ExpenseType[]) => void;
  setExpenseDate: (expenseDate: string | null) => void;
  setPaymentDateFrom: (paymentDateFrom: string | null) => void;
  setPaymentDateTo: (paymentDateTo: string | null) => void;
  setIncludeDeleted: (includeDeleted: boolean) => void;
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
  title: "",
  types: [],
  expenseDate: null,
  paymentDateFrom: null,
  paymentDateTo: null,
  includeDeleted: false,
} as const;

function defaultState(): ExpenseFilterState {
  return {
    ...DEFAULT_FILTERS,
    page: 0,
    pageSize: EXPENSE_DEFAULT_PAGE_SIZE,
    selectedIds: [],
  };
}

function toNonNegativePage(page: number): number {
  if (!Number.isFinite(page)) return 0;
  return Math.max(0, Math.trunc(page));
}

function toPositivePageSize(pageSize: number): number {
  if (!Number.isFinite(pageSize)) return EXPENSE_DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.trunc(pageSize));
}

export const useExpenseFilterStore = create<ExpenseFilterStore>(set => ({
  ...defaultState(),
  setTitle: title => set({ title, page: 0 }),
  setTypes: types => set({ types, page: 0 }),
  setExpenseDate: expenseDate => set({ expenseDate, page: 0 }),
  setPaymentDateFrom: paymentDateFrom => set({ paymentDateFrom, page: 0 }),
  setPaymentDateTo: paymentDateTo => set({ paymentDateTo, page: 0 }),
  setIncludeDeleted: includeDeleted => set({ includeDeleted, page: 0 }),
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
