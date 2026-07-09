import {
  ParentRepository,
  StaffProfileRepository,
  StudentRepository,
  TeacherRepository,
  UserRepository,
} from "@/backend/db";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib";
import {
  ManagerProfileService,
  ParentPortalService,
  ParentProfileService,
  PermissionsService,
  StaffProfileService,
  TeacherPortalService,
} from "@/backend/services";
import { loadTeacherBankingSummary } from "@/backend/services/profile/banking-summary";
import type {
  ParentAdminProfileUpdateInput,
  ParentOwnProfileUpdateInput,
  ProfileAudience,
  ProfileMode,
  ProfilePageContext,
  ProfilePageResolution,
  ProfileScope,
  UnifiedProfileReturnType,
  UpdateOwnProfileInput,
  UpdateUserProfileInput,
} from "@/backend/types";
import type { ParentProfileUpdateInput } from "@/backend/types/parent.types";
import type { TeacherProfileUpdateInputType } from "@/backend/types/teacher.types";

type ResolvedRoleIds = {
  readonly audience: ProfileAudience;
  readonly teacherId?: string;
  readonly parentId?: string;
  readonly staffProfileId?: string;
};

async function resolveRoleIdsForUser(userId: string): Promise<ResolvedRoleIds | null> {
  const teacher = await TeacherRepository.findByUserId(userId);
  if (teacher) {
    return { audience: "teacher", teacherId: teacher.id };
  }

  const parent = await ParentRepository.findByUserId(userId);
  if (parent) {
    return { audience: "parent", parentId: parent.id };
  }

  const staff = await StaffProfileRepository.findByUserId(userId);
  if (staff) {
    return { audience: "staff", staffProfileId: staff.staffProfileId };
  }

  return null;
}

export function isRedirect(result: ProfilePageResolution): result is { redirect: string } {
  return "redirect" in result;
}

export function toParentRepoInput(
  input: ParentOwnProfileUpdateInput | ParentAdminProfileUpdateInput
): ParentProfileUpdateInput {
  return {
    phone: input.phone,
    nationality: "nationality" in input ? input.nationality : undefined,
    address: "address" in input ? input.address : undefined,
    facebook: input.facebook,
    whatsapp: input.whatsapp,
    twitter: input.twitter,
    defaultZoomLink: input.defaultZoomLink,
    invoiceType: "invoiceType" in input ? input.invoiceType : undefined,
    feeAmount: "feeAmount" in input ? input.feeAmount : undefined,
    paymentMethod: "paymentMethod" in input ? input.paymentMethod : undefined,
    currency: "currency" in input ? input.currency : undefined,
  };
}

type OwnScopePermissionSet = {
  readonly authPermission: AppPermission;
  readonly audiencePermissions: Partial<Record<ProfileAudience, AppPermission>>;
  readonly audienceBypass: ProfileAudience[];
};

type OtherScopePermissionSet = {
  readonly genericPermission: AppPermission;
  readonly audiencePermissions: Partial<Record<ProfileAudience, AppPermission>>;
};

const VIEW_OWN_PERMISSIONS: OwnScopePermissionSet = {
  authPermission: AppPermission.AUTH_VIEW_OWN_PROFILE,
  audiencePermissions: {
    teacher: AppPermission.TEACHER_VIEW_OWN_PROFILE,
    parent: AppPermission.PARENT_VIEW_OWN_PROFILE,
  },
  audienceBypass: ["staff"],
};

const VIEW_OTHER_PERMISSIONS: OtherScopePermissionSet = {
  genericPermission: AppPermission.USER_VIEW_PROFILE,
  audiencePermissions: {
    parent: AppPermission.PARENT_VIEW_PROFILE,
    teacher: AppPermission.STAFF_EDIT_PROFILE,
  },
};

const EDIT_OWN_PERMISSIONS: OwnScopePermissionSet = {
  authPermission: AppPermission.AUTH_EDIT_OWN_PROFILE,
  audiencePermissions: {
    teacher: AppPermission.TEACHER_EDIT_OWN_PROFILE,
    parent: AppPermission.PARENT_EDIT_OWN_PROFILE,
  },
  audienceBypass: ["staff"],
};

const EDIT_OTHER_PERMISSIONS: OtherScopePermissionSet = {
  genericPermission: AppPermission.USER_EDIT_PROFILE,
  audiencePermissions: {
    parent: AppPermission.PARENTS_EDIT,
    teacher: AppPermission.STAFF_EDIT_PROFILE,
    staff: AppPermission.STAFF_EDIT_PROFILE,
  },
};

