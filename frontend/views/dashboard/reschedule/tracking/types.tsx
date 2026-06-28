import type { SvgIconComponent } from "@mui/icons-material";
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
import type {
  LeaveRequestStatus as GqlLeaveRequestStatus,
  RescheduleTrackingRow,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { LeaveRequestStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";


export type TrackingRow = Readonly<
  Omit<RescheduleTrackingRow, "__typename">
> & {
  readonly teacherInitials: string;
  readonly scheduledDate: string;
  readonly timeSlot: string;
};

export interface TrackingStatusLabelMap {
  readonly statusPending: string;
  readonly statusRescheduled: string;
  readonly statusApproved: string;
  readonly statusCancelled: string;
}

export function getTrackingStatusLabel(
  status: GqlLeaveRequestStatus | "",
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

export function getTrackingStatusIcon(status: GqlLeaveRequestStatus, sx?: object): ReactNode {
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

export interface MetricDefinition {
  readonly key: string;
  readonly labelKey: string;
  readonly icon: SvgIconComponent;
  readonly variant?: MetricItem["variant"];
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
