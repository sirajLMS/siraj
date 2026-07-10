import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  canEditStudentFieldGroup,
  canViewStudentFieldGroup,
  type StudentFieldFilterContext,
} from "@/backend/services/profile/profile-field-filter";

/**
 * Build a student field filter context from the actor's effective permissions.
 * The viewer is considered associated when the actor holds the legacy
 * `STUDENT_VIEW_ASSOCIATED` permission (mirrors the standalone
 * `studentById` / profile resolver behavior).
 *
 * Prefer Server-side filter APIs (`canViewStudentFieldGroup`,
 * `canEditStudentFieldGroup`) over raw `PermissionsService.hasPermission`
 * so the legacy edit bridge grants fine-grained groups when applicable.
 */
export async function buildStudentFieldFilterContext(
  actorUserId: string,
  studentId: string
): Promise<StudentFieldFilterContext> {
  const permissionContext = await PermissionsService.getUserContext(actorUserId);
  const permissions = new Set<AppPermission>(permissionContext.permissions);
  const isAssociatedViewer = permissions.has(AppPermission.STUDENT_VIEW_ASSOCIATED);

  return {
    actorUserId,
    studentId,
    isAssociatedViewer,
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
