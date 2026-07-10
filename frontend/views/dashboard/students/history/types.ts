import type { Theme } from "@mui/material";
import { AttendanceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/graphql/types/meeting-class-config.operations";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

export function isJoinableClassSession(executionState?: string, outcome?: string | null): boolean {
  return isJoinableClassInstance(executionState, outcome);
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
  readonly instructor: string;
  readonly timeSlot: string;
  readonly room: string;
  readonly notes: string;
  readonly meetingJoinUrl?: string | null;
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
}

export interface StudentHistoryMetrics {
  readonly totalClasses: number;
  readonly attendanceRate: number;
  readonly hoursStudied: number;
  readonly performance: number;
}

export interface StudentHistoryViewProps {
  readonly studentName: string;
  readonly currentMonth: Date;
  readonly metrics: StudentHistoryMetrics;
  readonly classes: Readonly<Partial<Record<number, ClassSession>>>;
  readonly selectedWeek: number;
  readonly selectedDay: number | null;
  readonly onSelectWeek: (week: number) => void;
  readonly onSelectDay: (day: number | null) => void;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly onPrint: () => void;
}

export interface StudentHistoryDesktopProps {
  readonly studentName: string;
  readonly currentMonth: Date;
  readonly metrics: StudentHistoryMetrics;
  readonly classes: Readonly<Partial<Record<number, ClassSession>>>;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly onPrint: () => void;
}

export interface StudentHistoryMobileProps {
  readonly studentName: string;
  readonly currentMonth: Date;
  readonly metrics: StudentHistoryMetrics;
  readonly classes: Readonly<Partial<Record<number, ClassSession>>>;
  readonly selectedWeek: number;
  readonly selectedDay: number | null;
  readonly onSelectWeek: (week: number) => void;
  readonly onSelectDay: (day: number | null) => void;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly onPrint: () => void;
}

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

export interface MobileMetricProps {
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly value: React.ReactNode;
  readonly bg: string | ((theme: Theme) => string);
}

export function mapStatusToAttendance(rawStatus: string): AttendanceStatus {
  const lower = rawStatus.toLowerCase();
  if (lower === "absent") return AttendanceStatus.Absent;
  if (lower === "late") return AttendanceStatus.Late;
  if (lower === "taken" || lower === "completed" || lower === "present") return AttendanceStatus.Present;
  return AttendanceStatus.Present;
}
