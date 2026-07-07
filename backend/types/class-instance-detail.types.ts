import type { classInstances } from "@/backend/db/schema/scheduling";
import type { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/lib/enum";

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

export type ClassInstanceDetailReturnType = Omit<ClassInstanceSelectType,
  "deletedAt" | "createdAt" | "updatedAt"
> & {
  classType: ClassType | null;
  instanceId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: ClassExecutionState | null;
  remarks: string | null;
  hasTimezoneMismatch: boolean;
  studentTimezone: string | null;
  teacherTimezone: string | null;
  zoomMeetingUrl: string | null;
  payrollCredited: boolean;
  isRescheduled: boolean;
  executionState: ClassExecutionState | null;
  outcome: ClassOutcome | null;
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
