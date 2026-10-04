"use client";

import { useEffect, useMemo } from "react";
import { useStudentDashboardStore } from "@/frontend/common/stores/studentDashboardStore";
import { logger } from "@/frontend/common/utils/logger";
import type { UpcomingLessonRow } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import type { LessonReportStatusLabelSlice } from "@/frontend/common/views/dashboard/student/dashboard/utils/recentLessonReportPresentation";
import { useRouter } from "@/shared/i18n/navigation";
import type { StudentPortalDashboardLabels as StudentDashboardLabels } from "@/shared/locale";

export function useStudentDashboardLabels(t: StudentDashboardLabels): StudentDashboardLabels {
  return useMemo(
    () => ({
      pageTitle: t.pageTitle,
      welcomeMessage: t.welcomeMessage,
      nextClass: t.nextClass,
      joinNow: t.joinNow,
      noUpcomingClasses: t.noUpcomingClasses,
      creditBalance: t.creditBalance,
      classesRemaining: t.classesRemaining,
      classesTotal: t.classesTotal,
      recentLessonReports: t.recentLessonReports,
      viewAllHistory: t.viewAllHistory,
      viewCredits: t.viewCredits,
      addReflection: t.addReflection,
      reflectionDialogTitle: t.reflectionDialogTitle,
      reflectionNotesLabel: t.reflectionNotesLabel,
      reflectionNotesPlaceholder: t.reflectionNotesPlaceholder,
      reflectionSaveError: t.reflectionSaveError,
      upcomingToday: t.upcomingToday,
      upcomingThisWeek: t.upcomingThisWeek,
      noLessonReports: t.noLessonReports,
      loadingMessage: t.loadingMessage,
      columnDate: t.columnDate,
      columnDuration: t.columnDuration,
      columnStatus: t.columnStatus,
      columnActions: t.columnActions,
      frozen: t.frozen,
      minutesShort: t.minutesShort,
      hoursShort: t.hoursShort,
      durationMinutesShort: t.durationMinutesShort,
      widgets: t.widgets,
    }),
    [t]
  );
}

export function useLessonReportStatusLabels(
  lessonReportLabels: LessonReportStatusLabelSlice
): LessonReportStatusLabelSlice {
  return useMemo<LessonReportStatusLabelSlice>(
    () => ({
      approved: lessonReportLabels.approved,
      pendingReview: lessonReportLabels.pendingReview,
      rejected: lessonReportLabels.rejected,
      draft: lessonReportLabels.draft,
    }),
    [lessonReportLabels]
  );
}

export function useReportsTotalCountSync(totalCount: number) {
  const setReportsTotalCount = useStudentDashboardStore(state => state.setReportsTotalCount);

  useEffect(() => {
    if (totalCount !== useStudentDashboardStore.getState().reportsTotalCount) {
      setReportsTotalCount(totalCount);
    }
  }, [totalCount, setReportsTotalCount]);
}

export interface StudentDashboardHandlers {
  readonly handleJoinLesson: (id: string) => void;
  readonly handleViewHistory: () => void;
  readonly handleViewCredits: () => void;
  readonly handleAddReflection: (classInstanceId: string) => void;
  readonly handleEditProfile: () => void;
  readonly handleReportsPageChange: (newPage: number) => void;
}

export function useStudentDashboardHandlers(upcomingLessons: readonly UpcomingLessonRow[]): StudentDashboardHandlers {
  const router = useRouter();
  const setSelectedReportId = useStudentDashboardStore(state => state.setSelectedReportId);
  const setReflectionDialogOpen = useStudentDashboardStore(state => state.setReflectionDialogOpen);
  const setPage = useStudentDashboardStore(state => state.setPage);

  return useMemo(
    () => ({
      handleJoinLesson: (id: string) => {
        const lesson = upcomingLessons.find(l => l.id === id);
        const url = lesson?.meetingJoinUrl;
        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
        } else {
          logger.warn("No join URL for lesson", { id });
        }
      },
      handleViewHistory: () => {
        router.push("/students/history");
      },
      handleViewCredits: () => {
        router.push("/students/credits");
      },
      handleAddReflection: (classInstanceId: string) => {
        setSelectedReportId(classInstanceId);
        setReflectionDialogOpen(true);
      },
      handleEditProfile: () => {
        router.push("/profile");
      },
      handleReportsPageChange: (newPage: number) => {
        setPage(newPage);
      },
    }),
    [upcomingLessons, router, setSelectedReportId, setReflectionDialogOpen, setPage]
  );
}
