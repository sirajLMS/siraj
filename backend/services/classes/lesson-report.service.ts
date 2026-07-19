import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { LessonReportRepository, type PendingReviewFilters } from "@/backend/db/repo/classes/lesson-report.repository";
import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { classInstances, teachers } from "@/backend/db/schema";
import { AppPermission, type AttendanceEvaluation, ClassExecutionState, LessonReportStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CreditService } from "@/backend/services/billing/credit.service";
import { dispatchWithPreferences } from "@/backend/services/notification/notification-dispatch.helpers";
import {
  buildLessonReportReviewedPayloads,
  buildLessonReportSubmittedPayloads,
} from "@/backend/services/notification/notification-payloads.builders";
import { TeacherDueService } from "@/backend/services/teacher/teacher-due.service";
import type {
  LessonReportReturnType,
  LessonReportSelectType,
  LessonReportSubmitInput,
  LessonReviewInput,
  PendingReviewCountReturnType,
} from "@/backend/types";
import type { PaginationArgs } from "@/backend/types/shared/pagination.types";
import { getServerTranslations } from "@/shared/locale";

/**
 * Service for the lesson report workflow (submit / review / approve / reject).
 *
 * State machine:
 *   submitReport   → PENDING_REVIEW
 *   approveReport  → PENDING_REVIEW → APPROVED    (side effect: TeacherDueService.createDueEntry)
 *   rejectReport   → PENDING_REVIEW → REJECTED    (side effect: CreditService.refundOnCancel)
 */
