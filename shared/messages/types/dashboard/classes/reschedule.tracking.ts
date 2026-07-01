export interface RescheduleTrackingLabels {
  readonly pageTitle: string;
  readonly sectionTitle: string;
  readonly exportData: string;
  readonly filterAll: string;
  readonly showingOf: string;
  readonly noEntries: string;
  readonly metrics: {
    readonly pendingRequests: string;
    readonly approvedClasses: string;
    readonly leaveRequests: string;
    readonly reScheduled: string;
    readonly cancelled: string;
  };
  readonly table: {
    readonly teacherName: string;
    readonly studentClass: string;
    readonly scheduledDate: string;
    readonly timeSlot: string;
    readonly classStatus: string;
    readonly action: string;
  };
  readonly badges: {
    readonly newDate: string;
    readonly leaveRequest: string;
  };
  readonly status: {
    readonly rescheduled: string;
    readonly pendingLeave: string;
    readonly approved: string;
    readonly cancelled: string;
  };
  readonly actions: {
    readonly viewDetails: string;
    readonly approveLeave: string;
    readonly approveSuccess: string;
    readonly rejectLeave: string;
  };
  readonly errors: {
    readonly missingOriginalClassId: string;
    readonly approveFailed: string;
  };
  readonly loadFailed: string;
}
