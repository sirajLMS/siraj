import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { AttendanceStatus } from "@/shared/constants/attendance-status.enum";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

export function isJoinableClassSession(
  executionState?: string,
  outcome?: string | null,
  options?: { readonly isFrozen?: boolean }
): boolean {
  return isJoinableClassInstance(executionState, outcome, options);
}

export interface ClassSession {
  readonly id: string;
  readonly dayOfMonth: number;
  readonly title: string;
  readonly time: string;
  readonly duration: number;
  readonly status: AttendanceStatus;
  readonly executionState?: string;
  readonly outcome?: string | null;
  readonly isFrozen?: boolean;
  readonly instructor: string;
  readonly timeSlot: string;
  readonly room: string;
  readonly notes: string;
  readonly meetingJoinUrl?: string | null;
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
}

export type { StudentHistoryMetrics } from "@/frontend/common/views/dashboard/students/history/types/studentHistoryTypes";

export interface CalendarGridProps {
  readonly currentMonth: Date;
  readonly classes: Readonly<Partial<Record<number, ClassSession>>>;
}

export interface ClassSessionListProps {
  readonly dateStr: string;
  readonly sessions: readonly ClassSession[];
}

export interface MobileWeeklyScrollerProps {
  readonly selectedWeek: number;
  readonly selectedDay: number | null;
  readonly currentMonth: Date;
  readonly classes: Readonly<Partial<Record<number, ClassSession>>>;
  readonly onSelectWeek: (week: number) => void;
  readonly onSelectDay: (day: number | null) => void;
}

export interface PerformanceStreakProps {
  readonly streakDays: readonly number[];
}
