import type {
  LeaveRequestStatus as GqlLeaveRequestStatus,
  RescheduleDateLabel as GqlRescheduleDateLabel,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { LeaveRequestStatus } from "@/frontend/graphql/generated/gql/graphql-types";

export interface TrackingRow {
  readonly id: string;
  readonly originalClassId: string | null;
  readonly teacherName: string;
  readonly teacherId: string;
  readonly teacherInitials: string;
  readonly teacherAvatarUrl?: string;
  readonly studentName: string;
  readonly scheduledDate: string;
  readonly dateLabel: GqlRescheduleDateLabel;
  readonly timeSlot: string;
  readonly status: GqlLeaveRequestStatus;
}

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
