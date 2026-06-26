"use client";

import { useQuery } from "@apollo/client/react";
import {
  CancelOutlined,
  CheckCircleOutlineOutlined,
  EventBusyOutlined,
  EventRepeatOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import { Box, CircularProgress } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  rescheduleTrackingMetricsQueryDocument,
  rescheduleTrackingRowsQueryDocument,
} from "@/frontend/graphql/sharedDocuments";
import { useRescheduleTrackingStore } from "@/frontend/stores/rescheduleTrackingStore";
import { logger } from "@/frontend/utils/logger";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { useRouter } from "@/shared/i18n/routing";
import { RescheduleTrackingView } from "./RescheduleTrackingView";
import type { TrackingRow } from "./types";

type RawRow = {
  readonly id?: string | null;
  readonly teacherName?: string | null;
  readonly teacherId?: string | null;
  readonly teacherAvatarUrl?: string | null;
  readonly studentName?: string | null;
  readonly scheduledStartAt?: unknown;
  readonly scheduledEndAt?: unknown;
  readonly dateLabel?: string | null;
  readonly status?: string | null;
};

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
      teacherName: r.teacherName ?? "",
      teacherId: r.teacherId ?? "",
      teacherInitials: initials || "T",
      teacherAvatarUrl: r.teacherAvatarUrl ?? undefined,
      studentClass: r.studentName ?? "",
      scheduledDate: formattedDate,
      dateLabel: r.dateLabel === "leave_request" ? ("leave_request" as const) : ("new_date" as const),
      timeSlot,
      status: r.status === "pending_leave" ? ("pending_leave" as const) : ("rescheduled" as const),
    };
  });
}

function handleExportData(rows: readonly TrackingRow[]) {
  try {
    const headers = ["Teacher", "Student", "Scheduled Date", "Time Slot", "Status"];
    const csvRows = rows.map(r => [r.teacherName, r.studentClass, r.scheduledDate, r.timeSlot, r.status]);
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
  const { page, pageSize, setPage } = useRescheduleTrackingStore();

  const {
    data: rowsData,
    loading: rowsLoading,
    error: rowsError,
  } = useQuery(rescheduleTrackingRowsQueryDocument, {
    variables: {
      search: null,
      status: null,
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
  } = useQuery(rescheduleTrackingMetricsQueryDocument);

  // Build labels object from translations
  const labels = {
    pageTitle: t("pageTitle"),
    sectionTitle: t("sectionTitle"),
    exportData: t("exportData"),
    filter: t("filter"),
    teacherName: t("table.teacherName"),
    studentClass: t("table.studentClass"),
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
  };

  const handleApprove = (id: string) => {
    logger.info("Approve leave request (auto-approved by system):", id);
  };

  const handleReject = (id: string) => {
    logger.info("Reject leave request (auto-approved by system):", id);
  };

  const handleView = (id: string) => {
    router.push(`/${locale}/classes/${id}`);
  };

  const handleExport = () => {
    handleExportData(rows);
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

  // Map backend metrics to dashboard MetricItem format
  const metrics = buildTrackingMetrics(metricsData?.rescheduleTrackingMetrics);

  // Map database rows to TrackingRow format
  const rows = buildTrackingRows(rowsData?.rescheduleTrackingRows?.rows ?? [], locale);

  const totalCount = rowsData?.rescheduleTrackingRows?.totalCount ?? 0;

  return (
    <RequirePermission permissions={[AppPermission.SessionReschedule]}>
      <RescheduleTrackingView
        metrics={metrics}
        rows={rows}
        totalItems={totalCount}
        labels={labels}
        onApprove={handleApprove}
        onReject={handleReject}
        onView={handleView}
        onExport={handleExport}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
      />
    </RequirePermission>
  );
}
