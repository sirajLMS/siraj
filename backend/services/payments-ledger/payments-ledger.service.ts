import { and, desc, eq, inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { ParentRepository } from "@/backend/db/repo/parents";
import { creditTransactions, invoices, payments, students } from "@/backend/db/schema";
import { AppPermission } from "@/backend/enum";
import { UnauthorizedError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { DBTransaction } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export interface PaymentLedgerEntry {
  id: string;
  studentId: string | null;
  studentName: string | null;
  creditsPurchased: number;
  amount: string;
  currency: string;
  packageName: string | null;
  paymentGateway: string;
  paymentDate: string;
}

export interface PaymentLedgerResult {
  entries: PaymentLedgerEntry[];
  totalCount: number;
}

export namespace PaymentsLedgerService {
  async function resolveCallerStudentIds(callerUserId: string, tx?: DBTransaction): Promise<string[]> {
    // Check if caller is a parent
    const parent = await ParentRepository.findByUserId(callerUserId, tx);
    if (parent) {
      const associated = await ParentRepository.getAssociatedStudents(parent.id, tx);
      return associated.map(s => s.id);
    }

    // Check if caller is a student
    const q = queryDb(tx);
    const [student] = await q
      .select({ id: students.id })
      .from(students)
      .where(eq(students.userId, callerUserId))
      .limit(1);

    return student ? [student.id] : [];
  }

  export async function getMyPaymentsLedger(callerUserId: string, locale?: string): Promise<PaymentLedgerResult> {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    const hasPermission = await PermissionsService.hasPermission(callerUserId, AppPermission.PAYMENTS_LEDGER_VIEW);
    if (!hasPermission) {
      throw new UnauthorizedError(tErrors.insufficientPermissions);
    }

    const studentIds = await resolveCallerStudentIds(callerUserId);
    if (studentIds.length === 0) {
      return { entries: [], totalCount: 0 };
    }

    const q = queryDb();
    const rows = await q
      .select({
        paymentId: payments.id,
        paymentAmount: payments.amount,
        paymentCurrency: payments.currency,
        paymentMethodType: payments.paymentMethodType,
        paymentCreatedAt: payments.createdAt,
        invoiceStudentId: invoices.studentId,
        invoiceType: invoices.invoiceType,
        studentName: students.name,
        creditsPurchased: creditTransactions.changeAmount,
      })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(
        creditTransactions,
        and(eq(creditTransactions.sourcePaymentId, payments.id), eq(creditTransactions.reason, "PURCHASE"))
      )
      .where(inArray(invoices.studentId, studentIds))
      .orderBy(desc(payments.createdAt));

    const entries: PaymentLedgerEntry[] = rows.map(r => ({
      id: r.paymentId,
      studentId: r.invoiceStudentId ?? null,
      studentName: r.studentName ?? null,
      creditsPurchased: r.creditsPurchased ?? 0,
      amount: r.paymentAmount,
      currency: r.paymentCurrency,
      packageName: r.invoiceType ?? null,
      paymentGateway: r.paymentMethodType,
      paymentDate: r.paymentCreatedAt.toISOString(),
    }));

    logger.info("Payments ledger fetched", { callerUserId, entryCount: entries.length });

    return {
      entries,
      totalCount: entries.length,
    };
  }
}
