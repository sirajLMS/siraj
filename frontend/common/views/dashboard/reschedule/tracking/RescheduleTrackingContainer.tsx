"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, type SxProps, type Theme } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useLocale } from "next-intl";
import { useCallback, useMemo } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission, LeaveRequestStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  rescheduleTrackingMetricsQueryDocument,
  rescheduleTrackingRowsQueryDocument,
  updateSessionStatusLeaveMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useRescheduleTrackingStore } from "@/frontend/common/stores/rescheduleTrackingStore";
import { exportRescheduleTracking } from "@/frontend/common/utils/excel-export/tracking-export";
import { logger } from "@/frontend/common/utils/logger";
import { RescheduleTrackingView } from "@/frontend/common/views/dashboard/reschedule/tracking/RescheduleTrackingView";
import {
  buildTrackingMetrics,
  buildTrackingRows,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.helpers";
import type { RescheduleTrackingViewLabels } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale/client";
import type { RescheduleTrackingLabels } from "@/shared/locale/types/dashboard/classes/rescheduleTracking";

const loadingSx: SxProps<Theme> = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "50vh",
};

const errorSx: SxProps<Theme> = { p: 3, textAlign: "center" };

function TrackingLoadingState() {
  return (
    <Box sx={loadingSx}>
      <CircularProgress />
    </Box>
  );
}

function TrackingErrorState({ message }: Readonly<{ message: string }>) {
  return <Box sx={errorSx}>{message}</Box>;
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

function useTrackingQueries(statusFilter: LeaveRequestStatus | null, pageSize: number, page: number, locale: string) {
  const {
    data: rowsData,
    loading: rowsLoading,
    error: rowsError,
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
    error: metricsError,
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
    rowsError,
    metricsError,
    refetchRows,
    refetchMetrics,
    rowsData,
    metricsData,
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

export function RescheduleTrackingContainer() {
  const t = useAppTranslation("dashboard.rescheduleTracking");
  const locale = useLocale();
  const router = useRouter();
  const { page, pageSize, setPage, statusFilter, setStatusFilter } = useRescheduleTrackingStore();

  const notifications = useNotifications();
  const labels = useMemo(() => buildViewLabels(t), [t]);

  const {
    rows,
    metrics,
    totalCount,
    rowsLoading,
    metricsLoading,
    rowsError,
    metricsError,
    refetchRows,
    refetchMetrics,
    rowsData,
    metricsData,
  } = useTrackingQueries(statusFilter, pageSize, page, locale);

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

  if ((rowsLoading && !rowsData) || (metricsLoading && !metricsData)) {
    return <TrackingLoadingState />;
  }

  if (rowsError || metricsError) {
    logger.error("Error fetching reschedule tracking data:", rowsError || metricsError);
    return <TrackingErrorState message={t.loadFailed} />;
  }

  return (
    <RequirePermission permissions={[AppPermission.SessionReschedule]}>
      <RescheduleTrackingView
        metrics={metrics}
        rows={rows}
        labels={labels}
        loading={rowsLoading}
        onApprove={handleApprove}
        onReject={handleReject}
        onView={handleView}
        onExport={handleExport}
        onFilterChange={handleFilterChange}
        statusFilter={statusFilter}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
      />
    </RequirePermission>
  );
}
