import { LessonReportRepository } from "@/backend/db/repo/classes/lesson-report.repository";
import { AppPermission, type AttendanceEvaluation, LessonReportStatus } from "@/backend/enum";
import { CreditService } from "@/backend/services/billing/credit.service";
import {
  fetchPaginatedReports,
  requirePermission,
  toReturnType,
  transitionReportStatus,
  validateLessonReportInput,
  validateRejectionReason,
} from "@/backend/services/classes/lesson-report.service.helpers";
import {
  getStudentRecentLessonReportsFlow,
  submitStudentReflectionFlow,
} from "@/backend/services/classes/lesson-report.service.student";
import { submitReportFlow } from "@/backend/services/classes/lesson-report.service.submit";
import { TeacherDueService } from "@/backend/services/teacher/teacher-due.service";
import {
  type LessonReportReturnType,
  type LessonReportSubmitInput,
  type LessonReviewInput,
  PaginationArgs,
  type PendingReviewCountReturnType,
  type PendingReviewFilters,
} from "@/backend/types";
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
  export async function submitReport(
    actorUserId: string,
    input: LessonReportSubmitInput,
    locale?: string
  ): Promise<LessonReportReturnType> {
    return submitReportFlow(actorUserId, input, locale);
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
    locale?: string;
  }): Promise<LessonReportReturnType | null> {
    const existing = await LessonReportRepository.findByClassInstanceId(input.classInstanceId);
    if (existing) {
      if (input.reviewedByUserId && existing.reviewedByUserId && existing.reviewedByUserId !== input.reviewedByUserId) {
        const updated = await LessonReportRepository.updateReviewedBy(
          existing.id,
          input.reviewedByUserId,
          input.reviewedAt ?? existing.reviewedAt
        );
        return toReturnType(updated);
      }
      return toReturnType(existing);
    }

    const tErrors = getServerTranslations(input.locale ?? "en").errorsTranslations;
    validateLessonReportInput(input.completionPercentage, input.durationMinutes, tErrors.invalidInput);
    validateRejectionReason(input.status, input.rejectionReason, tErrors);

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

  export async function approveReport(
    actorUserId: string,
    reportId: string,
    locale?: string
  ): Promise<LessonReportReturnType> {
    return transitionReportStatus({
      actorUserId,
      reportId,
      newStatus: LessonReportStatus.APPROVED,
      locale,
      approvePermission: AppPermission.LESSON_REPORTS_APPROVE,
      rejectPermission: AppPermission.LESSON_REPORTS_REJECT,
      sideEffect: async (tx, report) => {
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
      },
      successLogMessage: "Lesson report approved and teacher due entry created",
      dispatchDecision: "approved",
    });
  }

  export async function rejectReport(
    actorUserId: string,
    input: LessonReviewInput,
    locale?: string
  ): Promise<LessonReportReturnType> {
    return transitionReportStatus({
      actorUserId,
      reportId: input.reportId,
      newStatus: LessonReportStatus.REJECTED,
      locale,
      approvePermission: AppPermission.LESSON_REPORTS_APPROVE,
      rejectPermission: AppPermission.LESSON_REPORTS_REJECT,
      sideEffect: async (tx, report) => {
        // Side effect (Work Stream 2): refund the student's reserved credit for
        // the rejected lesson. The refund is idempotent on the booking key
        // (derived from classInstanceId), so re-running approve/reject cycles
        // never double-refunds.
        const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
        const refundIdempotencyKey = `credit-refund:${report.classInstanceId}`;
        await CreditService.refundOnCancel(
          report.studentId,
          report.classInstanceId,
          actorUserId,
          refundIdempotencyKey,
          tx,
          tErrors
        );
      },
      successLogMessage: "Lesson report rejected and credit refunded",
      dispatchDecision: "rejected",
      rejectionReason: input.rejectionReason,
    });
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
   * Return recently APPROVED lesson reports for the supervisor dashboard's
   * "Recent Approvals" panel. Supervisors need LESSON_REPORTS_REVIEW permission.
   */
  export async function getRecentApprovedLessonReports(
    actorUserId: string,
    paginationArgs: PaginationArgs,
    locale?: string
  ): Promise<{ rows: LessonReportReturnType[]; totalCount: number }> {
    return fetchPaginatedReports(
      actorUserId,
      locale,
      LessonReportRepository.findRecentApproved,
      LessonReportRepository.countRecentApproved,
      paginationArgs
    );
  }

  /**
   * Student portal dashboard: paginated lesson reports for the logged-in student.
   * Requires STUDENT_VIEW_OWN_DASHBOARD; student id is resolved from the actor.
   */
  export async function getStudentRecentLessonReports(
    actorUserId: string,
    paginationArgs: PaginationArgs,
    locale?: string
  ): Promise<{ rows: LessonReportReturnType[]; totalCount: number }> {
    return getStudentRecentLessonReportsFlow(actorUserId, paginationArgs, locale);
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

  export async function getPendingReviews(
    actorUserId: string,
    filters?: PendingReviewFilters,
    paginationArgs?: PaginationArgs,
    locale?: string
  ): Promise<{ rows: LessonReportReturnType[]; totalCount: number }> {
    const resolvedFilters = filters ?? {};
    const resolvedPagination = paginationArgs ?? new PaginationArgs();
    return fetchPaginatedReports(
      actorUserId,
      locale,
      pagination => LessonReportRepository.findPendingReviews(resolvedFilters, pagination),
      () => LessonReportRepository.countPendingReviews(resolvedFilters),
      resolvedPagination
    );
  }

  export async function submitStudentReflection(
    actorUserId: string,
    classInstanceId: string,
    studentNotes: string,
    locale?: string
  ): Promise<LessonReportReturnType> {
    return submitStudentReflectionFlow(actorUserId, classInstanceId, studentNotes, locale);
  }
}
