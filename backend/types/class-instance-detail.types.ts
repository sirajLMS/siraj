import type { ClassType } from "@/shared/lib/enum";

export type ClassInstancePerformanceReturnType = {
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

export type ClassInstanceDetailReturnType = {
  id: string;
  courseName: string;
  classType: ClassType;
  instanceId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  remarks: string | null;
  hasTimezoneMismatch: boolean;
  studentTimezone: string | null;
  zoomMeetingUrl: string | null;
  payrollCredited: boolean;
  isRescheduled: boolean;
  executionState: string;
  outcome: string;
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
