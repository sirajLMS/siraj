import type { SvgIconComponent } from "@mui/icons-material";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";

export type ScheduleAlertType = "leave_quota_exceeded" | "missed_class_time";

export interface ScheduleAlert {
  readonly id: string;
  readonly type: ScheduleAlertType;
  readonly pulse?: boolean;
}

export type ClassSessionAction =
  | "join_session"
  | "leave_disabled"
  | "leave_enabled"
  | "view_class_audit"
  | "contact_admin";

export type ClassSessionStatus = "active" | "upcoming" | "missed" | "hold";

export interface AcademicClassRow {
  readonly id: string;
  readonly className: string;
  readonly classId: string;
  readonly classAvatarUrl?: string | null;
  readonly instructor: string;
  readonly instructorId?: string;
  readonly time: string;
  readonly room: string;
  readonly action: ClassSessionAction;
  readonly sessionStatus: ClassSessionStatus;
  readonly executionState?: string | null;
  readonly outcome?: string | null;
  readonly isFrozen?: boolean | null;
  readonly meetingJoinUrl?: string | null;
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
}

export interface AlertsMetric {
  readonly key: string;
  readonly value: number | string;
  readonly labelKey: string;
  readonly subLabelKey: string;
  readonly icon: SvgIconComponent;
  readonly trend?: string;
}

export interface ScheduleAlertsLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly alertMessages: {
    readonly leave_quota_exceeded: string;
    readonly missed_class_time: string;
  };
  readonly reportTitle: string;
  readonly reportDescription: string;
  readonly reportDescriptionMobile: string;
  readonly downloadPdf: string;
  readonly sectionTitle: string;
  readonly sectionSubtitle: string;
  readonly filter: string;
  readonly export: string;
  readonly className: string;
  readonly instructor: string;
  readonly time: string;
  readonly room: string;
  readonly status: string;
  readonly joinSession: string;
  readonly leaveClass: string;
  readonly leaveDisabledReason: string;
  readonly viewClassAudit: string;
  readonly contactAdmin: string;
  readonly showingOf: (shown: number, total: number) => string;
  readonly active: string;
  readonly upcoming: string;
  readonly missed: string;
  readonly hold: string;
  readonly endOfSchedule: string;
  readonly noEntries: string;
  readonly loading: string;
}
