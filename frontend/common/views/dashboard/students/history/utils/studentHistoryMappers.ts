import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  mapStudentHistoryMetricsShared,
  mapStudentHistorySessionsShared,
} from "@/frontend/common/views/dashboard/shared/history/studentHistoryMappersShared";
import type { ClassSession, StudentHistoryMetrics } from "@/frontend/common/views/dashboard/students/history/types";
import { AttendanceStatus } from "@/shared/constants/attendance-status.enum";

const ATTENDANCE_STATUS_VALUES: Readonly<Record<AttendanceStatus, true>> = {
  [AttendanceStatus.PRESENT]: true,
  [AttendanceStatus.ABSENT]: true,
  [AttendanceStatus.LATE]: true,
};

function isAttendanceStatus(value: string): value is AttendanceStatus {
  return value in ATTENDANCE_STATUS_VALUES;
}

function isEffectiveMeeting(value: unknown): value is EffectiveMeetingFieldsFragment {
  return typeof value === "object" && value !== null && "joinUrl" in value;
}

function toClassSession(
  row: ReturnType<typeof mapStudentHistorySessionsShared>[number],
  status: AttendanceStatus
): ClassSession {
  return {
    id: row.id,
    dayOfMonth: row.dayOfMonth,
    title: row.title,
    time: row.time,
    duration: row.duration,
    status,
    outcome: row.outcome === "" ? null : row.outcome,
    isFrozen: row.isFrozen,
    instructor: row.instructor,
    timeSlot: row.timeSlot,
    room: row.room,
    notes: row.notes,
    meetingJoinUrl: row.meetingJoinUrl,
    effectiveMeeting: isEffectiveMeeting(row.effectiveMeeting) ? row.effectiveMeeting : null,
  };
}

export function mapStudentHistoryMetrics(
  metrics: Parameters<typeof mapStudentHistoryMetricsShared>[0]
): StudentHistoryMetrics {
  return mapStudentHistoryMetricsShared(metrics);
}

/**
 * Builds the day-of-month → session map consumed by the history calendar,
 * weekly scroller, and day list. The first session per day wins because the
 * history surface shows a single representative session per calendar day.
 */
export function mapStudentHistoryClassesByDay(
  sessions: Parameters<typeof mapStudentHistorySessionsShared>[0],
  year: number,
  month: number
): Readonly<Partial<Record<number, ClassSession>>> {
  const rows = mapStudentHistorySessionsShared(sessions, year, month);
  const classes: Partial<Record<number, ClassSession>> = {};
  for (const row of rows) {
    if (row.dayOfMonth <= 0 || classes[row.dayOfMonth]) continue;
    const status = isAttendanceStatus(row.status) ? row.status : AttendanceStatus.PRESENT;
    classes[row.dayOfMonth] = toClassSession(row, status);
  }
  return classes;
}
