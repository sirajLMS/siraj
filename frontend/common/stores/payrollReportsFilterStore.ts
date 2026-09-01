"use client";

import { create } from "zustand";
import type { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";

/** Rows per server page on first load. */
export const DEFAULT_PAGE_SIZE = 25;

/** Page-size choices offered by the payroll report pager. */
export const PAGE_SIZE_OPTIONS: readonly number[] = [25, 50, 100];

/**
 * Payroll report list UI state — filters + pagination survive route changes
 * (report → override dialog → back) within the browser session, mirroring
 * the accounting payments store convention (flat store, zustand `create`).
 *
 * `search` holds the raw text exactly as typed; the report view model
 * debounces it before it reaches the GraphQL query or the CSV export, so
 * the store never blocks keystrokes.
 */
interface PayrollReportsFilterStore {
  /** Filter: teacher UUID (null = all teachers). */
  teacherId: string | null;
  /** Filter: student UUID (null = all students). */
  studentId: string | null;
  /** Filter: inclusive scheduled-date lower bound (ISO date, YYYY-MM-DD). */
  dateFrom: string | null;
  /** Filter: inclusive scheduled-date upper bound (ISO date, YYYY-MM-DD). */
  dateTo: string | null;
  /** Filter: AND-combined calculation statuses (empty = all statuses). */
  calculationStatuses: readonly CalculationStatus[];
  /** Free-text search as typed; consumers debounce before querying. */
  search: string;
  /** Server page index (0-based). */
  page: number;
  /** Rows per server page. */
  pageSize: number;
  setTeacherId: (teacherId: string | null) => void;
  setStudentId: (studentId: string | null) => void;
  setDateFrom: (dateFrom: string | null) => void;
  setDateTo: (dateTo: string | null) => void;
  setCalculationStatuses: (calculationStatuses: readonly CalculationStatus[]) => void;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  /** Clears every report filter and returns to the first page, keeping the chosen page size. */
  clearFilters: () => void;
  /** Restores the pristine store, including the default page size. */
  reset: () => void;
}

const INITIAL_FILTERS = {
  teacherId: null,
  studentId: null,
  dateFrom: null,
  dateTo: null,
  calculationStatuses: [] as readonly CalculationStatus[],
  search: "",
} as const;

export const usePayrollReportsFilterStore = create<PayrollReportsFilterStore>(set => ({
  ...INITIAL_FILTERS,
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setTeacherId: teacherId => set({ teacherId, page: 0 }),
  setStudentId: studentId => set({ studentId, page: 0 }),
  setDateFrom: dateFrom => set({ dateFrom, page: 0 }),
  setDateTo: dateTo => set({ dateTo, page: 0 }),
  setCalculationStatuses: calculationStatuses => set({ calculationStatuses, page: 0 }),
  setSearch: search => set({ search, page: 0 }),
  setPage: page => set({ page }),
  setPageSize: pageSize => set({ pageSize, page: 0 }),
  clearFilters: () => set({ ...INITIAL_FILTERS, page: 0 }),
  reset: () => set({ ...INITIAL_FILTERS, page: 0, pageSize: DEFAULT_PAGE_SIZE }),
}));
