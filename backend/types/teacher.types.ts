import type { teacherBankingDetailsHistory, teacherPayments, teachers } from "@/backend/db/schema";
import type { AccountStatus, ClassExecutionState, ClassOutcome, Gender, PaymentMethod } from "@/shared/lib/enum";
import type { PageInfo } from "./pagination.types";
import type { ClassSessionMetrics } from "./schedule.types";

export type TeacherEntity = typeof teachers.$inferSelect;
export type TeacherEntityInput = typeof teachers.$inferInsert;

export type TeacherBankingDetailsHistorySelectType = typeof teacherBankingDetailsHistory.$inferSelect;
export type TeacherBankingDetailsHistoryInsertInput = typeof teacherBankingDetailsHistory.$inferInsert;

/** BankingDetailsHistoryReturnType removed — was unused. Re-create from TeacherBankingDetailsHistorySelectType if needed (Omit sensitive fields: accountNumber, routingNumber, swiftBic, iban, beneficiaryName). */

export type TeacherPaymentSelectType = typeof teacherPayments.$inferSelect;
export type TeacherPaymentInsertInput = typeof teacherPayments.$inferInsert;

// TeacherPaymentReturnType removed — was unused. Re-create from TeacherPaymentSelectType if needed (Omit bankingDetailsHistoryId).

export type SubmitBankingDetailsInput = Pick<
  TeacherBankingDetailsHistoryInsertInput,
  "teacherId" | "beneficiaryName" | "bankName" | "accountNumber" | "routingNumber" | "swiftBic" | "iban"
>;

export type VerifyBankingDetailsInput = {
  bankingDetailsId: string;
};

export type CreateTeacherPaymentInput = {
  teacherId: string;
  amount: string;
  currency: string;
  paymentDate: Date;
  isTestPayment?: boolean;
};

export type TeacherCreateResult = Pick<TeacherEntity, "id" | "userId" | "status" | "timezone" | "createdAt">;

export type TeacherDashboardScheduleRow = {
  id: string;
  studentId: string;
  studentName: string;
  scheduledStartAt: Date | string;
  durationMinutes: number;
  executionState: ClassExecutionState;
  outcome: ClassOutcome | null;
  zoomMeetingUrl: string | null;
  yourTimeFormatted: string | null;
};

export type TeacherProgressFeedItem = {
  id: string;
  title: string;
  type: string;
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
  | "timezoneId"
  | "zoomPassword"
  | "createdAt"
  | "dateOfBirth"
  | "updatedAt"
> & {
  userId: string;
  name: string;
  email: string;
  status: AccountStatus;
  gender: Gender | null;
  paymentMethod: PaymentMethod | null;
  dateOfBirth: string | null;
  updatedAt: string;
  totalClasses: number;
  avgEngagementScore: number;
};

export type TeacherProfileUpdateInputType = Partial<
  Omit<
    TeacherEntityInput,
    | "id"
    | "userId"
    | "status"
    | "createdAt"
    | "updatedAt"
    | "nationality"
    | "countryCode"
    | "timezoneId"
    | "gender"
    | "paymentMethod"
    | "timezone"
  >
> & {
  readonly gender?: Gender | null;
  readonly paymentMethod?: PaymentMethod | null;
  readonly timezone?: string | null;
};

export type TeacherDirectoryRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: AccountStatus;
  zoomLink: string | null;
};

export type TeacherDirectoryMetrics = {
  id: string;
  activated: number;
  deactivated: number;
};
