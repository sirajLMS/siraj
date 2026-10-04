"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { accountingPaymentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  buildPaymentListFilter,
  computePaymentListMetrics,
  hasAnyListFilter,
  MAX_FETCH_ROWS,
} from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel.helpers";
import { useAccountingPaymentsFilterSlice } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel.hooks";
import type {
  AccountingPaymentRow,
  PaymentsListViewModel,
} from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel.types";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingPayments } from "@/shared/locale/namespaces";

export type { PaymentsListViewModel };

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
