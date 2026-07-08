import {
  ParentRepository,
  StaffProfileRepository,
  StudentRepository,
  TeacherRepository,
  UserRepository,
} from "@/backend/db";
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
import { AppPermission } from "@/shared/lib";

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
    skype: input.skype,
    defaultZoomLink: input.defaultZoomLink,
    invoiceType: "invoiceType" in input ? input.invoiceType : undefined,
    feeAmount: "feeAmount" in input ? input.feeAmount : undefined,
    paymentMethod: "paymentMethod" in input ? input.paymentMethod : undefined,
    currency: "currency" in input ? input.currency : undefined,
    timezone: "timezone" in input ? input.timezone : undefined,
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
  const audiencePerm = permissionSet.audiencePermissions[audience];
  if (audiencePerm === undefined) {
    return false;
  }
  return PermissionsService.hasPermission(actorUserId, audiencePerm);
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
  const audiencePerm = permissionSet.audiencePermissions[audience];
  if (audiencePerm !== undefined) {
    return PermissionsService.hasPermission(actorUserId, audiencePerm);
  }
  return false;
}

async function assertOwnScopeOrThrow(
  actorUserId: string,
  audience: ProfileAudience,
  permissionSet: OwnScopePermissionSet,
  locale?: string
): Promise<boolean> {
  const hasOwnPermission = await checkOwnScopePermission(actorUserId, audience, permissionSet);
  if (!hasOwnPermission) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("insufficientPermissions"));
  }
  return true;
}

async function assertCanViewProfile(
  actorUserId: string,
  targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  locale?: string
): Promise<void> {
  if (scope === "own") {
    await assertOwnScopeOrThrow(actorUserId, audience, VIEW_OWN_PERMISSIONS, locale);
    return;
  }

  const canViewOther = await checkOtherScopePermission(actorUserId, audience, VIEW_OTHER_PERMISSIONS);
  if (canViewOther) {
    return;
  }

  if (actorUserId === targetUserId) {
    return assertCanViewProfile(actorUserId, targetUserId, "own", audience, locale);
  }

  const t = await getBackendTranslations({ locale, namespace: "errors" });
  throw new Error(t("insufficientPermissions"));
}

async function assertCanEditProfile(
  actorUserId: string,
  _targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  locale?: string
): Promise<void> {
  if (scope === "own") {
    await assertOwnScopeOrThrow(actorUserId, audience, EDIT_OWN_PERMISSIONS, locale);
    return;
  }

  const canEditOther = await checkOtherScopePermission(actorUserId, audience, EDIT_OTHER_PERMISSIONS);
  if (canEditOther) {
    return;
  }

  const t = await getBackendTranslations({ locale, namespace: "errors" });
  throw new Error(t("insufficientPermissions"));
}

export namespace ProfileService {
  async function loadRoleProfiles(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    roleIds: ResolvedRoleIds,
    locale?: string
  ) {
    let teacherOwnProfile = null;
    let teacherAdminProfile = null;
    let parentOwnProfile = null;
    let parentAdminProfile = null;
    let associatedStudents = null;
    let staffProfile = null;
    let staffPermissionGroups = null;
    let staffPermissionOverrides = null;
    let assignedStudents = null;

    if (roleIds.audience === "teacher" && roleIds.teacherId) {
      if (scope === "own") {
        teacherOwnProfile = await TeacherPortalService.getOwnProfile(targetUserId, locale);
      } else {
        teacherAdminProfile = await StaffProfileService.getTeacherProfileForEdit(
          actorUserId,
          roleIds.teacherId,
          locale
        );
        assignedStudents = await StudentRepository.getAssignedToTeacher(roleIds.teacherId);
      }
    }

    if (roleIds.audience === "parent" && roleIds.parentId) {
      if (scope === "own") {
        parentOwnProfile = await ParentPortalService.getOwnProfile(targetUserId, locale);
      } else {
        parentAdminProfile = await ParentProfileService.getProfile(actorUserId, roleIds.parentId, locale);
      }
      const parentStudents = await ParentRepository.getAssociatedStudents(roleIds.parentId);
      associatedStudents = {
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
      };
    }

    if (roleIds.audience === "staff" && roleIds.staffProfileId) {
      staffProfile = await StaffProfileRepository.findByStaffProfileId(roleIds.staffProfileId);

      if (scope === "other") {
        staffPermissionGroups = await StaffProfileRepository.getUserPermissionGroups(targetUserId);
        staffPermissionOverrides = await StaffProfileRepository.getUserPermissionOverrides(targetUserId);
      }
    }

    return {
      teacherOwnProfile,
      teacherAdminProfile,
      parentOwnProfile,
      parentAdminProfile,
      associatedStudents,
      staffProfile,
      staffPermissionGroups,
      staffPermissionOverrides,
      assignedStudents,
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
    _targetUserId: string,
    roleIds: ResolvedRoleIds,
    input: RoleSpecificUpdateInput,
    locale?: string
  ): Promise<void> {
    if (roleIds.audience === "teacher" && input.teacher && roleIds.teacherId) {
      if (scope === "own") {
        await TeacherPortalService.updateOwnProfile(actorUserId, roleIds.teacherId, input.teacher, locale);
      } else {
        await StaffProfileService.updateTeacherProfile(actorUserId, roleIds.teacherId, input.teacher, locale);
      }
    }

    if (roleIds.audience === "parent" && input.parent && roleIds.parentId) {
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

  export async function updateOwnProfile(
    actorUserId: string,
    input: UpdateOwnProfileInput,
    locale?: string
  ): Promise<UnifiedProfileReturnType> {
    const roleIds = await resolveRoleIdsOrThrow(actorUserId, locale);

    await assertCanEditProfile(actorUserId, actorUserId, "own", roleIds.audience, locale);

    await updateCoreUserFields(actorUserId, actorUserId, "own", input.core, locale);

    await applyRoleSpecificUpdates(actorUserId, "own", actorUserId, roleIds, input, locale);

    return getProfileByUserId(actorUserId, actorUserId, locale);
  }

  export async function updateUserProfile(
    actorUserId: string,
    targetUserId: string,
    input: UpdateUserProfileInput,
    locale?: string
  ): Promise<UnifiedProfileReturnType> {
    const roleIds = await resolveRoleIdsOrThrow(targetUserId, locale);

    const scope: ProfileScope = actorUserId === targetUserId ? "own" : "other";
    await assertCanEditProfile(actorUserId, targetUserId, scope, roleIds.audience, locale);

    await updateCoreUserFields(actorUserId, targetUserId, scope, input.core, locale);

    await applyRoleSpecificUpdates(actorUserId, scope, targetUserId, roleIds, input, locale);

    return getProfileByUserId(actorUserId, targetUserId, locale);
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
