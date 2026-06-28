import {
  CancelOutlined,
  CheckCircleOutlineOutlined,
  EventBusyOutlined,
  EventRepeatOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import type { Meta, StoryObj } from "@storybook/react";
import {
  LeaveRequestStatus as GqlLeaveRequestStatus,
  RescheduleDateLabel as GqlRescheduleDateLabel,
} from "@/frontend/graphql/generated/gql/graphql-types";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { RescheduleTrackingView } from "./RescheduleTrackingView";
import type { TrackingRow } from "./types";

const MOCK_METRICS: MetricItem[] = [
  {
    key: "pending",
    count: 24,
    labelKey: "dashboard.rescheduleTracking.metrics.pendingRequests",
    icon: PendingActionsOutlined,
  },
  {
    key: "approved",
    count: 156,
    labelKey: "dashboard.rescheduleTracking.metrics.approvedClasses",
    icon: CheckCircleOutlineOutlined,
  },
  {
    key: "leave",
    count: 8,
    labelKey: "dashboard.rescheduleTracking.metrics.leaveRequests",
    icon: EventBusyOutlined,
  },
  {
    key: "rescheduled",
    count: 12,
    labelKey: "dashboard.rescheduleTracking.metrics.reScheduled",
    icon: EventRepeatOutlined,
    variant: "highlight",
  },
  {
    key: "cancelled",
    count: 3,
    labelKey: "dashboard.rescheduleTracking.metrics.cancelled",
    icon: CancelOutlined,
    variant: "danger",
  },
];

const MOCK_ROWS: TrackingRow[] = [
  {
    id: "1",
    originalClassId: "orig-1",
    teacherName: "Mohammad Al-Farsi",
    teacherId: "T-10293",
    teacherInitials: "MA",
    teacherAvatarUrl: "/demo/avatars/01.png",
    studentName: "Grade 10 - Advanced Arabic",
    scheduledDate: "Oct 24, 2023",
    dateLabel: GqlRescheduleDateLabel.NewDate,
    timeSlot: "04:00 PM - 05:00 PM",
    status: GqlLeaveRequestStatus.Rescheduled,
  },
  {
    id: "2",
    originalClassId: "orig-2",
    teacherName: "Sarah Omar",
    teacherId: "T-10452",
    teacherInitials: "SM",
    teacherAvatarUrl: "/demo/avatars/02.png",
    studentName: "Grade 8 - Islamic Studies",
    scheduledDate: "Oct 25, 2023",
    dateLabel: GqlRescheduleDateLabel.LeaveRequest,
    timeSlot: "02:30 PM - 03:30 PM",
    status: GqlLeaveRequestStatus.Pending,
  },
  {
    id: "3",
    originalClassId: "orig-3",
    teacherName: "Rai Khan",
    teacherId: "T-10881",
    teacherInitials: "ZK",
    teacherAvatarUrl: "/demo/avatars/07.png",
    studentName: "Grade 12 - Memo Program",
    scheduledDate: "Oct 26, 2023",
    dateLabel: GqlRescheduleDateLabel.NewDate,
    timeSlot: "05:00 PM - 06:00 PM",
    status: GqlLeaveRequestStatus.Rescheduled,
  },
  {
    id: "4",
    originalClassId: "orig-4",
    teacherName: "Aisha Al-R",
    teacherId: "T-10932",
    teacherInitials: "AA",
    teacherAvatarUrl: "/demo/avatars/04.png",
    studentName: "Grade 7 - Quran Memorization",
    scheduledDate: "Oct 27, 2023",
    dateLabel: GqlRescheduleDateLabel.LeaveRequest,
    timeSlot: "09:00 AM - 10:00 AM",
    status: GqlLeaveRequestStatus.Pending,
  },
  {
    id: "5",
    originalClassId: null,
    teacherName: "Omar Ahmed",
    teacherId: "T-11001",
    teacherInitials: "OF",
    teacherAvatarUrl: "/demo/avatars/03.png",
    studentName: "Grade 11 - Islamic History",
    scheduledDate: "Oct 28, 2023",
    dateLabel: GqlRescheduleDateLabel.NewDate,
    timeSlot: "01:00 PM - 02:00 PM",
    status: GqlLeaveRequestStatus.Rescheduled,
  },
];

export function MockRescheduleTrackingContainer() {
  const labels = {
    pageTitle: "Reschedule Tracking",
    sectionTitle: "All Rescheduled and Leave Classes",
    exportData: "Export Data",
    filterAll: "All",
    teacherName: "Teacher Name",
    studentName: "Student & Subject",
    scheduledDate: "Date",
    timeSlot: "Time Slot",
    classStatus: "Status",
    action: "Action",
    newDate: "New Date",
    leaveRequest: "Leave Request",
    rescheduled: "Rescheduled",
    pendingLeave: "Pending Leave",
    viewDetails: "View Details",
    approveLeave: "Approve",
    rejectLeave: "Reject",
    showingOf: "Showing {from}-{to} of {total}",
    noEntries: "No records found",
    statusPending: "Pending",
    statusRescheduled: "Rescheduled",
    statusApproved: "Approved",
    statusCancelled: "Cancelled",
  };

  return (
    <RescheduleTrackingView
      metrics={MOCK_METRICS}
      rows={MOCK_ROWS}
      labels={labels}
      onApprove={() => {}}
      onReject={() => {}}
      onView={() => {}}
      onExport={() => {}}
      onFilterChange={() => {}}
      statusFilter={null}
      page={0}
      pageSize={5}
      totalCount={20}
      onPageChange={() => {}}
    />
  );
}

const meta: Meta<typeof MockRescheduleTrackingContainer> = {
  title: "Views/dashboard/reschedule/tracking/RescheduleTrackingContainer",
  component: MockRescheduleTrackingContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockRescheduleTrackingContainer>;

export const Default: Story = {
  args: {},
};
