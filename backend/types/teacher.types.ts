import type { teacherBankingDetailsHistory, teacherPayments, teachers } from "@/backend/db/schema";
import type {
  AccountStatus,
  ClassExecutionState,
  ClassOutcome,
  ClassType,
  Gender,
  PaymentMethod,
  StudentStatus,
} from "@/shared/lib/enum";
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
  scheduledEndAt: Date | string;
  durationMinutes: number;
  executionState: ClassExecutionState;
  outcome: ClassOutcome | null;
  zoomMeetingUrl: string | null;
  yourTimeFormatted: string | null;
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
  timezone: string;
  hourlyRate: string | null;
  rateCurrency: string | null;
  paymentMethod: PaymentMethod | null;
  zoomLink: string | null;
};

export type TeacherOwnProfileUpdateInput = {
  readonly phone?: string | null;
  readonly zoomLink?: string | null;
};

export type TeacherAssignedClassReturnType = {
  id: string;
  studentName: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
  executionState: ClassExecutionState;
  outcome: ClassOutcome | null;
};

export type TeacherAssignedClassesResult = {
  rows: TeacherAssignedClassReturnType[];
  totalCount: number;
};

export type CreateManualClassEntryInput = {
  studentId: string;
  teacherId: string;
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
};
