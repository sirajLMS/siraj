import { LessonReportRepository } from "@/backend/db/repo/classes/lesson-report.repository";
import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { toReturnType } from "@/backend/services/classes/lesson-report.service.helpers";
import type { LessonReportReturnType, PaginationArgs } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

/**
 * Student portal dashboard: paginated lesson reports for the logged-in student.
 * Requires STUDENT_VIEW_OWN_DASHBOARD; student id is resolved from the actor.
 */
export async function getStudentRecentLessonReportsFlow(
  actorUserId: string,
  paginationArgs: PaginationArgs,
  locale?: string
): Promise<{ rows: LessonReportReturnType[]; totalCount: number }> {
  const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

  const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENT_VIEW_OWN_DASHBOARD);
  if (!hasPermission) {
    throw new Error(tErrors.insufficientPermissions);
  }

  const studentId = await StudentRepository.getStudentIdByUserId(actorUserId);
  if (!studentId) {
    throw new Error(tErrors.unauthorizedAction);
  }

  const [rows, totalCount] = await Promise.all([
    LessonReportRepository.findForStudent(studentId, paginationArgs),
    LessonReportRepository.countForStudent(studentId),
  ]);
  return { rows: rows.map(toReturnType), totalCount };
}

export async function submitStudentReflectionFlow(
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
    throw new Error(tErrors.lessonReport.notFound);
  }

  const studentId = await StudentRepository.getStudentIdByUserId(actorUserId);
  if (!studentId || studentId !== report.studentId) {
    throw new Error(tErrors.unauthorizedAction);
  }

  const updated = await LessonReportRepository.updateStudentNotes(classInstanceId, studentNotes);
  if (!updated) {
    throw new Error(tErrors.lessonReport.notFound);
  }

  return toReturnType(updated);
}
