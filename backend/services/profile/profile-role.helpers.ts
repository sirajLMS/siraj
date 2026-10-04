import { ParentRepository, StaffProfileRepository, StudentRepository, TeacherRepository } from "@/backend/db/repo";
import { ProfileAudience } from "@/backend/enum";
import {
  checkOtherScopePermission,
  getErrors,
  hasAnyProfileViewOtherPermission,
  type PermissionCheckContext,
  VIEW_OTHER_PERMISSIONS,
} from "@/backend/services/profile/profile-permissions.helpers";

export type ResolvedRoleIds = {
  readonly audience: ProfileAudience;
  readonly teacherId?: string;
  readonly parentId?: string;
  readonly staffProfileId?: string;
  readonly studentId?: string;
};

export async function resolveRoleIdsForUser(userId: string): Promise<ResolvedRoleIds | null> {
  const teacher = await TeacherRepository.findByUserId(userId);
  if (teacher) {
    return { audience: ProfileAudience.TEACHER, teacherId: teacher.id };
  }

  const parent = await ParentRepository.findByUserId(userId);
  if (parent) {
    return { audience: ProfileAudience.PARENT, parentId: parent.id };
  }

  const staff = await StaffProfileRepository.findByUserId(userId);
  if (staff) {
    return { audience: ProfileAudience.STAFF, staffProfileId: staff.staffProfileId };
  }

  const studentId = await StudentRepository.getStudentIdByUserId(userId);
  if (studentId) {
    return { audience: ProfileAudience.STUDENT, studentId };
  }

  return null;
}

/** Pure admins (no role-specific row) still have a core profile when permitted. */
export async function resolveRoleIdsWithFallback(
  targetUserId: string,
  permCtx: PermissionCheckContext
): Promise<ResolvedRoleIds | null> {
  const roleIds = await resolveRoleIdsForUser(targetUserId);
  if (roleIds) {
    return roleIds;
  }

  if (
    hasAnyProfileViewOtherPermission(permCtx) ||
    checkOtherScopePermission(permCtx, ProfileAudience.STAFF, VIEW_OTHER_PERMISSIONS)
  ) {
    return { audience: ProfileAudience.STAFF };
  }

  return null;
}

export async function resolveRoleIdsOrThrow(userId: string, locale?: string): Promise<ResolvedRoleIds> {
  const roleIds = await resolveRoleIdsForUser(userId);
  if (!roleIds) {
    throw new Error(getErrors(locale).notFound);
  }
  return roleIds;
}
