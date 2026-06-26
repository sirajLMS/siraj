import type { teacherBankingDetailsHistory, teacherPayments, teachers } from "@/backend/db/schema";
import type { PageInfo } from "./pagination.types";

export type TeacherEntity = typeof teachers.$inferSelect;
export type TeacherEntityInput = typeof teachers.$inferInsert;

export type TeacherBankingDetailsHistorySelectType = typeof teacherBankingDetailsHistory.$inferSelect;
export type TeacherBankingDetailsHistoryInsertInput = typeof teacherBankingDetailsHistory.$inferInsert;

export type TeacherPaymentSelectType = typeof teacherPayments.$inferSelect;
export type TeacherPaymentInsertInput = typeof teacherPayments.$inferInsert;

export type SubmitBankingDetailsInput = Pick<
  TeacherBankingDetailsHistoryInsertInput,
  "teacherId" | "beneficiaryName" | "bankName" | "accountNumber" | "routingNumber" | "swiftBic" | "iban"
>;

export type VerifyBankingDetailsInput = {
  bankingDetailsId: string;
  verifiedByUserId: string;
};

export type CreateTeacherPaymentInput = {
  teacherId: string;
  amount: string;
  currency: string;
  paymentDate: Date;
  isTestPayment?: boolean;
};

export type TeacherCreateResult = Pick<TeacherEntity, "id" | "userId" | "status" | "timezone" | "createdAt">;

export type TeacherDashboardPaginatedResult = {
  id: string;
  metrics: Record<string, number>;
  scheduleRows: Record<string, unknown>[];
  progressFeed: Record<string, unknown>[];
  totalCount: number;
  pageInfo: PageInfo | null;
};
