import type {
  leaveQuotaUsage,
  leaveRequests,
  recurringScheduleDays,
  recurringSchedules,
  timezones,
} from "@/backend/db/schema";
import type {
  DayOfWeek,
  LeaveRequestStatus,
  OnDemandNoCreditsOutcome,
  RateSource,
  RescheduleDateLabel,
  SchedulingMode,
  StudentStatus,
} from "@/backend/enum";
import type {
  ClassInstancePerformanceSelectType,
  ClassInstanceSelectType,
  EffectiveMeetingReturnType,
  PageInfo,
  PaginationArgs,
  StudentSelectType,
  TeacherSelectType,
  UserSelectType,
} from "@/backend/types";
import type { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/constants/class-instance-detail.enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import type { DailyScheduleMetricsCounts } from "@/shared/lib/schedule/schedule-instance-dashboard-status";

export type RecurringScheduleSelectType = typeof recurringSchedules.$inferSelect;
type RecurringScheduleInsertType = typeof recurringSchedules.$inferInsert;

export type RecurringScheduleDaySelectType = typeof recurringScheduleDays.$inferSelect;
export type RecurringScheduleDayInsertType = typeof recurringScheduleDays.$inferInsert;

type DailyScheduleTeacher = TeacherSelectType & { user: UserSelectType };

export type DailyScheduleResult = Omit<
  ClassInstanceSelectType,
  "deletedAt" | "createdAt" | "updatedAt" | "idempotencyKey"
> & {
  courseName: string | null;
  avatarUrl?: string | null;
  instanceId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: ClassExecutionState;
  remarks: string | null;
  hasTimezoneMismatch: boolean;
  studentTimezone: IanaTimezone | null;
  teacherTimezone: IanaTimezone | null;
  performance: ClassInstancePerformanceSelectType | null;
  student?: StudentSelectType;
  teacher?: DailyScheduleTeacher;
  yourTimeFormatted?: string;
};

export type AdminDashboardScheduleRepoInput = {
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

export type LeaveQuotaUsageSelectType = typeof leaveQuotaUsage.$inferSelect;

export type LeaveRequestSelectType = typeof leaveRequests.$inferSelect;
type LeaveRequestInsertType = typeof leaveRequests.$inferInsert;

export type CreateLeaveRequestInput = Omit<LeaveRequestInsertType, "id">;

export type RequestSessionDelayInput = {
  classInstanceId: string;
  proposedStartAt: Date;
  reason?: string | null;
};

export type RequestSessionCancelInput = {
  classInstanceId: string;
  reason?: string | null;
};

export type UpsertStudentLeaveQuotaInput = {
  studentId: string;
  periodYear: number;
  periodMonth: number;
  usedCount: number;
};

export type TimezoneSelectType = typeof timezones.$inferSelect;

export type TimezoneUpsertInput = {
  ianaId: string;
  baseOffsetMinutes: number;
  isDstSupported?: boolean;
};

export type SettingsTimezonesPaginatedResult = {
  readonly id: string;
  readonly rows: TimezoneSelectType[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
};

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
  dayOfWeek: DayOfWeek;
  startTime: string;
  isActive: boolean;
};

export type CreateRecurringClassInput = {
  studentId: string;
  teacherId: string;
  subjectId: string;
  durationMinutes: number;
  defaultStartTime: string;
  timezone: IanaTimezone;
  timezoneId?: number | null;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  days: RecurringClassDayInput[];
  classType?: ClassType | null;
  generateInstancesForWeeks?: number | null;
  /** Recurring-class-level hourly rate (highest non-override tier). Nullable. */
  hourlyRate?: string | null;
  /** Currency for `hourlyRate`. Required when `hourlyRate` is set. */
  rateCurrency?: CurrencyCode | null;
  quotaId?: string | null;
  earmarkedClasses?: number | null;
  schedulingMode?: SchedulingMode | null;
  generationHorizonWeeks?: number | null;
  ondemandNoCreditsOutcome?: OnDemandNoCreditsOutcome | null;
  /** Optional locale forwarded to `dispatchWithPreferences` for i18n. */
  locale?: string;
};

export type CreateRecurringClassReturnType = {
  id: string;
  recurringScheduleId: string;
  classInstanceIds: string[];
  classInstanceCount: number;
  meetingUrl: string | null;
};

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
  executionState?: ClassExecutionState | null;
  outcome?: ClassOutcome | null;
};

export type WeeklyScheduleGridRow = {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  dayOfWeek: DayOfWeek;
  executionState: ClassExecutionState;
  outcome: ClassOutcome | null;
  isFrozen: boolean;
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
  effectiveMeeting?: EffectiveMeetingReturnType | null;
};

export type UpcomingClassRow = {
  id: string;
  instructor: string;
  teacherId: string;
  teacherAvatarUrl: string | null;
  subjectId: string | null;
  subjectName: string | null;
  avatarUrl: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: ClassExecutionState;
  outcome: ClassOutcome | null;
  isFrozen: boolean;
};

export type TeacherAssignedClassRow = {
  id: string;
  studentId: string;
  studentName: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: ClassExecutionState;
  outcome: ClassOutcome | null;
  isFrozen: boolean;
};

/**
 * Repo-level input for creating a recurring schedule with class instances.
 *
 * Distinct from {@link CreateRecurringClassInput} which is the service-layer
 * input shape (uses `IanaTimezone`, `string` dates, etc.). This repo-level
 * type uses raw `string`/`Date` shapes that align with the DB insertion.
 */
export interface CreateRecurringScheduleInput {
  studentId: string;
  teacherId: string;
  subjectId: string;
  durationMinutes: number;
  defaultStartTime: string;
  timezone: string;
  timezoneId?: number | null;
  effectiveFrom?: Date | null;
  effectiveUntil?: Date | null;
  days: {
    dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
    startTime: string;
    isActive: boolean;
  }[];
  classType?: "REGULAR" | "TRIAL" | "ADVANCE";
  generateInstancesForWeeks?: number;
  quotaDeducted?: boolean;
  /** Recurring-class-level hourly rate (highest non-override tier). Nullable. */
  hourlyRate?: string | null;
  /** Currency for `hourlyRate`. Required when `hourlyRate` is set. */
  rateCurrency?: CurrencyCode | null;
  quotaId?: string | null;
  earmarkedClasses?: number | null;
  schedulingMode?: SchedulingMode | null;
  generationHorizonWeeks?: number | null;
  ondemandNoCreditsOutcome?: OnDemandNoCreditsOutcome | null;
}

/**
 * Captured rate snapshot (amount + currency + source) frozen at booking time
 * so future rate changes don't affect already-scheduled classes.
 *
 * Related to {@link ResolvedClassRate} in `rate-resolver.types.ts`, but uses
 * the raw `rateAmount`/`rateCurrency` field names that match DB columns.
 */
export interface RateSnapshot {
  rateAmount: string;
  rateCurrency: CurrencyCode;
  rateSource: RateSource;
}

export type RecurringScheduleUpsertInput = Omit<
  RecurringScheduleInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
> & { studentId: string };

export type RecurringScheduleDayUpsertInput = {
  recurringScheduleId: string;
  dayOfWeek: RecurringScheduleDayInsertType["dayOfWeek"];
  startTime: string;
  isActive: boolean;
};
