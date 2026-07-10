import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { StudentHistoryRepository } from "@/backend/db/repo/students/student-history.repository";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";

export namespace StudentHistoryService {
  async function assertPermission(userId: string, permission: AppPermission, locale?: string) {
    const isAuthorized = await PermissionsService.hasPermission(userId, permission);
    if (!isAuthorized) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }
  }

  export async function getStudentClassHistory(
    userId: string,
    studentId: string,
    year: number,
    month: number,
    locale?: string
  ) {
    await assertPermission(userId, AppPermission.HISTORY_VIEW_CALENDAR, locale);

    const metrics = await StudentHistoryRepository.getMonthlyMetrics(studentId, year, month);
    const rawSessions = await StudentHistoryRepository.getMonthlyCalendar(studentId, year, month, locale);

    const sessions = await Promise.all(
      rawSessions.map(async session => {
        const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(session.id);
        return {
          ...session,
          meetingJoinUrl: effectiveMeeting.joinUrl,
          effectiveMeeting,
        };
      })
    );

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    return {
      id: `history-${studentId}-${year}-${month}`,
      studentName: student.name,
      metrics,
      sessions,
    };
  }

  export async function getStudentClassSessionDetail(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.HISTORY_VIEW_DETAILS, locale);

    const detail = await StudentHistoryRepository.getSessionDetail(classInstanceId, locale);
    if (!detail) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(classInstanceId);

    return {
      ...detail,
      meetingJoinUrl: effectiveMeeting.joinUrl,
      effectiveMeeting,
    };
  }
}
