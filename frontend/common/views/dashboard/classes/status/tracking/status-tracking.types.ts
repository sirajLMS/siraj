import type { SvgIconComponent } from "@mui/icons-material";
import {
  ClassExecutionState,
  type StatusTrackingScheduleQuery_statusTrackingSchedule,
  StudentStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { StatusTrackingLabelsBySection } from "@/frontend/common/views/dashboard/classes/status/tracking/types/statusTrackingViewModel.types";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

export enum SessionStatus {
  REGULAR = "regular",
  SUSPENDED_PENDING = "suspended_pending",
  ON_LEAVE = "on_leave",
  PENDING_VERIFICATION = "pending_verification",
}

export type StatusTrackingScheduleRow = StatusTrackingScheduleQuery_statusTrackingSchedule;
export interface StatusTrackingLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly filters: string;
  readonly newReport: string;
  readonly todaysClassSchedule: string;
  readonly totalSessions: (total: number) => string;
  readonly class: string;
  readonly student: string;
  readonly teacher: string;
  readonly schedule: string;
  readonly duration: string;
  readonly status: string;
  readonly actions: string;
  readonly showingOf: (shown: number, total: number) => string;
  readonly previous: string;
  readonly next: string;
  readonly joinSession: string;
  readonly activate: string;
  readonly reschedule: string;
  readonly verifyDocuments: string;
  readonly sessionLocked: string;
  readonly sessionEnded: string;
  readonly administrativeHold: string;
  readonly holdDescription: string;
  readonly seeAll: string;
  readonly todaysSchedule: string;
  readonly regular: string;
  readonly suspendedPending: string;
  readonly onLeave: string;
  readonly pendingVerification: string;
  readonly regularSubLabel: string;
  readonly pendingSubLabel: string;
  readonly suspendedSubLabel: string;
  readonly onLeaveSubLabel: string;
  readonly suspensionAnalytics: string;
  readonly analyticsNote: string;
  readonly urgentTask: string;
  readonly accountsLocked: (count: number) => string;
  readonly auditDescription: string;
  readonly openAuditLogs: string;
  readonly noEntries: string;
  readonly errorNoStudentId: string;
  readonly errorAuditLogsComingSoon: string;
  readonly errorFailedToLoad: string;
  readonly days: readonly string[];
  readonly dateFilter: {
    readonly today: string;
    readonly previousDay: string;
    readonly nextDay: string;
    readonly dateLabel: string;
  };
}

export interface StatusTrackingDataGridLabels {
  readonly class: string;
  readonly student: string;
  readonly teacher: string;
  readonly schedule: string;
  readonly duration: string;
  readonly status: string;
  readonly actions: string;
  readonly joinSession: string;
  readonly activate: string;
  readonly reschedule: string;
  readonly verifyDocuments: string;
  readonly administrativeHold: string;
  readonly holdDescription: string;
  readonly regular: string;
  readonly suspendedPending: string;
  readonly onLeave: string;
  readonly pendingVerification: string;
  readonly sessionEnded: string;
  readonly noEntries: string;
  readonly showingOf: (shown: number, total: number) => string;
  readonly previous: string;
  readonly next: string;
}

export interface CardListLabels {
  readonly class: string;
  readonly student: string;
  readonly teacher: string;
  readonly schedule: string;
  readonly duration: string;
  readonly joinSession: string;
  readonly activate: string;
  readonly reschedule: string;
  readonly verifyDocuments: string;
  readonly sessionLocked: string;
  readonly sessionEnded: string;
  readonly todaysSchedule: string;
  readonly regular: string;
  readonly suspendedPending: string;
  readonly onLeave: string;
  readonly pendingVerification: string;
  readonly noEntries: string;
}

export interface SuspensionAnalyticsLabels {
  readonly suspensionAnalytics: string;
  readonly analyticsNote: string;
  readonly urgentTask: string;
  readonly accountsLocked: (count: number) => string;
  readonly auditDescription: string;
  readonly openAuditLogs: string;
  readonly suspended: string;
  readonly days: readonly string[];
}

interface StatusActionLabels {
  readonly joinSession: string;
  readonly activate: string;
  readonly reschedule: string;
  readonly verifyDocuments: string;
  readonly administrativeHold: string;
  readonly holdDescription: string;
}

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

export function computeSessionStatus(
  studentStatus: string | null,
  isFrozen: boolean | null,
  executionState: string | null
): SessionStatus {
  if (isFrozen === true || studentStatus === StudentStatus.Suspended) {
    return SessionStatus.SUSPENDED_PENDING;
  }
  if (studentStatus === StudentStatus.OnLeave) {
    return SessionStatus.ON_LEAVE;
  }
  if (executionState === ClassExecutionState.NotActivated) {
    return SessionStatus.PENDING_VERIFICATION;
  }
  return SessionStatus.REGULAR;
}

export function formatScheduleRange(start: string | null, end: string | null, locale: string): string {
  const fmt = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleTimeString(getLatnLocaleTag(locale), { hour: "2-digit", minute: "2-digit" });
  };
  return `${fmt(start)} - ${fmt(end)}`;
}