export namespace LessonReportService {
  function toReturnType(
    row: LessonReportSelectType & { teacherName?: string | null; studentName?: string | null }
  ): LessonReportReturnType {
    return {
      ...row,
      status: row.status as LessonReportStatus,
      attendanceEvaluation: row.attendanceEvaluation as AttendanceEvaluation,
      teacherName: row.teacherName ?? null,
      studentName: row.studentName ?? null,
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

  async function resolveUserDisplayName(userId: string): Promise<string> {
    const user = await UserRepository.findById(userId);
    return user?.name ?? "—";
  }

  /**
   * Notify users with `LESSON_REPORTS_REVIEW` that a report was submitted.
   * Fire-and-forget: dispatch failure must not roll back the submit.
   */
  async function dispatchLessonReportSubmitted(
    report: LessonReportSelectType,
    teacherName: string,
    locale?: string
  ): Promise<void> {
    const reviewerUserIds = await PermissionsService.getUserIdsWithPermission(AppPermission.LESSON_REPORTS_REVIEW);
    const affectedUserIds = reviewerUserIds.filter(id => id !== report.submittedByUserId);
    if (affectedUserIds.length === 0) return;

    const payloads = buildLessonReportSubmittedPayloads(report.id, affectedUserIds, locale, {
      teacherName,
      classInstanceId: report.classInstanceId,
    });
    await dispatchWithPreferences(payloads, affectedUserIds, locale).catch(err => {
      logger.error("Lesson-report-submitted notification dispatch failed", {
        reportId: report.id,
        classInstanceId: report.classInstanceId,
        err,
      });
    });
  }

  /**
   * Notify the submitting teacher that their report was approved or rejected.
   * Fire-and-forget: dispatch failure must not roll back the review.
   */
  async function dispatchLessonReportReviewed(
    report: LessonReportSelectType,
    decision: "approved" | "rejected",
    locale?: string
  ): Promise<void> {
    const teacherUserId = report.submittedByUserId;
    if (!teacherUserId) return;

    const teacherName = await resolveUserDisplayName(teacherUserId);
    const payloads = buildLessonReportReviewedPayloads(report.id, teacherUserId, decision, locale, {
      teacherName,
      classInstanceId: report.classInstanceId,
    });
    await dispatchWithPreferences(payloads, [teacherUserId], locale).catch(err => {
      logger.error("Lesson-report-reviewed notification dispatch failed", {
        reportId: report.id,
        decision,
        teacherUserId,
        err,
      });
    });
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

      const teacherName = await resolveUserDisplayName(actorUserId);
      await dispatchLessonReportSubmitted(created, teacherName, locale);

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
      if (
        input.reviewedByUserId &&
        existing.reviewedByUserId &&
        existing.reviewedByUserId !== input.reviewedByUserId
      ) {
        const updated = await LessonReportRepository.updateReviewedBy(
          existing.id,
          input.reviewedByUserId,
          input.reviewedAt ?? existing.reviewedAt
        );
        return toReturnType(updated);
      }
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

    // Wrap the status transition + teacher-due creation in a single transaction so
    // the side effect only commits if the report flips to APPROVED successfully,
    // and vice-versa (avoids orphan dues on a rollback).
    const updated = await db.transaction(async tx => {
      const approved = await LessonReportRepository.updateStatus(
        reportId,
        LessonReportStatus.APPROVED,
        actorUserId,
        null,
        tx
      );

      // Side effect (Work Stream 4): create a TeacherDue row so the teacher is
      // owed for this approved lesson. Idempotent at the DB level via the
      // unique (class_instance_id) index on teacher_dues.
      await TeacherDueService.createDueEntry(
        report.classInstanceId,
        report.teacherId,
        report.studentId,
        actorUserId,
        tx,
        locale
      );

      return approved;
    });

    logger.info("Lesson report approved and teacher due entry created", {
      reportId,
      classInstanceId: report.classInstanceId,
      teacherId: report.teacherId,
      actorUserId,
    });

    await dispatchLessonReportReviewed(report, "approved", locale);

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

    // Wrap the status transition + credit refund in a single transaction so a
    // refund failure rolls back the rejection (and a rejection failure never
    // leaves a dangling refund).
    const updated = await db.transaction(async tx => {
      const rejected = await LessonReportRepository.updateStatus(
        input.reportId,
        LessonReportStatus.REJECTED,
        actorUserId,
        input.rejectionReason ?? null,
        tx
      );

      // Side effect (Work Stream 2): refund the student's reserved credit for
      // the rejected lesson. The refund is idempotent on the booking key
      // (derived from classInstanceId), so re-running approve/reject cycles
      // never double-refunds.
      const refundIdempotencyKey = `credit-refund:${report.classInstanceId}`;
      await CreditService.refundOnCancel(
        report.studentId,
        report.classInstanceId,
        actorUserId,
        refundIdempotencyKey,
        tx,
        tErrors
      );

      return rejected;
    });

    logger.info("Lesson report rejected and credit refunded", {
      reportId: input.reportId,
      classInstanceId: report.classInstanceId,
      studentId: report.studentId,
      actorUserId,
    });

    await dispatchLessonReportReviewed(report, "rejected", locale);

    return toReturnType(updated);
  }

  export async function getReportById(
    actorUserId: string,
    reportId: string,
    locale?: string
  ): Promise<LessonReportReturnType | null> {
    await requirePermission(actorUserId, AppPermission.LESSON_REPORTS_REVIEW, locale);
    const row = await LessonReportRepository.findById(reportId);
    return row ? toReturnType(row) : null;
  }

  /**
   * Return the most-recently APPROVED lesson reports for the supervisor
   * dashboard's "Recent Approvals" panel. Supervisors need
   * LESSON_REPORTS_REVIEW permission (already covers read access). Limited to
   * a small `limit` (defaults to 5) — callers should never request more than
   * 50 to keep the response payload small.
   */
  export async function getRecentApprovedLessonReports(
    actorUserId: string,
    limit = 5,
    locale?: string
  ): Promise<LessonReportReturnType[]> {
    await requirePermission(actorUserId, AppPermission.LESSON_REPORTS_REVIEW, locale);
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const rows = await LessonReportRepository.findRecentApproved(safeLimit);
    return rows.map(toReturnType);
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
