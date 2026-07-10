import type { BookingStatus, ClassExecutionState, ClassOutcome, CurrencyCode, ParentStatus } from "@/backend/enum";
import type { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type { PageInfo } from "@/backend/types/shared/pagination.types";

export type ParentEntity = typeof import("@/backend/db/schema").parents.$inferSelect;

export type ParentEntityInput = typeof import("@/backend/db/schema").parents.$inferInsert;

export type ParentCreateResult = Pick<
  ParentEntity,
  "id" | "userId" | "status" | "invoiceType" | "feeAmount" | "currency" | "displayCurrency" | "createdAt"
> & {
  readonly timezone: IanaTimezone;
};

export type ParentDirectoryMetrics = {
  id: string;
  activated: number;
  deactivated: number;
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
  status: string;
  updatedAt: Date;
  unpaidInvoices: number;
};

/**
 * Raw metrics from the database (used by the repository layer).
 * Does not include the synthetic `id` field that the service layer adds.
 */
export type ParentDirectoryRawMetrics = {
  activated: number;
  deactivated: number;
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
  accountStatus: ParentStatus;
  unpaidInvoices: number;
};

export type ParentDirectoryResult = {
  id: string;
  metrics: ParentDirectoryMetrics;
  rows: ParentDirectoryRow[];
  totalCount: number;
  pageInfo: PageInfo | null;
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
  readonly status: string;
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
  readonly status: string;
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
  readonly timezone: IanaTimezone;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type ParentAssignedStudentReturnType = {
  id: string;
  name: string;
  studentAvatarUrl: string | null;
  status: string;
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
  readonly displayCurrency?: CurrencyCode | null;
  readonly timezone?: IanaTimezone | null;
};

export interface DeactivateParentResult {
  readonly id: string;
  readonly userId: string;
  readonly status: string;
}

export type ParentDocument = {
  id: string;
  fileId: string;
  filePath: string;
  isProtected: boolean;
  usageType: string;
  createdAt: Date;
};
