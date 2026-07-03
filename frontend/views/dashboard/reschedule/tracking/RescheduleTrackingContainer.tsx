"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, type SxProps, type Theme } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, LeaveRequestStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  rescheduleTrackingMetricsQueryDocument,
  rescheduleTrackingRowsQueryDocument,
  updateSessionStatusLeaveMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { useRescheduleTrackingStore } from "@/frontend/stores/rescheduleTrackingStore";
import { exportRescheduleTracking } from "@/frontend/utils/excel-export/tracking-export";
import { logger } from "@/frontend/utils/logger";
import { useRouter } from "@/shared/i18n/routing";
import { RescheduleTrackingView } from "./RescheduleTrackingView";
import { buildTrackingMetrics, buildTrackingRows } from "./tracking.helpers";
import type { RescheduleTrackingViewLabels } from "./tracking.types";

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

function TrackingErrorState({ message }: { message: string }) {
  return <Box sx={errorSx}>{message}</Box>;
}

function buildViewLabels(t: ReturnType<typeof useTranslations>): RescheduleTrackingViewLabels {
  return {
    pageTitle: t("pageTitle"),
    sectionTitle: t("sectionTitle"),
    exportData: t("exportData"),
    filterAll: t("filterAll"),
    teacherName: t("table.teacherName"),
    studentName: t("table.studentClass"),
    scheduledDate: t("table.scheduledDate"),
    timeSlot: t("table.timeSlot"),
    classStatus: t("table.classStatus"),
    action: t("table.action"),
    newDate: t("badges.newDate"),
    leaveRequest: t("badges.leaveRequest"),
    rescheduled: t("status.rescheduled"),
    pendingLeave: t("status.pendingLeave"),
    viewDetails: t("actions.viewDetails"),
    approveLeave: t("actions.approveLeave"),
    rejectLeave: t("actions.rejectLeave"),
    showingOf: t.raw("showingOf") as string,
    noEntries: t("noEntries"),
    statusPending: t("status.pendingLeave"),
    statusRescheduled: t("status.rescheduled"),
    statusApproved: t("status.approved"),
    statusCancelled: t("status.cancelled"),
  };
}

function buildExportLabels(t: ReturnType<typeof useTranslations>) {
  return {
    pageTitle: t("pageTitle"),
    table: {
      teacher: t("table.teacherName"),
      student: t("table.studentClass"),
      scheduledDate: t("table.scheduledDate"),
      timeSlot: t("table.timeSlot"),
      status: t("table.classStatus"),
    },
    statusLabels: {
      [LeaveRequestStatus.Pending]: t("status.pendingLeave"),
      [LeaveRequestStatus.Rescheduled]: t("status.rescheduled"),
      [LeaveRequestStatus.Approved]: t("status.approved"),
      [LeaveRequestStatus.Cancelled]: t("status.cancelled"),
    },
  };
}

export function RescheduleTrackingContainer() {
  const t = useTranslations("dashboard.rescheduleTracking");
  const locale = useLocale();
  const router = useRouter();
  const { page, pageSize, setPage, statusFilter, setStatusFilter } = useRescheduleTrackingStore();

  const notifications = useNotifications();

  const [approveLeave] = useMutation(updateSessionStatusLeaveMutationDocument);

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

  const labels = useMemo(() => buildViewLabels(t), [t]);

  const handleApprove = useCallback(
    async (id: string) => {
      const row = rows.find(r => r.id === id);
      if (!row?.originalClassId) {
        notifications.show(t("errors.missingOriginalClassId"), { severity: "error", autoHideDuration: 4000 });
        return;
      }
      try {
        await approveLeave({
          variables: {
            classInstanceId: row.originalClassId,
            leaveReason: "Admin approved leave request",
          },
        });
        notifications.show(t("actions.approveSuccess"), { severity: "success", autoHideDuration: 4000 });
        await Promise.all([refetchRows(), refetchMetrics()]);
      } catch (err) {
        logger.error("Failed to approve leave request:", err);
        notifications.show(t("errors.approveFailed"), { severity: "error", autoHideDuration: 4000 });
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
        notifications.show(t("errors.missingOriginalClassId"), { severity: "error", autoHideDuration: 4000 });
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

  const handleFilterChange = useCallback(
    (status: LeaveRequestStatus | null) => {
      setStatusFilter(status);
    },
    [setStatusFilter]
  );

  if (rowsLoading || metricsLoading) {
    return <TrackingLoadingState />;
  }

  if (rowsError || metricsError) {
    logger.error("Error fetching reschedule tracking data:", rowsError || metricsError);
    return <TrackingErrorState message={t("loadFailed")} />;
  }

  const totalCount = rowsData?.rescheduleTrackingRows?.totalCount ?? 0;

  return (
    <RequirePermission permissions={[AppPermission.SessionReschedule]}>
      <RescheduleTrackingView
        metrics={metrics}
        rows={rows}
        labels={labels}
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
