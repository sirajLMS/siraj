import type {
  classInstances,
  leaveQuotaUsage,
  recurringScheduleDays,
  recurringSchedules,
  timezones,
} from "@/backend/db/schema";
import type {
  ClassExecutionState,
  ClassOutcome,
  LeaveRequestStatus,
  RescheduleDateLabel,
  StudentStatus,
} from "@/backend/enum";
import type { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type { ClassInstancePerformanceReturnType } from "@/backend/types/classes/class-instance-detail.types";
import type { PageInfo, PaginationArgs } from "@/backend/types/shared/pagination.types";
import type { StudentEntity } from "@/backend/types/students/student.types";
import type { TeacherEntity } from "@/backend/types/teachers/teacher.types";
import type { UserSelectType } from "@/backend/types/users/user.types";
import type { DailyScheduleMetricsCounts } from "@/shared/lib/schedule/schedule-instance-dashboard-status";

export type RecurringScheduleEntity = typeof recurringSchedules.$inferSelect;
export type RecurringScheduleInsertInput = typeof recurringSchedules.$inferInsert;

export type RecurringScheduleDayEntity = typeof recurringScheduleDays.$inferSelect;
export type RecurringScheduleDayInsertInput = typeof recurringScheduleDays.$inferInsert;

export type ClassInstanceEntity = typeof classInstances.$inferSelect;
export type ClassInstanceInsertInput = typeof classInstances.$inferInsert;

export type DailyScheduleTeacher = TeacherEntity & { user: UserSelectType };

export type DailyScheduleResult = Omit<ClassInstanceEntity, "deletedAt" | "createdAt" | "updatedAt"> & {
  courseName: string | null;
  avatarUrl?: string | null;
  instanceId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: ClassInstanceEntity["executionState"];
  remarks: string | null;
  hasTimezoneMismatch: boolean;
  studentTimezone: IanaTimezone | null;
  teacherTimezone: IanaTimezone | null;
  performance: ClassInstancePerformanceReturnType | null;
  student?: StudentEntity;
  teacher?: DailyScheduleTeacher;
  yourTimeFormatted?: string;
};

export type AdminDashboardScheduleInput = {
  date: Date;
  teacherId?: string;
  search?: string;
  viewerTimezone: IanaTimezone;
  metricFilter?: string;
  pagination?: PaginationArgs | null;
  locale?: string;
};

export type AdminDashboardScheduleResult = {
  metrics: DailyScheduleMetricsCounts;
  rows: DailyScheduleResult[];
  totalCount: number;
  pageInfo: PageInfo | null;
};

export type LeaveQuotaUsageEntity = typeof leaveQuotaUsage.$inferSelect;
export type LeaveQuotaUsageInsertInput = typeof leaveQuotaUsage.$inferInsert;

export type TimezoneEntity = typeof timezones.$inferSelect;

export type TimezoneUpsertInput = {
  ianaId: string;
  baseOffsetMinutes: number;
  isDstSupported?: boolean;
};
export type TimezoneInsertInput = typeof timezones.$inferInsert;

export type RescheduleTrackingRow = {
  id: string;
  originalClassId: string | null;
  teacherId: string;
  teacherName: string;
  teacherAvatarUrl: string | null;
  studentId: string;
  studentName: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  status: LeaveRequestStatus;
  dateLabel: RescheduleDateLabel;
  remarks: string | null;
};

export type RescheduleTrackingInput = {
  search?: string | null;
  status?: LeaveRequestStatus | null;
};

export type RescheduleTrackingPaginatedResult = {
  id?: string;
  rows: RescheduleTrackingRow[];
  totalCount: number;
  pageInfo: PageInfo | null;
};

export type RescheduleTrackingMetrics = {
  id: string;
  pending: number;
  approved: number;
  leave: number;
  rescheduled: number;
  cancelled: number;
};

export type RecurringClassDayInput = {
  dayOfWeek: string;
  startTime: string;
  isActive: boolean;
};

export type CreateRecurringClassInput = {
  studentId: string;
  teacherId: string;
  durationMinutes: number;
  defaultStartTime: string;
  timezone: IanaTimezone;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  days: RecurringClassDayInput[];
  classType?: string | null;
  generateInstancesForWeeks?: number | null;
};

export type CreateRecurringClassReturnType = {
  id: string;
  recurringScheduleId: string;
  classInstanceIds: string[];
  classInstanceCount: number;
};

export type DailyScheduleMetricFilter =
  | "total"
  | "regular"
  | "trial"
  | "advance"
  | "rescheduled"
  | "suspended"
  | "taken"
  | "pending"
  | "activated"
  | "running"
  | "absent"
  | "leave";

export type FutureClassRow = {
  id: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  isRescheduled: boolean;
  studentName: string;
  studentId: string;
  classType?: string | null;
  subjectId?: string | null;
  subjectName?: string | null;
  subjectAvatarUrl?: string | null;
  recurringAvatarUrl?: string | null;
  meetingJoinUrl?: string | null;
  executionState?: string | null;
  outcome?: string | null;
};

export type WeeklyScheduleGridRow = {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  dayOfWeek: string;
  executionState: string;
  outcome: string;
  subjectId?: string | null;
  subjectName?: string | null;
  classType?: string | null;
};

export type WeeklyWorkloadMetrics = {
  totalMinutes: number;
  totalHoursFormatted: string;
  classCount: number;
};

export type StatusTrackingRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentInitials: string;
  studentAvatarUrl: string | null;
  studentStatus: StudentStatus;
  teacherId: string;
  teacherName: string;
  teacherAvatarUrl: string | null;
  courseName: string | null;
  avatarUrl: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: ClassExecutionState;
  outcome: ClassOutcome;
  isFrozen: boolean;
  meetingJoinUrl?: string | null;
  effectiveMeeting?: import("@/backend/types/meeting/class-meeting-config.types").EffectiveMeetingReturnType | null;
};

export type UpcomingClassRow = {
  id: string;
  instructor: string;
  teacherId: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: string;
  outcome: string;
  isFrozen: boolean;
};

export type TeacherAssignedClassRow = {
  id: string;
  studentName: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: string;
  outcome: string | null;
};
