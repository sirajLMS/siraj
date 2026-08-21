import type {
  ClassExecutionState,
  ClassOutcome,
  EffectiveMeetingFieldsFragment,
  LessonReportStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";

export interface UpcomingLessonRow {
  readonly id: string;
  readonly instructor: string;
  readonly teacherId: string | null;
  readonly scheduledStartAt: string | null;
  readonly scheduledEndAt: string | null;
  readonly durationMinutes: number;
  readonly executionState: ClassExecutionState | null;
  readonly outcome: ClassOutcome | null;
  readonly isFrozen: boolean;
  readonly meetingJoinUrl: string | null;
  readonly effectiveMeeting: EffectiveMeetingFieldsFragment | null;
}

export interface RecentLessonReportRow {
  readonly id: string;
  readonly classInstanceId: string | null;
  readonly subjectName: string | null;
  readonly classAvatarUrl: string | null;
  readonly teacherId: string | null;
  readonly teacherName: string | null;
  readonly teacherAvatarUrl: string | null;
  readonly lessonDate: string | null;
  readonly durationMinutes: number;
  readonly status: LessonReportStatus | null;
  readonly completionPercentage: number;
  readonly attendanceEvaluation: string | null;
  readonly teacherNotes: string | null;
  readonly studentNotes: string | null;
}

export interface StudentCreditBalanceRow {
  readonly classesRemaining: number;
  readonly classesTotal: number;
}
