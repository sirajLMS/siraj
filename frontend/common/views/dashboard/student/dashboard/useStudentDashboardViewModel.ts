"use client";

import { useMemo } from "react";
import { useStudentDashboardStore } from "@/frontend/common/stores/studentDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type {
  RecentLessonReportRow,
  StudentCreditBalanceRow,
  UpcomingLessonRow,
} from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import { useStudentDashboardQueries } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardQueries.hooks";
import {
  useLessonReportStatusLabels,
  useReportsTotalCountSync,
  useStudentDashboardHandlers,
  useStudentDashboardLabels,
} from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel.hooks";
import type { LessonReportStatusLabelSlice } from "@/frontend/common/views/dashboard/student/dashboard/utils/recentLessonReportPresentation";
import {
  type AppLocale,
  type CommonLabels,
  type StudentPortalDashboardLabels as StudentDashboardLabels,
  Translation,
  useAppLocale,
  useAppTranslation,
} from "@/shared/locale";

export interface ReportsPagination {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
}

export interface StudentDashboardViewModel {
  readonly userName: string | null;
  readonly locale: AppLocale;
  readonly nextLesson: UpcomingLessonRow | null;
  readonly upcomingTodayCount: number;
  readonly creditBalance: StudentCreditBalanceRow;
  readonly recentLessonReports: readonly RecentLessonReportRow[];
  readonly reportsPagination: ReportsPagination;
  readonly labels: StudentDashboardLabels;
  readonly lessonReportStatusLabels: LessonReportStatusLabelSlice;
  readonly commonLabels: CommonLabels;
  readonly loading: boolean;
  readonly onJoinLesson: (id: string) => void;
  readonly onViewHistory: () => void;
  readonly onViewCredits: () => void;
  /** Opens the reflection dialog; `classInstanceId` is stored as `selectedReportId`. */
  readonly onAddReflection: (classInstanceId: string) => void;
  readonly onEditProfile: () => void;
}

export type UseStudentDashboardViewModelProps = Record<string, never>;

export function useStudentDashboardViewModel(_props: UseStudentDashboardViewModelProps): StudentDashboardViewModel {
  const t = useAppTranslation(Translation.Dashboard.StudentPortalDashboard);
  const lessonReportLabels = useAppTranslation(Translation.Dashboard.LmsLessonReports);
  const commonLabels = useAppTranslation(Translation.Common);
  const locale = useAppLocale();
  const userName = useUserStore(state => state.name);
  const page = useStudentDashboardStore(state => state.page);
  const pageSize = useStudentDashboardStore(state => state.pageSize);

  const labels = useStudentDashboardLabels(t);
  const lessonReportStatusLabels = useLessonReportStatusLabels(lessonReportLabels);

  const { nextLesson, upcomingLessons, upcomingTodayCount, creditBalance, recentLessonReports, totalCount, loading } =
    useStudentDashboardQueries(page, pageSize);

  useReportsTotalCountSync(totalCount);

  const {
    handleJoinLesson,
    handleViewHistory,
    handleViewCredits,
    handleAddReflection,
    handleEditProfile,
    handleReportsPageChange,
  } = useStudentDashboardHandlers(upcomingLessons);

  const reportsPagination = useMemo<ReportsPagination>(
    () => ({
      page,
      pageSize,
      totalCount,
      onPageChange: handleReportsPageChange,
    }),
    [page, pageSize, totalCount, handleReportsPageChange]
  );

  return {
    userName: userName || null,
    locale,
    nextLesson,
    upcomingTodayCount,
    creditBalance,
    recentLessonReports,
    reportsPagination,
    labels,
    lessonReportStatusLabels,
    commonLabels,
    loading,
    onJoinLesson: handleJoinLesson,
    onViewHistory: handleViewHistory,
    onViewCredits: handleViewCredits,
    onAddReflection: handleAddReflection,
    onEditProfile: handleEditProfile,
  };
}
