"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import {
  ClassExecutionState,
  ClassOutcome,
  type EffectiveMeeting,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  parentDashboardMetricsQueryDocument,
  parentDashboardScheduleQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useParentDashboardStore } from "@/frontend/common/stores/parentDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import { ParentDashboardView } from "@/frontend/common/views/dashboard/parent/dashboard/parentDashboardView";
import type {
  ParentDashboardMetrics,
  ParentScheduleRow,
  StudentProgressItem,
  WorkshopPromo,
} from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale/client";
import type { ParentDashboardLabels } from "@/shared/locale/types/dashboard/core/parentDashboard";

function mapExecutionStateToLiveClassStatus(
  executionState: string,
  outcome: string
): "starting_soon" | "pending" | "scheduled" {
  if (executionState === "ACTIVATED") return "starting_soon";
  if (outcome === "PENDING") return "pending";
  return "scheduled";
}

function resolveMeetingJoinUrl(
  meetingJoinUrl?: string | null,
  effectiveMeeting?: EffectiveMeeting | null
): string | null {
  const fromEffective = effectiveMeeting?.joinUrl?.trim();
  const fromLegacy = meetingJoinUrl?.trim();
  return fromEffective || fromLegacy || null;
}

function useScheduleRows(
  data:
    | {
        readonly parentDashboardSchedule?: {
          readonly rows?:
            | readonly {
                readonly id?: string | null;
                readonly classTimeFormatted?: string | null;
                readonly durationMinutes?: number | null;
                readonly studentId?: string | null;
                readonly studentName?: string | null;
                readonly studentInitials?: string | null;
                readonly studentAvatarUrl?: string | null;
                readonly teacherId?: string | null;
                readonly teacherName?: string | null;
                readonly teacherAvatarUrl?: string | null;
                readonly bookingStatus?: string | null;
                readonly executionState?: ClassExecutionState | null;
                readonly outcome?: ClassOutcome | null;
                readonly isFrozen?: boolean | null;
                readonly meetingJoinUrl?: string | null;
                readonly effectiveMeeting?: EffectiveMeeting | null;
              }[]
            | null;
          readonly totalCount?: number | null;
        } | null;
      }
    | undefined
): readonly ParentScheduleRow[] {
  return useMemo(() => {
    const rows = data?.parentDashboardSchedule?.rows;
    if (!rows) return [];
    return rows.map(r => {
      const joinUrl = resolveMeetingJoinUrl(r.meetingJoinUrl, r.effectiveMeeting);
      const executionState = r.executionState ?? ClassExecutionState.NotActivated;
      const outcome = r.outcome ?? ClassOutcome.Pending;
      return {
        id: r.id ?? "",
        rowNumber: 0,
        classTime: r.classTimeFormatted ?? "",
        durationMinutes: r.durationMinutes ?? 0,
        studentId: r.studentId ?? undefined,
        studentName: r.studentName ?? "",
        studentInitials: r.studentInitials ?? "",
        studentAvatarUrl: r.studentAvatarUrl ?? undefined,
        teacherId: r.teacherId ?? undefined,
        teacherName: r.teacherName ?? "",
        teacherAvatarUrl: r.teacherAvatarUrl ?? undefined,
        bookingStatus: r.bookingStatus === "rescheduled" ? "rescheduled" : "confirmed",
        liveClassStatus: mapExecutionStateToLiveClassStatus(executionState, outcome),
        executionState,
        outcome,
        isFrozen: r.isFrozen ?? false,
        videoEnabled: Boolean(joinUrl),
        meetingJoinUrl: joinUrl,
        effectiveMeeting: r.effectiveMeeting ?? null,
      };
    });
  }, [data]);
}

function useDashboardLabels(t: ParentDashboardLabels, _userName: string) {
  return useMemo(
    () => ({
      pageTitle: t.pageTitle,
      welcome: t.welcome,
      welcomeBack: t.welcomeBack,
      pendingMessages: t.pendingMessages,
      metrics: t.metrics,
      schedule: {
        title: t.schedule.title,
        titleMobile: t.schedule.titleMobile,
        filter: t.schedule.filter,
        viewFullWeek: t.schedule.viewFullWeek,
        viewAll: t.schedule.viewAll,
        rowNumber: t.schedule.rowNumber,
        classTime: t.schedule.classTime,
        studentName: t.schedule.studentName,
        teacherName: t.schedule.teacherName,
        history: t.schedule.history,
        status: t.schedule.status,
        contact: t.schedule.contact,
        classStatus: t.schedule.classStatus,
        duration: t.schedule.duration,
        teacherLabel: t.schedule.teacherLabel,
        joinVideo: t.schedule.joinVideo,
        frozen: t.schedule.frozen,
        contactAdmin: t.schedule.contactAdmin,
        noEntries: t.schedule.noEntries,
      },
      bookingStatus: t.bookingStatus,
      liveClassStatus: t.liveClassStatus,
      progress: t.progress,
      workshop: t.workshop,
      support: t.support,
    }),
    [t]
  );
}

