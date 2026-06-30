import type { BookingStatus, ClassExecutionState, ClassOutcome, ParentStatus } from "@/shared/lib/enum";
import type { PageInfo } from "./pagination.types";

export type ParentEntity = typeof import("@/backend/db/schema").parents.$inferSelect;

export type ParentEntityInput = typeof import("@/backend/db/schema").parents.$inferInsert;

export type ParentCreateResult = Pick<
  ParentEntity,
  "id" | "userId" | "status" | "invoiceType" | "feeAmount" | "paymentMethod" | "currency" | "timezone" | "createdAt"
>;

export type ParentDirectoryMetrics = {
  activated: number;
  deactivated: number;
  regular: number;
  onLeave: number;
  suspended: number;
  onTrial: number;
};

export type ParentDirectoryRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: ParentStatus;
  updatedAt: Date;
  unpaidInvoices: number;
};

export type ParentDirectoryResult = {
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
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  bookingStatus: BookingStatus;
  executionState: ClassExecutionState;
  outcome: ClassOutcome;
  zoomMeetingUrl: string | null;
  classTimeFormatted: string;
};

export type ParentDashboardScheduleInput = {
  date?: string | null;
  search?: string | null;
};

export type ParentDashboardSchedulePaginatedResult = {
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
