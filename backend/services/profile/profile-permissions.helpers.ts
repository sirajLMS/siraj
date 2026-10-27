import { AppPermission, ProfileAudience, ProfileScope, UserRole } from "@/backend/enum";
import { PermissionsService } from "@/backend/services";
import { PROFILE_VIEW_OTHER_KEYS, PROFILE_VIEW_OWN_KEYS } from "@/backend/services/profile/profile-field-manifest";
import type { ProfilePermissionContext, UserPermissionContext } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

type OwnScopePermissionSet = {
  readonly authPermission: AppPermission;
  readonly audiencePermissions: Partial<Record<ProfileAudience, AppPermission>>;
  readonly audienceBypass: ProfileAudience[];
};

type OtherScopePermissionSet = {
  readonly genericPermission: AppPermission;
  readonly audiencePermissions: Partial<Record<ProfileAudience, AppPermission>>;
};

export const VIEW_OWN_PERMISSIONS: OwnScopePermissionSet = {
  authPermission: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN,
  audiencePermissions: {
    [ProfileAudience.TEACHER]: AppPermission.PROFILE_TEACHER_PROFESSIONAL_VIEW_OWN,
    [ProfileAudience.PARENT]: AppPermission.PROFILE_PARENT_SOCIAL_VIEW_OWN,
    [ProfileAudience.STUDENT]: AppPermission.STUDENT_IDENTITY_VIEW_OWN,
    [ProfileAudience.STAFF]: AppPermission.PROFILE_STAFF_ROLE_VIEW_OWN,
  },
  audienceBypass: [],
};

export const VIEW_OTHER_PERMISSIONS: OtherScopePermissionSet = {
  genericPermission: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER,
  audiencePermissions: {
    [ProfileAudience.PARENT]: AppPermission.PROFILE_PARENT_SOCIAL_VIEW_OTHER,
    [ProfileAudience.TEACHER]: AppPermission.PROFILE_TEACHER_PROFESSIONAL_VIEW_OTHER,
  },
};

export const EDIT_OWN_PERMISSIONS: OwnScopePermissionSet = {
  authPermission: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
  audiencePermissions: {
    [ProfileAudience.TEACHER]: AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OWN,
    [ProfileAudience.PARENT]: AppPermission.PROFILE_PARENT_SOCIAL_EDIT_OWN,
    [ProfileAudience.STUDENT]: AppPermission.STUDENT_IDENTITY_EDIT_OWN,
    [ProfileAudience.STAFF]: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
  },
  audienceBypass: [],
};

export const EDIT_OTHER_PERMISSIONS: OtherScopePermissionSet = {
  genericPermission: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OTHER,
  audiencePermissions: {
    [ProfileAudience.PARENT]: AppPermission.PROFILE_PARENT_SOCIAL_EDIT_OTHER,
    [ProfileAudience.TEACHER]: AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER,
    [ProfileAudience.STAFF]: AppPermission.PROFILE_STAFF_ROLE_EDIT_OTHER,
  },
};

export type PermissionCheckContext = UserPermissionContext & { readonly actorUserId: string };

export async function resolvePermCtx(
  actorUserId: string,
  permissionContext?: ProfilePermissionContext
): Promise<PermissionCheckContext> {
  if (permissionContext) {
    return {
      permissions: permissionContext.permissions,
      permissionGroups: [],
      isSuperAdmin: permissionContext.isSuperAdmin,
      role: UserRole.USER,
      actorUserId,
    };
  }
  return {
    ...(await PermissionsService.getUserContext(actorUserId)),
    actorUserId,
  };
}

export function contextHasPermission(ctx: PermissionCheckContext, permissionKey: AppPermission): boolean {
  return ctx.isSuperAdmin || ctx.permissions.includes(permissionKey);
}

function contextHasAnyPermission(ctx: PermissionCheckContext, permissionKeys: readonly AppPermission[]): boolean {
  if (permissionKeys.length === 0) return false;
  if (ctx.isSuperAdmin) return true;
  return permissionKeys.some(key => ctx.permissions.includes(key));
}

function hasAudiencePermission(
  ctx: PermissionCheckContext,
  audience: ProfileAudience,
  audiencePermissions: Partial<Record<ProfileAudience, AppPermission>>
): boolean {
  const audiencePerm = audiencePermissions[audience];
  if (audiencePerm === undefined) {
    return false;
  }
  return contextHasPermission(ctx, audiencePerm);
}

