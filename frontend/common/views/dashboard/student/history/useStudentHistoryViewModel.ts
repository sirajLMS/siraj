"use client";

import type { StudentHistoryLabels } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryLabels";
import type {
  StudentHistoryMetrics,
  StudentHistorySessionRow,
} from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";

export interface StudentHistoryViewModel {
  readonly metrics: StudentHistoryMetrics;
  readonly sessions: readonly StudentHistorySessionRow[];
  readonly labels: StudentHistoryLabels;
  readonly loading: boolean;
  readonly onBackToDashboard: () => void;
}

export type UseStudentHistoryViewModelProps = Omit<StudentHistoryViewModel, never>;

export function useStudentHistoryViewModel(props: UseStudentHistoryViewModelProps): StudentHistoryViewModel {
  return props;
}
