"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useMemo } from "react";
import { LeaveRequestStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  rescheduleTrackingMetricsQueryDocument,
  rescheduleTrackingRowsQueryDocument,
  updateSessionStatusLeaveMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useRescheduleTrackingStore } from "@/frontend/common/stores/rescheduleTrackingStore";
import { exportRescheduleTracking } from "@/frontend/common/utils/excel-export/tracking-export";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildTrackingMetrics,
  buildTrackingRows,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.helpers";
import type { RescheduleTrackingViewLabels } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { RescheduleTrackingLabels } from "@/shared/locale/types/dashboard/classes/rescheduleTracking";

interface RescheduleTrackingViewModel {
  readonly metrics: readonly ReturnType<typeof buildTrackingMetrics>[number][];
  readonly rows: readonly ReturnType<typeof buildTrackingRows>[number][];
  readonly labels: RescheduleTrackingViewLabels;
  readonly loading: boolean;
  readonly totalCount: number | undefined;
  readonly page: number;
  readonly pageSize: number;
  readonly statusFilter: LeaveRequestStatus | null;
  readonly onApprove: (id: string) => void;
  readonly onReject: (id: string) => void;
  readonly onView: (id: string) => void;
  readonly onExport: () => void;
  readonly onFilterChange: (status: LeaveRequestStatus | null) => void;
  readonly onPageChange: (page: number) => void;
}

interface UseRescheduleTrackingViewModelProps {
  readonly page?: number;
  readonly pageSize?: number;
}

export function useRescheduleTrackingViewModel(): RescheduleTrackingViewModel {
  const t = useAppTranslation(Translation.Dashboard.RescheduleTracking);
  const locale = useAppLocale();
  const router = useRouter();
  const notifications = useNotifications();

  const page = useRescheduleTrackingStore(state => state.page);
  const pageSize = useRescheduleTrackingStore(state => state.pageSize);
  const statusFilter = useRescheduleTrackingStore(state => state.statusFilter);
  const setStatusFilter = useRescheduleTrackingStore(state => state.setStatusFilter);

  const { rows, metrics, totalCount, rowsLoading, metricsLoading, refetchRows, refetchMetrics } = useTrackingQueries(
    statusFilter,
    pageSize,
    page,
    locale
  );

  const labels = useMemo(() => buildViewLabels(t), [t]);

  const { handleApprove, handleReject, handleView, handleExport } = useTrackingHandlers(
    rows,
    t,
    router,
    notifications,
    refetchRows,
    refetchMetrics
  );

  const handleFilterChange = useCallback(
    (status: LeaveRequestStatus | null) => {
      setStatusFilter(status);
    },
    [setStatusFilter]
  );

  const loading = (rowsLoading && !rows) || (metricsLoading && !metrics);

  return {
    metrics,
    rows,
    labels,
    loading,
    totalCount,
    page,
    pageSize,
    statusFilter,
    onApprove: handleApprove,
    onReject: handleReject,
    onView: handleView,
    onExport: handleExport,
    onFilterChange: handleFilterChange,
    onPageChange: (newPage: number) => {
      useRescheduleTrackingStore.getState().setPage(newPage);
    },
  };
}

