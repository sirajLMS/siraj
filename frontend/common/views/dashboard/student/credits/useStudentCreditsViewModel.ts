"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { CreditReason } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  studentCreditBalanceQueryDocument,
  studentCreditTransactionsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/credit-lms.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import type {
  StudentCreditBalanceInfo,
  StudentCreditTransactionRow,
} from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";
import { useRouter } from "@/shared/i18n/navigation";
import {
  type AppLocale,
  type StudentPortalCreditsLabels,
  Translation,
  useAppLocale,
  useAppTranslation,
} from "@/shared/locale";

export type CreditReasonFilter = "ALL" | CreditReason;

export interface CreditReasonFilterOption {
  readonly value: CreditReasonFilter;
  readonly label: string;
}

function useStudentCreditsLabels(t: StudentPortalCreditsLabels): StudentPortalCreditsLabels {
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

type TransactionItem = NonNullable<
  NonNullable<
    import("@/frontend/common/graphql/generated/gql/operations").StudentCreditTransactionsQuery["studentCreditTransactions"]
  >[number]
>;

function mapTransaction(raw: TransactionItem): StudentCreditTransactionRow {
  return {
    id: raw.id ?? "",
    changeAmount: raw.changeAmount ?? 0,
    reason: raw.reason ?? null,
    notes: raw.notes ?? null,
    createdAt: raw.createdAt ?? null,
  };
}

const DEFAULT_PAGE_SIZE = 10;

export interface StudentCreditsViewModel {
  readonly balance: StudentCreditBalanceInfo;
  readonly transactions: readonly StudentCreditTransactionRow[];
  readonly totalCount: number;
  readonly reasonFilter: CreditReasonFilter;
  readonly reasonOptions: readonly CreditReasonFilterOption[];
  readonly page: number;
  readonly pageSize: number;
  readonly locale: AppLocale;
  readonly labels: StudentPortalCreditsLabels;
  readonly loading: boolean;
  readonly onReasonFilterChange: (value: CreditReasonFilter) => void;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
  readonly onBackToDashboard: () => void;
  readonly reasonLabel: (reason: CreditReason | null) => string;
}

export type UseStudentCreditsViewModelProps = Record<string, never>;

interface UseCreditQueriesState {
  readonly studentId: string | null;
  readonly balance: StudentCreditBalanceInfo;
  readonly allTransactions: readonly StudentCreditTransactionRow[];
  readonly loading: boolean;
}

function useStudentCreditQueries(): UseCreditQueriesState {
  const { data: profileData, loading: profileLoading } = useQuery(studentProfileQueryDocument, {
    variables: { studentId: null, year: null, month: null },
    fetchPolicy: "cache-first",
  });
  const studentId = profileData?.studentProfile?.id ?? null;

  const { data: balanceData, loading: balanceLoading } = useQuery(studentCreditBalanceQueryDocument, {
    variables: { studentId: studentId ?? "" },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const { data: transactionsData, loading: transactionsLoading } = useQuery(studentCreditTransactionsQueryDocument, {
    variables: {
      studentId: studentId ?? "",
      paginationArgs: {
        first: 100,
        skip: null,
        after: null,
        before: null,
        last: null,
        page: null,
        maxCount: null,
      },
    },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const balance = useMemo<StudentCreditBalanceInfo>(
    () => ({
      classesRemaining: balanceData?.studentCreditBalance?.classesRemaining ?? 0,
      classesTotal: balanceData?.studentCreditBalance?.classesTotal ?? 0,
    }),
    [balanceData]
  );

  const allTransactions = useMemo<readonly StudentCreditTransactionRow[]>(() => {
    const rows = transactionsData?.studentCreditTransactions;
    if (!rows) return [];
    return rows.map(mapTransaction);
  }, [transactionsData]);

  const loading = profileLoading || balanceLoading || transactionsLoading;

  return { studentId, balance, allTransactions, loading };
}

interface UseReasonFilterState {
  readonly reasonFilter: CreditReasonFilter;
  readonly page: number;
  readonly pageSize: number;
  readonly setReasonFilter: (value: CreditReasonFilter) => void;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (size: number) => void;
}

function useStudentCreditsPagination(): UseReasonFilterState {
  const [reasonFilter, setReasonFilter] = useState<CreditReasonFilter>("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  return {
    reasonFilter,
    page,
    pageSize,
    setReasonFilter: value => {
      setReasonFilter(value);
      setPage(0);
    },
    setPage,
    setPageSize: size => {
      setPageSize(size);
      setPage(0);
    },
  };
}

interface UseDerivedTransactionsState {
  readonly filteredTransactions: readonly StudentCreditTransactionRow[];
  readonly transactions: readonly StudentCreditTransactionRow[];
  readonly totalCount: number;
}

function useDerivedTransactions(
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

function useReasonOptions(labels: StudentPortalCreditsLabels): UseReasonOptionsState {
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

export function useStudentCreditsViewModel(): StudentCreditsViewModel {
  const t = useAppTranslation(Translation.Dashboard.StudentPortalCredits);
  const locale = useAppLocale();
  const router = useRouter();
  const labels = useStudentCreditsLabels(t);

  const { balance, allTransactions, loading } = useStudentCreditQueries();
  const { reasonFilter, page, pageSize, setReasonFilter, setPage, setPageSize } = useStudentCreditsPagination();
  const { transactions, totalCount } = useDerivedTransactions(allTransactions, reasonFilter, page, pageSize);
  const { reasonOptions, reasonLabel } = useReasonOptions(labels);

  return {
    balance,
    transactions,
    totalCount,
    reasonFilter,
    reasonOptions,
    page,
    pageSize,
    locale,
    labels,
    loading,
    onReasonFilterChange: setReasonFilter,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    onBackToDashboard: () => router.push("/dashboard"),
    reasonLabel,
  };
}
