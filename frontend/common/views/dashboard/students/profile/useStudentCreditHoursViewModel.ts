"use client";

import { useMemo } from "react";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { TRANSACTIONS_PAGINATION } from "@/frontend/common/views/dashboard/students/profile/useStudentCreditHoursViewModel.constants";
import {
  audienceHint,
  buildBalanceMetrics,
  mapHourTransaction,
  resolveCreditHoursAudience,
  type StudentCreditHoursTransactionRow,
} from "@/frontend/common/views/dashboard/students/profile/useStudentCreditHoursViewModel.helpers";
import { useCreditHoursQueries } from "@/frontend/common/views/dashboard/students/profile/useStudentCreditHoursViewModel.hooks";
import { useAppTranslation } from "@/shared/locale/client";
import { useAppLocale } from "@/shared/locale/localeContext";
import { DashboardAccountingStudentCreditHours } from "@/shared/locale/namespaces";
import type { StudentCreditHoursLabels } from "@/shared/locale/types/dashboard/accounting/student-credit-hours";

export type { StudentCreditHoursTransactionRow };

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
