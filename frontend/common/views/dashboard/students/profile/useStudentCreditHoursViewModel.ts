"use client";

import { useQuery } from "@apollo/client/react";
import { ShoppingBagOutlined, TrendingDownOutlined, WalletOutlined } from "@mui/icons-material";
import { useMemo } from "react";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { AppPermission, type StudentCreditTransactionsQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentCreditHourBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { studentCreditTransactionsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { formatAccountingDate } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import { useAppTranslation } from "@/shared/locale/client";
import { useAppLocale } from "@/shared/locale/localeContext";
import { DashboardAccountingStudentCreditHours } from "@/shared/locale/namespaces";
import type { StudentCreditHoursLabels } from "@/shared/locale/types/dashboard/accounting/student-credit-hours";

const RECENT_TRANSACTIONS_LIMIT = 10;

// The studentCreditTransactions field accepts paginationArgs resolver-side but
// its GraphQL object type exposes rows only (no totalCount/pageInfo), so the
// list primitives paginate client-side over the latest RECENT_TRANSACTIONS_LIMIT
// rows fetched here. Server-mode pagination requires a schema change first.
const TRANSACTIONS_PAGINATION: ListPaginationOptions = { mode: "client", pageSize: RECENT_TRANSACTIONS_LIMIT };

type CreditHoursAudience = "admin" | "teacher" | "parent" | null;

type HourTransaction = NonNullable<StudentCreditTransactionsQuery["studentCreditTransactions"]>[number];

type HourBalance = NonNullable<
  import("@/frontend/common/graphql/generated/gql/graphql").StudentCreditHourBalanceQuery["studentCreditHourBalance"]
>;

/** Grid/card row shape consumed by both tier views (pre-formatted display strings). */
export interface StudentCreditHoursTransactionRow {
  readonly id: string;
  readonly dateLabel: string;
  readonly changeLabel: string;
  readonly isPositive: boolean;
  /** Raw transaction reason (PURCHASE/DEDUCTION/REFUND/ADJUSTMENT) — StatusBadge status key. */
  readonly reasonStatus: string;
  /** Translated reason label. */
  readonly reasonLabel: string;
  readonly notes: string;
}

export interface UseStudentCreditHoursViewModelProps {
  readonly studentId: string;
}

export interface StudentCreditHoursViewModel {
  readonly labels: StudentCreditHoursLabels;
  readonly hint: string | null;
  readonly lowBalanceMessage: string | null;
  readonly metrics: readonly MetricItem[];
  readonly transactions: readonly StudentCreditHoursTransactionRow[];
  readonly transactionsLoading: boolean;
  readonly transactionsError: boolean;
  /** True while the first balance fetch is in flight (pre-data glass pane). */
  readonly initialLoading: boolean;
  readonly balanceError: boolean;
  readonly transactionsPagination: ListPaginationOptions;
}

/** Formats an hour delta as "+1.50 h" / "−0.50 h" / em-dash when unknown. */
function formatHourChange(hours: number | null): string {
  if (hours == null) {
    return "—";
  }
  return `${hours > 0 ? "+" : "−"}${Math.abs(hours).toFixed(2)} h`;
}

function resolveReasonLabel(labels: StudentCreditHoursLabels, reason: string | null | undefined): string {
  if (!reason) {
    return "—";
  }
  const map: Record<string, string> = {
    PURCHASE: labels.reasons.PURCHASE,
    DEDUCTION: labels.reasons.DEDUCTION,
    REFUND: labels.reasons.REFUND,
    ADJUSTMENT: labels.reasons.ADJUSTMENT,
  };
  return map[reason] ?? reason;
}

/**
 * Client-side mirror of the server helper `resolveStudentsPageAudience`
 * (app/(dashboard)/lib) — the tab renders inside the client profile page,
 * where only the permission list is available. Same priority order:
 * admin (super/StudentsList) → teacher → parent.
 */
function resolveCreditHoursAudience(permissions: readonly AppPermission[], isSuperAdmin: boolean): CreditHoursAudience {
  if (isSuperAdmin || permissions.includes(AppPermission.StudentsList)) return "admin";
  if (permissions.includes(AppPermission.TeacherViewStudents)) return "teacher";
  if (permissions.includes(AppPermission.ParentViewStudents)) return "parent";
  return null;
}

function audienceHint(labels: StudentCreditHoursLabels, audience: CreditHoursAudience): string | null {
  switch (audience) {
    case "admin":
      return labels.perAudience.supervisorHint;
    case "teacher":
      return labels.perAudience.teacherHint;
    case "parent":
      return labels.perAudience.parentHint;
    default:
      return labels.perAudience.studentHint;
  }
}

interface CreditHoursQueriesState {
  readonly balance: HourBalance | null;
  readonly balanceLoading: boolean;
  readonly balanceError: boolean;
  readonly rawTransactions: readonly HourTransaction[];
  readonly transactionsLoading: boolean;
  readonly transactionsError: boolean;
}

function useCreditHoursQueries(studentId: string): CreditHoursQueriesState {
  const {
    data: balanceData,
    loading: balanceLoading,
    error: balanceError,
  } = useQuery(studentCreditHourBalanceQueryDocument, { variables: { studentId }, skip: !studentId });

  const {
    data: txData,
    loading: txLoading,
    error: txError,
  } = useQuery(studentCreditTransactionsQueryDocument, {
    variables: {
      studentId,
      paginationArgs: {
        after: null,
        before: null,
        first: RECENT_TRANSACTIONS_LIMIT,
        last: null,
        maxCount: null,
        page: null,
        skip: null,
      },
      hoursOnly: true,
    },
    skip: !studentId,
  });

  const balance = balanceData?.studentCreditHourBalance ?? null;
  const rawTransactions = useMemo(() => txData?.studentCreditTransactions ?? [], [txData]);

  return {
    balance,
    balanceLoading,
    balanceError: Boolean(balanceError),
    rawTransactions,
    transactionsLoading: txLoading,
    transactionsError: Boolean(txError),
  };
}

function mapHourTransaction(
  tx: HourTransaction,
  labels: StudentCreditHoursLabels,
  locale: string
): StudentCreditHoursTransactionRow {
  const hours = tx.changeAmountHours == null ? null : Number(tx.changeAmountHours);
  return {
    id: tx.id ?? "",
    dateLabel: formatAccountingDate(tx.createdAt, locale),
    changeLabel: formatHourChange(hours),
    isPositive: hours != null && hours > 0,
    reasonStatus: tx.reason ?? "unknown",
    reasonLabel: resolveReasonLabel(labels, tx.reason),
    notes: tx.notes ?? "—",
  };
}

function buildBalanceMetrics(
  labels: StudentCreditHoursLabels,
  total: number,
  consumed: number,
  remaining: number,
  isLowBalance: boolean
): readonly MetricItem[] {
  return [
    {
      key: "total",
      count: labels.hoursUnit(total.toFixed(2)),
      labelKey: "total",
      label: labels.totalLabel,
      icon: ShoppingBagOutlined,
    },
    {
      key: "consumed",
      count: labels.hoursUnit(consumed.toFixed(2)),
      labelKey: "consumed",
      label: labels.consumedLabel,
      icon: TrendingDownOutlined,
    },
    {
      key: "remaining",
      count: labels.hoursUnit(remaining.toFixed(2)),
      labelKey: "remaining",
      label: labels.balanceCardTitle,
      icon: WalletOutlined,
      variant: isLowBalance ? "error" : "highlight",
    },
  ];
}

export function useStudentCreditHoursViewModel(
  props: UseStudentCreditHoursViewModelProps
): StudentCreditHoursViewModel {
  const { studentId } = props;
  const labels = useAppTranslation(DashboardAccountingStudentCreditHours);
  const locale = useAppLocale();
  const permissions = useUserStore(s => s.permissions);
  const actorIsSuperAdmin = useUserStore(s => s.actorIsSuperAdmin);

  const audience = useMemo(
    () => resolveCreditHoursAudience(permissions, actorIsSuperAdmin),
    [permissions, actorIsSuperAdmin]
  );

  const { balance, balanceLoading, balanceError, rawTransactions, transactionsLoading, transactionsError } =
    useCreditHoursQueries(studentId);

  const total = Number(balance?.creditHoursTotal ?? 0);
  const remaining = Number(balance?.creditHoursRemaining ?? 0);
  const consumed = Math.max(0, total - remaining);
  const lowHoursThreshold = balance?.lowHoursThreshold ?? 0;
  const isLowBalance = remaining < lowHoursThreshold;

  const transactions = useMemo(
    () => rawTransactions.map(tx => mapHourTransaction(tx, labels, locale)),
    [rawTransactions, labels, locale]
  );

  const metrics = useMemo(
    () => buildBalanceMetrics(labels, total, consumed, remaining, isLowBalance),
    [labels, total, consumed, remaining, isLowBalance]
  );

  return {
    labels,
    hint: audienceHint(labels, audience),
    lowBalanceMessage: isLowBalance ? labels.lowBalanceAlert(remaining.toFixed(2), lowHoursThreshold.toFixed(2)) : null,
    metrics,
    transactions,
    transactionsLoading: transactionsLoading && transactions.length === 0,
    transactionsError,
    initialLoading: balanceLoading && !balance,
    balanceError,
    transactionsPagination: TRANSACTIONS_PAGINATION,
  };
}
