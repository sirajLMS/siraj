"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type { CreditReason } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  studentCreditBalanceQueryDocument,
  studentCreditTransactionsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/credit-lms.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import type {
  StudentCreditBalanceInfo,
  StudentCreditTransactionRow,
} from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";
import { useRouter } from "@/shared/i18n/routing";
import { type StudentPortalCreditsLabels, useAppTranslation } from "@/shared/locale";

function useStudentCreditsLabels(t: StudentPortalCreditsLabels): StudentPortalCreditsLabels {
  return useMemo(
    () => ({
      pageTitle: t.pageTitle,
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
    reason: (raw.reason ?? null) as CreditReason | null,
    notes: raw.notes ?? null,
    createdAt: raw.createdAt ?? null,
  };
}

export interface StudentCreditsViewModel {
  readonly balance: StudentCreditBalanceInfo;
  readonly transactions: readonly StudentCreditTransactionRow[];
  readonly labels: StudentPortalCreditsLabels;
  readonly loading: boolean;
  readonly onBackToDashboard: () => void;
}

export type UseStudentCreditsViewModelProps = {};

export function useStudentCreditsViewModel(): StudentCreditsViewModel {
  const t = useAppTranslation().dashboardTranslations.studentPortalCredits;
  const router = useRouter();
  const labels = useStudentCreditsLabels(t);

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
        first: 25,
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

  const balance: StudentCreditBalanceInfo = useMemo(
    () => ({
      classesRemaining: balanceData?.studentCreditBalance?.classesRemaining ?? 0,
      classesTotal: balanceData?.studentCreditBalance?.classesTotal ?? 0,
    }),
    [balanceData]
  );

  const transactions: readonly StudentCreditTransactionRow[] = useMemo(() => {
    const rows = transactionsData?.studentCreditTransactions;
    if (!rows) return [];
    return rows.map(mapTransaction);
  }, [transactionsData]);

  const loading = profileLoading || balanceLoading || transactionsLoading;

  return {
    balance,
    transactions,
    labels,
    loading,
    onBackToDashboard: () => router.push("/students/me"),
  };
}
