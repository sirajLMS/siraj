import type { teacherPayments, teachers } from "@/backend/db/schema";
import type { AccountStatus, Gender, StudentStatus, TeacherProgressFeedEventKind } from "@/backend/enum";
import type {
  ClassSessionMetrics,
  DisplayAmountReturnType,
  EffectiveMeetingReturnType,
  PageInfo,
} from "@/backend/types";
import type { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/constants/class-instance-detail.enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

export type TeacherSelectType = typeof teachers.$inferSelect;
export type TeacherInsertType = typeof teachers.$inferInsert;

export type TeacherPaymentSelectType = typeof teacherPayments.$inferSelect;
export type TeacherPaymentInsertType = typeof teacherPayments.$inferInsert;

export type TeacherPaymentReturnType = TeacherPaymentSelectType & {
  readonly displayAmount?: DisplayAmountReturnType | null;
};

export type CreateTeacherPaymentInput = {
  readonly teacherId: string;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly paymentDate: Date;
  readonly userPaymentMethodId: string | null;
  readonly isTestPayment?: boolean;
};

export type TeacherCreateReturnType = Pick<TeacherSelectType, "id" | "userId" | "createdAt" | "phone" | "gender"> & {
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
  effectiveMeeting: EffectiveMeetingReturnType | null;
  yourTimeFormatted: string | null;
  isFrozen: boolean;
};

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
  TeacherSelectType,
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
  nationality: string | null;
  countryCode: string | null;
  dateOfBirth: string | null;
  updatedAt: string;
  timezone: IanaTimezone;
  totalClasses: number;
  avgEngagementScore: number;
  displayAmount?: DisplayAmountReturnType | null;
};

export type TeacherProfileUpdateInput = Partial<
  Omit<TeacherInsertType, "id" | "userId" | "createdAt" | "updatedAt" | "gender" | "paymentMethod">
> & {
  readonly status?: AccountStatus | null;
  readonly gender?: Gender | null;
  readonly timezone?: IanaTimezone | null;
  readonly nationality?: string | null;
  readonly countryCode?: string | null;
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
  nationality: string | null;
  countryCode: string | null;
  /**
   * National ID, returned UNMASKED to the owner (the teacher editing their own
   * profile). Admin/other-scope views go through `StaffProfileService` which
   * masks the value via `maskNationalId`.
   */
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  address: string | null;
  qualifications: string | null;
  timezone: IanaTimezone;
  hourlyRate: string | null;
  rateCurrency: CurrencyCode | null;
  totalClasses: number;
  displayAmount: DisplayAmountReturnType | null;
};

export type TeacherOwnProfileUpdateInput = {
  readonly phone?: string | null;
  readonly nationality?: string | null;
  readonly countryCode?: string | null;
  /**
   * Teacher's own national ID. Required for a teacher to operate on the system
   * (enforced on first login via the dashboard guard), but admins may leave it
   * unset at creation time. Format is validated against `nationality` via
   * `isValidNationalIdForCountry` in `TeacherPortalService.updateOwnProfile`.
   */
  readonly nationalId?: string | null;
  readonly dateOfBirth?: string | null;
  readonly gender?: Gender | null;
  readonly address?: string | null;
  readonly qualifications?: string | null;
  readonly timezone?: IanaTimezone | null;
};

export type TeacherAssignedClassReturnType = {
  id: string;
  studentId: string;
  studentName: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
  executionState: ClassExecutionState;
  outcome: ClassOutcome | null;
  isFrozen: boolean;
  meetingJoinUrl?: string | null;
  effectiveMeeting?: EffectiveMeetingReturnType | null;
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
