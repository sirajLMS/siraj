import type { SvgIconComponent } from "@mui/icons-material";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/graphql/types/meeting-class-config.operations";

export type ScheduleAlertType = "leave_quota_exceeded" | "missed_class_time";

export interface ScheduleAlert {
  readonly id: string;
  readonly type: ScheduleAlertType;
  readonly pulse?: boolean;
}

export type ClassSessionAction = "join_session" | "leave_disabled" | "leave_enabled" | "view_class_audit";

export type ClassSessionStatus = "active" | "upcoming" | "missed";

export interface AcademicClassRow {
  readonly id: string;
  readonly className: string;
  readonly classId: string;
  readonly instructor: string;
  readonly instructorId?: string;
  readonly time: string;
  readonly room: string;
  readonly action: ClassSessionAction;
  readonly sessionStatus: ClassSessionStatus;
  readonly executionState?: string | null;
  readonly outcome?: string | null;
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
