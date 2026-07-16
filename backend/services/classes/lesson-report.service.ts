import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { LessonReportRepository, type PendingReviewFilters } from "@/backend/db/repo/classes/lesson-report.repository";
import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { classInstances, teachers } from "@/backend/db/schema";
import { AppPermission, type AttendanceEvaluation, ClassExecutionState, LessonReportStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  LessonReportReturnType,
  LessonReportSelectType,
  LessonReportSubmitInput,
  LessonReviewInput,
  PendingReviewCountReturnType,
} from "@/backend/types";
import type { PaginationArgs } from "@/backend/types/shared/pagination.types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/**
 * Service for the lesson report workflow (submit / review / approve / reject).
 *
 * State machine:
 *   submitReport   → PENDING_REVIEW
 *   approveReport  → PENDING_REVIEW → APPROVED
 *   rejectReport   → PENDING_REVIEW → REJECTED
 *
 * Side effects (wired in later work streams):
 *   - approveReport: TeacherDuesService.createDueEntry(classInstanceId, actorUserId, tx)  (Work Stream 4)
 *   - rejectReport:  CreditService.refundOnCancel(studentId, classInstanceId, actorUserId, idempotencyKey, tx)  (Work Stream 2)
 */
export namespace LessonReportService {
  function toReturnType(row: LessonReportSelectType): LessonReportReturnType {
    return {
      ...row,
      status: row.status as LessonReportStatus,
      attendanceEvaluation: row.attendanceEvaluation as AttendanceEvaluation,
    };
  }

