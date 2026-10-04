import { ParentRepository, StaffProfileRepository, StudentRepository, UserRepository } from "@/backend/db/repo";
import { AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";
import {
  ParentPortalService,
  ParentProfileService,
  StaffProfileService,
  TeacherPortalService,
} from "@/backend/services";
import { MeetingConfigService } from "@/backend/services/meeting/meeting-config.service";
import {
  contextHasPermission,
  getErrors,
  type PermissionCheckContext,
} from "@/backend/services/profile/profile-permissions.helpers";
import type { ResolvedRoleIds } from "@/backend/services/profile/profile-role.helpers";
import type { FieldFilterContext, UserMeetingConfigReturnType } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

async function loadTeacherRoleProfiles(
  permCtx: PermissionCheckContext,
  targetUserId: string,
  scope: ProfileScope,
  roleIds: ResolvedRoleIds,
  locale?: string
) {
  if (roleIds.audience !== ProfileAudience.TEACHER || !roleIds.teacherId) {
    return { teacherOwnProfile: null, teacherAdminProfile: null, assignedStudents: null };
  }

  if (scope === ProfileScope.OWN) {
    return {
      teacherOwnProfile: await TeacherPortalService.getOwnProfile(targetUserId, getErrors(locale)),
      teacherAdminProfile: null,
      assignedStudents: null,
    };
  }

  return {
    teacherOwnProfile: null,
    teacherAdminProfile: await StaffProfileService.getTeacherProfileForEdit(
      permCtx.actorUserId,
      roleIds.teacherId,
      locale
    ),
    assignedStudents: await StudentRepository.getAssignedToTeacher(roleIds.teacherId),
  };
}

async function loadParentRoleProfiles(
  permCtx: PermissionCheckContext,
  targetUserId: string,
  scope: ProfileScope,
  roleIds: ResolvedRoleIds,
  locale?: string
) {
  if (roleIds.audience !== ProfileAudience.PARENT || !roleIds.parentId) {
    return { parentOwnProfile: null, parentAdminProfile: null, associatedStudents: null };
  }

  const parentOwnProfile =
    scope === ProfileScope.OWN ? await ParentPortalService.getOwnProfile(targetUserId, locale) : null;
  const parentAdminProfile =
    scope === ProfileScope.OTHER
      ? await ParentProfileService.getProfile(permCtx.actorUserId, roleIds.parentId, locale)
      : null;
  const parentStudents = await ParentRepository.getAssociatedStudents(roleIds.parentId);
  const canViewAssociatedStudents = contextHasPermission(permCtx, AppPermission.STUDENT_VIEW_ASSOCIATED);

  return {
    parentOwnProfile,
    parentAdminProfile,
    associatedStudents: canViewAssociatedStudents
      ? {
          rows: parentStudents.map(student => ({
            id: student.id,
            name: student.name,
            studentAvatarUrl: student.studentAvatarUrl,
            status: student.status,
            primaryTeacherId: student.primaryTeacherId,
            teacherUserId: student.teacherUserId,
            teacherName: student.teacherName,
            teacherAvatarUrl: student.teacherAvatarUrl,
            hoursPerWeek: student.hoursPerWeek,
            classesRemaining: student.classesRemaining,
            classesTotal: student.classesTotal,
          })),
          totalCount: parentStudents.length,
        }
      : null,
  };
}

async function loadStaffRoleProfiles(
  targetUserId: string,
  scope: ProfileScope,
  roleIds: ResolvedRoleIds,
  locale?: string
) {
  if (roleIds.audience !== ProfileAudience.STAFF || !roleIds.staffProfileId) {
    return { staffProfile: null, staffPermissionGroups: null, staffPermissionOverrides: null };
  }

  const staffProfile = await StaffProfileRepository.findByStaffProfileId(roleIds.staffProfileId);
  if (scope !== ProfileScope.OTHER) {
    return { staffProfile, staffPermissionGroups: null, staffPermissionOverrides: null };
  }

  const [staffPermissionGroups, staffPermissionOverrides] = await Promise.all([
    StaffProfileRepository.getUserPermissionGroups(targetUserId, locale),
    StaffProfileRepository.getUserPermissionOverrides(targetUserId),
  ]);

  return { staffProfile, staffPermissionGroups, staffPermissionOverrides };
}

export async function loadRoleProfiles(
  permCtx: PermissionCheckContext,
  targetUserId: string,
  scope: ProfileScope,
  roleIds: ResolvedRoleIds,
  locale?: string
) {
  const [teacherProfiles, parentProfiles, staffProfiles] = await Promise.all([
    loadTeacherRoleProfiles(permCtx, targetUserId, scope, roleIds, locale),
    loadParentRoleProfiles(permCtx, targetUserId, scope, roleIds, locale),
    loadStaffRoleProfiles(targetUserId, scope, roleIds, locale),
  ]);

  return {
    ...teacherProfiles,
    ...parentProfiles,
    ...staffProfiles,
  };
}

export async function safeLoadMeetingConfigs(
  actorUserId: string,
  targetUserId: string,
  tErrors: ErrorsLabels
): Promise<UserMeetingConfigReturnType[] | null> {
  try {
    return await MeetingConfigService.listUserMeetingConfigs(actorUserId, targetUserId, tErrors);
  } catch {
    return null;
  }
}

export function buildProfileFilterContext(
  permCtx: PermissionCheckContext,
  targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience
): FieldFilterContext {
  return {
    actorUserId: permCtx.actorUserId,
    targetUserId,
    scope,
    audience,
    permissions: new Set(permCtx.permissions),
  };
}

export async function resolveUserOrThrow(targetUserId: string, locale?: string) {
  const user = await UserRepository.findSafeById(targetUserId);
  if (!user) {
    throw new Error(getErrors(locale).userNotFound(targetUserId));
  }
  return user;
}
