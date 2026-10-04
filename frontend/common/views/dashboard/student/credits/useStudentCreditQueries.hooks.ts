"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
// Hours-domain balance (creditHoursRemaining/Total) — NOT the legacy class-unit balance.
import { studentCreditHourBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting/accounting.documents";
import { studentCreditTransactionsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/credit-lms.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import type {
  StudentCreditBalanceInfo,
  StudentCreditTransactionRow,
} from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";
import {
  mapTransaction,
  type TransactionItem,
} from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel.helpers";

interface UseCreditQueriesState {
  readonly studentId: string | null;
  readonly balance: StudentCreditBalanceInfo;
  readonly allTransactions: readonly StudentCreditTransactionRow[];
  readonly loading: boolean;
}

export function useStudentCreditQueries(): UseCreditQueriesState {
  const { data: profileData, loading: profileLoading } = useQuery(studentProfileQueryDocument, {
    variables: { studentId: null, year: null, month: null, includeUpcomingClasses: true },
    fetchPolicy: "cache-first",
  });
  const studentId = profileData?.studentProfile?.id ?? null;

  const { data: balanceData, loading: balanceLoading } = useQuery(studentCreditHourBalanceQueryDocument, {
    variables: { studentId: studentId ?? "" },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const { data: transactionsData, loading: transactionsLoading } = useQuery(studentCreditTransactionsQueryDocument, {
    variables: {
      studentId: studentId ?? "",
      hoursOnly: null,
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

  // Hours domain: this page is the student's credit-HOURS ledger — the legacy
  // studentCreditBalance (class units) must not feed the hour KPI cards.
  const balance = useMemo<StudentCreditBalanceInfo>(
    () => ({
      hoursRemaining: Number(balanceData?.studentCreditHourBalance?.creditHoursRemaining ?? 0),
      hoursTotal: Number(balanceData?.studentCreditHourBalance?.creditHoursTotal ?? 0),
    }),
    [balanceData]
  );

  const allTransactions = useMemo<readonly StudentCreditTransactionRow[]>(() => {
    const rows = transactionsData?.studentCreditTransactions;
    if (!rows) return [];
    // Apollo masks the TypedDocumentNode rows (MaybeMasked union) — cast at
    // the resolver boundary (documented repo convention for generated types).
    return (rows as readonly TransactionItem[]).map(mapTransaction);
  }, [transactionsData]);

  const loading = profileLoading || balanceLoading || transactionsLoading;

  return { studentId, balance, allTransactions, loading };
}
