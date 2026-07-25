import { ParentRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { ParentAssignedStudentsResult, ParentOwnProfileReturnType } from "@/backend/types/parents/parent.types";
import { getServerTranslations } from "@/shared/locale";

export namespace ParentPortalService {
  async function assertPermission(userId: string, permission: AppPermission, locale?: string) {
    const isAuthorized = await PermissionsService.hasPermission(userId, permission);
    if (!isAuthorized) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.unauthorizedAction);
    }
  }

  async function resolveParentForUser(userId: string, locale?: string) {
    const parent = await ParentRepository.findByUserId(userId);
    if (!parent) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.notFound);
    }
    return parent;
  }

  export async function listAssignedStudents(userId: string, locale?: string): Promise<ParentAssignedStudentsResult> {
    await assertPermission(userId, AppPermission.PARENT_VIEW_STUDENTS, locale);
    const parent = await resolveParentForUser(userId, locale);
    const rows = await ParentRepository.getAssociatedStudents(parent.id);

    return {
      rows: rows.map(row => ({
        id: row.id,
        name: row.name,
        studentAvatarUrl: row.studentAvatarUrl,
        status: row.status,
        primaryTeacherId: row.primaryTeacherId,
        teacherUserId: row.teacherUserId,
        teacherName: row.teacherName,
        teacherAvatarUrl: row.teacherAvatarUrl,
        hoursPerWeek: row.hoursPerWeek,
        classesRemaining: row.classesRemaining,
        classesTotal: row.classesTotal,
      })),
      totalCount: rows.length,
    };
  }

  export async function getOwnProfile(userId: string, locale?: string): Promise<ParentOwnProfileReturnType> {
    await assertPermission(userId, AppPermission.PARENT_VIEW_OWN_PROFILE, locale);
    const parent = await resolveParentForUser(userId, locale);
    const profile = await ParentRepository.getParentProfile(parent.id);
    if (!profile) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.notFound);
    }

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      nationality: profile.nationality,
      address: profile.address,
      facebook: profile.facebook,
      whatsapp: profile.whatsapp,
      twitter: profile.twitter,
    };
  }

  export async function resolveParentIdForUser(userId: string): Promise<string | null> {
    const parent = await ParentRepository.findByUserId(userId);
    return parent?.id ?? null;
  }
}
