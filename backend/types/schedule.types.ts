import type { SupportContactReturnType, TeacherImportantNoteReturnType } from "./teacher-notes.types";

export type ClassSessionMetrics = {
  id?: string;
  total: number;
  regular: number;
  trial: number;
  advance: number;
  rescheduled: number;
  suspended: number;
  taken: number;
  pending: number;
  activated: number;
  running: number;
  absent: number;
  leave: number;
};

export type RescheduleClassInputType = {
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
};

export type SupportRequestResultReturnType = {
  id: string;
  success: boolean;
};

export type LeaveProcessResultReturnType = {
  id: string;
  completedInstanceId: string;
  rescheduledInstanceId: string;
};

export type FutureClassReturnType = {
  id: string;
  courseName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isRescheduled: boolean;
  leaveRequestDisabled: boolean;
  leaveRequestDisabledReason: string | null;
  studentCount: number;
  location: string;
  subjectId?: string | null;
  subjectName?: string | null;
  classType?: string | null;
  zoomMeetingUrl?: string | null;
};

export type TeacherFutureScheduleReturnType = {
  id: string;
  leaveQuotaUsed: number;
  leaveQuotaTotal: number;
  totalClasses: number;
  classes: FutureClassReturnType[];
  importantNotes: TeacherImportantNoteReturnType[];
  supportContact: SupportContactReturnType | null;
};

export type WeeklyScheduleClassReturnType = {
  id: string;
  studentName: string;
  studentId: string;
  duration: number;
  startTime: string;
  day: string;
  executionState: string | null;
  outcome: string | null;
  subjectId?: string | null;
  subjectName?: string | null;
  classType?: string | null;
};

export type WeeklyScheduleGridReturnType = {
  id: string;
  teacherId: string;
  weekStart: string;
  weekEnd: string;
  classes: WeeklyScheduleClassReturnType[];
  teacherName?: string | null;
};

export type WeeklyWorkloadMetricsReturnType = {
  id: string;
  weeklyHoursWorked: string;
  totalMinutes: number;
  classCount: number;
};
