"use client";

import type { ErrorLike } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import type { FxWarning } from "@/backend/types";
import {
  AppPermission,
  type ProfitLossReportQuery,
  type ProfitLossReportQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { profitLossReportQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { type ProfitLossTab, useProfitLossFilterStore } from "@/frontend/common/stores/profitLossFilterStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { EMPTY_FX_WARNINGS } from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel.constants";
import {
  buildReportVariables,
  toExpensesPage,
  toFxWarnings,
  toIncomePage,
  toPaymentsPage,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel.helpers";
import type {
  ProfitLossExpensesPage,
  ProfitLossIncomePage,
  ProfitLossPaymentsPage,
  ProfitLossSummary,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel.types";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingProfitLoss } from "@/shared/locale/namespaces";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting/profit-loss";

export type {
  ProfitLossExpenseRow,
  ProfitLossIncomeRow,
  ProfitLossPaymentRow,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel.types";

export interface ProfitLossViewModel {
  readonly labels: ProfitLossLabels;
  /** True when the caller holds ACCOUNTING_PROFITS_VIEW; the query is skipped otherwise. */
  readonly canView: boolean;
  readonly month: string;
  readonly currency: ProfitLossReportQueryVariables["currency"];
  readonly activeTab: ProfitLossTab;
  readonly paymentsPage: ProfitLossPaymentsPage;
  readonly expensesPage: ProfitLossExpensesPage;
  readonly incomePage: ProfitLossIncomePage;
  readonly summary: ProfitLossSummary | null;
  /** Currency pairs the report excluded for missing FX rates (empty while none). */
  readonly fxWarnings: readonly FxWarning[];
  /** Rows excluded across every currency pair — the aggregate discrepancy behind the warning chip. */
  readonly fxExcludedRowCount: number;
  /** True when none of the three list tabs has a single row for the month. */
  readonly isEmptyMonth: boolean;
  readonly isLoading: boolean;
  readonly error: ErrorLike | null;
  readonly refetch: () => void;
  readonly onTabChange: (tab: ProfitLossTab) => void;
  readonly onPaymentsPageChange: (page: number) => void;
  readonly onExpensesPageChange: (page: number) => void;
  readonly onIncomePageChange: (page: number) => void;
  /** 0-based server page index of the Payments tab. */
  readonly paymentsPageIndex: number;
  /** 0-based server page index of the Expenses tab. */
  readonly expensesPageIndex: number;
  /** 0-based server page index of the Income Payments tab. */
  readonly incomePageIndex: number;
  readonly pageSize: number;
}

export type UseProfitLossViewModelProps = Record<string, never>;

export function useProfitLossViewModel(_props: Readonly<UseProfitLossViewModelProps>): ProfitLossViewModel {
  const labels = useAppTranslation(DashboardAccountingProfitLoss);

  const month = useProfitLossFilterStore(state => state.month);
  const currency = useProfitLossFilterStore(state => state.currency);
  const activeTab = useProfitLossFilterStore(state => state.activeTab);
  const paymentsPageIndex = useProfitLossFilterStore(state => state.paymentsPage);
  const expensesPageIndex = useProfitLossFilterStore(state => state.expensesPage);
  const incomePageIndex = useProfitLossFilterStore(state => state.incomePage);
  const pageSize = useProfitLossFilterStore(state => state.pageSize);
  const setActiveTab = useProfitLossFilterStore(state => state.setActiveTab);
  const setPaymentsPage = useProfitLossFilterStore(state => state.setPaymentsPage);
  const setExpensesPage = useProfitLossFilterStore(state => state.setExpensesPage);
  const setIncomePage = useProfitLossFilterStore(state => state.setIncomePage);

  const hasPermission = useUserStore(state => state.hasPermission);
  const canView = hasPermission(AppPermission.AccountingProfitsView);

  const variables = useMemo(
    () => buildReportVariables({ month, currency, pageSize, paymentsPageIndex, expensesPageIndex, incomePageIndex }),
    [month, currency, pageSize, paymentsPageIndex, expensesPageIndex, incomePageIndex]
  );

  const { data, loading, error, refetch } = useQuery(profitLossReportQueryDocument, {
    variables,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    skip: !canView,
  });

  const report: ProfitLossReportQuery["profitLossReport"] = data?.profitLossReport ?? null;

  const paymentsPage = useMemo(() => toPaymentsPage(report?.paymentsPage ?? null), [report?.paymentsPage]);
  const expensesPage = useMemo(() => toExpensesPage(report?.expensesPage ?? null), [report?.expensesPage]);
  const incomePage = useMemo(() => toIncomePage(report?.incomePaymentsPage ?? null), [report?.incomePaymentsPage]);
  const summary = report?.profitsSummary ?? null;

  const fxWarnings = useMemo(
    () => (report?.fxWarnings == null ? EMPTY_FX_WARNINGS : toFxWarnings(report.fxWarnings)),
    [report]
  );
  const fxExcludedRowCount = useMemo(
    () => fxWarnings.reduce((total, warning) => total + warning.rowCount, 0),
    [fxWarnings]
  );

  const isEmptyMonth = paymentsPage.totalCount === 0 && expensesPage.totalCount === 0 && incomePage.totalCount === 0;

  const handleRefetch = useCallback(() => {
    void refetch();
  }, [refetch]);
  const handleTabChange = useCallback((tab: ProfitLossTab) => setActiveTab(tab), [setActiveTab]);
  const handlePaymentsPageChange = useCallback((page: number) => setPaymentsPage(page), [setPaymentsPage]);
  const handleExpensesPageChange = useCallback((page: number) => setExpensesPage(page), [setExpensesPage]);
  const handleIncomePageChange = useCallback((page: number) => setIncomePage(page), [setIncomePage]);

  return {
    labels,
    canView,
    month,
    currency,
    activeTab,
    paymentsPage,
    expensesPage,
    incomePage,
    summary,
    fxWarnings,
    fxExcludedRowCount,
    isEmptyMonth,
    isLoading: loading,
    error: error ?? null,
    refetch: handleRefetch,
    onTabChange: handleTabChange,
    onPaymentsPageChange: handlePaymentsPageChange,
    onExpensesPageChange: handleExpensesPageChange,
    onIncomePageChange: handleIncomePageChange,
    paymentsPageIndex,
    expensesPageIndex,
    incomePageIndex,
    pageSize,
  };
}
