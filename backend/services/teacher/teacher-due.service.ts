import { db } from "@/backend/db/drizzleDb";
import { TeacherDueRepository } from "@/backend/db/repo/teachers/teacher-due.repository";
import { AppPermission, RateSource, TeacherDueStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { invalidateClassLifecycle } from "@/backend/services/cache";
import {
  accrueDueEntry,
  assertCanViewDues,
  type DueAccrualInput,
  markLinkedInstancesPaid,
} from "@/backend/services/teacher/teacher-due.helpers";
import type {
  DBTransaction,
  TeacherDueInsertType,
  TeacherDueReturnType,
  TeacherMonthlyReportReturnType,
  TeacherPendingDuesSummaryReturnType,
} from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { getServerTranslations } from "@/shared/locale";

export namespace TeacherDueService {
  /**
   * Accrues a teacher due row for an approved lesson report. When the linked
   * class instance carries a calculated payroll snapshot
   * (`CALCULATED` / `PARTIALLY` / `REFUND`), the snapshot's
   * `teacherPaidAmount` / `teacherPaidCurrency` become the authoritative due
   * amount and the rate cascade is skipped; otherwise the legacy
   * rate-resolver path produces the amount and a warning is logged. Either
   * way the instance payroll state moves to `WAITING_PAID` and a
   * `PAYROLL_STATUS_TRANSITION` event is appended — in the same transaction
   * as the due insert.
   */
  export async function createDueEntry(
    classInstanceId: string,
    teacherId: string,
    studentId: string,
    approvedByUserId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherDueReturnType> {
    logger.info("Creating teacher due entry", { classInstanceId, teacherId, studentId });

    const input: DueAccrualInput = { classInstanceId, teacherId, studentId, approvedByUserId, locale };
    // The due row and the payroll lifecycle flip must commit atomically, so a
    // caller without a transaction gets a dedicated one.
    const row = tx ? await accrueDueEntry(tx, input) : await db.transaction(innerTx => accrueDueEntry(innerTx, input));

    try {
      await invalidateClassLifecycle(teacherId, undefined);
    } catch (cacheErr) {
      logger.error("Failed to invalidate class lifecycle tags after creating due entry", {
        teacherId,
        error: cacheErr,
      });
    }

    return row;
  }

  /**
   * Seed-only bootstrap: idempotent insert of a teacher due row for an approved
   * lesson report. Skips permission checks (the seed caller is admin) and
   * allows the caller to specify a PAID status directly with a link to an
   * existing teacher payment id (so paid-out dues are also seeded without
   * needing to go through the public mark-as-paid API). Uses the existing
   * `findByClassInstanceId` helper for idempotency (one due per class instance
   * — enforced by DB unique index).
   */
  export async function seedTeacherDueIfMissing(input: {
    classInstanceId: string;
    teacherId: string;
    studentId: string;
    hours: number;
    amount: number;
    currency: CurrencyCode;
    rateSource?: RateSource;
    approvedByUserId: string;
    status?: TeacherDueStatus;
    teacherPaymentId?: string | null;
    approvedAt?: Date;
    tx?: DBTransaction;
    locale?: string;
  }): Promise<TeacherDueReturnType | null> {
    const existing = await TeacherDueRepository.findByClassInstanceId(input.classInstanceId, input.tx);
    if (existing) {
      return existing;
    }

    const t = getServerTranslations(input.locale ?? "en").errorsTranslations;
    if (input.hours <= 0) throw new Error(t.teacherDue.hoursMustBePositive);
    if (input.amount < 0) throw new Error(t.teacherDue.amountMustBeNonNegative);

    const insertPayload: TeacherDueInsertType = {
      teacherId: input.teacherId,
      classInstanceId: input.classInstanceId,
      studentId: input.studentId,
      hours: input.hours.toFixed(2),
      amount: input.amount.toFixed(2),
      currency: input.currency,
      rateSource: input.rateSource ?? RateSource.TEACHER,
      status: input.status ?? TeacherDueStatus.PENDING,
      approvedByUserId: input.approvedByUserId,
      teacherPaymentId: input.teacherPaymentId ?? null,
      ...(input.approvedAt ? { approvedAt: input.approvedAt } : {}),
    };

    const row = await TeacherDueRepository.create(insertPayload, input.tx);
    return row;
  }

  export async function getMonthlyReport(
    actorUserId: string,
    teacherId: string,
    year: number,
    month: number,
    locale?: string
  ): Promise<TeacherMonthlyReportReturnType> {
    await assertCanViewDues(actorUserId, teacherId, locale);
    return TeacherDueRepository.getMonthlyReport(teacherId, year, month);
  }

  export async function getPendingDues(
    actorUserId: string,
    teacherId: string | undefined,
    locale?: string
  ): Promise<TeacherDueReturnType[]> {
    if (teacherId) {
      await assertCanViewDues(actorUserId, teacherId, locale);
    } else {
      const canViewAll = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_DUES_VIEW);
      if (!canViewAll) {
        const t = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new Error(t.unauthorizedAction);
      }
    }
    return TeacherDueRepository.getPendingDues(teacherId);
  }

  export async function getPendingDuesSummary(
    actorUserId: string,
    locale?: string
  ): Promise<TeacherPendingDuesSummaryReturnType> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_DUES_VIEW);
    if (!hasPermission) {
      const t = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(t.insufficientPermissions);
    }
    return TeacherDueRepository.getPendingDuesSummary();
  }

  /**
   * Marks a batch of dues as paid through a teacher payment. Besides the due
   * status write, every linked instance still awaiting settlement flips to
   * `PAID` with a `PAYROLL_STATUS_TRANSITION` event — all inside one
   * transaction, so a payment is either fully recorded or not at all.
   */
  export async function markAsPaid(
    actorUserId: string,
    dueIds: readonly string[],
    teacherPaymentId: string,
    locale?: string
  ): Promise<TeacherDueReturnType[]> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_DUES_MARK_PAID);
    if (!hasPermission) {
      const t = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(t.insufficientPermissions);
    }

    const updated = await db.transaction(async tx => {
      const dueRows = await TeacherDueRepository.markAsPaid([...dueIds], teacherPaymentId, tx);
      await markLinkedInstancesPaid(tx, dueRows, actorUserId, teacherPaymentId, locale);
      return dueRows;
    });

    try {
      const teacherIds = [...new Set(updated.map(d => d.teacherId))];
      await Promise.all(teacherIds.map(tid => invalidateClassLifecycle(tid, undefined)));
    } catch (cacheErr) {
      logger.error("Failed to invalidate class lifecycle tags after marking dues as paid", { error: cacheErr });
    }

    return updated;
  }
}
