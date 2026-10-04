import { useEffect, useMemo } from "react";
import type { ParentDashboardScheduleQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { useParentDashboardStore } from "@/frontend/common/stores/parentDashboardStore";
import { studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type {
  ParentScheduleRow,
  StudentProgressItem,
  WorkshopPromo,
} from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import {
  buildMetrics,
  buildPaginationArgs,
  buildScheduleRow,
  buildStudentProgress,
  buildWorkshopPromo,
  type MetricsResult,
  type SchedulePagination,
} from "@/frontend/common/views/dashboard/parent/dashboard/useParentDashboardViewModel.helpers";
import type { useRouter } from "@/shared/i18n/navigation";
import type { ParentDashboardLabels } from "@/shared/locale";

type ScheduleQueryData = ParentDashboardScheduleQuery;

export function useScheduleRows(data: ScheduleQueryData | undefined): readonly ParentScheduleRow[] {
  return useMemo(() => {
    const rows = data?.parentDashboardSchedule?.rows;
    if (!rows) return [];
    return rows.map(buildScheduleRow);
  }, [data]);
}

export function useDashboardLabels(t: ParentDashboardLabels, _userName: string): ParentDashboardLabels {
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

export function useParentDashboardMetrics(metricsResult: MetricsResult | null | undefined): {
  readonly metrics: ReturnType<typeof buildMetrics>;
  readonly studentProgress: readonly StudentProgressItem[];
  readonly workshopPromo: WorkshopPromo | null;
} {
  const metrics = useMemo(() => buildMetrics(metricsResult), [metricsResult]);
  const studentProgress = useMemo(() => buildStudentProgress(metricsResult), [metricsResult]);
  const workshopPromo = useMemo(() => buildWorkshopPromo(metricsResult), [metricsResult]);

  return { metrics, studentProgress, workshopPromo };
}

export function useParentDashboardHandlers(
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

export function useScheduleTotalCountSync(totalCount: number, setScheduleTotalCount: (count: number) => void): void {
  useEffect(() => {
    if (totalCount !== useParentDashboardStore.getState().scheduleTotalCount) {
      setScheduleTotalCount(totalCount);
    }
  }, [totalCount, setScheduleTotalCount]);
}

export function useSchedulePagination(
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

export function useTodayIso(): string {
  return useMemo(() => new Date().toISOString().split("T")[0], []);
}

export function usePaginationArgs(page: number, pageSize: number) {
  return useMemo(() => buildPaginationArgs(page, pageSize), [page, pageSize]);
}
