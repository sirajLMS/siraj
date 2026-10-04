import type { SvgIconComponent } from "@mui/icons-material";
import type { StatusTrackingScheduleQuery_statusTrackingSchedule } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  CardListLabels,
  StatusActionLabels,
  StatusTrackingDataGridLabels,
  SuspensionAnalyticsLabels,
} from "@/frontend/common/views/dashboard/classes/status/tracking/status-tracking.labels.types";
import type { StatusTrackingLabelsBySection } from "@/frontend/common/views/dashboard/classes/status/tracking/types/statusTrackingViewModel.types";

export {
  computeSessionStatus,
  formatScheduleRange,
  SessionStatus,
} from "@/frontend/common/views/dashboard/classes/status/tracking/status-tracking.helpers";
export type {
  CardListLabels,
  StatusTrackingDataGridLabels,
  StatusTrackingLabels,
  SuspensionAnalyticsLabels,
} from "@/frontend/common/views/dashboard/classes/status/tracking/status-tracking.labels.types";

export type StatusTrackingScheduleRow = StatusTrackingScheduleQuery_statusTrackingSchedule;

export interface MetricCounts {
  readonly regular: number;
  readonly pending: number;
  readonly suspended: number;
  readonly on_leave: number;
}

export interface RawMetric {
  readonly key: string;
  readonly count: number;
  readonly labelKey: string;
  readonly icon: SvgIconComponent;
  readonly variant?: "default" | "error" | "highlight" | "danger";
  readonly subLabel?: string;
}

interface StatusTrackingViewProps {
  readonly metrics: readonly RawMetric[];
  readonly rows: readonly StatusTrackingScheduleRow[];
  readonly totalSessions: number;
  readonly suspendedCount: number;
  readonly labelsBySection: StatusTrackingLabelsBySection;
  readonly dateValue: string;
  readonly onDateChange: (date: string) => void;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
  readonly onNewReport: () => void;
  readonly onOpenAuditLogs: () => void;
}

export interface StatusTrackingDataGridProps {
  readonly rows: readonly StatusTrackingScheduleRow[];
  readonly labels: StatusTrackingDataGridLabels;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
  readonly loading?: boolean;
}

export interface StatusTrackingCardListProps {
  readonly rows: readonly StatusTrackingScheduleRow[];
  readonly totalSessions: number;
  readonly labels: CardListLabels;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
}

export interface SuspensionAnalyticsProps {
  readonly suspendedCount: number;
  readonly labels: SuspensionAnalyticsLabels;
  readonly onOpenAuditLogs: () => void;
}

export interface StatusActionProps {
  readonly row: StatusTrackingScheduleRow;
  readonly labels: StatusActionLabels;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
}

export type MobileLayoutProps = StatusTrackingViewProps;

export type DesktopLayoutProps = StatusTrackingViewProps;