function useTrackingQueries(statusFilter: LeaveRequestStatus | null, pageSize: number, page: number, locale: string) {
  const {
    data: rowsData,
    loading: rowsLoading,
    refetch: refetchRows,
  } = useQuery(rescheduleTrackingRowsQueryDocument, {
    variables: {
      search: null,
      status: statusFilter,
      paginationArgs: {
        first: pageSize,
        page: page + 1,
        skip: null,
        after: null,
        before: null,
        last: null,
        maxCount: null,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: metricsData,
    loading: metricsLoading,
    refetch: refetchMetrics,
  } = useQuery(rescheduleTrackingMetricsQueryDocument);

  const metrics = useMemo(
    () => buildTrackingMetrics(metricsData?.rescheduleTrackingMetrics),
    [metricsData?.rescheduleTrackingMetrics]
  );

  const rows = useMemo(
    () => buildTrackingRows(rowsData?.rescheduleTrackingRows?.rows ?? [], locale),
    [rowsData?.rescheduleTrackingRows?.rows, locale]
  );

  const totalCount = rowsData ? (rowsData.rescheduleTrackingRows?.totalCount ?? 0) : undefined;

  return {
    rows,
    metrics,
    totalCount,
    rowsLoading,
    metricsLoading,
    refetchRows,
    refetchMetrics,
  };
}

function useTrackingHandlers(
  rows: readonly ReturnType<typeof buildTrackingRows>[number][],
  t: RescheduleTrackingLabels,
  router: ReturnType<typeof useRouter>,
  notifications: ReturnType<typeof useNotifications>,
  refetchRows: () => unknown,
  refetchMetrics: () => unknown
) {
  const [approveLeave] = useMutation(updateSessionStatusLeaveMutationDocument);

  const handleApprove = useCallback(
    async (id: string) => {
      const row = rows.find(r => r.id === id);
      if (!row?.originalClassId) {
        notifications.show(t.errors.missingOriginalClassId, { severity: "error", autoHideDuration: 4000 });
        return;
      }
      try {
        await approveLeave({
          variables: {
            classInstanceId: row.originalClassId,
            leaveReason: t.actions.approveLeave,
          },
        });
        notifications.show(t.actions.approveSuccess, { severity: "success", autoHideDuration: 4000 });
        await Promise.all([refetchRows(), refetchMetrics()]);
      } catch (err) {
        logger.error("Failed to approve leave request:", err);
        notifications.show(t.errors.approveFailed, { severity: "error", autoHideDuration: 4000 });
      }
    },
    [rows, approveLeave, notifications, t, refetchRows, refetchMetrics]
  );

  const handleReject = useCallback(
    (id: string) => {
      const row = rows.find(r => r.id === id);
      if (row?.originalClassId) {
        router.push(`/classes/${row.originalClassId}`);
      } else {
        notifications.show(t.errors.missingOriginalClassId, { severity: "error", autoHideDuration: 4000 });
      }
    },
    [rows, router, notifications, t]
  );

  const handleView = useCallback(
    (id: string) => {
      router.push(`/classes/${id}`);
    },
    [router]
  );

  const handleExport = useCallback(() => {
    exportRescheduleTracking({ rows, labels: buildExportLabels(t) }).catch((err: unknown) => {
      logger.error("Excel export failed", err);
    });
  }, [rows, t]);

  return { handleApprove, handleReject, handleView, handleExport };
}

function buildViewLabels(t: RescheduleTrackingLabels): RescheduleTrackingViewLabels {
  return {
    pageTitle: t.pageTitle,
    sectionTitle: t.sectionTitle,
    exportData: t.exportData,
    filterAll: t.filterAll,
    teacherName: t.table.teacherName,
    studentName: t.table.studentClass,
    scheduledDate: t.table.scheduledDate,
    timeSlot: t.table.timeSlot,
    classStatus: t.table.classStatus,
    action: t.table.action,
    newDate: t.badges.newDate,
    leaveRequest: t.badges.leaveRequest,
    rescheduled: t.status.rescheduled,
    pendingLeave: t.status.pendingLeave,
    viewDetails: t.actions.viewDetails,
    approveLeave: t.actions.approveLeave,
    rejectLeave: t.actions.rejectLeave,
    showingOf: t.showingOf as unknown as string,
    noEntries: t.noEntries,
    statusPending: t.status.pendingLeave,
    statusRescheduled: t.status.rescheduled,
    statusApproved: t.status.approved,
    statusCancelled: t.status.cancelled,
  };
}

function buildExportLabels(t: RescheduleTrackingLabels) {
  return {
    pageTitle: t.pageTitle,
    table: {
      teacher: t.table.teacherName,
      student: t.table.studentClass,
      scheduledDate: t.table.scheduledDate,
      timeSlot: t.table.timeSlot,
      status: t.table.classStatus,
    },
    statusLabels: {
      [LeaveRequestStatus.Pending]: t.status.pendingLeave,
      [LeaveRequestStatus.Rescheduled]: t.status.rescheduled,
      [LeaveRequestStatus.Approved]: t.status.approved,
      [LeaveRequestStatus.Cancelled]: t.status.cancelled,
    },
  };
}

export type { RescheduleTrackingViewModel, UseRescheduleTrackingViewModelProps };
