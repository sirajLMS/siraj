import type { classInstances } from "@/backend/db/schema/classes/scheduling";
import type { ClassExecutionState, ClassOutcome, ClassType } from "@/backend/enum";
import type { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type { EffectiveMeetingReturnType } from "@/backend/types/meeting/class-meeting-config.types";
// Foundation types from schema
export type ClassInstanceSelectType = typeof classInstances.$inferSelect;
export type ClassInstanceInsertType = typeof classInstances.$inferInsert;

export type ClassInstancePerformanceReturnType = {
  id: string;
  engagementScore: number | null;
  assessmentProgress: number | null;
  assessmentTotal: number | null;
  focusLevel: string | null;
  sessionHealth: string | null;
  heatmapData: number[] | null;
  latencyMs: number | null;
  authorizationLabel: string | null;
  attendanceRate: number | null;
  avgGrade: string | null;
  lastClassDaysAgo: number | null;
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
  performance: ClassInstancePerformanceReturnType | null;
};

export type ClassStatusEventReturnType = {
  id: string;
  eventType: string;
  description: string | null;
  createdAt: Date | string;
};
