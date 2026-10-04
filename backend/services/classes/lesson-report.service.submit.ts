import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { LessonReportRepository } from "@/backend/db/repo/classes/lesson-report.repository";
import { classInstances } from "@/backend/db/schema";
import { AppPermission, LessonReportStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import {
  dispatchLessonReportSubmitted,
  requireClassInstanceOwnedByTeacher,
  requirePermission,
  resolveTeacherIdForUser,
  resolveUserDisplayName,
  toReturnType,
  validateLessonReportInput,
} from "@/backend/services/classes/lesson-report.service.helpers";
import type { LessonReportReturnType, LessonReportSubmitInput } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export async function submitReportFlow(
  actorUserId: string,
  input: LessonReportSubmitInput,
  locale?: string
): Promise<LessonReportReturnType> {
  await requirePermission(actorUserId, AppPermission.LESSON_REPORTS_SUBMIT, locale);
  const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

  validateLessonReportInput(input.completionPercentage, input.durationMinutes, tErrors.invalidInput);

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
  if (instance.executionState !== "COMPLETED") {
    throw new Error(tErrors.lessonReport.notEligibleForReview);
  }

  // Idempotency: at most one report per class instance
  const existing = await LessonReportRepository.findByClassInstanceId(input.classInstanceId);
  if (existing) {
    throw new Error(tErrors.lessonReport.alreadyExists);
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
    throw new Error(tErrors.lessonReport.createFailed, { cause: error });
  }
}
