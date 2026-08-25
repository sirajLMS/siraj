import type { AccountStatus, BookingStatus, ParentStatus, StudentStatus } from "@/backend/enum";
import type { DisplayAmountReturnType, EffectiveMeetingReturnType, PageInfo } from "@/backend/types";
import type { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

export type ParentSelectType = typeof import("@/backend/db/schema").parents.$inferSelect;

export type ParentInsertType = typeof import("@/backend/db/schema").parents.$inferInsert;

export type ParentCreateResult = Pick<
  ParentSelectType,
  "id" | "userId" | "status" | "invoiceType" | "feeAmount" | "currency" | "createdAt"
> & {
  readonly timezone: IanaTimezone;
};

export type ParentDirectoryMetrics = {
  id: string;
  regular: number;
  onLeave: number;
  suspended: number;
  onTrial: number;
};

/**
 * Raw row from the database (used by the repository layer).
 * `status` and `updatedAt` are the DB column names; the service layer
 * transforms these into the enriched {@link ParentDirectoryRow}.
 */
export type ParentDirectoryRawRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  lifecycleStatus: string;
  accountStatus: string;
  updatedAt: Date;
  unpaidInvoices: number;
};

/**
 * Raw metrics from the database (used by the repository layer).
 * Does not include the synthetic `id` field that the service layer adds.
 */
export type ParentDirectoryRawMetrics = {
  regular: number;
  onLeave: number;
  suspended: number;
  onTrial: number;
};

export type ParentDirectoryRow = {
  id: string;
  userId: string;
  index: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  guardianOf: string;
  time: string;
  lifecycleStatus: ParentStatus;
  accountStatus: AccountStatus;
  unpaidInvoices: number;
};

export type ParentDirectoryResult = {
  id: string;
  metrics: ParentDirectoryMetrics;
  rows: ParentDirectoryRow[];
  totalCount: number;
  pageInfo: PageInfo | null;
};

/** Lightweight row for parent autocomplete (`parentsDirectory` query). */
export type ParentDirectoryAutocompleteRow = {
  id: string;
  name: string;
  avatarUrl: string | null;
  email: string;
};

export type ParentDashboardScheduleRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentInitials: string;
  studentAvatarUrl: string | null;
  teacherId: string;
  teacherName: string;
  teacherAvatarUrl: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  bookingStatus: BookingStatus;
  executionState: ClassExecutionState;
  outcome: ClassOutcome;
  meetingJoinUrl: string | null;
  effectiveMeeting?: EffectiveMeetingReturnType;
  isFrozen: boolean;
  classTimeFormatted: string;
};

export type ParentDashboardScheduleInput = {
  date?: string | null;
  search?: string | null;
};

export type ParentDashboardSchedulePaginatedResult = {
  id?: string;
  rows: ParentDashboardScheduleRow[];
  totalCount: number;
  pageInfo: PageInfo | null;
};

export type ParentDashboardMetricsType = {
  id: string;
  totalStudents: number;
  todaysClasses: number;
  pendingInvoicesCount: number;
  pendingInvoicesAmount: string;
  performanceAvg: number;
  performanceAvgMobile: number;
  pendingMessages: number;
};

export type StudentProgressReturnType = {
  id: string;
  name: string;
  completionPercent: number;
};

export type WorkshopPromoReturnType = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type ParentDashboardMetricsReturnType = {
  id: string;
  metrics: ParentDashboardMetricsType;
  studentProgress: StudentProgressReturnType[];
  workshopPromo: WorkshopPromoReturnType | null;
};

export interface AssociatedStudentResult {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly status: StudentStatus;
  readonly primaryTeacherId: string | null;
  readonly teacherUserId: string | null;
  readonly teacherName: string | null;
  readonly hoursPerWeek: string;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly language: string | null;
  readonly gender: string | null;
  readonly version: number;
  readonly updatedAt: Date;
}

export interface ParentProfileResult {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly lifecycleStatus: string;
  readonly accountStatus: AccountStatus;
  readonly phone: string | null;
  readonly nationality: string | null;
  readonly address: string | null;
  readonly facebook: string | null;
  readonly whatsapp: string | null;
  readonly twitter: string | null;
  readonly invoiceType: string | null;
  readonly feeAmount: string | null;
  readonly currency: CurrencyCode | null;
  readonly displayCurrency: CurrencyCode | null;
  readonly displayAmount?: DisplayAmountReturnType | null;
  readonly timezone: IanaTimezone;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type ParentAssignedStudentReturnType = {
  id: string;
  name: string;
  studentAvatarUrl: string | null;
  status: StudentStatus;
  primaryTeacherId: string | null;
  teacherUserId: string | null;
  teacherName: string | null;
  teacherAvatarUrl: string | null;
  hoursPerWeek: string;
  classesRemaining: number;
  classesTotal: number;
};

export type ParentAssignedStudentsResult = {
  rows: ParentAssignedStudentReturnType[];
  totalCount: number;
};

export type ParentOwnProfileReturnType = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  address: string | null;
  facebook: string | null;
  whatsapp: string | null;
  twitter: string | null;
};

export type ParentProfileUpdateInput = {
  readonly phone?: string | null;
  readonly nationality?: string | null;
  readonly address?: string | null;
  readonly facebook?: string | null;
  readonly whatsapp?: string | null;
  readonly twitter?: string | null;
  readonly invoiceType?: string | null;
  readonly feeAmount?: string | null;
  readonly currency?: CurrencyCode | null;
  readonly timezone?: IanaTimezone | null;
};

export interface DeactivateParentResult {
  readonly id: string;
  readonly userId: string;
  readonly accountStatus: AccountStatus;
}

export interface ReactivateParentResult {
  readonly id: string;
  readonly userId: string;
  readonly accountStatus: AccountStatus;
}

export interface ChangeParentLifecycleResult {
  readonly id: string;
  readonly lifecycleStatus: ParentStatus;
}
