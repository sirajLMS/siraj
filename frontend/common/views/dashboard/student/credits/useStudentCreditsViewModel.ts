"use client";

import type { CreditReason } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  StudentCreditBalanceInfo,
  StudentCreditTransactionRow,
} from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";
import { useStudentCreditQueries } from "@/frontend/common/views/dashboard/student/credits/useStudentCreditQueries.hooks";
import type {
  CreditReasonFilter,
  CreditReasonFilterOption,
} from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel.helpers";
import {
  useDerivedTransactions,
  useReasonOptions,
  useStudentCreditsLabels,
  useStudentCreditsPagination,
} from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel.hooks";
import { useRouter } from "@/shared/i18n/navigation";
import {
  type AppLocale,
  type StudentPortalCreditsLabels,
  Translation,
  useAppLocale,
  useAppTranslation,
} from "@/shared/locale";

export interface StudentCreditsViewModel {
  readonly balance: StudentCreditBalanceInfo;
  /** The logged-in student own student id (null until the profile query resolves). */
  readonly studentId: string | null;
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

export function useStudentCreditsViewModel(): StudentCreditsViewModel {
  const t = useAppTranslation(Translation.Dashboard.StudentPortalCredits);
  const locale = useAppLocale();
  const router = useRouter();
  const labels = useStudentCreditsLabels(t);

  const { studentId, balance, allTransactions, loading } = useStudentCreditQueries();
  const { reasonFilter, page, pageSize, setReasonFilter, setPage, setPageSize } = useStudentCreditsPagination();
  const { transactions, totalCount } = useDerivedTransactions(allTransactions, reasonFilter, page, pageSize);
  const { reasonOptions, reasonLabel } = useReasonOptions(labels);

  return {
    balance,
    studentId,
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
