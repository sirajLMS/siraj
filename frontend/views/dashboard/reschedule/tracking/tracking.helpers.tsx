import {
  CancelOutlined,
  CheckCircleOutlineOutlined,
  EventBusyOutlined,
  EventRepeatOutlined,
  HistoryOutlined,
  PendingActionsOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import type { ReactNode } from "react";
import type { RescheduleTrackingRow } from "@/frontend/graphql/generated/gql/graphql-types";
import { LeaveRequestStatus, RescheduleDateLabel } from "@/frontend/graphql/generated/gql/graphql-types";
import type { MetricDefinition, RawMetrics, TrackingRow, TrackingStatusLabelMap } from "./tracking.types";

export function getTrackingStatusLabel(
  status: LeaveRequestStatus | "",
  labels: TrackingStatusLabelMap & { readonly filterAll: string }
): string {
  switch (status) {
    case LeaveRequestStatus.Pending:
      return labels.statusPending;
    case LeaveRequestStatus.Rescheduled:
      return labels.statusRescheduled;
    case LeaveRequestStatus.Approved:
      return labels.statusApproved;
    case LeaveRequestStatus.Cancelled:
      return labels.statusCancelled;
    default:
      return labels.filterAll;
  }
}

export function getTrackingStatusIcon(status: LeaveRequestStatus, sx?: object): ReactNode {
  switch (status) {
    case LeaveRequestStatus.Rescheduled:
      return <HistoryOutlined sx={sx} />;
    case LeaveRequestStatus.Approved:
      return <CheckCircleOutlineOutlined sx={sx} />;
    case LeaveRequestStatus.Cancelled:
      return <CancelOutlined sx={sx} />;
    default:
      return <WarningAmberOutlined sx={sx} />;
  }
}

export const TRACKING_METRIC_DEFINITIONS: readonly MetricDefinition[] = [
  { key: "pending", labelKey: "dashboard.rescheduleTracking.metrics.pendingRequests", icon: PendingActionsOutlined },
  {
    key: "approved",
    labelKey: "dashboard.rescheduleTracking.metrics.approvedClasses",
    icon: CheckCircleOutlineOutlined,
  },
  { key: "leave", labelKey: "dashboard.rescheduleTracking.metrics.leaveRequests", icon: EventBusyOutlined },
  {
    key: "rescheduled",
    labelKey: "dashboard.rescheduleTracking.metrics.reScheduled",
    icon: EventRepeatOutlined,
    variant: "highlight",
  },
  {
    key: "cancelled",
    labelKey: "dashboard.rescheduleTracking.metrics.cancelled",
    icon: CancelOutlined,
    variant: "danger",
  },
] as const;

export function buildTrackingMetrics(rawMetrics: RawMetrics | null | undefined) {
  const counts: Record<string, number | null | undefined> = {
    pending: rawMetrics?.pending,
    approved: rawMetrics?.approved,
    leave: rawMetrics?.leave,
    rescheduled: rawMetrics?.rescheduled,
    cancelled: rawMetrics?.cancelled,
  };
  return TRACKING_METRIC_DEFINITIONS.map(def => ({
    key: def.key,
    count: counts[def.key] ?? 0,
    labelKey: def.labelKey,
    icon: def.icon,
    ...(def.variant ? { variant: def.variant } : {}),
  }));
}

export function buildTrackingRows(rawRows: readonly RescheduleTrackingRow[], locale: string): TrackingRow[] {
  return rawRows.map(r => {
    const start =
      r.scheduledStartAt && typeof r.scheduledStartAt === "string" ? new Date(r.scheduledStartAt) : undefined;
    const end = r.scheduledEndAt && typeof r.scheduledEndAt === "string" ? new Date(r.scheduledEndAt) : undefined;

    const initials = (r.teacherName ?? "")
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    const formatDate = (d: Date) =>
      d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
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

    const scheduledDate = start ? formatDate(start) : "";
    const timeSlot = start && end ? `${formatTime(start)} - ${formatTime(end)}` : "";

    return {
      id: r.id ?? "",
      originalClassId: r.originalClassId ?? null,
      remarks: r.remarks ?? null,
      scheduledStartAt: r.scheduledStartAt ?? null,
      scheduledEndAt: r.scheduledEndAt ?? null,
      teacherName: r.teacherName ?? "",
      teacherId: r.teacherId ?? "",
      teacherInitials: initials || "T",
      teacherAvatarUrl: r.teacherAvatarUrl ?? null,
      studentId: r.studentId ?? null,
      studentName: r.studentName ?? "",
      scheduledDate,
      dateLabel:
        r.dateLabel === RescheduleDateLabel.LeaveRequest
          ? RescheduleDateLabel.LeaveRequest
          : RescheduleDateLabel.NewDate,
      timeSlot,
      status: r.status ?? null,
    };
  });
}
