import { StudentRepository } from "@/backend/db/repo/students";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { canEditStudentFieldGroup } from "@/backend/services/profile/profile-field-filter";
import type { StudentFieldFilterContext } from "@/backend/types";

import { getServerTranslations } from "@/shared/locale";

/**
 * Build a student field filter context from the actor's effective permissions.
 * Own vs other scope is derived from whether `actorUserId` matches the
 * student's LMS user id (`studentUserId`).
 *
 * Prefer Server-side filter APIs (`canViewStudentFieldGroup`,
 * `canEditStudentFieldGroup`) over raw `PermissionsService.hasPermission`
 * so the legacy edit bridge grants fine-grained groups when applicable.
 */
export async function buildStudentFieldFilterContext(
  actorUserId: string,
  studentId: string,
  locale?: string
): Promise<StudentFieldFilterContext> {
  const profile = await StudentRepository.findProfileById(studentId);
  if (!profile) {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(tErrors.student.studentNotFound(studentId));
  }

  const permissionContext = await PermissionsService.getUserContext(actorUserId);
  const permissions = new Set(permissionContext.permissions);

  return {
    actorUserId,
    studentId,
    studentUserId: profile.userId,
    permissions,
  };
}

export function assertStudentFieldEdit(ctx: StudentFieldFilterContext, groupKey: string, locale?: string): void {
  if (!canEditStudentFieldGroup(ctx, groupKey)) {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(tErrors.insufficientPermissions);
  }
}