function hasAnyProfileViewOwnPermission(ctx: PermissionCheckContext): boolean {
  return contextHasAnyPermission(ctx, PROFILE_VIEW_OWN_KEYS);
}

export function hasAnyProfileViewOtherPermission(ctx: PermissionCheckContext): boolean {
  return contextHasAnyPermission(ctx, PROFILE_VIEW_OTHER_KEYS);
}

function checkOwnScopePermission(
  ctx: PermissionCheckContext,
  audience: ProfileAudience,
  permissionSet: OwnScopePermissionSet,
  isView: boolean
): boolean {
  if (contextHasPermission(ctx, permissionSet.authPermission)) {
    return true;
  }
  if (permissionSet.audienceBypass.includes(audience)) {
    return true;
  }
  if (hasAudiencePermission(ctx, audience, permissionSet.audiencePermissions)) {
    return true;
  }
  return isView && hasAnyProfileViewOwnPermission(ctx);
}

export function checkOtherScopePermission(
  ctx: PermissionCheckContext,
  audience: ProfileAudience,
  permissionSet: OtherScopePermissionSet
): boolean {
  if (contextHasPermission(ctx, permissionSet.genericPermission)) {
    return true;
  }
  return hasAudiencePermission(ctx, audience, permissionSet.audiencePermissions);
}

export function getErrors(locale?: string): ErrorsLabels {
  return getServerTranslations(locale ?? "en").errorsTranslations;
}

export function throwInsufficientPermissions(locale?: string): never {
  throw new Error(getErrors(locale).insufficientPermissions);
}

async function assertOwnScopeOrThrow(
  ctx: PermissionCheckContext,
  audience: ProfileAudience,
  permissionSet: OwnScopePermissionSet,
  isView: boolean,
  locale?: string
): Promise<boolean> {
  if (!checkOwnScopePermission(ctx, audience, permissionSet, isView)) {
    throwInsufficientPermissions(locale);
  }
  return true;
}

async function assertProfilePermission(
  ctx: PermissionCheckContext,
  scope: ProfileScope,
  audience: ProfileAudience,
  ownPermissionSet: OwnScopePermissionSet,
  otherPermissionSet: OtherScopePermissionSet,
  isView: boolean,
  locale?: string
): Promise<void> {
  if (scope === ProfileScope.OWN) {
    await assertOwnScopeOrThrow(ctx, audience, ownPermissionSet, isView, locale);
    return;
  }

  if (!checkOtherScopePermission(ctx, audience, otherPermissionSet)) {
    throwInsufficientPermissions(locale);
  }
}

/**
 * If scope is OWN but the actor lacks own-scope permission while having other-scope permission,
 * escalate to OTHER. Used for view mode (e.g. pure admins with view_other only).
 */
export function resolveEffectiveScope(
  ctx: PermissionCheckContext,
  scope: ProfileScope,
  audience: ProfileAudience,
  ownPermissionSet: OwnScopePermissionSet,
  otherPermissionSet: OtherScopePermissionSet,
  isView: boolean
): ProfileScope {
  if (scope !== ProfileScope.OWN) {
    return scope;
  }
  if (checkOwnScopePermission(ctx, audience, ownPermissionSet, isView)) {
    return ProfileScope.OWN;
  }
  if (checkOtherScopePermission(ctx, audience, otherPermissionSet)) {
    return ProfileScope.OTHER;
  }
  if (isView && hasAnyProfileViewOtherPermission(ctx)) {
    return ProfileScope.OTHER;
  }
  return scope;
}

export async function assertCanViewProfile(
  ctx: PermissionCheckContext,
  targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  locale?: string
): Promise<void> {
  if (scope === ProfileScope.OTHER) {
    if (checkOtherScopePermission(ctx, audience, VIEW_OTHER_PERMISSIONS)) {
      return;
    }
    if (hasAnyProfileViewOtherPermission(ctx)) {
      return;
    }
    if (ctx.actorUserId === targetUserId) {
      return assertCanViewProfile(ctx, targetUserId, ProfileScope.OWN, audience, locale);
    }
    throwInsufficientPermissions(locale);
    return;
  }

  await assertProfilePermission(ctx, scope, audience, VIEW_OWN_PERMISSIONS, VIEW_OTHER_PERMISSIONS, true, locale);
}

export async function assertCanEditProfile(
  ctx: PermissionCheckContext,
  _targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  locale?: string
): Promise<void> {
  await assertProfilePermission(ctx, scope, audience, EDIT_OWN_PERMISSIONS, EDIT_OTHER_PERMISSIONS, false, locale);
}
