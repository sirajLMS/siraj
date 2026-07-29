import { StudentRepository } from "@/backend/db";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  canEditStudentFieldGroup,
  canViewStudentFieldGroup,
  type StudentFieldFilterContext,
} from "@/backend/services/profile/profile-field-filter";

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
  studentId: string
): Promise<StudentFieldFilterContext> {
  const profile = await StudentRepository.findProfileById(studentId);
  if (!profile) {
    throw new Error("studentNotFound");
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

export function assertStudentFieldEdit(ctx: StudentFieldFilterContext, groupKey: string): void {
  if (!canEditStudentFieldGroup(ctx, groupKey)) {
    throw new Error("insufficientPermissions");
  }
}

export function assertStudentFieldView(ctx: StudentFieldFilterContext, groupKey: string): void {
  if (!canViewStudentFieldGroup(ctx, groupKey)) {
    throw new Error("insufficientPermissions");
  }
}
