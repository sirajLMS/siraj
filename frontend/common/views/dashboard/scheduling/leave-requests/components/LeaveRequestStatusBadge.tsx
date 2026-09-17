"use client";

import { StatusBadge } from "@/frontend/common/components/ui";
import type { LeaveRequestsViewModel } from "@/frontend/common/views/dashboard/scheduling/leave-requests/useLeaveRequestsViewModel";

export interface LeaveRequestStatusBadgeProps {
  readonly status: string;
  readonly labels: LeaveRequestsViewModel["labels"];
}

export function LeaveRequestStatusBadge({ status, labels }: Readonly<LeaveRequestStatusBadgeProps>) {
  const labelMap: Record<string, string> = {
    PENDING: labels.statusBadge.pending,
    APPROVED: labels.statusBadge.approved,
    REJECTED: labels.statusBadge.rejected,
    RESCHEDULED: labels.statusBadge.rescheduled,
    CANCELLED: labels.statusBadge.cancelled,
  };
  return (
    <StatusBadge category="requestStatus" status={status} label={labelMap[status] ?? labels.statusBadge.pending} />
  );
}
