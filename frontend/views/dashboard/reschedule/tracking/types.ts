import type { LeaveRequestStatus as GqlLeaveRequestStatus, RescheduleDateLabel as GqlRescheduleDateLabel } from "@/frontend/graphql/generated/gql/graphql-types";

export type TrackingClassStatus = GqlLeaveRequestStatus;

export interface TrackingRow {
  readonly id: string;
  readonly teacherName: string;
  readonly teacherId: string;
  readonly teacherInitials: string;
  readonly teacherAvatarUrl?: string;
  readonly studentClass: string;
  readonly scheduledDate: string;
  readonly dateLabel: GqlRescheduleDateLabel;
  readonly timeSlot: string;
  readonly status: GqlLeaveRequestStatus;
}
