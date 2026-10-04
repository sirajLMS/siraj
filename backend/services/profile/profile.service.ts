import { ParentRepository, TeacherRepository } from "@/backend/db/repo";
import { ProfileMode, ProfileScope } from "@/backend/enum";
import { PermissionsService } from "@/backend/services";
import { PaymentMethodService } from "@/backend/services/payment-method/payment-method.service";
import {
  canEditProfileFieldGroup,
  collectProfileEditGroupsFromUpdate,
  filterProfileByFieldGroups,
} from "@/backend/services/profile/profile-field-filter";
import {
  buildProfileFilterContext,
  loadRoleProfiles,
  resolveUserOrThrow,
  safeLoadMeetingConfigs,
} from "@/backend/services/profile/profile-load.helpers";
import {
  assertCanEditProfile,
  assertCanViewProfile,
  EDIT_OTHER_PERMISSIONS,
  EDIT_OWN_PERMISSIONS,
  getErrors,
  type PermissionCheckContext,
  resolveEffectiveScope,
  resolvePermCtx,
  throwInsufficientPermissions,
  VIEW_OTHER_PERMISSIONS,
  VIEW_OWN_PERMISSIONS,
} from "@/backend/services/profile/profile-permissions.helpers";
import {
  resolveRoleIdsForUser,
  resolveRoleIdsOrThrow,
  resolveRoleIdsWithFallback,
} from "@/backend/services/profile/profile-role.helpers";
import { toIanaTimezone } from "@/backend/services/profile/profile-timezone.helpers";
import { applyRoleSpecificUpdates, updateCoreUserFields } from "@/backend/services/profile/profile-update.helpers";
import type {
  FieldFilterContext,
  ProfileAccessOptions,
  ProfilePageContext,
  ProfilePageResolution,
  UnifiedProfileReturnType,
  UpdateOwnProfileInput,
  UpdateUserProfileInput,
} from "@/backend/types";

export { toParentRepoInput } from "@/backend/services/profile/profile-update.helpers";

export function isRedirect(result: ProfilePageResolution): result is { redirect: string } {
  return "redirect" in result;
}

export namespace ProfileService {
  export async function resolvePageContext(
    actorUserId: string,
    options: { readonly targetUserId?: string; readonly mode: ProfileMode } & ProfileAccessOptions,
    locale?: string
  ): Promise<ProfilePageResolution> {
    const targetUserId = options.targetUserId ?? actorUserId;
    const scope: ProfileScope = targetUserId === actorUserId ? ProfileScope.OWN : ProfileScope.OTHER;
    const permCtx: PermissionCheckContext = await resolvePermCtx(actorUserId, options.permissionContext);
    const roleIds = await resolveRoleIdsWithFallback(targetUserId, permCtx);

    if (!roleIds) {
      return { redirect: "/dashboard" };
    }

    const ownSet = options.mode === ProfileMode.VIEW ? VIEW_OWN_PERMISSIONS : EDIT_OWN_PERMISSIONS;
    const otherSet = options.mode === ProfileMode.VIEW ? VIEW_OTHER_PERMISSIONS : EDIT_OTHER_PERMISSIONS;
    const effectiveScope = resolveEffectiveScope(
      permCtx,
      scope,
      roleIds.audience,
      ownSet,
      otherSet,
      options.mode === ProfileMode.VIEW
    );

    try {
      if (options.mode === ProfileMode.VIEW) {
        await assertCanViewProfile(permCtx, targetUserId, effectiveScope, roleIds.audience, locale);
      } else {
        await assertCanEditProfile(permCtx, targetUserId, effectiveScope, roleIds.audience, locale);
      }
    } catch {
      if (options.mode === ProfileMode.EDIT && effectiveScope === ProfileScope.OWN) {
        return { redirect: "/profile" };
      }
      return { redirect: "/dashboard" };
    }

    const context: ProfilePageContext = {
      scope: effectiveScope,
      mode: options.mode,
      audience: roleIds.audience,
      actorUserId,
      targetUserId,
      teacherId: roleIds.teacherId,
      parentId: roleIds.parentId,
      staffProfileId: roleIds.staffProfileId,
      studentId: roleIds.studentId,
      allowedPermissions: permCtx.permissions,
    };

    return context;
  }

