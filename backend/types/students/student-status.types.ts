import type { StudentStatus } from "@/backend/enum";
import type { EffectiveMeetingReturnType } from "@/backend/types/meeting/class-meeting-config.types";
import type { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";

export interface StudentUpcomingClass {
  readonly id: string;
  readonly instructor: string;
  readonly teacherId: string;
  readonly teacherAvatarUrl: string | null;
  readonly subjectId: string | null;
  readonly subjectName: string | null;
  readonly avatarUrl: string | null;
  readonly scheduledStartAt: Date;
  readonly scheduledEndAt: Date;
  readonly durationMinutes: number;
  readonly executionState: ClassExecutionState;
  readonly outcome: ClassOutcome;
  readonly isFrozen: boolean;
  readonly meetingJoinUrl?: string | null;
  readonly effectiveMeeting?: EffectiveMeetingReturnType | null;
}

export interface StudentUpcomingClassesResult {
  readonly id: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly status: StudentStatus;
  readonly classes: StudentUpcomingClass[];
}
