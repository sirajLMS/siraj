import type { teacherPayments, teachers } from "@/backend/db/schema";
import type {
  AccountStatus,
  ClassExecutionState,
  ClassOutcome,
  ClassType,
  CurrencyCode,
  Gender,
  StudentStatus,
} from "@/backend/enum";
import type { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type { ClassSessionMetrics } from "@/backend/types/scheduling/schedule.types";
import type { PageInfo } from "@/backend/types/shared/pagination.types";

export type TeacherEntity = typeof teachers.$inferSelect;
export type TeacherEntityInput = typeof teachers.$inferInsert;

export type TeacherPaymentSelectType = typeof teacherPayments.$inferSelect;
export type TeacherPaymentInsertInput = typeof teacherPayments.$inferInsert;

export type CreateTeacherPaymentInput = {
  readonly teacherId: string;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly paymentDate: Date;
  readonly userPaymentMethodId: string | null;
  readonly isTestPayment?: boolean;
};

export type TeacherCreateResult = Pick<TeacherEntity, "id" | "userId" | "createdAt"> & {
  readonly status: AccountStatus;
  readonly timezone: IanaTimezone;
};

export type TeacherDashboardScheduleRow = {
  id: string;
  studentId: string;
  studentName: string;
  scheduledStartAt: Date | string;
  scheduledEndAt: Date | string;
  durationMinutes: number;
  executionState: ClassExecutionState;
  outcome: ClassOutcome | null;
  meetingJoinUrl: string | null;
  yourTimeFormatted: string | null;
  isFrozen: boolean;
};

export type TeacherProgressFeedEventKind =
  | "auto_missed"
  | "marked_absent"
  | "activated"
  | "started"
  | "completed"
  | "leave"
  | "other";

export type TeacherProgressFeedItem = {
  id: string;
  studentId: string;
  studentName: string;
  scheduledTimeFormatted: string | null;
  durationMinutes: number | null;
  eventKind: TeacherProgressFeedEventKind;
  occurredAt: Date;
};

export type TeacherDashboardPaginatedResult = {
  id: string;
  metrics: ClassSessionMetrics;
  scheduleRows: TeacherDashboardScheduleRow[];
  progressFeed: TeacherProgressFeedItem[];
  totalCount: number;
  pageInfo: PageInfo | null;
};

export type TeacherProfileReturnType = Omit<
  TeacherEntity,
  | "userId"
  | "status"
  | "gender"
  | "nationality"
  | "countryCode"
  | "paymentMethod"
  | "timezone"
  | "timezoneId"
  | "createdAt"
  | "dateOfBirth"
  | "updatedAt"
> & {
  userId: string;
  name: string;
  email: string;
  status: AccountStatus;
  gender: Gender | null;
  dateOfBirth: string | null;
  updatedAt: string;
  timezone: IanaTimezone;
  totalClasses: number;
  avgEngagementScore: number;
};

export type TeacherProfileUpdateInputType = Partial<
  Omit<
    TeacherEntityInput,
    "id" | "userId" | "createdAt" | "updatedAt" | "nationality" | "countryCode" | "gender" | "paymentMethod"
  >
> & {
  readonly status?: AccountStatus | null;
  readonly gender?: Gender | null;
  readonly timezone?: IanaTimezone | null;
};

export type TeacherDirectoryRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: AccountStatus;
};

export type TeacherDirectoryMetrics = {
  id: string;
  activated: number;
  deactivated: number;
};

export type TeacherDirectoryReturnType = {
  id: string;
  metrics: TeacherDirectoryMetrics;
  rows: TeacherDirectoryRow[];
  totalTeachers: number;
  pageInfo: PageInfo | null;
};

export type TeacherAssignedStudentReturnType = {
  id: string;
  name: string;
  studentAvatarUrl: string | null;
  parentId: string | null;
  parentUserId: string | null;
  parentName: string | null;
  parentAvatarUrl: string | null;
  className: string | null;
  status: StudentStatus;
  hoursPerWeek: number;
  classesRemaining: number;
  classesTotal: number;
};

export type TeacherAssignedStudentsResult = {
  rows: TeacherAssignedStudentReturnType[];
  totalCount: number;
};

export type TeacherOwnProfileReturnType = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  timezone: IanaTimezone;
  hourlyRate: string | null;
  rateCurrency: CurrencyCode | null;
  totalClasses: number;
};

export type TeacherOwnProfileUpdateInput = {
  readonly phone?: string | null;
};

export type TeacherAssignedClassReturnType = {
  id: string;
  studentName: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
  executionState: ClassExecutionState;
  outcome: ClassOutcome | null;
  isFrozen: boolean;
  meetingJoinUrl?: string | null;
  effectiveMeeting?: import("@/backend/types/meeting/class-meeting-config.types").EffectiveMeetingReturnType | null;
};

export type TeacherAssignedClassesResult = {
  rows: TeacherAssignedClassReturnType[];
  totalCount: number;
};

export type CreateManualClassEntryInput = {
  studentId: string;
  teacherId: string;
  subjectId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
  classType?: ClassType | null;
};

export type LogSupportRequestInput = {
  reason: string;
};

export type TeacherHandbookUrl = {
  id: string;
  url: string;
};

export type TeacherSimple = {
  id: string;
  name: string;
  avatarUrl: string | null;
};
