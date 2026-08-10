"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import {
  BookingStatus,
  ClassExecutionState,
  ClassOutcome,
  type EffectiveMeeting,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import {
  parentDashboardMetricsQueryDocument,
  parentDashboardScheduleQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useParentDashboardStore } from "@/frontend/common/stores/parentDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type {
  ParentDashboardMetrics,
  ParentScheduleRow,
  StudentProgressItem,
  WorkshopPromo,
} from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import { useRouter } from "@/shared/i18n/navigation";
import { type ParentDashboardLabels, Translation, useAppTranslation } from "@/shared/locale";

export interface SchedulePagination {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
}

export interface ParentDashboardViewModel {
  readonly userName: string;
  readonly metrics: ParentDashboardMetrics;
  readonly scheduleRows: readonly ParentScheduleRow[];
  readonly studentProgress: readonly StudentProgressItem[];
  readonly workshopPromo: WorkshopPromo | null;
  readonly schedulePagination?: SchedulePagination;
  readonly labels: ParentDashboardLabels;
  readonly onFilter: () => void;
  readonly onViewFullWeek: () => void;
  readonly onViewAll: () => void;
  readonly onHistory: (id: string) => void;
  readonly onDownloadReport: () => void;
  readonly onLearnMore: () => void;
  readonly onSupport: () => void;
  // --- derived presenter values ----------------------------------------------
  readonly pageCount: number;
}

export type UseParentDashboardViewModelProps = Record<string, never>;

function mapExecutionStateToLiveClassStatus(
  executionState: string,
  outcome: string
): "starting_soon" | "pending" | "scheduled" {
  if (executionState === "ACTIVATED") return "starting_soon";
  if (outcome === "PENDING") return "pending";
  return "scheduled";
}

function resolveMeetingJoinUrl(effectiveMeeting?: EffectiveMeeting | null): string | null {
  const fromEffective = effectiveMeeting?.joinUrl?.trim();
  return fromEffective || null;
}

type ScheduleQueryData = Operations.ParentDashboardScheduleQuery;

function useScheduleRows(data: ScheduleQueryData | undefined): readonly ParentScheduleRow[] {
  return useMemo(() => {
    const rows = data?.parentDashboardSchedule?.rows;
    if (!rows) return [];
    return rows.map(r => {
      const joinUrl = resolveMeetingJoinUrl(r.effectiveMeeting);
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
        bookingStatus: r.bookingStatus === BookingStatus.Rescheduled ? "rescheduled" : "confirmed",
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

type MetricsResult = Operations.ParentDashboardMetricsQuery_parentDashboardMetrics_ParentDashboardMetricsResult;

function useParentDashboardMetrics(metricsResult: MetricsResult | null | undefined): {
  readonly metrics: ParentDashboardMetrics;
  readonly studentProgress: readonly StudentProgressItem[];
  readonly workshopPromo: WorkshopPromo | null;
} {
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

  return { metrics, studentProgress, workshopPromo };
}

function useParentDashboardHandlers(
  router: ReturnType<typeof useRouter>,
  workshopPromo: WorkshopPromo | null,
  setPage: (page: number) => void
) {
  return useMemo(
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
}

function useScheduleTotalCountSync(totalCount: number, setScheduleTotalCount: (count: number) => void) {
  useMemo(() => {
    if (totalCount !== useParentDashboardStore.getState().scheduleTotalCount) {
      setScheduleTotalCount(totalCount);
    }
  }, [totalCount, setScheduleTotalCount]);
}

function useSchedulePagination(
  page: number,
  pageSize: number,
  totalCount: number,
  handlePageChange: (page: number) => void
): SchedulePagination {
  return useMemo<SchedulePagination>(
    () => ({
      page,
      pageSize,
      totalCount,
      onPageChange: handlePageChange,
    }),
    [page, pageSize, totalCount, handlePageChange]
  );
}

function useTodayIso(): string {
  return useMemo(() => new Date().toISOString().split("T")[0], []);
}

function usePaginationArgs(page: number, pageSize: number) {
  return useMemo(
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
}

export function useParentDashboardViewModel(_props: UseParentDashboardViewModelProps): ParentDashboardViewModel {
  const t = useAppTranslation(Translation.Dashboard.CoreParentDashboard);
  const router = useRouter();
  const userName = useUserStore(state => state.name);
  const page = useParentDashboardStore(state => state.page);
  const pageSize = useParentDashboardStore(state => state.pageSize);
  const setPage = useParentDashboardStore(state => state.setPage);
  const setScheduleTotalCount = useParentDashboardStore(state => state.setScheduleTotalCount);

  const paginationArgs = usePaginationArgs(page, pageSize);
  const today = useTodayIso();

  const { data: scheduleData } = useQuery(parentDashboardScheduleQueryDocument, {
    variables: { date: today, search: null, paginationArgs },
    fetchPolicy: "cache-and-network",
  });

  const { data: metricsData } = useQuery(parentDashboardMetricsQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const { metrics, studentProgress, workshopPromo } = useParentDashboardMetrics(metricsData?.parentDashboardMetrics);

  const scheduleRows = useScheduleRows(scheduleData);
  const totalCount = scheduleData?.parentDashboardSchedule?.totalCount ?? 0;
  const labels = useDashboardLabels(t, userName);
  const handlers = useParentDashboardHandlers(router, workshopPromo, setPage);

  useScheduleTotalCountSync(totalCount, setScheduleTotalCount);

  const schedulePagination = useSchedulePagination(page, pageSize, totalCount, handlers.handlePageChange);

  const pageCount =
    schedulePagination.pageSize > 0
      ? Math.max(1, Math.ceil(schedulePagination.totalCount / schedulePagination.pageSize))
      : 0;

  return {
    userName,
    metrics,
    scheduleRows,
    studentProgress,
    workshopPromo,
    schedulePagination,
    labels,
    onFilter: handlers.handleFilter,
    onViewFullWeek: handlers.handleViewFullWeek,
    onViewAll: handlers.handleViewAll,
    onHistory: handlers.handleHistory,
    onDownloadReport: handlers.handleDownloadReport,
    onLearnMore: handlers.handleLearnMore,
    onSupport: handlers.handleSupport,
    pageCount,
  };
}
