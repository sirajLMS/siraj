import type { LeaveRequestStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  RescheduleTrackingDataGridLabels,
  RescheduleTrackingViewLabels,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";

export function buildTrackingTableLabels(labels: RescheduleTrackingViewLabels): RescheduleTrackingDataGridLabels {
  return {
    newDate: labels.newDate,
    leaveRequest: labels.leaveRequest,
    rescheduled: labels.rescheduled,
    pendingLeave: labels.pendingLeave,
    viewDetails: labels.viewDetails,
    approveLeave: labels.approveLeave,
    rejectLeave: labels.rejectLeave,
    noEntries: labels.noEntries,
    statusPending: labels.statusPending,
    statusRescheduled: labels.statusRescheduled,
    statusApproved: labels.statusApproved,
    statusCancelled: labels.statusCancelled,
  };
}

export function buildTrackingTableHeaders(labels: RescheduleTrackingViewLabels) {
  return {
    teacherName: labels.teacherName,
    studentName: labels.studentName,
    scheduledDate: labels.scheduledDate,
    timeSlot: labels.timeSlot,
    classStatus: labels.classStatus,
    action: labels.action,
  };
}

export interface TrackingFilterSelectProps {
  readonly statusFilter: LeaveRequestStatus | null;
  readonly onFilterChange: (status: LeaveRequestStatus | null) => void;
  readonly labels: RescheduleTrackingViewLabels;
}
