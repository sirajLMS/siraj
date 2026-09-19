import type { classInstances } from "@/backend/db/schema/classes/scheduling";
import type {
  ClassInstancePerformanceSelectType,
  ClassSubjectSelectType,
  EffectiveMeetingReturnType,
  RecurringScheduleSelectType,
  StudentSelectType,
  TeacherSelectType,
  UserSelectType,
} from "@/backend/types";
import type { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/constants/class-instance-detail.enum";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

// Foundation types from schema
export type ClassInstanceSelectType = typeof classInstances.$inferSelect;
export type ClassInstanceInsertType = typeof classInstances.$inferInsert;

/**
 * Insert input accepted by `SchedulingRepository.createClassInstance`.
 * Narrowed so callers cannot set server-managed columns: timestamps
 * (`createdAt`/`updatedAt`), and the quota/rate snapshot columns
 * (`quotaDeducted`, `rateAmount`, `rateCurrency`, `isRateOverridden`,
 * `rateSource`) that are owned exclusively by QuotaService / the
 * rate-resolver cascade and their guarded repository write paths.
 */
export type ClassInstanceCreateInput = Omit<
  ClassInstanceInsertType,
  "createdAt" | "updatedAt" | "quotaDeducted" | "rateAmount" | "rateCurrency" | "isRateOverridden" | "rateSource"
>;

/**
 * Update input accepted by `SchedulingRepository.updateClassInstance`.
 * Same narrowing as `ClassInstanceCreateInput`, applied partially.
 */
export type ClassInstanceUpdateInput = Partial<ClassInstanceCreateInput>;

/**
 * Class instance enriched with the relations joined by
 * `SchedulingRepository.getClassInstanceById` (subject, recurring schedule,
 * student, teacher-with-user, and the resolved avatar URL).
 */
export type ClassInstanceWithRelations = ClassInstanceSelectType & {
  subject?: ClassSubjectSelectType;
  recurring?: RecurringScheduleSelectType;
  avatarUrl: string | null;
  student?: StudentSelectType;
  teacher?: TeacherSelectType & { user: UserSelectType };
};

export type ClassInstanceStudentReturnType = {
  id: string;
  name: string;
  grade: string | null;
  level: string | null;
  avatarUrl: string | null;
};

export type ClassInstanceTeacherReturnType = {
  id: string;
  name: string;
  title: string | null;
  avatarUrl: string | null;
};

export type ClassInstanceDetailReturnType = Omit<
  ClassInstanceSelectType,
  "deletedAt" | "createdAt" | "updatedAt" | "classType" | "executionState" | "outcome"
> & {
  courseName?: string | null;
  classType: ClassType | null;
  instanceId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: ClassExecutionState | null;
  remarks: string | null;
  hasTimezoneMismatch: boolean;
  studentTimezone: IanaTimezone | null;
  teacherTimezone: IanaTimezone | null;
  meetingJoinUrl: string | null;
  effectiveMeeting?: EffectiveMeetingReturnType | null;
  payrollCredited: boolean;
  isRescheduled: boolean;
  executionState: ClassExecutionState | null;
  outcome: ClassOutcome | null;
  avatarUrl?: string | null;
  subjectId: string;
  subjectName: string;
  subjectAvatarUrl: string | null;
  student: ClassInstanceStudentReturnType;
  teacher: ClassInstanceTeacherReturnType;
  performance: ClassInstancePerformanceSelectType | null;
};

export type ClassStatusEventReturnType = {
  id: string;
  eventType: string;
  description: string | null;
  createdAt: Date | string;
};