export function ParentDashboardContainer() {
  const t = useAppTranslation().dashboardTranslations.coreParentDashboard;
  const router = useRouter();
  const userName = useUserStore(state => state.name);
  const page = useParentDashboardStore(state => state.page);
  const pageSize = useParentDashboardStore(state => state.pageSize);
  const setPage = useParentDashboardStore(state => state.setPage);
  const setScheduleTotalCount = useParentDashboardStore(state => state.setScheduleTotalCount);

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

  const today = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const { data: scheduleData } = useQuery(parentDashboardScheduleQueryDocument, {
    variables: { date: today, search: null, paginationArgs },
    fetchPolicy: "cache-and-network",
  });

  const { data: metricsData } = useQuery(parentDashboardMetricsQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const metricsResult = metricsData?.parentDashboardMetrics;
  const metrics: ParentDashboardMetrics = useMemo(
    () => ({
      totalStudents: metricsResult?.metrics?.totalStudents ?? 0,
      todaysClasses: metricsResult?.metrics?.todaysClasses ?? 0,
      pendingInvoicesCount: metricsResult?.metrics?.pendingInvoicesCount ?? 0,
      pendingInvoicesAmount: metricsResult?.metrics?.pendingInvoicesAmount ?? "0",
      performanceAvg: metricsResult?.metrics?.performanceAvg ?? 0,
      performanceAvgMobile: metricsResult?.metrics?.performanceAvgMobile ?? 0,
      pendingMessages: metricsResult?.metrics?.pendingMessages ?? 0,
    }),
    [metricsResult]
  );

  const studentProgress: readonly StudentProgressItem[] = useMemo(
    () =>
      (metricsResult?.studentProgress ?? []).map(s => ({
        id: s?.id ?? "",
        name: s?.name ?? "",
        completionPercent: s?.completionPercent ?? 0,
      })),
    [metricsResult]
  );

  const workshopPromo: WorkshopPromo | null = useMemo(() => {
    const wp = metricsResult?.workshopPromo;
    if (!wp) return null;
    return { title: wp.title ?? "", description: wp.description ?? "", imageUrl: wp.imageUrl ?? "" };
  }, [metricsResult]);

  const scheduleRows = useScheduleRows(scheduleData);
  const totalCount = scheduleData?.parentDashboardSchedule?.totalCount ?? 0;
  const labels = useDashboardLabels(t, userName);

  const handlers = useMemo(
    () => ({
      handleFilter: () => {
        router.push("/schedule");
      },
      handleViewFullWeek: () => {
        router.push("/schedule");
      },
      handleViewAll: () => {
        router.push("/schedule");
      },
      handleHistory: (id: string) => {
        router.push(studentProfileTabHref(id, "history"));
      },
      handleDownloadReport: () => {
        router.push("/reports");
      },
      handleLearnMore: () => {
        if (workshopPromo?.title) {
          router.push("/workshops");
        }
      },
      handleSupport: () => {
        router.push("/support");
      },
      handlePageChange: (newPage: number) => {
        setPage(newPage);
      },
    }),
    [router, workshopPromo, setPage]
  );

  if (totalCount !== useParentDashboardStore.getState().scheduleTotalCount) {
    setScheduleTotalCount(totalCount);
  }

  return (
    <ParentDashboardView
      userName={userName}
      metrics={metrics}
      scheduleRows={scheduleRows}
      studentProgress={studentProgress}
      workshopPromo={workshopPromo}
      schedulePagination={{
        page,
        pageSize,
        totalCount,
        onPageChange: handlers.handlePageChange,
      }}
      labels={labels}
      onFilter={handlers.handleFilter}
      onViewFullWeek={handlers.handleViewFullWeek}
      onViewAll={handlers.handleViewAll}
      onHistory={handlers.handleHistory}
      onDownloadReport={handlers.handleDownloadReport}
      onLearnMore={handlers.handleLearnMore}
      onSupport={handlers.handleSupport}
    />
  );
}
