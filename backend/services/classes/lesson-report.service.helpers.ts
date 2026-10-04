import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { LessonReportRepository } from "@/backend/db/repo/classes/lesson-report.repository";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { classInstances, teachers } from "@/backend/db/schema";
import { AppPermission, AttendanceEvaluation, LessonReportStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { dispatchWithPreferences } from "@/backend/services/notification/notification-dispatch.helpers";
import {
  buildLessonReportReviewedPayloads,
  buildLessonReportSubmittedPayloads,
} from "@/backend/services/notification/notification-payloads.builders";
import type { DBTransaction, LessonReportReturnType, LessonReportSelectType, PaginationArgs } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

function isLessonReportStatus(value: string): value is LessonReportStatus {
  return (Object.values(LessonReportStatus) as readonly string[]).includes(value);
}

function isAttendanceEvaluation(value: string): value is AttendanceEvaluation {
  return (Object.values(AttendanceEvaluation) as readonly string[]).includes(value);
}

function assertLessonReportStatus(value: string): LessonReportStatus {
  if (!isLessonReportStatus(value)) {
    throw new Error(`Unexpected LessonReportStatus: ${value}`);
  }
  return value;
}

function assertAttendanceEvaluation(value: string): AttendanceEvaluation {
  if (!isAttendanceEvaluation(value)) {
    throw new Error(`Unexpected AttendanceEvaluation: ${value}`);
  }
  return value;
}

export function toReturnType(
  row: LessonReportSelectType & {
    teacherName?: string | null;
    studentName?: string | null;
    subjectName?: string | null;
    classAvatarUrl?: string | null;
  }
): LessonReportReturnType {
  return {
    ...row,
    status: assertLessonReportStatus(row.status),
    attendanceEvaluation: assertAttendanceEvaluation(row.attendanceEvaluation),
    teacherName: row.teacherName ?? null,
    studentName: row.studentName ?? null,
    subjectName: row.subjectName ?? null,
    classAvatarUrl: row.classAvatarUrl ?? null,
  };
}

export async function requirePermission(
  actorUserId: string,
  permission: AppPermission,
  locale?: string
): Promise<void> {
  const has = await PermissionsService.hasPermission(actorUserId, permission);
  if (!has) {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(tErrors.unauthorized);
  }
}

export async function requireClassInstanceOwnedByTeacher(
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
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(tErrors.lessonReport.notEligibleForReview);
  }
}

export async function resolveTeacherIdForUser(userId: string, locale?: string): Promise<string> {
  const [teacher] = await db.select({ id: teachers.id }).from(teachers).where(eq(teachers.userId, userId)).limit(1);
  if (!teacher) {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(tErrors.teacher.teacherNotFound(userId));
  }
  return teacher.id;
}

export async function resolveUserDisplayName(userId: string): Promise<string> {
  const user = await UserRepository.findById(userId);
  return user?.name ?? "—";
}

/**
 * Validates common lesson report input fields.
 * Throws error with the provided error message if validation fails.
 */
export function validateLessonReportInput(
  completionPercentage: number,
  durationMinutes: number,
  invalidInputError: string
): void {
  if (completionPercentage < 0 || completionPercentage > 100) {
    throw new Error(invalidInputError);
  }
  if (durationMinutes <= 0) {
    throw new Error(invalidInputError);
  }
}

/**
 * Validates rejection reason based on lesson report status.
 * Throws error if validation fails.
 */
export function validateRejectionReason(
  status: LessonReportStatus,
  rejectionReason: string | null | undefined,
  tErrors: {
    rejectedReportsRequireReason: string;
    approvedReportsNoRejectionReason: string;
  }
): void {
  if (status === LessonReportStatus.REJECTED && (!rejectionReason || rejectionReason.trim().length === 0)) {
    throw new Error(tErrors.rejectedReportsRequireReason);
  }
  if (status === LessonReportStatus.APPROVED && rejectionReason) {
    throw new Error(tErrors.approvedReportsNoRejectionReason);
  }
}

/**
 * Notify users with `LESSON_REPORTS_REVIEW` that a report was submitted.
 * Fire-and-forget: dispatch failure must not roll back the submit.
 */
export async function dispatchLessonReportSubmitted(
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

export async function fetchPaginatedReports(
  actorUserId: string,
  locale: string | undefined,
  findFn: (paginationArgs: PaginationArgs) => Promise<LessonReportSelectType[]>,
  countFn: () => Promise<number>,
  paginationArgs: PaginationArgs,
  permission: AppPermission = AppPermission.LESSON_REPORTS_REVIEW
): Promise<{ rows: LessonReportReturnType[]; totalCount: number }> {
  await requirePermission(actorUserId, permission, locale);
  const [rows, totalCount] = await Promise.all([findFn(paginationArgs), countFn()]);
  return { rows: rows.map(toReturnType), totalCount };
}

interface TransitionReportStatusOptions {
  actorUserId: string;
  reportId: string;
  newStatus: LessonReportStatus;
  locale?: string;
  approvePermission: AppPermission;
  rejectPermission: AppPermission;
  sideEffect: (tx: DBTransaction, report: LessonReportSelectType) => Promise<void>;
  successLogMessage: string;
  dispatchDecision: "approved" | "rejected";
  rejectionReason?: string | null;
}

/**
 * Generic function to transition a lesson report status (APPROVED/REJECTED).
 * Handles permission check, validation, transaction, side effects, logging, and notification.
 */
export async function transitionReportStatus(options: TransitionReportStatusOptions): Promise<LessonReportReturnType> {
  const {
    actorUserId,
    reportId,
    newStatus,
    locale,
    approvePermission,
    rejectPermission,
    sideEffect,
    successLogMessage,
    dispatchDecision,
    rejectionReason,
  } = options;
  const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

  // Check appropriate permission based on the target status
  const requiredPermission = newStatus === LessonReportStatus.APPROVED ? approvePermission : rejectPermission;
  await requirePermission(actorUserId, requiredPermission, locale);

  const report = await LessonReportRepository.findById(reportId);
  if (!report) {
    throw new Error(tErrors.lessonReport.notFound);
  }
  if (report.status !== "PENDING_REVIEW") {
    throw new Error(tErrors.lessonReport.alreadyReviewed);
  }

  // Validate rejection reason using shared helper
  validateRejectionReason(newStatus, rejectionReason, tErrors);

  // Wrap the status transition + side effect in a single transaction
  const updated = await db.transaction(async tx => {
    const statusUpdated = await LessonReportRepository.updateStatus(
      reportId,
      newStatus,
      actorUserId,
      rejectionReason ?? null,
      tx
    );

    await sideEffect(tx, report);

    return statusUpdated;
  });

  logger.info(successLogMessage, {
    reportId,
    classInstanceId: report.classInstanceId,
    teacherId: report.teacherId,
    studentId: report.studentId,
    actorUserId,
  });

  await dispatchLessonReportReviewed(report, dispatchDecision, locale);

  return toReturnType(updated);
}
