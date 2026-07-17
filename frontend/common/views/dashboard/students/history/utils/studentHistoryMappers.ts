import type {
  StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_metrics_StudentHistoryMetrics,
  StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_sessions_StudentHistorySession,
} from "@/frontend/common/graphql/generated/gql/operations";
import type {
  StudentHistoryMetrics,
  StudentHistorySessionRow,
} from "@/frontend/common/views/dashboard/students/history/types";

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
    | undefined
): readonly StudentHistorySessionRow[] {
  if (!sessions) return [];
  return sessions.map(s => ({
    id: s.id ?? "",
    title: s.title ?? "",
    time: s.time ?? "",
    duration: s.duration ?? 0,
    status: s.status ?? "",
    outcome: s.outcome ?? "",
    isFrozen: s.isFrozen ?? false,
    instructor: s.instructor ?? "",
    timeSlot: s.timeSlot ?? "",
    room: s.room ?? "",
    notes: s.notes ?? "",
    dayOfMonth: s.dayOfMonth ?? 0,
    meetingJoinUrl: s.meetingJoinUrl ?? null,
    effectiveMeeting: s.effectiveMeeting ?? null,
  }));
}
