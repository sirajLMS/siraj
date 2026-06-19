import type { Meta, StoryObj } from "@storybook/react";
import { useRescheduleTrackingStore } from "@/frontend/stores/mockRescheduleTrackingStore";
import { RescheduleTrackingView } from "./RescheduleTrackingView";

export function MockRescheduleTrackingContainer() {
  const metrics = useRescheduleTrackingStore(state => state.metrics);
  const rows = useRescheduleTrackingStore(state => state.rows);
  const pagination = useRescheduleTrackingStore(state => state.pagination);

  const labels = {
    pageTitle: "Reschedule Tracking",
    sectionTitle: "All Rescheduled and Leave Classes",
    exportData: "Export Data",
    filter: "Filter",
    teacherName: "Teacher Name",
    studentClass: "Student & Subject",
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
  };

  return (
    <RescheduleTrackingView
      metrics={metrics}
      rows={rows}
      totalItems={pagination.totalItems}
      labels={labels}
      onApprove={() => {}}
      onReject={() => {}}
      onView={() => {}}
      onExport={() => {}}
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
