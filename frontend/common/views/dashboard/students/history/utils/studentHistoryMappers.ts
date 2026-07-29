import type {
  StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_metrics_StudentHistoryMetrics,
  StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_sessions_StudentHistorySession,
} from "@/frontend/common/graphql/generated/gql/operations";
import type {
  StudentHistoryMetrics,
  StudentHistorySessionRow,
} from "@/frontend/common/views/dashboard/students/history/types";
import { resolveSessionDateTime } from "@/shared/lib/datetime/resolveSessionDateTime";

export function mapStudentHistoryMetrics(
  metrics:
    | StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_metrics_StudentHistoryMetrics
    | null
    | undefined
): StudentHistoryMetrics {
  if (!metrics) {
    return { totalClasses: 0, attendanceRate: 0, hoursStudied: 0, performance: 0 };
  }
  return {
    totalClasses: metrics.totalClasses ?? 0,
    attendanceRate: metrics.attendanceRate ?? 0,
    hoursStudied: metrics.hoursStudied ?? 0,
    performance: metrics.performance ?? 0,
  };
}

export function mapStudentHistorySessions(
  sessions:
    | readonly StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_sessions_StudentHistorySession[]
    | null
    | undefined,
  year: number,
  month: number
): readonly StudentHistorySessionRow[] {
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
      timeSlot: s.timeSlot ?? "",
      room: s.room ?? "",
      notes: s.notes ?? "",
      dayOfMonth,
      meetingJoinUrl: s.meetingJoinUrl ?? null,
      effectiveMeeting: s.effectiveMeeting ?? null,
    };
  });
}
