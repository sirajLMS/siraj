import { LeaveRequestStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { RescheduleTrackingViewLabels } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import type { RescheduleTrackingLabels } from "@/shared/locale/types/dashboard/classes/rescheduleTracking";

export function buildViewLabels(t: RescheduleTrackingLabels): RescheduleTrackingViewLabels {
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
    showingOf: t.showingOf(0, 0),
    noEntries: t.noEntries,
    statusPending: t.status.pendingLeave,
    statusRescheduled: t.status.rescheduled,
    statusApproved: t.status.approved,
    statusCancelled: t.status.cancelled,
  };
}

export function buildExportLabels(t: RescheduleTrackingLabels) {
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
