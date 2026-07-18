import type {
  ClassExecutionState,
  ClassOutcome,
  EffectiveMeeting,
  LessonReportStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";

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
  readonly effectiveMeeting: EffectiveMeeting | null;
}

export interface RecentLessonReportRow {
  readonly id: string;
  readonly classInstanceId: string | null;
  readonly teacherName: string | null;
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
