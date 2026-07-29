"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo } from "react";
import { studentCreditBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/credit-lms.documents";
import { studentRecentLessonReportsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/lesson-report.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useStudentDashboardStore } from "@/frontend/common/stores/studentDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  RecentLessonReportRow,
  StudentCreditBalanceRow,
  UpcomingLessonRow,
} from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import {
  isToday,
  isWithinNextDays,
  mapCreditBalance,
  mapRecentLessonReports,
  mapUpcomingLessons,
} from "@/frontend/common/views/dashboard/student/dashboard/utils/studentDashboardMappers";
import { useRouter } from "@/shared/i18n/navigation";
import {
  type AppLocale,
  type CommonLabels,
  type StudentPortalDashboardLabels as StudentDashboardLabels,
  Translation,
  useAppLocale,
  useAppTranslation,
} from "@/shared/locale";

function useStudentDashboardLabels(t: StudentDashboardLabels): StudentDashboardLabels {
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
    }),
    [t]
  );
}

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
  const commonLabels = useAppTranslation(Translation.Common);
  const locale = useAppLocale();
  const router = useRouter();
  const userName = useUserStore(state => state.name);
  const setSelectedReportId = useStudentDashboardStore(state => state.setSelectedReportId);
  const setReflectionDialogOpen = useStudentDashboardStore(state => state.setReflectionDialogOpen);
  const page = useStudentDashboardStore(state => state.page);
  const pageSize = useStudentDashboardStore(state => state.pageSize);
  const setPage = useStudentDashboardStore(state => state.setPage);
  const setReportsTotalCount = useStudentDashboardStore(state => state.setReportsTotalCount);

  const labels = useStudentDashboardLabels(t);

  const paginationArgs = useMemo(
    () => ({
      page: page + 1,
      first: pageSize,
      skip: null,
      after: null,
      before: null,
      last: null,
      maxCount: null,
    }),
    [page, pageSize]
  );

  const { data: profileData, loading: profileLoading } = useQuery(studentProfileQueryDocument, {
    variables: { studentId: null, year: null, month: null },
    fetchPolicy: "cache-and-network",
  });

  const studentId = profileData?.studentProfile?.id ?? null;

  const { data: balanceData, loading: balanceLoading } = useQuery(studentCreditBalanceQueryDocument, {
    variables: { studentId: studentId ?? "" },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const { data: reportsData, loading: reportsLoading } = useQuery(studentRecentLessonReportsQueryDocument, {
    variables: {
      paginationArgs,
    },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const upcomingLessons: readonly UpcomingLessonRow[] = useMemo(
    () => mapUpcomingLessons(profileData?.studentProfile),
    [profileData]
  );

  const nextLesson: UpcomingLessonRow | null = useMemo(() => {
    const joinable = upcomingLessons.find(
      l => isWithinNextDays(l.scheduledStartAt, 7) && Boolean(l.meetingJoinUrl) && !l.isFrozen
    );
    return joinable ?? upcomingLessons[0] ?? null;
  }, [upcomingLessons]);

  const upcomingTodayCount = useMemo(
    () => upcomingLessons.filter(l => isToday(l.scheduledStartAt)).length,
    [upcomingLessons]
  );

  const creditBalance: StudentCreditBalanceRow = useMemo(
    () => mapCreditBalance(balanceData?.studentCreditBalance),
    [balanceData]
  );

  const recentLessonReports: readonly RecentLessonReportRow[] = useMemo(
    () => mapRecentLessonReports(reportsData?.studentRecentLessonReports?.rows),
    [reportsData]
  );

  const totalCount = reportsData?.studentRecentLessonReports?.totalCount ?? 0;

  useEffect(() => {
    if (totalCount !== useStudentDashboardStore.getState().reportsTotalCount) {
      setReportsTotalCount(totalCount);
    }
  }, [totalCount, setReportsTotalCount]);

  const loading = profileLoading || balanceLoading || reportsLoading;

  const handlers = useMemo(
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
        router.push("/students/me/history");
      },
      handleViewCredits: () => {
        router.push("/students/me/credits");
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

  const reportsPagination = useMemo<ReportsPagination>(
    () => ({
      page,
      pageSize,
      totalCount,
      onPageChange: handlers.handleReportsPageChange,
    }),
    [page, pageSize, totalCount, handlers.handleReportsPageChange]
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
    commonLabels,
    loading,
    onJoinLesson: handlers.handleJoinLesson,
    onViewHistory: handlers.handleViewHistory,
    onViewCredits: handlers.handleViewCredits,
    onAddReflection: handlers.handleAddReflection,
    onEditProfile: handlers.handleEditProfile,
  };
}