  async function requirePermission(actorUserId: string, permission: AppPermission, locale?: string): Promise<void> {
    const has = await PermissionsService.hasPermission(actorUserId, permission);
    if (!has) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.unauthorized);
    }
  }

  async function requireClassInstanceOwnedByTeacher(
    classInstanceId: string,
    teacherId: string,
    locale?: string
  ): Promise<void> {
    const [instance] = await db
      .select({ id: classInstances.id, teacherId: classInstances.teacherId })
      .from(classInstances)
      .where(eq(classInstances.id, classInstanceId))
      .limit(1);
    if (!instance) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.scheduling.classInstanceNotFound({ id: classInstanceId }));
    }
    if (instance.teacherId !== teacherId) {
      throw new Error("lessonReport.notEligibleForReview");
    }
  }

  async function resolveTeacherIdForUser(userId: string, locale?: string): Promise<string> {
    const [teacher] = await db.select({ id: teachers.id }).from(teachers).where(eq(teachers.userId, userId)).limit(1);
    if (!teacher) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.teacher.teacherNotFound(userId));
    }
    return teacher.id;
  }

  export async function submitReport(
    actorUserId: string,
    input: LessonReportSubmitInput,
    locale?: string
  ): Promise<LessonReportReturnType> {
    await requirePermission(actorUserId, AppPermission.LESSON_REPORTS_SUBMIT, locale);
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    if (input.completionPercentage < 0 || input.completionPercentage > 100) {
      throw new Error(tErrors.invalidInput);
    }
    if (input.durationMinutes <= 0) {
      throw new Error(tErrors.invalidInput);
    }

    const teacherId = await resolveTeacherIdForUser(actorUserId, locale);
    await requireClassInstanceOwnedByTeacher(input.classInstanceId, teacherId, locale);

    // Validate class instance is in COMPLETED state
    const [instance] = await db
      .select({
        executionState: classInstances.executionState,
        studentId: classInstances.studentId,
        scheduledStartAt: classInstances.scheduledStartAt,
        durationMinutes: classInstances.durationMinutes,
      })
      .from(classInstances)
      .where(eq(classInstances.id, input.classInstanceId))
      .limit(1);
    if (!instance) {
      throw new Error(tErrors.scheduling.classInstanceNotFound({ id: input.classInstanceId }));
    }
    if (instance.executionState !== ClassExecutionState.COMPLETED) {
      throw new Error("lessonReport.notEligibleForReview");
    }

    // Idempotency: at most one report per class instance
    const existing = await LessonReportRepository.findByClassInstanceId(input.classInstanceId);
    if (existing) {
      throw new Error("lessonReport.alreadyExists");
    }

    const idempotencyKey = `lesson-report:${input.classInstanceId}`;
    const now = new Date();
    try {
      const created = await LessonReportRepository.create({
        classInstanceId: input.classInstanceId,
        studentId: instance.studentId,
        teacherId,
        lessonDate: instance.scheduledStartAt,
        durationMinutes: input.durationMinutes,
        attendanceEvaluation: input.attendanceEvaluation,
        teacherNotes: input.teacherNotes ?? null,
        completionPercentage: input.completionPercentage,
        status: LessonReportStatus.PENDING_REVIEW,
        submittedByUserId: actorUserId,
        submittedAt: now,
        reviewedByUserId: null,
        reviewedAt: null,
        rejectionReason: null,
        idempotencyKey,
        createdAt: now,
        updatedAt: now,
      });
      return toReturnType(created);
    } catch (error) {
      logger.error("Failed to submit lesson report", { classInstanceId: input.classInstanceId, error });
      throw new Error("lessonReport.createFailed", { cause: error });
    }
  }

  /**
   * Seed-only bootstrap: idempotent insert of a lesson report (skipping
   * permission checks and teacher-ownership resolution — the caller is
   * responsible for passing valid ids). Lets the seeder create reports in a
   * mix of PENDING_REVIEW / APPROVED / REJECTED statuses without going through
   * the public submit/approve/reject APIs. Returns the existing report row
   * if one is already linked to the class instance.
   */
  export async function seedLessonReportIfMissing(input: {
    classInstanceId: string;
    studentId: string;
    teacherId: string;
    lessonDate: Date;
    durationMinutes: number;
    attendanceEvaluation: AttendanceEvaluation;
    teacherNotes?: string | null;
    completionPercentage: number;
    status: LessonReportStatus;
    submittedByUserId: string;
    reviewedByUserId?: string | null;
    reviewedAt?: Date | null;
    rejectionReason?: string | null;
    idempotencyKey?: string;
  }): Promise<LessonReportReturnType | null> {
    const existing = await LessonReportRepository.findByClassInstanceId(input.classInstanceId);
    if (existing) {
      return toReturnType(existing);
    }

    if (input.completionPercentage < 0 || input.completionPercentage > 100) {
      throw new Error("completionPercentage must be between 0 and 100");
    }
    if (input.durationMinutes <= 0) {
      throw new Error("durationMinutes must be greater than 0");
    }
    if (
      input.status === LessonReportStatus.REJECTED &&
      (!input.rejectionReason || input.rejectionReason.trim() === "")
    ) {
      throw new Error("REJECTED reports must include a rejectionReason");
    }
    if (input.status === LessonReportStatus.APPROVED && input.rejectionReason) {
      throw new Error("APPROVED reports must not include a rejectionReason");
    }

    const now = new Date();
    const created = await LessonReportRepository.create({
      classInstanceId: input.classInstanceId,
      studentId: input.studentId,
      teacherId: input.teacherId,
      lessonDate: input.lessonDate,
      durationMinutes: input.durationMinutes,
      attendanceEvaluation: input.attendanceEvaluation,
      teacherNotes: input.teacherNotes ?? null,
      completionPercentage: input.completionPercentage,
      status: input.status,
      submittedByUserId: input.submittedByUserId,
      submittedAt: now,
      reviewedByUserId: input.reviewedByUserId ?? null,
      reviewedAt: input.reviewedAt ?? null,
      rejectionReason: input.rejectionReason ?? null,
      idempotencyKey: input.idempotencyKey ?? `seed-lesson-report:${input.classInstanceId}`,
      createdAt: now,
      updatedAt: now,
    });

    return toReturnType(created);
  }

  export async function getPendingReviews(
    actorUserId: string,
    filters: PendingReviewFilters,
    paginationArgs: PaginationArgs,
    locale?: string
  ): Promise<{ rows: LessonReportReturnType[]; totalCount: number }> {
    await requirePermission(actorUserId, AppPermission.LESSON_REPORTS_REVIEW, locale);
    const [rows, totalCount] = await Promise.all([
      LessonReportRepository.findPendingReviews(filters, paginationArgs),
      LessonReportRepository.countPendingReviews(filters),
    ]);
    return { rows: rows.map(toReturnType), totalCount };
  }

  export async function approveReport(
    actorUserId: string,
    reportId: string,
    locale?: string
  ): Promise<LessonReportReturnType> {
    await requirePermission(actorUserId, AppPermission.LESSON_REPORTS_APPROVE, locale);

    const report = await LessonReportRepository.findById(reportId);
    if (!report) {
      throw new Error("lessonReport.notFound");
    }
    if (report.status !== LessonReportStatus.PENDING_REVIEW) {
      throw new Error("lessonReport.alreadyReviewed");
    }

    const updated = await LessonReportRepository.updateStatus(reportId, LessonReportStatus.APPROVED, actorUserId, null);

    // Trigger side effect: create a teacher due entry.
    // Wired in Work Stream 4: TeacherDuesService.createDueEntry(report.classInstanceId, actorUserId, tx)

    return toReturnType(updated);
  }

  export async function rejectReport(
    actorUserId: string,
    input: LessonReviewInput,
    locale?: string
  ): Promise<LessonReportReturnType> {
    await requirePermission(actorUserId, AppPermission.LESSON_REPORTS_REJECT, locale);
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    const report = await LessonReportRepository.findById(input.reportId);
    if (!report) {
      throw new Error("lessonReport.notFound");
    }
    if (report.status !== LessonReportStatus.PENDING_REVIEW) {
      throw new Error("lessonReport.alreadyReviewed");
    }
    if (!input.rejectionReason || input.rejectionReason.trim().length === 0) {
      throw new Error(tErrors.invalidInput);
    }

    const updated = await LessonReportRepository.updateStatus(
      input.reportId,
      LessonReportStatus.REJECTED,
      actorUserId,
      input.rejectionReason
    );

    // Trigger side effect: refund the student's reserved credit.
    // Wired in Work Stream 2: CreditService.refundOnCancel(report.studentId, report.classInstanceId, actorUserId, report.idempotencyKey, tx)

    return toReturnType(updated);
  }

  export async function getReportByClassId(
    actorUserId: string,
    classInstanceId: string,
    locale?: string
  ): Promise<LessonReportReturnType | null> {
    await requirePermission(actorUserId, AppPermission.LESSON_REPORTS_REVIEW, locale);
    const row = await LessonReportRepository.findByClassInstanceId(classInstanceId);
    return row ? toReturnType(row) : null;
  }

  export async function getPendingReviewCount(
    actorUserId: string,
    filters?: PendingReviewFilters,
    locale?: string
  ): Promise<PendingReviewCountReturnType> {
    await requirePermission(actorUserId, AppPermission.LESSON_REPORTS_REVIEW, locale);
    const pendingCount = await LessonReportRepository.countPendingReviews(filters);
    return { pendingCount };
  }

  export async function submitStudentReflection(
    actorUserId: string,
    classInstanceId: string,
    studentNotes: string,
    locale?: string
  ): Promise<LessonReportReturnType> {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENT_VIEW_OWN_DASHBOARD);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    if (!studentNotes || studentNotes.trim().length === 0) {
      throw new Error(tErrors.invalidInput);
    }

    const report = await LessonReportRepository.findByClassInstanceId(classInstanceId);
    if (!report) {
      throw new Error("lessonReport.notFound");
    }

    const studentId = await StudentRepository.getStudentIdByUserId(actorUserId);
    if (!studentId || studentId !== report.studentId) {
      throw new Error(tErrors.unauthorizedAction);
    }

    const updated = await LessonReportRepository.updateStudentNotes(classInstanceId, studentNotes);
    if (!updated) {
      throw new Error("lessonReport.notFound");
    }

    return toReturnType(updated);
  }
}
