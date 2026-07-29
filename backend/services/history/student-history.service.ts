import { ParentRepository, StudentRepository, TeacherRepository } from "@/backend/db";
import { StudentHistoryRepository } from "@/backend/db/repo/students/student-history.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import type { ErrorsLabels } from "@/shared/locale";

export namespace StudentHistoryService {
  async function resolveIsAssociatedViewer(actorUserId: string, studentId: string): Promise<boolean> {
    const profile = await StudentRepository.findProfileById(studentId);
    if (!profile) {
      return false;
    }

    // LMS — Student login accounts can view their own history.
    if (profile.userId === actorUserId) {
      return true;
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (parent?.id === profile.parentId) {
      return true;
    }

    const teacher = await TeacherRepository.findByUserId(actorUserId);
    if (profile.primaryTeacherId === teacher?.id) {
      return true;
    }

    return false;
  }

  async function assertCanViewStudentHistory(userId: string, studentId: string, tErrors: ErrorsLabels): Promise<void> {
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

    throw new Error(tErrors.unauthorizedAction);
  }

  async function assertPermission(userId: string, permission: AppPermission, tErrors: ErrorsLabels) {
    const isAuthorized = await PermissionsService.hasPermission(userId, permission);
    if (!isAuthorized) {
      throw new Error(tErrors.unauthorizedAction);
    }
  }

  export async function getStudentClassHistory(
    userId: string,
    studentId: string,
    year: number,
    month: number,
    tErrors: ErrorsLabels
  ) {
    await assertCanViewStudentHistory(userId, studentId, tErrors);

    const metrics = await StudentHistoryRepository.getMonthlyMetrics(studentId, year, month);
    const rawSessions = await StudentHistoryRepository.getMonthlyCalendar(studentId, year, month);

    const sessions = await Promise.all(
      rawSessions.map(async session => {
        const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(session.id, tErrors);
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
      throw new Error(tErrors.notFound);
    }

    return {
      id: `history-${studentId}-${year}-${month}`,
      studentName: student.name,
      metrics,
      sessions,
    };
  }

  export async function getStudentClassSessionDetail(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.HISTORY_VIEW_DETAILS, tErrors);

    const detail = await StudentHistoryRepository.getSessionDetail(classInstanceId);
    if (!detail) {
      throw new Error(tErrors.notFound);
    }

    await assertCanViewStudentHistory(userId, detail.studentId, tErrors);

    const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(classInstanceId, tErrors);

    return {
      ...detail,
      meetingJoinUrl: effectiveMeeting.joinUrl,
      effectiveMeeting,
    };
  }
}
