import type { ClassExecutionState, ClassOutcome, StudentStatus } from "@/backend/enum";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";
import type { StatusTrackingRow } from "@/backend/types/scheduling.types";

export function mapStatusTrackingQueryRow(r: {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatarUrl: string | null;
  studentStatus: string;
  teacherId: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: string;
  outcome: string;
  isFrozen: boolean;
  teacherUserName: string | null;
  teacherAvatarUrl: string | null;
  subjectName: string | null;
  subjectAvatarUrl: string | null;
  recurringAvatarUrl: string | null;
}): StatusTrackingRow {
  return {
    id: r.id,
    studentId: r.studentId,
    studentName: r.studentName,
    studentInitials: r.studentName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() ?? "")
      .join(""),
    studentAvatarUrl: r.studentAvatarUrl ?? null,
    studentStatus: r.studentStatus as StudentStatus,
    teacherId: r.teacherId,
    teacherName: r.teacherUserName ?? "",
    teacherAvatarUrl: r.teacherAvatarUrl ?? null,
    courseName: r.subjectName ?? null,
    avatarUrl: resolveClassAvatarUrl(r.recurringAvatarUrl, r.subjectAvatarUrl),
    scheduledStartAt: r.scheduledStartAt,
    scheduledEndAt: r.scheduledEndAt,
    durationMinutes: r.durationMinutes,
    executionState: r.executionState as ClassExecutionState,
    outcome: r.outcome as ClassOutcome,
    isFrozen: r.isFrozen,
  };
}
