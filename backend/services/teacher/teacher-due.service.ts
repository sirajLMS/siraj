import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import { RecurringScheduleRepository } from "@/backend/db/repo/scheduling/recurring-schedule.repository";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { TeacherDueRepository } from "@/backend/db/repo/teachers/teacher-due.repository";
import { classInstances } from "@/backend/db/schema";
import { AppPermission, type CurrencyCode, RateSource, TeacherDueStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { invalidateClassLifecycle } from "@/backend/services/cache";
import { resolveClassRate } from "@/backend/services/pricing/rate-resolver.service";
import type {
  TeacherDueInsertType,
  TeacherDueReturnType,
  TeacherDueSelectType,
  TeacherMonthlyReportReturnType,
  TeacherPendingDuesSummaryReturnType,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export namespace TeacherDueService {
  async function assertCanViewDues(actorUserId: string, teacherId: string, locale?: string): Promise<void> {
    const canViewAll = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_DUES_VIEW);
    if (canViewAll) return;

    const ownTeacher = await TeacherRepository.findByUserId(actorUserId);
    if (ownTeacher?.id === teacherId) return;

    const t = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(t.unauthorizedAction);
  }

  export async function createDueEntry(
    classInstanceId: string,
    teacherId: string,
    studentId: string,
    approvedByUserId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherDueReturnType> {
    logger.info("Creating teacher due entry", { classInstanceId, teacherId, studentId });

    const executor = tx ?? db;

    const [classInstance] = await executor
      .select()
      .from(classInstances)
      .where(eq(classInstances.id, classInstanceId))
      .limit(1);
    if (!classInstance) {
      const t = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(t.scheduling.classInstanceNotFound({ id: classInstanceId }));
    }

    const teacher = await TeacherRepository.findById(teacherId, tx);
    if (!teacher) {
      const t = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(t.teacher.teacherNotFound(teacherId));
    }

    // Resolve the effective hourly rate using the 4-tier precedence cascade:
    //   instance override > recurring schedule > subject > teacher.
    // The recurring schedule and subject are loaded within the same executor
    // (tx) so the resolution is consistent with the surrounding transaction.
    const recurringScheduleRow = classInstance.recurringScheduleId
      ? await RecurringScheduleRepository.findById(classInstance.recurringScheduleId, tx)
      : null;

    let subject: Awaited<ReturnType<typeof ClassSubjectRepository.getSubjectById>> | null = null;
    try {
      subject = await ClassSubjectRepository.getSubjectById(classInstance.subjectId, undefined, tx);
    } catch {
      // Subject may have been soft-deleted; fall back to teacher rate.
    }

    const resolved = resolveClassRate({
      classInstance,
      recurringSchedule: recurringScheduleRow?.schedule ?? null,
      subject,
      teacher,
    });

    const hourlyRateStr = resolved.hourlyRate;
    const rateCurrency = resolved.currency;
    const rateSource: RateSource = resolved.source;
    const durationMinutes = classInstance.durationMinutes;
    const hours = +(durationMinutes / 60).toFixed(2);
    const amount = +(Number.parseFloat(hourlyRateStr) * hours).toFixed(2);

    const insertPayload: TeacherDueInsertType = {
      teacherId,
      classInstanceId,
      studentId,
      hours: String(hours),
      amount: String(amount),
      currency: rateCurrency,
      rateSource,
      status: TeacherDueStatus.PENDING,
      approvedByUserId,
      teacherPaymentId: null,
    };

    const row: TeacherDueSelectType = await TeacherDueRepository.create(insertPayload, tx);

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
  }): Promise<TeacherDueReturnType | null> {
    const existing = await TeacherDueRepository.findByClassInstanceId(input.classInstanceId, input.tx);
    if (existing) {
      return existing;
    }

    if (input.hours <= 0) throw new Error("hours must be greater than 0");
    if (input.amount < 0) throw new Error("amount must be non-negative");

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

    const row: TeacherDueSelectType = await TeacherDueRepository.create(insertPayload, input.tx);
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
    const rows = await TeacherDueRepository.getPendingDues(teacherId);
    return rows;
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
    const updated = await TeacherDueRepository.markAsPaid([...dueIds], teacherPaymentId);

    try {
      const teacherIds = [...new Set(updated.map(d => d.teacherId))];
      await Promise.all(teacherIds.map(tid => invalidateClassLifecycle(tid, undefined)));
    } catch (cacheErr) {
      logger.error("Failed to invalidate class lifecycle tags after marking dues as paid", { error: cacheErr });
    }

    return updated;
  }
}
