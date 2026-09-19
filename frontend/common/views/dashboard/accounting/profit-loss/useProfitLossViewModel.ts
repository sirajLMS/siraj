"use client";

import type { ErrorLike } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import type { FxWarning } from "@/backend/types";
import {
  AppPermission,
  type CurrencyCode,
  type ProfitLossReportQuery,
  type ProfitLossReportQuery_profitLossReport_expensesPage,
  type ProfitLossReportQuery_profitLossReport_expensesPage_rows,
  type ProfitLossReportQuery_profitLossReport_fxWarnings,
  type ProfitLossReportQuery_profitLossReport_incomePaymentsPage,
  type ProfitLossReportQuery_profitLossReport_incomePaymentsPage_rows,
  type ProfitLossReportQuery_profitLossReport_paymentsPage,
  type ProfitLossReportQuery_profitLossReport_paymentsPage_rows,
  type ProfitLossReportQuery_profitLossReport_profitsSummary,
  type ProfitLossReportQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { profitLossReportQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { type ProfitLossTab, useProfitLossFilterStore } from "@/frontend/common/stores/profitLossFilterStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { CurrencyCode as DomainCurrencyCode } from "@/shared/constants/currency.enum";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingProfitLoss } from "@/shared/locale/namespaces";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting/profit-loss";

/** One class-session payment row on the Payments tab. */
export type ProfitLossPaymentRow = ProfitLossReportQuery_profitLossReport_paymentsPage_rows;

/** One expense row on the Expenses tab. */
export type ProfitLossExpenseRow = ProfitLossReportQuery_profitLossReport_expensesPage_rows;

/** One student income payment row on the Income Payments tab. */
export type ProfitLossIncomeRow = ProfitLossReportQuery_profitLossReport_incomePaymentsPage_rows;

/** Net-result figures the Profits tab renders as a summary. */
type ProfitLossSummary = ProfitLossReportQuery_profitLossReport_profitsSummary;

/** Server page slice of one tab: the visible rows plus whole-result metadata. */
interface ProfitLossTabPage<TRow, TAggregate> {
  readonly rows: readonly TRow[];
  /** Total rows matching the month + currency across all server pages. */
  readonly totalCount: number;
  readonly aggregate: TAggregate | null;
}

type ProfitLossPaymentsPage = ProfitLossTabPage<
  ProfitLossPaymentRow,
  ProfitLossReportQuery_profitLossReport_paymentsPage["aggregate"]
>;
type ProfitLossExpensesPage = ProfitLossTabPage<
  ProfitLossExpenseRow,
  ProfitLossReportQuery_profitLossReport_expensesPage["aggregate"]
>;
type ProfitLossIncomePage = ProfitLossTabPage<
  ProfitLossIncomeRow,
  ProfitLossReportQuery_profitLossReport_incomePaymentsPage["aggregate"]
>;

/** Stable empty pages rendered while the first fetch is in flight. */
const EMPTY_PAYMENTS_PAGE: ProfitLossPaymentsPage = { rows: [], totalCount: 0, aggregate: null };
const EMPTY_EXPENSES_PAGE: ProfitLossExpensesPage = { rows: [], totalCount: 0, aggregate: null };
const EMPTY_INCOME_PAGE: ProfitLossIncomePage = { rows: [], totalCount: 0, aggregate: null };
const EMPTY_FX_WARNINGS: readonly FxWarning[] = [];

/** Type guard for the JSON-scalar per-type tallies the API reports as `unknown`. */
function isRowCountByType(value: unknown): value is Readonly<Record<string, number>> {
  if (typeof value !== "object" || value === null) return false;
  for (const key of Object.keys(value)) {
    if (typeof Reflect.get(value, key) !== "number") return false;
  }
  return true;
}

function toPaymentsPage(page: ProfitLossReportQuery_profitLossReport_paymentsPage | null): ProfitLossPaymentsPage {
  if (page === null) return EMPTY_PAYMENTS_PAGE;
  return { rows: page.rows ?? [], totalCount: page.totalCount ?? 0, aggregate: page.aggregate ?? null };
}

function toExpensesPage(page: ProfitLossReportQuery_profitLossReport_expensesPage | null): ProfitLossExpensesPage {
  if (page === null) return EMPTY_EXPENSES_PAGE;
  const aggregate =
    page.aggregate == null
      ? null
      : {
          ...page.aggregate,
          rowCountByType: isRowCountByType(page.aggregate.rowCountByType) ? page.aggregate.rowCountByType : {},
        };
  return { rows: page.rows ?? [], totalCount: page.totalCount ?? 0, aggregate };
}

function toIncomePage(page: ProfitLossReportQuery_profitLossReport_incomePaymentsPage | null): ProfitLossIncomePage {
  if (page === null) return EMPTY_INCOME_PAGE;
  return { rows: page.rows ?? [], totalCount: page.totalCount ?? 0, aggregate: page.aggregate ?? null };
}

/**
 * Drops warnings with incomplete data (a non-null pair with a row count is
 * guaranteed by the schema, but a partially written cache entry still renders
 * safely) and exposes the rest in the shape the filter bar's chip and
 * tooltip consume. Currency codes are bridged from the codegen enum onto the
 * domain enum — both enumerate the same ISO 4217 value strings.
 */
const DOMAIN_CURRENCY_CODE_VALUES: readonly string[] = Object.values(DomainCurrencyCode);

function isDomainCurrencyCode(value: string): value is DomainCurrencyCode {
  return DOMAIN_CURRENCY_CODE_VALUES.includes(value);
}

/** Bridges a codegen currency code onto the domain enum via its string value. */
function toDomainCurrencyCode(code: CurrencyCode | null): DomainCurrencyCode | null {
  if (code === null) return null;
  return isDomainCurrencyCode(code) ? code : null;
}

function toFxWarnings(warnings: readonly ProfitLossReportQuery_profitLossReport_fxWarnings[]): readonly FxWarning[] {
  return warnings.flatMap(warning => {
    const originalCurrency = toDomainCurrencyCode(warning.originalCurrency);
    const targetCurrency = toDomainCurrencyCode(warning.targetCurrency);
    if (originalCurrency === null || targetCurrency === null || warning.rowCount === null) {
      return [];
    }
    return [{ originalCurrency, targetCurrency, rowCount: warning.rowCount }];
  });
}

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

  const variables = useMemo<ProfitLossReportQueryVariables>(
    () => ({
      month,
      currency,
      paymentsLimit: pageSize,
      paymentsOffset: paymentsPageIndex * pageSize,
      expensesLimit: pageSize,
      expensesOffset: expensesPageIndex * pageSize,
      incomePaymentsLimit: pageSize,
      incomePaymentsOffset: incomePageIndex * pageSize,
    }),
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
