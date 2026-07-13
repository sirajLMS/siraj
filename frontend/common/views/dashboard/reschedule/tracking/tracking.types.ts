import type { SvgIconComponent } from "@mui/icons-material";
import type { RescheduleTrackingRow } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { LeaveRequestStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";

export type TrackingRow = Readonly<Omit<RescheduleTrackingRow, "__typename">> & {
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

export interface MetricDefinition {
  readonly key: string;
  readonly labelKey: string;
  readonly icon: SvgIconComponent;
  readonly variant?: MetricItem["variant"];
}

export interface RawMetrics {
  readonly pending?: number | null;
  readonly approved?: number | null;
  readonly leave?: number | null;
  readonly rescheduled?: number | null;
  readonly cancelled?: number | null;
}

export interface RescheduleTrackingCommonLabels extends TrackingStatusLabelMap {
  readonly newDate: string;
  readonly leaveRequest: string;
  readonly rescheduled: string;
  readonly pendingLeave: string;
  readonly viewDetails: string;
  readonly noEntries: string;
}

export interface RescheduleTrackingDataGridLabels extends RescheduleTrackingCommonLabels {
  readonly approveLeave: string;
  readonly rejectLeave: string;
}

export interface RescheduleTrackingDataGridProps {
  readonly rows: readonly TrackingRow[];
  readonly headers: {
    readonly teacherName: string;
    readonly studentName: string;
    readonly scheduledDate: string;
    readonly timeSlot: string;
    readonly classStatus: string;
    readonly action: string;
  };
  readonly labels: RescheduleTrackingDataGridLabels;
  readonly onApprove: (id: string) => void;
  readonly onReject: (id: string) => void;
  readonly onView: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly loading?: boolean;
}

export type RescheduleTrackingCardListLabels = RescheduleTrackingCommonLabels;

export interface RescheduleTrackingCardListProps {
  readonly rows: readonly TrackingRow[];
  readonly labels: RescheduleTrackingCardListLabels;
  readonly onView: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

export interface RescheduleTrackingViewLabels extends RescheduleTrackingCommonLabels {
  readonly pageTitle: string;
  readonly sectionTitle: string;
  readonly exportData: string;
  readonly filterAll: string;
  readonly teacherName: string;
  readonly studentName: string;
  readonly scheduledDate: string;
  readonly timeSlot: string;
  readonly classStatus: string;
  readonly action: string;
  readonly approveLeave: string;
  readonly rejectLeave: string;
  readonly showingOf: string;
}

export interface RescheduleTrackingViewProps {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly TrackingRow[];
  readonly labels: RescheduleTrackingViewLabels;
  readonly loading?: boolean;
  readonly onApprove: (id: string) => void;
  readonly onReject: (id: string) => void;
  readonly onView: (id: string) => void;
  readonly onExport: () => void;
  readonly onFilterChange: (status: LeaveRequestStatus | null) => void;
  readonly statusFilter: LeaveRequestStatus | null;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount?: number;
  readonly onPageChange: (page: number) => void;
}

export const STATUS_FILTER_OPTIONS: readonly (LeaveRequestStatus | "")[] = [
  "",
  LeaveRequestStatus.Pending,
  LeaveRequestStatus.Rescheduled,
  LeaveRequestStatus.Approved,
  LeaveRequestStatus.Cancelled,
] as const;
