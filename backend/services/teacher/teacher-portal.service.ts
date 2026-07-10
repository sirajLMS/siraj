import { SchedulingRepository, StudentRepository, TeacherRepository } from "@/backend/db";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import type {
  TeacherAssignedClassesResult,
  TeacherAssignedStudentsResult,
  TeacherOwnProfileReturnType,
  TeacherOwnProfileUpdateInput,
} from "@/backend/types";

export namespace TeacherPortalService {
  async function assertPermission(userId: string, permission: AppPermission, locale?: string) {
    const isAuthorized = await PermissionsService.hasPermission(userId, permission);
    if (!isAuthorized) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }
  }

  async function resolveTeacherForUser(userId: string, locale?: string) {
    const teacher = await TeacherRepository.findByUserId(userId);
    if (!teacher) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }
    return teacher;
  }

  export async function listAssignedStudents(userId: string, locale?: string): Promise<TeacherAssignedStudentsResult> {
    await assertPermission(userId, AppPermission.TEACHER_VIEW_STUDENTS, locale);
    const teacher = await resolveTeacherForUser(userId, locale);
    return StudentRepository.getAssignedToTeacher(teacher.id);
  }

  export async function getOwnProfile(userId: string, locale?: string): Promise<TeacherOwnProfileReturnType> {
    await assertPermission(userId, AppPermission.TEACHER_VIEW_OWN_PROFILE, locale);
    const teacher = await resolveTeacherForUser(userId, locale);
    const profile = await TeacherRepository.getTeacherProfileForEdit(teacher.id);
    if (!profile) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
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

  export async function listAssignedClasses(userId: string, locale?: string): Promise<TeacherAssignedClassesResult> {
    await assertPermission(userId, AppPermission.SESSION_VIEW_DETAILS, locale);
    const teacher = await resolveTeacherForUser(userId, locale);
    const rows = await SchedulingRepository.getTeacherAssignedClasses(teacher.id);

    const enrichedRows = await Promise.all(
      rows.map(async row => {
        const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(row.id);
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
    locale?: string
  ): Promise<TeacherOwnProfileReturnType> {
    await assertPermission(userId, AppPermission.TEACHER_EDIT_OWN_PROFILE, locale);
    const teacher = await resolveTeacherForUser(userId, locale);

    if (teacher.id !== teacherId) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    const success = await TeacherRepository.updateTeacherProfile(teacherId, {
      phone: input.phone ?? undefined,
    });

    if (!success) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    return getOwnProfile(userId, locale);
  }
}
