import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";

export interface StudentHistoryMetrics {
  readonly totalClasses: number;
  readonly attendanceRate: number;
  readonly hoursStudied: number;
  readonly performance: number;
}

export interface StudentHistorySessionRow {
  readonly id: string;
  readonly title: string;
  readonly time: string;
  readonly duration: number;
  readonly status: string;
  readonly outcome: string;
  readonly isFrozen: boolean;
  readonly instructor: string;
  readonly timeSlot: string;
  readonly room: string;
  readonly notes: string;
  readonly dayOfMonth: number;
  readonly meetingJoinUrl: string | null;
  readonly effectiveMeeting: EffectiveMeetingFieldsFragment | null;
}
