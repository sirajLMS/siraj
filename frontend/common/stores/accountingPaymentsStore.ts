"use client";

import { create } from "zustand";

/**
 * Accounting payments list UI state — filters + pagination survive route
 * changes (list → detail → back) within the browser session, mirroring
 * the quotaStore convention (flat store, zustand `create`).
 */
interface AccountingPaymentsStore {
  /** Filter: student UUID (null = all students). */
  studentId: string | null;
  /** Filter: parent UUID (null = all parents). */
  parentId: string | null;
  /** Filter: inclusive payment-date lower bound (ISO date). */
  fromDate: string | null;
  /** Filter: inclusive payment-date upper bound (ISO date). */
  toDate: string | null;
  /** Filter: only payments whose invoice is still unpaid. */
  unpaidOnly: boolean;
  /** Server page index (0-based). */
  page: number;
  /** Rows per server page. */
  pageSize: number;
  setStudentId: (studentId: string | null) => void;
  setParentId: (parentId: string | null) => void;
  setFromDate: (fromDate: string | null) => void;
  setToDate: (toDate: string | null) => void;
  setUnpaidOnly: (unpaidOnly: boolean) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetFilters: () => void;
}

const INITIAL_FILTERS = {
  studentId: null,
  parentId: null,
  fromDate: null,
  toDate: null,
  unpaidOnly: false,
} as const;

export const useAccountingPaymentsStore = create<AccountingPaymentsStore>(set => ({
  ...INITIAL_FILTERS,
  page: 0,
  pageSize: 10,
  setStudentId: studentId => set({ studentId, page: 0 }),
  setParentId: parentId => set({ parentId, page: 0 }),
  setFromDate: fromDate => set({ fromDate, page: 0 }),
  setToDate: toDate => set({ toDate, page: 0 }),
  setUnpaidOnly: unpaidOnly => set({ unpaidOnly, page: 0 }),
  setPage: page => set({ page }),
  setPageSize: pageSize => set({ pageSize, page: 0 }),
  resetFilters: () => set({ ...INITIAL_FILTERS, page: 0 }),
}));
