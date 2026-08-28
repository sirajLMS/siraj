"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { type AccountingPaymentFilterInput, AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { accountingPaymentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { useAccountingPaymentsStore } from "@/frontend/common/stores/accountingPaymentsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingPayments } from "@/shared/locale/namespaces";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

/** Hard transport cap per fetch — the catalog stays small; client paginates. */
const MAX_FETCH_ROWS = 500;

/** True when at least one list filter is actively constraining the query. */
function hasAnyListFilter(v: {
  readonly studentId: string | null;
  readonly parentId: string | null;
  readonly fromDate: string | null;
  readonly toDate: string | null;
  readonly unpaidOnly: boolean | null;
}): boolean {
  return [
    v.studentId !== null && v.studentId !== "",
    v.parentId !== null && v.parentId !== "",
    v.fromDate !== null && v.fromDate !== "",
    v.toDate !== null && v.toDate !== "",
    v.unpaidOnly === true,
  ].includes(true);
}

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

export interface PaymentsListViewModel extends PaymentsFilterSlice {
  readonly t: PaymentsLabels;
  readonly rows: readonly AccountingPaymentRow[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly metrics: PaymentsListMetrics;
  readonly metricsBasis: string | null;
  readonly hasActiveFilters: boolean;
  /** True when the caller holds ACCOUNTING_PAYMENTS_MANAGE (create/edit/toggle). */
  readonly canManagePayments: boolean;
}

export function usePaymentsListViewModel(): PaymentsListViewModel {
  const t = useAppTranslation(DashboardAccountingPayments);
  const filterSlice = useAccountingPaymentsFilterSlice();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManagePayments = hasPermission(AppPermission.AccountingPaymentsManage);
  const {
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
  } = filterSlice;

  const filter = useMemo(
    () => buildPaymentListFilter({ studentId, parentId, fromDate, toDate, unpaidOnly }),
    [studentId, parentId, fromDate, toDate, unpaidOnly]
  );

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

  const metrics = useMemo(() => computePaymentListMetrics(rows), [rows]);
  const metricsBasis = rows.length >= MAX_FETCH_ROWS ? t.metricsBasis(MAX_FETCH_ROWS) : null;

  const hasActiveFilters = hasAnyListFilter({ studentId, parentId, fromDate, toDate, unpaidOnly });

  return {
    t,
    rows,
    loading,
    error: Boolean(error),
    metrics,
    metricsBasis,
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
    canManagePayments,
  };
}

/** Pure aggregation over fetched rows for the payments summary strip. */
function computePaymentListMetrics(rows: readonly AccountingPaymentRow[]): PaymentsListMetrics {
  let paid = 0;
  let creditHours = 0;
  for (const row of rows) {
    if (row.isPaidStatusOn) paid += 1;
    creditHours += Number(row.creditHours ?? 0);
  }
  return { total: rows.length, paid, unpaid: rows.length - paid, creditHours };
}

/** Narrow store slice for the payments list (fields + actions). */
interface PaymentsFilterSlice {
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
}

function useAccountingPaymentsFilterSlice(): PaymentsFilterSlice {
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

/** Fields-only view of the slice consumed by the GraphQL filter mapping. */
type PaymentsFilterFields = Pick<PaymentsFilterSlice, "studentId" | "parentId" | "fromDate" | "toDate" | "unpaidOnly">;

/** Maps the raw filter fields onto the GraphQL filter input (null when inactive). */
function buildPaymentListFilter(v: PaymentsFilterFields): AccountingPaymentFilterInput | null {
  if (!hasAnyListFilter(v)) return null;
  return {
    studentId: v.studentId ?? null,
    parentId: v.parentId ?? null,
    fromDate: v.fromDate ?? null,
    toDate: v.toDate ?? null,
    unpaidOnly: v.unpaidOnly || null,
  };
}
