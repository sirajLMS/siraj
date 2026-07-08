import type { SvgIconComponent } from "@mui/icons-material";

export type ScheduleAlertType = "leave_quota_exceeded" | "missed_class_time";

export interface ScheduleAlert {
  readonly id: string;
  readonly type: ScheduleAlertType;
  readonly pulse?: boolean;
}

export type ClassSessionAction = "join_session" | "leave_disabled" | "leave_enabled" | "view_recording";

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
}

export interface AlertsMetric {
  readonly key: string;
  readonly value: number | string;
  readonly labelKey: string;
  readonly subLabelKey: string;
  readonly icon: SvgIconComponent;
  readonly trend?: string;
}
