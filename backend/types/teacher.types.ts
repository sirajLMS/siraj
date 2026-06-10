import type { teacherBankingDetailsHistory, teacherPayments, teachers } from "@/backend/db/schema";

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
