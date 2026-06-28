"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import {
  CancelOutlined,
  CheckCircleOutlineOutlined,
  EventBusyOutlined,
  EventRepeatOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import { Alert, Box, CircularProgress, Snackbar } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import type { RescheduleTrackingRow as GqlRescheduleTrackingRow } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  AppPermission,
  LeaveRequestStatus as GqlLeaveRequestStatus,
  RescheduleDateLabel as GqlRescheduleDateLabel,
} from "@/frontend/graphql/generated/gql/graphql-types";
import {
  rescheduleTrackingMetricsQueryDocument,
  rescheduleTrackingRowsQueryDocument,
  updateSessionStatusLeaveMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { useRescheduleTrackingStore } from "@/frontend/stores/rescheduleTrackingStore";
import { logger } from "@/frontend/utils/logger";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { useRouter } from "@/shared/i18n/routing";
import { RescheduleTrackingView } from "./RescheduleTrackingView";
import type { TrackingRow } from "./types";

type RawRow = GqlRescheduleTrackingRow;

type RawMetrics = {
  readonly pending?: number | null;
  readonly approved?: number | null;
  readonly leave?: number | null;
  readonly rescheduled?: number | null;
  readonly cancelled?: number | null;
};

function buildTrackingMetrics(rawMetrics: RawMetrics | null | undefined): MetricItem[] {
  return [
    {
      key: "pending",
      count: rawMetrics?.pending ?? 0,
      labelKey: "dashboard.rescheduleTracking.metrics.pendingRequests",
      icon: PendingActionsOutlined,
    },
    {
      key: "approved",
      count: rawMetrics?.approved ?? 0,
      labelKey: "dashboard.rescheduleTracking.metrics.approvedClasses",
      icon: CheckCircleOutlineOutlined,
    },
    {
      key: "leave",
      count: rawMetrics?.leave ?? 0,
      labelKey: "dashboard.rescheduleTracking.metrics.leaveRequests",
      icon: EventBusyOutlined,
    },
    {
      key: "rescheduled",
      count: rawMetrics?.rescheduled ?? 0,
      labelKey: "dashboard.rescheduleTracking.metrics.reScheduled",
      icon: EventRepeatOutlined,
      variant: "highlight",
    },
    {
      key: "cancelled",
      count: rawMetrics?.cancelled ?? 0,
      labelKey: "dashboard.rescheduleTracking.metrics.cancelled",
      icon: CancelOutlined,
      variant: "danger",
    },
  ];
}

function buildTrackingRows(rawRows: readonly RawRow[], locale: string): TrackingRow[] {
  return rawRows.map(r => {
    const start =
      r.scheduledStartAt && typeof r.scheduledStartAt === "string" ? new Date(r.scheduledStartAt) : new Date();
    const end = r.scheduledEndAt && typeof r.scheduledEndAt === "string" ? new Date(r.scheduledEndAt) : new Date();

    const initials = (r.teacherName ?? "")
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    const formattedDate = start.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const formatTime = (d: Date) =>
      d.toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    const timeSlot = `${formatTime(start)} - ${formatTime(end)}`;

    return {
      id: r.id ?? "",
      originalClassId: r.originalClassId ?? null,
      teacherName: r.teacherName ?? "",
      teacherId: r.teacherId ?? "",
      teacherInitials: initials || "T",
      teacherAvatarUrl: r.teacherAvatarUrl ?? undefined,
      studentName: r.studentName ?? "",
      scheduledDate: formattedDate,
      dateLabel:
        r.dateLabel === GqlRescheduleDateLabel.LeaveRequest
          ? GqlRescheduleDateLabel.LeaveRequest
          : GqlRescheduleDateLabel.NewDate,
      timeSlot,
      status: r.status ?? GqlLeaveRequestStatus.Pending,
    };
  });
}

function handleExportData(rows: readonly TrackingRow[]) {
  try {
    const headers = ["Teacher", "Student", "Scheduled Date", "Time Slot", "Status"];
    const csvRows = rows.map(r => [r.teacherName, r.studentName, r.scheduledDate, r.timeSlot, r.status]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reschedule_tracking.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    logger.error("Failed to export reschedule tracking data:", err);
  }
}

export function RescheduleTrackingContainer() {
  const t = useTranslations("dashboard.rescheduleTracking");
  const locale = useLocale();
  const router = useRouter();
  const { page, pageSize, setPage, statusFilter, setStatusFilter } = useRescheduleTrackingStore();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

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

  const labels = {
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

  const handleApprove = async (id: string) => {
    const row = rows.find(r => r.id === id);
    if (!row?.originalClassId) {
      setSnackbarMessage(t("errors.missingOriginalClassId"));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      await approveLeave({
        variables: {
          classInstanceId: row.originalClassId,
          leaveReason: "Admin approved leave request",
        },
      });
      setSnackbarMessage(t("actions.approveSuccess"));
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      await Promise.all([refetchRows(), refetchMetrics()]);
    } catch (err) {
      logger.error("Failed to approve leave request:", err);
      setSnackbarMessage(t("errors.approveFailed"));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleReject = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (row?.originalClassId) {
      router.push(`/classes/${row.originalClassId}`);
    } else {
      setSnackbarMessage(t("errors.missingOriginalClassId"));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleView = (id: string) => {
    router.push(`/classes/${id}`);
  };

  const handleExport = () => {
    handleExportData(rows);
  };

  const handleFilterChange = (status: GqlLeaveRequestStatus | null) => {
    setStatusFilter(status);
  };

  if (rowsLoading || metricsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (rowsError || metricsError) {
    logger.error("Error fetching reschedule tracking data:", rowsError || metricsError);
    return <Box sx={{ p: 3, textAlign: "center" }}>Failed to load tracking data.</Box>;
  }

  const metrics = buildTrackingMetrics(metricsData?.rescheduleTrackingMetrics);

  const rows = buildTrackingRows(rowsData?.rescheduleTrackingRows?.rows ?? [], locale);

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
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </RequirePermission>
  );
}
