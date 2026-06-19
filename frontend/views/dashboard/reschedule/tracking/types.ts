export type TrackingClassStatus = "rescheduled" | "pending_leave";

export interface TrackingRow {
  readonly id: string;
  readonly teacherName: string;
  readonly teacherId: string;
  readonly teacherInitials: string;
  readonly teacherAvatarUrl?: string;
  readonly studentClass: string;
  readonly scheduledDate: string;
  readonly dateLabel: "new_date" | "leave_request";
  readonly timeSlot: string;
  readonly status: TrackingClassStatus;
}
