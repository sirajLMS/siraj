import type { Meta, StoryObj } from "@storybook/react";
import { LeaveRequestStatus, RescheduleDateLabel } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { RescheduleTrackingView } from "@/frontend/views/dashboard/reschedule/tracking/RescheduleTrackingView";
import { TRACKING_METRIC_DEFINITIONS } from "@/frontend/views/dashboard/reschedule/tracking/tracking.helpers";
import type { TrackingRow } from "@/frontend/views/dashboard/reschedule/tracking/tracking.types";

const MOCK_METRIC_COUNTS: Record<string, number> = {
  pending: 24,
  approved: 156,
  leave: 8,
  rescheduled: 12,
  cancelled: 3,
};

const MOCK_METRICS = TRACKING_METRIC_DEFINITIONS.map(def => ({
  key: def.key,
  count: MOCK_METRIC_COUNTS[def.key] ?? 0,
  labelKey: def.labelKey,
  icon: def.icon,
  ...(def.variant ? { variant: def.variant } : {}),
}));

const MOCK_ROWS: TrackingRow[] = [
  {
    id: "1",
    originalClassId: "orig-1",
    remarks: null,
    scheduledStartAt: "2023-10-24T16:00:00.000Z",
    scheduledEndAt: "2023-10-24T17:00:00.000Z",
    teacherName: "Mohammad Al-Farsi",
    teacherId: "T-10293",
    teacherInitials: "MA",
    teacherAvatarUrl: "/demo/avatars/01.png",
    studentId: "S-1001",
    studentName: "Grade 10 - Advanced Arabic",
    scheduledDate: "Oct 24, 2023",
    dateLabel: RescheduleDateLabel.NewDate,
    timeSlot: "04:00 PM - 05:00 PM",
    status: LeaveRequestStatus.Rescheduled,
  },
  {
    id: "2",
    originalClassId: "orig-2",
    remarks: null,
    scheduledStartAt: "2023-10-25T14:30:00.000Z",
    scheduledEndAt: "2023-10-25T15:30:00.000Z",
    teacherName: "Sarah Omar",
    teacherId: "T-10452",
    teacherInitials: "SM",
    teacherAvatarUrl: "/demo/avatars/02.png",
    studentId: "S-1002",
    studentName: "Grade 8 - Islamic Studies",
    scheduledDate: "Oct 25, 2023",
    dateLabel: RescheduleDateLabel.LeaveRequest,
    timeSlot: "02:30 PM - 03:30 PM",
    status: LeaveRequestStatus.Pending,
  },
  {
    id: "3",
    originalClassId: "orig-3",
    remarks: null,
    scheduledStartAt: "2023-10-26T17:00:00.000Z",
    scheduledEndAt: "2023-10-26T18:00:00.000Z",
    teacherName: "Rai Khan",
    teacherId: "T-10881",
    teacherInitials: "ZK",
    teacherAvatarUrl: "/demo/avatars/07.png",
    studentId: "S-1003",
    studentName: "Grade 12 - Memo Program",
    scheduledDate: "Oct 26, 2023",
    dateLabel: RescheduleDateLabel.NewDate,
    timeSlot: "05:00 PM - 06:00 PM",
    status: LeaveRequestStatus.Rescheduled,
  },
  {
    id: "4",
    originalClassId: "orig-4",
    remarks: null,
    scheduledStartAt: "2023-10-27T09:00:00.000Z",
    scheduledEndAt: "2023-10-27T10:00:00.000Z",
    teacherName: "Aisha Al-R",
    teacherId: "T-10932",
    teacherInitials: "AA",
    teacherAvatarUrl: "/demo/avatars/04.png",
    studentId: "S-1004",
    studentName: "Grade 7 - Quran Memorization",
    scheduledDate: "Oct 27, 2023",
    dateLabel: RescheduleDateLabel.LeaveRequest,
    timeSlot: "09:00 AM - 10:00 AM",
    status: LeaveRequestStatus.Pending,
  },
  {
    id: "5",
    originalClassId: null,
    remarks: null,
    scheduledStartAt: "2023-10-28T13:00:00.000Z",
    scheduledEndAt: "2023-10-28T14:00:00.000Z",
    teacherName: "Omar Ahmed",
    teacherId: "T-11001",
    teacherInitials: "OF",
    teacherAvatarUrl: "/demo/avatars/03.png",
    studentId: "S-1005",
    studentName: "Grade 11 - Islamic History",
    scheduledDate: "Oct 28, 2023",
    dateLabel: RescheduleDateLabel.NewDate,
    timeSlot: "01:00 PM - 02:00 PM",
    status: LeaveRequestStatus.Rescheduled,
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