async function hasAudiencePermission(
  actorUserId: string,
  audience: ProfileAudience,
  audiencePermissions: Partial<Record<ProfileAudience, AppPermission>>
): Promise<boolean> {
  const audiencePerm = audiencePermissions[audience];
  if (audiencePerm === undefined) {
    return false;
  }
  return PermissionsService.hasPermission(actorUserId, audiencePerm);
}

async function checkOwnScopePermission(
  actorUserId: string,
  audience: ProfileAudience,
  permissionSet: OwnScopePermissionSet
): Promise<boolean> {
  const hasAuth = await PermissionsService.hasPermission(actorUserId, permissionSet.authPermission);
  if (!hasAuth) {
    return false;
  }
  if (permissionSet.audienceBypass.includes(audience)) {
    return true;
  }
  return hasAudiencePermission(actorUserId, audience, permissionSet.audiencePermissions);
}

async function checkOtherScopePermission(
  actorUserId: string,
  audience: ProfileAudience,
  permissionSet: OtherScopePermissionSet
): Promise<boolean> {
  const hasGeneric = await PermissionsService.hasPermission(actorUserId, permissionSet.genericPermission);
  if (hasGeneric) {
    return true;
  }
  return hasAudiencePermission(actorUserId, audience, permissionSet.audiencePermissions);
}

async function throwInsufficientPermissions(locale?: string): Promise<never> {
  const t = await getBackendTranslations({ locale, namespace: "errors" });
  throw new Error(t("insufficientPermissions"));
}

async function assertOwnScopeOrThrow(
  actorUserId: string,
  audience: ProfileAudience,
  permissionSet: OwnScopePermissionSet,
  locale?: string
): Promise<boolean> {
  const hasOwnPermission = await checkOwnScopePermission(actorUserId, audience, permissionSet);
  if (!hasOwnPermission) {
    await throwInsufficientPermissions(locale);
  }
  return true;
}

async function assertProfilePermission(
  actorUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  ownPermissionSet: OwnScopePermissionSet,
  otherPermissionSet: OtherScopePermissionSet,
  locale?: string
): Promise<void> {
  if (scope === "own") {
    await assertOwnScopeOrThrow(actorUserId, audience, ownPermissionSet, locale);
    return;
  }

  const canAccessOther = await checkOtherScopePermission(actorUserId, audience, otherPermissionSet);
  if (!canAccessOther) {
    await throwInsufficientPermissions(locale);
  }
}

async function assertCanViewProfile(
  actorUserId: string,
  targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  locale?: string
): Promise<void> {
  if (scope === "other") {
    const canViewOther = await checkOtherScopePermission(actorUserId, audience, VIEW_OTHER_PERMISSIONS);
    if (canViewOther) {
      return;
    }
    if (actorUserId === targetUserId) {
      return assertCanViewProfile(actorUserId, targetUserId, "own", audience, locale);
    }
    await throwInsufficientPermissions(locale);
    return;
  }

  await assertProfilePermission(actorUserId, scope, audience, VIEW_OWN_PERMISSIONS, VIEW_OTHER_PERMISSIONS, locale);
}

async function assertCanEditProfile(
  actorUserId: string,
  _targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  locale?: string
): Promise<void> {
  await assertProfilePermission(actorUserId, scope, audience, EDIT_OWN_PERMISSIONS, EDIT_OTHER_PERMISSIONS, locale);
}

export namespace ProfileService {
  async function loadTeacherRoleProfiles(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    roleIds: ResolvedRoleIds,
    locale?: string
  ) {
    if (roleIds.audience !== "teacher" || !roleIds.teacherId) {
      return { teacherOwnProfile: null, teacherAdminProfile: null, assignedStudents: null };
    }

    if (scope === "own") {
      return {
        teacherOwnProfile: await TeacherPortalService.getOwnProfile(targetUserId, locale),
        teacherAdminProfile: null,
        assignedStudents: null,
      };
    }

    return {
      teacherOwnProfile: null,
      teacherAdminProfile: await StaffProfileService.getTeacherProfileForEdit(actorUserId, roleIds.teacherId, locale),
      assignedStudents: await StudentRepository.getAssignedToTeacher(roleIds.teacherId),
    };
  }

