"use client";

import { useMemo, useState } from "react";
import { CreditReason } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentCreditTransactionRow } from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";
import {
  type CreditReasonFilter,
  type CreditReasonFilterOption,
  DEFAULT_PAGE_SIZE,
} from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel.helpers";
import type { StudentPortalCreditsLabels } from "@/shared/locale";

export function useStudentCreditsLabels(t: StudentPortalCreditsLabels): StudentPortalCreditsLabels {
  return useMemo(
    () => ({
      pageTitle: t.pageTitle,
      pageSubtitle: t.pageSubtitle,
      currentBalance: t.currentBalance,
      hoursRemaining: t.hoursRemaining,
      hoursTotal: t.hoursTotal,
      transactionHistory: t.transactionHistory,
      dateColumn: t.dateColumn,
      typeColumn: t.typeColumn,
      amountColumn: t.amountColumn,
      notesColumn: t.notesColumn,
      purchase: t.purchase,
      deduction: t.deduction,
      refund: t.refund,
      adjustment: t.adjustment,
      filterAll: t.filterAll,
      noTransactions: t.noTransactions,
      backToDashboard: t.backToDashboard,
    }),
    [t]
  );
}

interface UseReasonFilterState {
  readonly reasonFilter: CreditReasonFilter;
  readonly page: number;
  readonly pageSize: number;
  readonly setReasonFilter: (value: CreditReasonFilter) => void;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (size: number) => void;
}

export function useStudentCreditsPagination(): UseReasonFilterState {
  const [reasonFilter, setReasonFilterState] = useState<CreditReasonFilter>("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);

  return {
    reasonFilter,
    page,
    pageSize,
    setReasonFilter: value => {
      setReasonFilterState(value);
      setPage(0);
    },
    setPage,
    setPageSize: size => {
      setPageSizeState(size);
      setPage(0);
    },
  };
}

interface UseDerivedTransactionsState {
  readonly filteredTransactions: readonly StudentCreditTransactionRow[];
  readonly transactions: readonly StudentCreditTransactionRow[];
  readonly totalCount: number;
}

export function useDerivedTransactions(
  allTransactions: readonly StudentCreditTransactionRow[],
  reasonFilter: CreditReasonFilter,
  page: number,
  pageSize: number
): UseDerivedTransactionsState {
  const filteredTransactions = useMemo(() => {
    if (reasonFilter === "ALL") return allTransactions;
    return allTransactions.filter(row => row.reason === reasonFilter);
  }, [allTransactions, reasonFilter]);

  const totalCount = filteredTransactions.length;

  const transactions = useMemo(() => {
    const start = page * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, page, pageSize]);

  return { filteredTransactions, transactions, totalCount };
}

interface UseReasonOptionsState {
  readonly reasonOptions: readonly CreditReasonFilterOption[];
  readonly reasonLabel: (reason: CreditReason | null) => string;
}

export function useReasonOptions(labels: StudentPortalCreditsLabels): UseReasonOptionsState {
  const reasonOptions = useMemo<readonly CreditReasonFilterOption[]>(
    () => [
      { value: "ALL", label: labels.filterAll },
      { value: CreditReason.Purchase, label: labels.purchase },
      { value: CreditReason.Deduction, label: labels.deduction },
      { value: CreditReason.Refund, label: labels.refund },
      { value: CreditReason.Adjustment, label: labels.adjustment },
    ],
    [labels]
  );

  const reasonLabel = useMemo(
    () =>
      (reason: CreditReason | null): string => {
        if (!reason) return "";
        switch (reason) {
          case CreditReason.Purchase:
            return labels.purchase;
          case CreditReason.Deduction:
            return labels.deduction;
          case CreditReason.Refund:
            return labels.refund;
          case CreditReason.Adjustment:
            return labels.adjustment;
          default:
            return reason;
        }
      },
    [labels]
  );

  return { reasonOptions, reasonLabel };
}
