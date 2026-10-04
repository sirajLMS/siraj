import { and, eq, isNotNull } from "drizzle-orm";
import { type db, queryDb } from "@/backend/db";
import { creditTransactions, students } from "@/backend/db/schema";
import { CreditReason } from "@/backend/enum";
import { DomainError } from "@/backend/lib/errors";
import type { DBTransaction } from "@/backend/types";

type ReadExecutor = DBTransaction | typeof db;

type StudentScope = {
  targetStudentId: string;
  executor: ReadExecutor | undefined;
};

/**
 * Resolves the polymorphic (tx | studentId) argument pair used by balance
 * getters, where the first argument may itself carry the student id.
 */
export function resolveStudentScope(tx: ReadExecutor | string | undefined, studentId?: string): StudentScope {
  const targetStudentId = studentId ?? (typeof tx === "string" ? tx : undefined);
  if (!targetStudentId) {
    throw new DomainError("INVALID_ARGS", "studentId is required when tx is not a string");
  }
  return { targetStudentId, executor: typeof tx === "string" ? undefined : tx };
}

/**
 * Resolves the polymorphic (tx | studentId) pair for ledger reads that require
 * a student id, rejecting the case where neither argument supplies one.
 */
export function resolveStudentArgPair(
  tx: ReadExecutor | string,
  studentId: string | undefined
): { executor: ReadExecutor | undefined; studentId: string } {
  const executor = typeof tx === "string" ? undefined : tx;
  const resolvedStudentId = typeof tx === "string" ? tx : studentId;
  if (typeof resolvedStudentId !== "string") {
    throw new DomainError("INVALID_ARGS", "studentId must be a string when tx is not a string");
  }
  return { executor, studentId: resolvedStudentId };
}

/** Shared quota row fetch backing both the class-count and hour balance getters. */
export async function fetchStudentQuotaRow(executor: ReadExecutor | undefined, targetStudentId: string) {
  const q = queryDb(executor);
  const [row] = await q
    .select({
      classesTotal: students.classesTotal,
      classesRemaining: students.classesRemaining,
      creditHoursTotal: students.creditHoursTotal,
      creditHoursRemaining: students.creditHoursRemaining,
    })
    .from(students)
    .where(eq(students.id, targetStudentId))
    .limit(1);
  return row;
}

/** Type guard: narrows unknown to CreditReason by checking against enum values. */
export const isCreditReason = (value: unknown): value is CreditReason =>
  typeof value === "string" && (Object.values(CreditReason) as readonly string[]).includes(value);

/**
 * Builds the student ledger filter, optionally narrowing to hour-based parallel
 * ledger rows (XOR: exactly one of changeAmount / changeAmountHours is set).
 */
export function buildStudentLedgerFilter(studentId: string, hoursOnly?: boolean) {
  return hoursOnly
    ? and(eq(creditTransactions.studentId, studentId), isNotNull(creditTransactions.changeAmountHours))
    : eq(creditTransactions.studentId, studentId);
}

export type { ReadExecutor };