  export async function getProfileByUserId(
    actorUserId: string,
    targetUserId: string,
    locale?: string,
    accessOptions?: ProfileAccessOptions
  ): Promise<UnifiedProfileReturnType> {
    const scope: ProfileScope = actorUserId === targetUserId ? ProfileScope.OWN : ProfileScope.OTHER;
    const roleIds = await resolveRoleIdsForUser(targetUserId);

    if (!roleIds) {
      throw new Error(getErrors(locale).notFound);
    }

    const permCtx: PermissionCheckContext = await resolvePermCtx(actorUserId, accessOptions?.permissionContext);

    await assertCanViewProfile(permCtx, targetUserId, scope, roleIds.audience, locale);

    const user = await resolveUserOrThrow(targetUserId, locale);

    const {
      teacherOwnProfile,
      teacherAdminProfile,
      parentOwnProfile,
      parentAdminProfile,
      associatedStudents,
      staffProfile,
      staffPermissionGroups,
      staffPermissionOverrides,
      assignedStudents,
    } = await loadRoleProfiles(permCtx, targetUserId, scope, roleIds, locale);

    const tErrors = getErrors(locale);
    const meetingConfigs = await safeLoadMeetingConfigs(actorUserId, targetUserId, tErrors);

    const paymentMethods = await PaymentMethodService.listForProfile(actorUserId, targetUserId, scope, locale);
    const filterCtx = buildProfileFilterContext(permCtx, targetUserId, scope, roleIds.audience);
    const paymentMethodDefaults = await PaymentMethodService.getDefaultsForProfile(
      actorUserId,
      targetUserId,
      scope,
      locale
    );

    return filterProfileByFieldGroups(
      {
        id: targetUserId,
        userId: targetUserId,
        audience: roleIds.audience,
        scope,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        teacherId: roleIds.teacherId ?? null,
        parentId: roleIds.parentId ?? null,
        staffProfileId: roleIds.staffProfileId ?? null,
        teacherOwnProfile,
        teacherAdminProfile,
        parentOwnProfile,
        parentAdminProfile,
        associatedStudents,
        staffProfile,
        staffPermissionGroups,
        staffPermissionOverrides,
        meetingConfigs,
        paymentMethods,
        paymentMethodDefaults,
        assignedStudents,
        displayCurrency: user.displayCurrency,
        timezone: toIanaTimezone(user.timezone),
        phone: user.phone,
      },
      filterCtx
    );
  }

  async function applyProfileUpdate(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    input: UpdateOwnProfileInput | UpdateUserProfileInput,
    locale?: string
  ): Promise<UnifiedProfileReturnType> {
    const roleIds = await resolveRoleIdsOrThrow(targetUserId, locale);

    const permCtx: PermissionCheckContext = {
      ...(await PermissionsService.getUserContext(actorUserId)),
      actorUserId,
    };

    await assertCanEditProfile(permCtx, targetUserId, scope, roleIds.audience, locale);

    const filterCtx: FieldFilterContext = {
      actorUserId,
      targetUserId,
      scope,
      audience: roleIds.audience,
      permissions: new Set(permCtx.permissions),
    };
    const editGroups = collectProfileEditGroupsFromUpdate(roleIds.audience, scope, input);
    for (const groupKey of editGroups) {
      if (!canEditProfileFieldGroup(filterCtx, groupKey)) {
        throwInsufficientPermissions(locale);
      }
    }

    await updateCoreUserFields(permCtx, targetUserId, scope, input.core, locale);
    await applyRoleSpecificUpdates(permCtx.actorUserId, scope, targetUserId, roleIds, input, locale);
    return getProfileByUserId(actorUserId, targetUserId, locale);
  }

  export async function updateOwnProfile(
    actorUserId: string,
    input: UpdateOwnProfileInput,
    locale?: string
  ): Promise<UnifiedProfileReturnType> {
    return applyProfileUpdate(actorUserId, actorUserId, ProfileScope.OWN, input, locale);
  }

  export async function updateUserProfile(
    actorUserId: string,
    targetUserId: string,
    input: UpdateUserProfileInput,
    locale?: string
  ): Promise<UnifiedProfileReturnType> {
    const scope: ProfileScope = actorUserId === targetUserId ? ProfileScope.OWN : ProfileScope.OTHER;
    return applyProfileUpdate(actorUserId, targetUserId, scope, input, locale);
  }

  export async function resolveUserIdForTeacherId(teacherId: string): Promise<string | null> {
    const teacher = await TeacherRepository.findById(teacherId);
    return teacher?.userId ?? null;
  }

  export async function resolveUserIdForParentId(parentId: string): Promise<string | null> {
    const profile = await ParentRepository.getParentProfile(parentId);
    return profile?.userId ?? null;
  }
}
