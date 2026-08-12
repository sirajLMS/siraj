import { StudentRepository } from "@/backend/db/repo/students";
import { StudentHistoryRepository } from "@/backend/db/repo/students/student-history.repository";
import { AppPermission } from "@/backend/enum";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import type { ErrorsLabels } from "@/shared/locale";

const CLASS_EXECUTION_STATES: readonly string[] = Object.values(ClassExecutionState);
const CLASS_OUTCOMES: readonly string[] = Object.values(ClassOutcome);

function isClassExecutionState(value: string): value is ClassExecutionState {
  return CLASS_EXECUTION_STATES.includes(value);
}

function isClassOutcome(value: string): value is ClassOutcome {
  return CLASS_OUTCOMES.includes(value);
}

function toClassExecutionState(value: string): ClassExecutionState {
  return isClassExecutionState(value) ? value : ClassExecutionState.NOT_ACTIVATED;
}

function toClassOutcome(value: string | null): ClassOutcome | null {
  if (value === null) return null;
  return isClassOutcome(value) ? value : null;
}

export namespace StudentHistoryService {
  async function assertCanViewStudentHistory(userId: string, studentId: string, tErrors: ErrorsLabels): Promise<void> {
    const hasLegacy = await PermissionsService.hasPermission(userId, AppPermission.HISTORY_VIEW_CALENDAR);
    if (hasLegacy) {
      return;
    }

    const profile = await StudentRepository.findProfileById(studentId);
    if (!profile) {
      throw new Error(tErrors.studentNotFound(studentId));
    }

    const viewPermission =
      profile.userId === userId ? AppPermission.STUDENT_HISTORY_VIEW_OWN : AppPermission.STUDENT_HISTORY_VIEW_OTHER;

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
        return Object.assign(session, {
          status: toClassExecutionState(session.status),
          outcome: toClassOutcome(session.outcome ?? null),
          meetingJoinUrl: effectiveMeeting.joinUrl,
          effectiveMeeting,
        });
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
      executionState: toClassExecutionState(detail.executionState),
      outcome: toClassOutcome(detail.outcome),
      meetingJoinUrl: effectiveMeeting.joinUrl,
      effectiveMeeting,
    };
  }
}