  async function loadParentRoleProfiles(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    roleIds: ResolvedRoleIds,
    locale?: string
  ) {
    if (roleIds.audience !== "parent" || !roleIds.parentId) {
      return { parentOwnProfile: null, parentAdminProfile: null, associatedStudents: null };
    }

    const parentOwnProfile = scope === "own" ? await ParentPortalService.getOwnProfile(targetUserId, locale) : null;
    const parentAdminProfile =
      scope === "other" ? await ParentProfileService.getProfile(actorUserId, roleIds.parentId, locale) : null;
    const parentStudents = await ParentRepository.getAssociatedStudents(roleIds.parentId);

    return {
      parentOwnProfile,
      parentAdminProfile,
      associatedStudents: {
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
      },
    };
  }

  async function loadStaffRoleProfiles(
    targetUserId: string,
    scope: ProfileScope,
    roleIds: ResolvedRoleIds,
    locale?: string
  ) {
    if (roleIds.audience !== "staff" || !roleIds.staffProfileId) {
      return { staffProfile: null, staffPermissionGroups: null, staffPermissionOverrides: null };
    }

    const staffProfile = await StaffProfileRepository.findByStaffProfileId(roleIds.staffProfileId);
    if (scope !== "other") {
      return { staffProfile, staffPermissionGroups: null, staffPermissionOverrides: null };
    }

    const [staffPermissionGroups, staffPermissionOverrides] = await Promise.all([
      StaffProfileRepository.getUserPermissionGroups(targetUserId, locale),
      StaffProfileRepository.getUserPermissionOverrides(targetUserId),
    ]);

    return { staffProfile, staffPermissionGroups, staffPermissionOverrides };
  }

  async function loadRoleProfiles(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    roleIds: ResolvedRoleIds,
    locale?: string
  ) {
    const [teacherProfiles, parentProfiles, staffProfiles] = await Promise.all([
      loadTeacherRoleProfiles(actorUserId, targetUserId, scope, roleIds, locale),
      loadParentRoleProfiles(actorUserId, targetUserId, scope, roleIds, locale),
      loadStaffRoleProfiles(targetUserId, scope, roleIds, locale),
    ]);

    return {
      ...teacherProfiles,
      ...parentProfiles,
      ...staffProfiles,
    };
  }

  export async function resolvePageContext(
    actorUserId: string,
    options: { readonly targetUserId?: string; readonly mode: ProfileMode },
    locale?: string
  ): Promise<ProfilePageResolution> {
    const targetUserId = options.targetUserId ?? actorUserId;
    const scope: ProfileScope = targetUserId === actorUserId ? "own" : "other";
    const roleIds = await resolveRoleIdsForUser(targetUserId);

    if (!roleIds) {
      return { redirect: "/dashboard" };
    }

    try {
      if (options.mode === "view") {
        await assertCanViewProfile(actorUserId, targetUserId, scope, roleIds.audience, locale);
      } else {
        await assertCanEditProfile(actorUserId, targetUserId, scope, roleIds.audience, locale);
      }
    } catch {
      if (options.mode === "edit" && scope === "own") {
        return { redirect: "/profile" };
      }
      return { redirect: "/dashboard" };
    }

    const actorPermissions = (await PermissionsService.getUserContext(actorUserId)).permissions;

    const context: ProfilePageContext = {
      scope,
      mode: options.mode,
      audience: roleIds.audience,
      actorUserId,
      targetUserId,
      teacherId: roleIds.teacherId,
      parentId: roleIds.parentId,
      staffProfileId: roleIds.staffProfileId,
      allowedPermissions: actorPermissions,
    };

    return context;
  }

