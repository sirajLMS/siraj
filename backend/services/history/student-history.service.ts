import { ParentRepository } from "@/backend/db/repo/parents";
import { StudentRepository } from "@/backend/db/repo/students";
import { StudentHistoryRepository } from "@/backend/db/repo/students/student-history.repository";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { AppPermission, EffectiveMeetingSource } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import { assertHasPermission } from "@/backend/services/shared";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
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
    // M1 fix: for non-admin actors, enforce ownership before honoring any
    // view permission shortcut. Previously, HISTORY_VIEW_CALENDAR caused an
    // early return without checking if the caller actually owns the student.
    const ctx = await PermissionsService.getUserContext(userId);
    if (ctx.isSuperAdmin) return;

    const profile = await StudentRepository.findProfileById(studentId);
    if (!profile) {
      throw new Error(tErrors.studentNotFound(studentId));
    }

    // Check ownership: is the caller the student, their parent, or their teacher?
    const isOwner = profile.userId === userId;
    if (!isOwner) {
      const [parent, teacher] = await Promise.all([
        ParentRepository.findByUserId(userId),
        TeacherRepository.findByUserId(userId),
      ]);
      const isParent = (parent?.id ?? null) === profile.parentId;
      const isTeacher = (teacher?.id ?? null) === profile.primaryTeacherId;
      if (!isParent && !isTeacher) {
        // Not the owner — require the explicit "view other" permission.
        const hasViewOther = await PermissionsService.hasPermission(userId, AppPermission.STUDENT_HISTORY_VIEW_OTHER);
        if (!hasViewOther) {
          throw new Error(tErrors.unauthorizedAction);
        }
        return;
      }
    }

    // Owner or has view-other permission — check the appropriate view permission.
    const viewPermission =
      profile.userId === userId ? AppPermission.STUDENT_HISTORY_VIEW_OWN : AppPermission.STUDENT_HISTORY_VIEW_OTHER;
    const hasGroupPermission = await PermissionsService.hasPermission(userId, viewPermission);
    if (hasGroupPermission) {
      return;
    }

    // Fall back to legacy calendar permission for owners only.
    const hasLegacy = await PermissionsService.hasPermission(userId, AppPermission.HISTORY_VIEW_CALENDAR);
    if (hasLegacy) {
      return;
    }

    throw new Error(tErrors.unauthorizedAction);
  }

  async function assertPermission(userId: string, permission: AppPermission, tErrors: ErrorsLabels) {
    return assertHasPermission(userId, permission, tErrors.unauthorizedAction);
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

    const sessionIds = rawSessions.map(s => s.id);
    const meetingMap = await EffectiveMeetingService.resolveForClassInstances(sessionIds, tErrors);

    const sessions = rawSessions.map(session => {
      const effectiveMeeting = meetingMap.get(session.id) ?? {
        joinUrl: null,
        providerSlug: null,
        providerName: null,
        logoUrl: null,
        meetingId: null,
        source: EffectiveMeetingSource.NONE,
        configId: null,
        providerId: null,
        supportsAutoGeneration: false,
      };
      return Object.assign(session, {
        status: toClassExecutionState(session.status),
        outcome: toClassOutcome(session.outcome ?? null),
        meetingJoinUrl: effectiveMeeting.joinUrl,
        effectiveMeeting,
      });
    });

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
