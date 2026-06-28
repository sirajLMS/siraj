import type { Theme } from "@mui/material";
import { AttendanceStatus } from "@/shared/lib/enum";

export { AttendanceStatus } from "@/shared/lib/enum";

export interface ClassSession {
  readonly id: string;
  readonly dayOfMonth: number;
  readonly title: string;
  readonly time: string;
  readonly duration: number;
  readonly status: AttendanceStatus;
  readonly instructor: string;
  readonly timeSlot: string;
  readonly room: string;
  readonly notes: string;
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
  if (lower === "absent") return AttendanceStatus.ABSENT;
  if (lower === "late") return AttendanceStatus.LATE;
  if (lower === "taken" || lower === "completed" || lower === "present") return AttendanceStatus.PRESENT;
  return AttendanceStatus.PRESENT;
}
