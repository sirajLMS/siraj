"use client";

import { useAccountingPaymentsStore } from "@/frontend/common/stores/accountingPaymentsStore";
import type { PaymentsFilterSlice } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel.types";

/** Subscribes to the payments filter store slice (fields + actions). */
export function useAccountingPaymentsFilterSlice(): PaymentsFilterSlice {
  const studentId = useAccountingPaymentsStore(s => s.studentId);
  const parentId = useAccountingPaymentsStore(s => s.parentId);
  const fromDate = useAccountingPaymentsStore(s => s.fromDate);
  const toDate = useAccountingPaymentsStore(s => s.toDate);
  const unpaidOnly = useAccountingPaymentsStore(s => s.unpaidOnly);
  const setStudentId = useAccountingPaymentsStore(s => s.setStudentId);
  const setParentId = useAccountingPaymentsStore(s => s.setParentId);
  const setFromDate = useAccountingPaymentsStore(s => s.setFromDate);
  const setToDate = useAccountingPaymentsStore(s => s.setToDate);
  const setUnpaidOnly = useAccountingPaymentsStore(s => s.setUnpaidOnly);
  const resetFilters = useAccountingPaymentsStore(s => s.resetFilters);
  return {
    studentId,
    parentId,
    fromDate,
    toDate,
    unpaidOnly,
    setStudentId,
    setParentId,
    setFromDate,
    setToDate,
    setUnpaidOnly,
    resetFilters,
  };
}
