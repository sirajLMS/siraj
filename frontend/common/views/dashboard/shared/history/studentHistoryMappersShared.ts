import type {
  StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_metrics_StudentHistoryMetrics,
  StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_sessions_StudentHistorySession,
} from "@/frontend/common/graphql/generated/gql/operations";
import { resolveSessionDateTime } from "@/shared/lib/datetime/resolveSessionDateTime";

export interface StudentHistoryMetricsShared {
  readonly totalClasses: number;
  readonly attendanceRate: number;
  readonly hoursStudied: number;
  readonly performance: number;
}

export interface StudentHistorySessionRowShared {
  readonly id: string;
  readonly title: string;
  readonly time: string;
  readonly duration: number;
  readonly status: string;
  readonly outcome: string;
  readonly isFrozen: boolean;
  readonly instructor: string;
  readonly teacherId: string;
  readonly timeSlot: string;
  readonly room: string;
  readonly notes: string;
  readonly dayOfMonth: number;
  readonly meetingJoinUrl: string | null;
  readonly effectiveMeeting: unknown;
}

const EMPTY_METRICS: StudentHistoryMetricsShared = {
  totalClasses: 0,
  attendanceRate: 0,
  hoursStudied: 0,
  performance: 0,
};

export function mapStudentHistoryMetricsShared(
  metrics:
    | StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_metrics_StudentHistoryMetrics
    | null
    | undefined
): StudentHistoryMetricsShared {
  if (!metrics) return EMPTY_METRICS;
  return {
    totalClasses: metrics.totalClasses ?? 0,
    attendanceRate: metrics.attendanceRate ?? 0,
    hoursStudied: metrics.hoursStudied ?? 0,
    performance: metrics.performance ?? 0,
  };
}

export function mapStudentHistorySessionsShared(
  sessions:
    | readonly StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_sessions_StudentHistorySession[]
    | null
    | undefined,
  year: number,
  month: number
): readonly StudentHistorySessionRowShared[] {
  if (!sessions) return [];
  return sessions.map(s => {
    const dayOfMonth = s.dayOfMonth ?? 0;
    const rawTime = s.time ?? "";
    return {
      id: s.id ?? "",
      title: s.title ?? "",
      time: resolveSessionDateTime(rawTime, year, month, dayOfMonth),
      duration: s.duration ?? 0,
      status: s.status ?? "",
      outcome: s.outcome ?? "",
      isFrozen: s.isFrozen ?? false,
      instructor: s.instructor ?? "",
      teacherId: s.teacherId ?? "",
      timeSlot: s.timeSlot ?? "",
      room: s.room ?? "",
      notes: s.notes ?? "",
      dayOfMonth,
      meetingJoinUrl: s.meetingJoinUrl ?? null,
      effectiveMeeting: s.effectiveMeeting ?? null,
    };
  });
}
