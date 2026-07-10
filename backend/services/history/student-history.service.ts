import { ParentRepository, StudentRepository, TeacherRepository } from "@/backend/db";
import { StudentHistoryRepository } from "@/backend/db/repo/students/student-history.repository";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";

export namespace StudentHistoryService {
  async function resolveIsAssociatedViewer(actorUserId: string, studentId: string): Promise<boolean> {
    const profile = await StudentRepository.findProfileById(studentId);
    if (!profile) {
      return false;
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (parent && parent.id === profile.parentId) {
      return true;
    }

    const teacher = await TeacherRepository.findByUserId(actorUserId);
    if (teacher && profile.primaryTeacherId === teacher.id) {
      return true;
    }

    return false;
  }

  async function assertCanViewStudentHistory(userId: string, studentId: string, locale?: string): Promise<void> {
    const hasLegacy = await PermissionsService.hasPermission(userId, AppPermission.HISTORY_VIEW_CALENDAR);
    if (hasLegacy) {
      return;
    }

    const isAssociatedViewer = await resolveIsAssociatedViewer(userId, studentId);
    const viewPermission = isAssociatedViewer
      ? AppPermission.STUDENT_HISTORY_VIEW_OWN
      : AppPermission.STUDENT_HISTORY_VIEW_OTHER;

    const hasGroupPermission = await PermissionsService.hasPermission(userId, viewPermission);
    if (hasGroupPermission) {
      return;
    }

    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("unauthorizedAction"));
  }

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
    await assertCanViewStudentHistory(userId, studentId, locale);

    const metrics = await StudentHistoryRepository.getMonthlyMetrics(studentId, year, month);
    const rawSessions = await StudentHistoryRepository.getMonthlyCalendar(studentId, year, month, locale);

    const sessions = await Promise.all(
      rawSessions.map(async session => {
        const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(session.id);
        return {
          ...session,
          meetingJoinUrl: effectiveMeeting.joinUrl,
          effectiveMeeting,
          outcome: session.outcome ?? null,
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
