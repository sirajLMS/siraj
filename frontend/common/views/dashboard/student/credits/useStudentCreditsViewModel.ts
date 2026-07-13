"use client";

import type { StudentCreditsLabels } from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsLabels";
import type {
  StudentCreditBalanceInfo,
  StudentCreditTransactionRow,
} from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";

export interface StudentCreditsViewModel {
  readonly balance: StudentCreditBalanceInfo;
  readonly transactions: readonly StudentCreditTransactionRow[];
  readonly labels: StudentCreditsLabels;
  readonly loading: boolean;
  readonly onBackToDashboard: () => void;
}

export type UseStudentCreditsViewModelProps = Omit<StudentCreditsViewModel, never>;

export function useStudentCreditsViewModel(props: UseStudentCreditsViewModelProps): StudentCreditsViewModel {
  return props;
}
