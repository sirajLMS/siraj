import type { ClassExecutionState, ClassOutcome, ClassType } from "@/backend/enum";
import type { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type { EffectiveMeetingReturnType } from "@/backend/types/meeting/class-meeting-config.types";
import type {
  SupportContactReturnType,
  TeacherImportantNoteReturnType,
} from "@/backend/types/teachers/teacher-notes.types";

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
  classType?: ClassType | null;
  meetingJoinUrl?: string | null;
  avatarUrl?: string | null;
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
  executionState: ClassExecutionState | null;
  outcome: ClassOutcome | null;
  subjectId?: string | null;
  subjectName?: string | null;
  classType?: ClassType | null;
  meetingJoinUrl?: string | null;
  effectiveMeeting?: EffectiveMeetingReturnType | null;
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

export type DailyScheduleListUserItem = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

export type DailyScheduleListReturnType = {
  id: string;
  studentTime: string;
  teacherTime: string;
  yourTime: string;
  duration: number;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  status: ClassExecutionState;
  outcome: ClassOutcome;
  executionState: ClassExecutionState;
  student: DailyScheduleListUserItem;
  teacher: DailyScheduleListUserItem;
  courseName?: string | null;
  avatarUrl?: string | null;
  teacherTimezone?: IanaTimezone | null;
  studentTimezone?: IanaTimezone | null;
  meetingJoinUrl?: string | null;
  effectiveMeeting?: EffectiveMeetingReturnType | null;
};

export type AdminDashboardScheduleInputType = {
  date: string;
  teacherId?: string | null;
  search?: string | null;
  metricFilter?: string | null;
  paginationArgs?: import("@/backend/types/shared/pagination.types").PaginationInput | null;
};

export type AdminDashboardScheduleReturnType = {
  id: string;
  totalCount: number;
  metrics: ClassSessionMetrics;
  rows: DailyScheduleListReturnType[];
  pageInfo: import("@/backend/types/shared/pagination.types").PageInfo | null;
};

export type StatusTrackingScheduleRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentInitials: string;
  studentAvatarUrl?: string | null;
  studentStatus: import("@/backend/enum").StudentStatus;
  teacherId: string;
  teacherName: string;
  teacherAvatarUrl?: string | null;
  courseName?: string | null;
  avatarUrl?: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: ClassExecutionState;
  outcome: ClassOutcome;
  isFrozen: boolean;
  meetingJoinUrl?: string | null;
  effectiveMeeting?: import("@/backend/types/meeting/class-meeting-config.types").EffectiveMeetingReturnType | null;
};