  export async function getProfileByUserId(
    actorUserId: string,
    targetUserId: string,
    locale?: string
  ): Promise<UnifiedProfileReturnType> {
    const scope: ProfileScope = actorUserId === targetUserId ? "own" : "other";
    const roleIds = await resolveRoleIdsForUser(targetUserId);

    if (!roleIds) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    await assertCanViewProfile(actorUserId, targetUserId, scope, roleIds.audience, locale);

    const user = await UserRepository.findSafeById(targetUserId);
    if (!user) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("userNotFound", { id: targetUserId }));
    }

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
    } = await loadRoleProfiles(actorUserId, targetUserId, scope, roleIds, locale);

    const bankingSummary = await loadTeacherBankingSummary(
      actorUserId,
      scope,
      roleIds.audience,
      roleIds.teacherId ?? null
    );

    return {
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
      bankingSummary,
      assignedStudents,
    };
  }

  async function updateCoreUserFields(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    core: UpdateOwnProfileInput["core"] | UpdateUserProfileInput["core"],
    locale?: string
  ): Promise<void> {
    if (!core) {
      return;
    }

    const requiredPermission = scope === "own" ? AppPermission.AUTH_EDIT_OWN_PROFILE : AppPermission.USER_EDIT_PROFILE;
    const canEdit = await PermissionsService.hasPermission(actorUserId, requiredPermission);
    if (!canEdit) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("insufficientPermissions"));
    }

    await UserRepository.updateProfileFields(targetUserId, core, locale);
  }

  type RoleSpecificUpdateInput = {
    readonly teacher?: UpdateOwnProfileInput["teacher"];
    readonly parent?: UpdateOwnProfileInput["parent"];
    readonly staff?: UpdateOwnProfileInput["staff"];
  };

  async function applyRoleSpecificUpdates(
    actorUserId: string,
    scope: ProfileScope,
    targetUserId: string,
    roleIds: ResolvedRoleIds,
    input: RoleSpecificUpdateInput,
    locale?: string
  ): Promise<void> {
    if (roleIds.audience === "teacher" && input.teacher && roleIds.teacherId) {
      if (scope === "other" && "timezone" in input.teacher) {
        const teacherTimezone = (input.teacher as TeacherProfileUpdateInputType).timezone;
        if (teacherTimezone != null) {
          await UserRepository.updateTimezone(targetUserId, teacherTimezone, undefined, locale);
        }
      }

      if (scope === "own") {
        await TeacherPortalService.updateOwnProfile(actorUserId, roleIds.teacherId, input.teacher, locale);
      } else {
        const { timezone: _teacherTimezone, ...teacherInput } = input.teacher as TeacherProfileUpdateInputType;
        if (Object.keys(teacherInput).length > 0) {
          await StaffProfileService.updateTeacherProfile(actorUserId, roleIds.teacherId, teacherInput, locale);
        }
      }
    }

    if (roleIds.audience === "parent" && input.parent && roleIds.parentId) {
      if (scope === "other" && "timezone" in input.parent) {
        const parentTimezone = (input.parent as ParentAdminProfileUpdateInput).timezone;
        if (parentTimezone != null) {
          await UserRepository.updateTimezone(targetUserId, parentTimezone, undefined, locale);
        }
      }

      if (scope === "own") {
        await ParentProfileService.updateOwnProfile(actorUserId, roleIds.parentId, input.parent, locale);
      } else {
        await ParentProfileService.updateProfile(
          actorUserId,
          roleIds.parentId,
          toParentRepoInput(input.parent),
          locale
        );
      }
    }

    if (roleIds.audience === "staff" && input.staff && roleIds.staffProfileId) {
      if (scope === "own") {
        await ManagerProfileService.updateOwnStaffProfile(actorUserId, roleIds.staffProfileId, input.staff, locale);
      } else {
        await ManagerProfileService.updateManagerProfile(actorUserId, roleIds.staffProfileId, input.staff, locale);
      }
    }
  }

  async function resolveRoleIdsOrThrow(userId: string, locale?: string): Promise<ResolvedRoleIds> {
    const roleIds = await resolveRoleIdsForUser(userId);
    if (!roleIds) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }
    return roleIds;
  }

  async function applyProfileUpdate(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    input: UpdateOwnProfileInput | UpdateUserProfileInput,
    locale?: string
  ): Promise<UnifiedProfileReturnType> {
    const roleIds = await resolveRoleIdsOrThrow(targetUserId, locale);
    await assertCanEditProfile(actorUserId, targetUserId, scope, roleIds.audience, locale);
    await updateCoreUserFields(actorUserId, targetUserId, scope, input.core, locale);
    await applyRoleSpecificUpdates(actorUserId, scope, targetUserId, roleIds, input, locale);
    return getProfileByUserId(actorUserId, targetUserId, locale);
  }

  export async function updateOwnProfile(
    actorUserId: string,
    input: UpdateOwnProfileInput,
    locale?: string
  ): Promise<UnifiedProfileReturnType> {
    return applyProfileUpdate(actorUserId, actorUserId, "own", input, locale);
  }

  export async function updateUserProfile(
    actorUserId: string,
    targetUserId: string,
    input: UpdateUserProfileInput,
    locale?: string
  ): Promise<UnifiedProfileReturnType> {
    const scope: ProfileScope = actorUserId === targetUserId ? "own" : "other";
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
