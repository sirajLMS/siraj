"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { studentCreditHourBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { studentCreditTransactionsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { RECENT_TRANSACTIONS_LIMIT } from "@/frontend/common/views/dashboard/students/profile/useStudentCreditHoursViewModel.constants";
import type {
  HourBalance,
  HourTransaction,
} from "@/frontend/common/views/dashboard/students/profile/useStudentCreditHoursViewModel.helpers";

interface CreditHoursQueriesState {
  readonly balance: HourBalance | null;
  readonly balanceLoading: boolean;
  readonly balanceError: boolean;
  readonly rawTransactions: readonly HourTransaction[];
  readonly transactionsLoading: boolean;
  readonly transactionsError: boolean;
}

export function useCreditHoursQueries(studentId: string): CreditHoursQueriesState {
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
