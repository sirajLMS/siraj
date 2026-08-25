import type { creditTransactions } from "@/backend/db/schema";
import type { CreditReason } from "@/backend/enum";

export type CreditTransactionSelectType = typeof creditTransactions.$inferSelect;
export type CreditTransactionInsertType = typeof creditTransactions.$inferInsert;

export type CreditTransactionReturnType = Omit<CreditTransactionSelectType, "reason"> & {
  reason: CreditReason;
};

export interface CreditTransactionSubmitInput {
  studentId: string;
  hours: number;
  notes?: string | null;
  sourcePaymentId?: string | null;
}

export interface CreditBalanceReturnType {
  studentId: string;
  classesTotal: number;
  classesRemaining: number;
}

