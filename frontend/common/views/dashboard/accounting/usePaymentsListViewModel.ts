"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type { AccountingPaymentFilterInput } from "@/frontend/common/graphql/generated/gql/graphql";
import { accountingPaymentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { useAccountingPaymentsStore } from "@/frontend/common/stores/accountingPaymentsStore";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingPayments } from "@/shared/locale/namespaces";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

/** Hard transport cap per fetch — the catalog stays small; client paginates. */
const MAX_FETCH_ROWS = 500;

/** One row of the accounting payments list (denormalized payment view). */
export type AccountingPaymentRow = NonNullable<
  NonNullable<
    import("@/frontend/common/graphql/generated/gql/graphql").AccountingPaymentsQuery["accountingPayments"]
  >[number]
>;

export interface PaymentsListMetrics {
  readonly total: number;
  readonly paid: number;
  readonly unpaid: number;
  /** Sum of credit hours across loaded rows (unit-safe: hours, not currency). */
  readonly creditHours: number;
}

export interface PaymentsListViewModel {
  readonly t: PaymentsLabels;
  readonly rows: readonly AccountingPaymentRow[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly metrics: PaymentsListMetrics;
  readonly studentId: string | null;
  readonly parentId: string | null;
  readonly fromDate: string | null;
  readonly toDate: string | null;
  readonly unpaidOnly: boolean;
  readonly setStudentId: (studentId: string | null) => void;
  readonly setParentId: (parentId: string | null) => void;
  readonly setFromDate: (fromDate: string | null) => void;
  readonly setToDate: (toDate: string | null) => void;
  readonly setUnpaidOnly: (unpaidOnly: boolean) => void;
  readonly resetFilters: () => void;
  readonly hasActiveFilters: boolean;
}

export function usePaymentsListViewModel(): PaymentsListViewModel {
  const t = useAppTranslation(DashboardAccountingPayments);

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

  const filter = useMemo<AccountingPaymentFilterInput | null>(() => {
    const f: AccountingPaymentFilterInput = {
      studentId: studentId ?? null,
      parentId: parentId ?? null,
      fromDate: fromDate ?? null,
      toDate: toDate ?? null,
      unpaidOnly: unpaidOnly || null,
    };
    const hasAny = Boolean(studentId || parentId || fromDate || toDate || unpaidOnly);
    return hasAny ? f : null;
  }, [studentId, parentId, fromDate, toDate, unpaidOnly]);

  const { data, loading, error } = useQuery(accountingPaymentsQueryDocument, {
    variables: {
      filter,
      paginationArgs: {
        after: null,
        before: null,
        first: MAX_FETCH_ROWS,
        last: null,
        maxCount: null,
        page: null,
        skip: null,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const rows = useMemo<readonly AccountingPaymentRow[]>(() => data?.accountingPayments ?? [], [data]);

  const metrics = useMemo<PaymentsListMetrics>(() => {
    let paid = 0;
    let creditHours = 0;
    for (const row of rows) {
      if (row.isPaidStatusOn) paid += 1;
      creditHours += Number(row.creditHours ?? 0);
    }
    return {
      total: rows.length,
      paid,
      unpaid: rows.length - paid,
      creditHours,
    };
  }, [rows]);

  const hasActiveFilters = Boolean(studentId || parentId || fromDate || toDate || unpaidOnly);

  return {
    t,
    rows,
    loading,
    error: Boolean(error),
    metrics,
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
    hasActiveFilters,
  };
}
