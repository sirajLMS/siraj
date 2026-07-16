import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { TeacherDueService } from "@/backend/services/teacher/teacher-due.service";
import type { TeacherMonthlyReportReturnType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

export namespace TeacherMonthlyReportService {
  async function assertCanViewMonthlyReport(actorUserId: string, teacherId: string, locale?: string): Promise<void> {
    const hasMonthlyPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.MONTHLY_REPORTS_VIEW
    );
    if (hasMonthlyPermission) return;

    const hasDuesPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_DUES_VIEW);
    if (hasDuesPermission) return;

    const ownTeacher = await TeacherRepository.findByUserId(actorUserId);
    if (ownTeacher && ownTeacher.id === teacherId) return;

    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(tErrors.unauthorizedAction);
  }

  export async function getMonthlyReport(
    actorUserId: string,
    teacherId: string,
    year: number,
    month: number,
    locale?: string
  ): Promise<TeacherMonthlyReportReturnType> {
    logger.info("TeacherMonthlyReportService.getMonthlyReport", { actorUserId, teacherId, year, month });
    await assertCanViewMonthlyReport(actorUserId, teacherId, locale);
    return TeacherDueService.getMonthlyReport(actorUserId, teacherId, year, month, locale);
  }
}
