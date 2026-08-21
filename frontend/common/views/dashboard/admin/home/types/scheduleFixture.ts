import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

export interface DailyScheduleRowOverrides {
  readonly id: string;
  readonly yourTime: string;
  readonly teacherTime: string;
  readonly studentTime: string;
  readonly duration: number;
  readonly scheduledStartAt: string;
  readonly scheduledEndAt: string;
  readonly outcome: ClassOutcome;
  readonly executionState: ClassExecutionState;
  readonly student: { readonly id: string; readonly name: string; readonly avatarUrl: string | null };
  readonly teacher: { readonly id: string; readonly name: string; readonly avatarUrl: string | null };
  readonly avatarUrl?: string | null;
  readonly courseName?: string | null;
  readonly teacherTimezone?: IanaTimezone | null;
  readonly studentTimezone?: IanaTimezone | null;
  readonly meetingJoinUrl?: string | null;
  readonly effectiveMeeting?: DailyScheduleRow["effectiveMeeting"];
  readonly isFrozen?: boolean | null;
}

export function createDailyScheduleRow(overrides: DailyScheduleRowOverrides): DailyScheduleRow {
  return {
    id: overrides.id,
    yourTime: overrides.yourTime,
    teacherTime: overrides.teacherTime,
    studentTime: overrides.studentTime,
    duration: overrides.duration,
    scheduledStartAt: overrides.scheduledStartAt,
    scheduledEndAt: overrides.scheduledEndAt,
    outcome: overrides.outcome,
    executionState: overrides.executionState,
    avatarUrl: overrides.avatarUrl ?? null,
    courseName: overrides.courseName ?? null,
    student: overrides.student,
    teacher: overrides.teacher,
    teacherTimezone: overrides.teacherTimezone ?? null,
    studentTimezone: overrides.studentTimezone ?? null,
    meetingJoinUrl: overrides.meetingJoinUrl ?? null,
    effectiveMeeting: overrides.effectiveMeeting ?? null,
    isFrozen: overrides.isFrozen ?? null,
  };
}
