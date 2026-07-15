"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { studentCreditBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/credit-lms.documents";
import { pendingLessonReportsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/lesson-report.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useStudentDashboardStore } from "@/frontend/common/stores/studentDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { StudentDashboardView } from "@/frontend/common/views/dashboard/student/dashboard/studentDashboardView";
import type {
  RecentLessonReportRow,
  StudentCreditBalanceRow,
  UpcomingLessonRow,
} from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import {
  isWithinNextDays,
  mapCreditBalance,
  mapRecentLessonReports,
  mapUpcomingLessons,
} from "@/frontend/common/views/dashboard/student/dashboard/utils/studentDashboardMappers";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale/client";
import type { StudentDashboardLabels } from "@/shared/locale/types/dashboard/studentPortal/studentDashboard";

function useStudentDashboardLabels(
  t: ReturnType<typeof useAppTranslation<"dashboard.studentPortal.dashboard">>
): StudentDashboardLabels {
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
      upcomingToday: t.upcomingToday,
      upcomingThisWeek: t.upcomingThisWeek,
      noLessonReports: t.noLessonReports,
      loadingMessage: t.loadingMessage,
    }),
    [t]
  );
}

export function StudentDashboardContainer() {
  const t = useAppTranslation("dashboard.studentPortal.dashboard");
  const router = useRouter();
  const userName = useUserStore(state => state.name);
  const setSelectedReportId = useStudentDashboardStore(state => state.setSelectedReportId);
  const setReflectionDialogOpen = useStudentDashboardStore(state => state.setReflectionDialogOpen);

  const labels = useStudentDashboardLabels(t);

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

  const { data: reportsData, loading: reportsLoading } = useQuery(pendingLessonReportsQueryDocument, {
    variables: {
      studentId: studentId ?? null,
      teacherId: null,
      paginationArgs: {
        first: 5,
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

  const creditBalance: StudentCreditBalanceRow = useMemo(
    () => mapCreditBalance(balanceData?.studentCreditBalance),
    [balanceData]
  );

  const recentLessonReports: readonly RecentLessonReportRow[] = useMemo(
    () => mapRecentLessonReports(reportsData?.pendingLessonReports),
    [reportsData]
  );

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
      handleAddReflection: (lessonReportId: string) => {
        setSelectedReportId(lessonReportId);
        setReflectionDialogOpen(true);
      },
      handleEditProfile: () => {
        router.push("/students/me/profile");
      },
    }),
    [upcomingLessons, router, setSelectedReportId, setReflectionDialogOpen]
  );

  return (
    <StudentDashboardView
      userName={userName || null}
      nextLesson={nextLesson}
      upcomingLessons={upcomingLessons}
      creditBalance={creditBalance}
      recentLessonReports={recentLessonReports}
      labels={labels}
      loading={loading}
      onJoinLesson={handlers.handleJoinLesson}
      onViewHistory={handlers.handleViewHistory}
      onViewCredits={handlers.handleViewCredits}
      onAddReflection={handlers.handleAddReflection}
      onEditProfile={handlers.handleEditProfile}
    />
  );
}
