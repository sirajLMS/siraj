import { SchedulingRepository, StudentRepository, TeacherRepository } from "@/backend/db";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import type {
  TeacherAssignedClassesResult,
  TeacherAssignedStudentsResult,
  TeacherOwnProfileReturnType,
  TeacherOwnProfileUpdateInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace TeacherPortalService {
  async function assertPermission(userId: string, permission: AppPermission, tErrors: ErrorsLabels) {
    const isAuthorized = await PermissionsService.hasPermission(userId, permission);
    if (!isAuthorized) {
      throw new Error(tErrors.unauthorizedAction);
    }
  }

  async function resolveTeacherForUser(userId: string, tErrors: ErrorsLabels) {
    const teacher = await TeacherRepository.findByUserId(userId);
    if (!teacher) {
      throw new Error(tErrors.notFound);
    }
    return teacher;
  }

  export async function listAssignedStudents(
    userId: string,
    tErrors: ErrorsLabels
  ): Promise<TeacherAssignedStudentsResult> {
    await assertPermission(userId, AppPermission.TEACHER_VIEW_STUDENTS, tErrors);
    const teacher = await resolveTeacherForUser(userId, tErrors);
    return StudentRepository.getAssignedToTeacher(teacher.id);
  }

  export async function getOwnProfile(userId: string, tErrors: ErrorsLabels): Promise<TeacherOwnProfileReturnType> {
    await assertPermission(userId, AppPermission.TEACHER_VIEW_OWN_PROFILE, tErrors);
    const teacher = await resolveTeacherForUser(userId, tErrors);
    const profile = await TeacherRepository.getTeacherProfileForEdit(teacher.id);
    if (!profile) {
      throw new Error(tErrors.notFound);
    }

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      timezone: profile.timezone,
      hourlyRate: profile.hourlyRate,
      rateCurrency: profile.rateCurrency,
      totalClasses: profile.totalClasses,
    };
  }

  export async function listAssignedClasses(
    userId: string,
    tErrors: ErrorsLabels
  ): Promise<TeacherAssignedClassesResult> {
    await assertPermission(userId, AppPermission.SESSION_VIEW_DETAILS, tErrors);
    const teacher = await resolveTeacherForUser(userId, tErrors);
    const rows = await SchedulingRepository.getTeacherAssignedClasses(teacher.id);

    const enrichedRows = await Promise.all(
      rows.map(async row => {
        const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(row.id, tErrors);
        return {
          id: row.id,
          studentName: row.studentName,
          scheduledStartAt: row.scheduledStartAt.toISOString(),
          scheduledEndAt: row.scheduledEndAt.toISOString(),
          durationMinutes: row.durationMinutes,
          executionState: row.executionState as TeacherAssignedClassesResult["rows"][number]["executionState"],
          outcome: row.outcome as TeacherAssignedClassesResult["rows"][number]["outcome"],
          isFrozen: row.isFrozen,
          meetingJoinUrl: effectiveMeeting.joinUrl,
          effectiveMeeting,
        };
      })
    );

    return {
      rows: enrichedRows,
      totalCount: enrichedRows.length,
    };
  }

  export async function resolveTeacherIdForUser(userId: string): Promise<string | null> {
    const teacher = await TeacherRepository.findByUserId(userId);
    return teacher?.id ?? null;
  }

  export async function updateOwnProfile(
    userId: string,
    teacherId: string,
    input: TeacherOwnProfileUpdateInput,
    tErrors: ErrorsLabels
  ): Promise<TeacherOwnProfileReturnType> {
    await assertPermission(userId, AppPermission.TEACHER_EDIT_OWN_PROFILE, tErrors);
    const teacher = await resolveTeacherForUser(userId, tErrors);

    if (teacher.id !== teacherId) {
      throw new Error(tErrors.unauthorizedAction);
    }

    const success = await TeacherRepository.updateTeacherProfile(teacherId, {
      phone: input.phone ?? undefined,
    });

    if (!success) {
      throw new Error(tErrors.notFound);
    }

    return getOwnProfile(userId, tErrors);
  }
}
