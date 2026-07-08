import type { SvgIconComponent } from "@mui/icons-material";
import type { StatusTrackingScheduleRow } from "@/frontend/graphql/generated/gql/graphql-types";
import { ClassExecutionState, StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

export enum SessionStatus {
  REGULAR = "regular",
  SUSPENDED_PENDING = "suspended_pending",
  ON_LEAVE = "on_leave",
  PENDING_VERIFICATION = "pending_verification",
}

export type { StatusTrackingScheduleRow };
export type StatusTrackingRow = StatusTrackingScheduleRow;

export interface StatusTrackingLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly filters: string;
  readonly newReport: string;
  readonly todaysClassSchedule: string;
  readonly totalSessions: string;
  readonly studentClass: string;
  readonly teacher: string;
  readonly schedule: string;
  readonly status: string;
  readonly actions: string;
  readonly showingOf: string;
  readonly previous: string;
  readonly next: string;
  readonly joinSession: string;
  readonly activate: string;
  readonly reschedule: string;
  readonly verifyDocuments: string;
  readonly sessionLocked: string;
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
  readonly accountsLocked: string;
  readonly auditDescription: string;
  readonly openAuditLogs: string;
  readonly noEntries: string;
  readonly errorNoStudentId: string;
  readonly errorAuditLogsComingSoon: string;
  readonly days: readonly string[];
}

export interface StatusTrackingDataGridLabels {
  readonly studentClass: string;
  readonly teacher: string;
  readonly schedule: string;
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
  readonly noEntries: string;
}

export interface CardListLabels {
  readonly joinSession: string;
  readonly activate: string;
  readonly verifyDocuments: string;
  readonly sessionLocked: string;
  readonly seeAll: string;
  readonly todaysSchedule: string;
  readonly regular: string;
  readonly suspendedPending: string;
  readonly onLeave: string;
  readonly pendingVerification: string;
}

export interface SuspensionAnalyticsLabels {
  readonly suspensionAnalytics: string;
  readonly analyticsNote: string;
  readonly urgentTask: string;
  readonly accountsLocked: string;
  readonly auditDescription: string;
  readonly openAuditLogs: string;
  readonly suspended: string;
  readonly days: readonly string[];
}

export interface StatusActionLabels {
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
  readonly variant?: "default" | "error" | "highlight" | "danger" | "compact";
}

export interface StatusTrackingViewProps {
  readonly metrics: readonly RawMetric[];
  readonly rows: readonly StatusTrackingRow[];
  readonly totalSessions: number;
  readonly suspendedCount: number;
  readonly labels: StatusTrackingLabels;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
  readonly onNewReport: () => void;
  readonly onJoin: (id: string) => void;
  readonly onOpenAuditLogs: () => void;
  readonly onSeeAll: () => void;
}

export interface StatusTrackingDataGridProps {
  readonly rows: readonly StatusTrackingRow[];
  readonly labels: StatusTrackingDataGridLabels;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
  readonly onJoin: (id: string) => void;
  readonly loading?: boolean;
}

export interface StatusTrackingCardListProps {
  readonly rows: readonly StatusTrackingRow[];
  readonly totalSessions: number;
  readonly labels: CardListLabels;
  readonly onActivate: (id: string) => void;
  readonly onVerify: (id: string) => void;
  readonly onJoin: (id: string) => void;
  readonly onSeeAll: () => void;
}

export interface SuspensionAnalyticsProps {
  readonly suspendedCount: number;
  readonly labels: SuspensionAnalyticsLabels;
  readonly onOpenAuditLogs: () => void;
}

export interface StatusActionProps {
  readonly row: StatusTrackingRow;
  readonly labels: StatusActionLabels;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
  readonly onJoin: (id: string) => void;
}

export interface MobileLayoutProps extends Omit<StatusTrackingViewProps, "suspendedCount"> {
  readonly cardListLabels: CardListLabels;
}

export interface DesktopLayoutProps extends StatusTrackingViewProps {
  readonly analyticsLabels: SuspensionAnalyticsLabels;
}

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
