import type { TeacherScheduleRow } from "@/frontend/common/types/shared.types";

interface RawRow {
  readonly id?: string | null;
  readonly studentId?: string | null;
  readonly studentName?: string | null;
  readonly scheduledStartAt?: string | Date | null;
  readonly durationMinutes?: number | null;
  readonly executionState?: string | null;
  readonly outcome?: string | null;
  readonly zoomMeetingUrl?: string | null;
  readonly yourTimeFormatted?: string | null;
}

type ScheduleRowStatus = "upcoming" | "completed" | "missed" | "activated" | "active";

const COMPLETED_OUTCOMES = new Set(["TAKEN", "COMPLETED"]);
const MISSED_OUTCOMES = new Set(["ABSENT", "LEAVE", "CANCELLED", "MISSED"]);

function resolveRowStatus(row: RawRow): ScheduleRowStatus {
  if (row.outcome && COMPLETED_OUTCOMES.has(row.outcome)) return "completed";
  if (row.outcome && MISSED_OUTCOMES.has(row.outcome)) return "missed";
  if (row.executionState === "ACTIVATED") return "activated";
  if (row.executionState === "IN_PROGRESS") return "active";
  return "upcoming";
}

function buildStudentInitials(studentName: string | null | undefined): string {
  if (!studentName) return "ST";
  return studentName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function captureTimestamp(): number {
  return Date.now();
}

export function mapRows(rows: readonly RawRow[] | null | undefined, todayDateStr: string): TeacherScheduleRow[] {
  if (!rows) return [];
  return rows.map((row, idx) => {
    const startAt = new Date(row.scheduledStartAt ?? todayDateStr);
    const endAt = new Date(startAt.getTime() + (row.durationMinutes ?? 60) * 60000);
    const startWindow = new Date(startAt.getTime() - 5 * 60000);
    const now = new Date();
    const status = resolveRowStatus(row);
    const activateEnabled = now >= startWindow && now <= endAt && row.executionState === "NOT_ACTIVATED";
    const isLiveRow = row.executionState === "ACTIVATED" || row.executionState === "IN_PROGRESS";

    return {
      id: row.id ?? `row-${idx}`,
      rowNumber: idx + 1,
      classId: row.id ?? "",
      studentId: row.studentId ?? "",
      studentName: row.studentName ?? "Unknown",
      studentInitials: buildStudentInitials(row.studentName),
      timeRange: row.yourTimeFormatted ?? startAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status,
      videoEnabled: Boolean(row.zoomMeetingUrl),
      activateEnabled,
      durationMinutes: row.durationMinutes ?? undefined,
      meetingJoinUrl: row.zoomMeetingUrl ?? null,
      isLive: isLiveRow,
      isCurrent: isLiveRow,
    };
  });
}
