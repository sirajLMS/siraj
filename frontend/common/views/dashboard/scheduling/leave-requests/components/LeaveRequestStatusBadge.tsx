"use client";

import {
  CancelOutlined,
  CheckCircleOutlined,
  EventBusyOutlined,
  HourglassEmptyOutlined,
  SwapHorizOutlined,
} from "@mui/icons-material";
import { Chip } from "@mui/material";
import type { ReactElement } from "react";
import type { LeaveRequestsViewModel } from "@/frontend/common/views/dashboard/scheduling/leave-requests/useLeaveRequestsViewModel";

export interface LeaveRequestStatusBadgeProps {
  readonly status: string;
  readonly labels: LeaveRequestsViewModel["labels"];
}

export function LeaveRequestStatusBadge({ status, labels }: Readonly<LeaveRequestStatusBadgeProps>) {
  const statusMap: Record<
    string,
    { label: string; color: "default" | "success" | "error" | "warning" | "info"; icon: ReactElement }
  > = {
    PENDING: { label: labels.statusBadge.pending, color: "warning", icon: <HourglassEmptyOutlined /> },
    APPROVED: { label: labels.statusBadge.approved, color: "success", icon: <CheckCircleOutlined /> },
    REJECTED: { label: labels.statusBadge.rejected, color: "error", icon: <CancelOutlined /> },
    RESCHEDULED: { label: labels.statusBadge.rescheduled, color: "info", icon: <SwapHorizOutlined /> },
    CANCELLED: { label: labels.statusBadge.cancelled, color: "default", icon: <EventBusyOutlined /> },
  };
  const entry = statusMap[status] ?? statusMap.PENDING;
  return (
    <Chip
      size="small"
      color={entry.color}
      variant="outlined"
      icon={entry.icon}
      label={entry.label}
      sx={{ borderRadius: 2 }}
    />
  );
}
