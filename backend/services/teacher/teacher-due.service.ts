import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { TeacherDueRepository } from "@/backend/db/repo/teachers/teacher-due.repository";
import { classInstances } from "@/backend/db/schema";
import { AppPermission, type CurrencyCode, TeacherDueStatus } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  TeacherDueInsertType,
  TeacherDueReturnType,
  TeacherDueSelectType,
  TeacherMonthlyReportReturnType,
} from "@/backend/types";

export namespace TeacherDueService {
  async function assertCanViewDues(actorUserId: string, teacherId: string, locale?: string): Promise<void> {
    const canViewAll = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_DUES_VIEW);
    if (canViewAll) return;

    const ownTeacher = await TeacherRepository.findByUserId(actorUserId);
    if (ownTeacher && ownTeacher.id === teacherId) return;

    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("unauthorizedAction"));
  }

  export async function createDueEntry(
    classInstanceId: string,
    teacherId: string,
    studentId: string,
    approvedByUserId: string,
    tx?: DBTransaction
  ): Promise<TeacherDueReturnType> {
    logger.info("Creating teacher due entry", { classInstanceId, teacherId, studentId });

    const executor = tx ?? db;

    const [classInstance] = await executor
      .select()
      .from(classInstances)
      .where(eq(classInstances.id, classInstanceId))
      .limit(1);
    if (!classInstance) {
      const t = await getBackendTranslations({ namespace: "errors" });
      throw new Error(t("classInstanceNotFound", { id: classInstanceId }));
    }

    const teacher = await TeacherRepository.findById(teacherId, tx);
    if (!teacher) {
      const t = await getBackendTranslations({ namespace: "errors" });
      throw new Error(t("teacherNotFound", { id: teacherId }));
    }

    const hourlyRateStr = teacher.hourlyRate ?? "0";
    const rateCurrency = (teacher.rateCurrency ?? "SAR") as CurrencyCode;
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
      status: TeacherDueStatus.PENDING,
      approvedByUserId,
      teacherPaymentId: null,
    };

    const row: TeacherDueSelectType = await TeacherDueRepository.create(insertPayload, tx);
    return {
      ...row,
      status: row.status as TeacherDueStatus,
      currency: row.currency as CurrencyCode,
    };
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
    approvedByUserId: string;
    status?: TeacherDueStatus;
    teacherPaymentId?: string | null;
    approvedAt?: Date;
    tx?: DBTransaction;
  }): Promise<TeacherDueReturnType | null> {
    const existing = await TeacherDueRepository.findByClassInstanceId(input.classInstanceId, input.tx);
    if (existing) {
      return {
        ...existing,
        status: existing.status as TeacherDueStatus,
        currency: existing.currency as CurrencyCode,
      };
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
      status: input.status ?? TeacherDueStatus.PENDING,
      approvedByUserId: input.approvedByUserId,
      teacherPaymentId: input.teacherPaymentId ?? null,
      ...(input.approvedAt ? { approvedAt: input.approvedAt } : {}),
    };

    const row: TeacherDueSelectType = await TeacherDueRepository.create(insertPayload, input.tx);
    return {
      ...row,
      status: row.status as TeacherDueStatus,
      currency: row.currency as CurrencyCode,
    };
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
    }
    const rows = await TeacherDueRepository.getPendingDues(teacherId);
    return rows.map(row => ({
      ...row,
      status: row.status as TeacherDueStatus,
      currency: row.currency as CurrencyCode,
    }));
  }
}
