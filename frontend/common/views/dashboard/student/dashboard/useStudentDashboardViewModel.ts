"use client";

import type { StudentDashboardLabels } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardLabels";
import type {
  RecentLessonReportRow,
  StudentCreditBalanceRow,
  UpcomingLessonRow,
} from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";

export interface StudentDashboardViewModel {
  readonly userName: string | null;
  readonly nextLesson: UpcomingLessonRow | null;
  readonly upcomingLessons: readonly UpcomingLessonRow[];
  readonly creditBalance: StudentCreditBalanceRow;
  readonly recentLessonReports: readonly RecentLessonReportRow[];
  readonly labels: StudentDashboardLabels;
  readonly loading: boolean;
  readonly onJoinLesson: (id: string) => void;
  readonly onViewHistory: () => void;
  readonly onViewCredits: () => void;
  readonly onAddReflection: (lessonReportId: string) => void;
  readonly onEditProfile: () => void;
}

export type UseStudentDashboardViewModelProps = Omit<StudentDashboardViewModel, never>;

export function useStudentDashboardViewModel(props: UseStudentDashboardViewModelProps): StudentDashboardViewModel {
  return props;
}
