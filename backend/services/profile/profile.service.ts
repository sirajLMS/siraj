import { ParentRepository, StaffProfileRepository, TeacherRepository, UserRepository } from "@/backend/db";
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

async function assertCanViewProfile(
  actorUserId: string,
  targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  locale?: string
): Promise<void> {
  const t = await getBackendTranslations({ locale, namespace: "errors" });

  if (scope === "own") {
    const canViewOwn =
      (await PermissionsService.hasPermission(actorUserId, AppPermission.AUTH_VIEW_OWN_PROFILE)) &&
      ((audience === "teacher" &&
        (await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_VIEW_OWN_PROFILE))) ||
        (audience === "parent" &&
          (await PermissionsService.hasPermission(actorUserId, AppPermission.PARENT_VIEW_OWN_PROFILE))) ||
        audience === "staff");

    if (!canViewOwn) {
      throw new Error(t("insufficientPermissions"));
    }
    return;
  }

  const canViewOther = await PermissionsService.hasPermission(actorUserId, AppPermission.USER_VIEW_PROFILE);
  if (canViewOther) {
    return;
  }

  if (audience === "parent") {
    const canViewParent = await PermissionsService.hasPermission(actorUserId, AppPermission.PARENT_VIEW_PROFILE);
    if (canViewParent) {
      return;
    }
  }

  if (audience === "teacher") {
    const canEditTeacher = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_EDIT_PROFILE);
    if (canEditTeacher) {
      return;
    }
  }

  if (actorUserId === targetUserId) {
    return assertCanViewProfile(actorUserId, targetUserId, "own", audience, locale);
  }

  throw new Error(t("insufficientPermissions"));
}

async function assertCanEditProfile(
  actorUserId: string,
  _targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  locale?: string
): Promise<void> {
  const t = await getBackendTranslations({ locale, namespace: "errors" });

  if (scope === "own") {
    const canEditOwn =
      (await PermissionsService.hasPermission(actorUserId, AppPermission.AUTH_EDIT_OWN_PROFILE)) &&
      ((audience === "teacher" &&
        (await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_EDIT_OWN_PROFILE))) ||
        (audience === "parent" &&
          (await PermissionsService.hasPermission(actorUserId, AppPermission.PARENT_EDIT_OWN_PROFILE))) ||
        audience === "staff");

    if (!canEditOwn) {
      throw new Error(t("insufficientPermissions"));
    }
    return;
  }

  const canEditOther = await PermissionsService.hasPermission(actorUserId, AppPermission.USER_EDIT_PROFILE);
  if (canEditOther) {
    return;
  }

  if (audience === "parent") {
    const canEditParent = await PermissionsService.hasPermission(actorUserId, AppPermission.PARENTS_EDIT);
    if (canEditParent) {
      return;
    }
  }

  if (audience === "teacher") {
    const canEditTeacher = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_EDIT_PROFILE);
    if (canEditTeacher) {
      return;
    }
  }

  if (audience === "staff") {
    const canEditStaff = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_EDIT_PROFILE);
    if (canEditStaff) {
      return;
    }
  }

  throw new Error(t("insufficientPermissions"));
}

export namespace ProfileService {
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

    let teacherOwnProfile = null;
    let teacherAdminProfile = null;
    let parentOwnProfile = null;
    let parentAdminProfile = null;
    let staffProfile = null;

    if (roleIds.audience === "teacher" && roleIds.teacherId) {
      if (scope === "own") {
        teacherOwnProfile = await TeacherPortalService.getOwnProfile(targetUserId, locale);
      } else {
        teacherAdminProfile = await StaffProfileService.getTeacherProfileForEdit(
          actorUserId,
          roleIds.teacherId,
          locale
        );
      }
    }

    if (roleIds.audience === "parent" && roleIds.parentId) {
      if (scope === "own") {
        parentOwnProfile = await ParentPortalService.getOwnProfile(targetUserId, locale);
      } else {
        parentAdminProfile = await ParentProfileService.getProfile(actorUserId, roleIds.parentId, locale);
      }
    }

    if (roleIds.audience === "staff" && roleIds.staffProfileId) {
      staffProfile = await StaffProfileRepository.findByStaffProfileId(roleIds.staffProfileId);
    }

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
      staffProfile,
      bankingSummary,
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

    if (scope === "own") {
      const canEdit = await PermissionsService.hasPermission(actorUserId, AppPermission.AUTH_EDIT_OWN_PROFILE);
      if (!canEdit) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("insufficientPermissions"));
      }
    } else {
      const canEdit = await PermissionsService.hasPermission(actorUserId, AppPermission.USER_EDIT_PROFILE);
      if (!canEdit) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("insufficientPermissions"));
      }
    }

    await UserRepository.updateProfileFields(targetUserId, core, locale);
  }

  function toParentRepoInput(
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

  export async function updateOwnProfile(
    actorUserId: string,
    input: UpdateOwnProfileInput,
    locale?: string
  ): Promise<UnifiedProfileReturnType> {
    const roleIds = await resolveRoleIdsForUser(actorUserId);
    if (!roleIds) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    await assertCanEditProfile(actorUserId, actorUserId, "own", roleIds.audience, locale);

    await updateCoreUserFields(actorUserId, actorUserId, "own", input.core, locale);

    if (roleIds.audience === "teacher" && input.teacher && roleIds.teacherId) {
      await TeacherPortalService.updateOwnProfile(actorUserId, roleIds.teacherId, input.teacher, locale);
    }

    if (roleIds.audience === "parent" && input.parent && roleIds.parentId) {
      await ParentProfileService.updateOwnProfile(actorUserId, roleIds.parentId, input.parent, locale);
    }

    if (roleIds.audience === "staff" && input.staff && roleIds.staffProfileId) {
      await ManagerProfileService.updateManagerProfile(actorUserId, roleIds.staffProfileId, input.staff, locale);
    }

    return getProfileByUserId(actorUserId, actorUserId, locale);
  }

  export async function updateUserProfile(
    actorUserId: string,
    targetUserId: string,
    input: UpdateUserProfileInput,
    locale?: string
  ): Promise<UnifiedProfileReturnType> {
    const roleIds = await resolveRoleIdsForUser(targetUserId);
    if (!roleIds) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    const scope: ProfileScope = actorUserId === targetUserId ? "own" : "other";
    await assertCanEditProfile(actorUserId, targetUserId, scope, roleIds.audience, locale);

    await updateCoreUserFields(actorUserId, targetUserId, scope, input.core, locale);

    if (roleIds.audience === "teacher" && input.teacher && roleIds.teacherId) {
      await StaffProfileService.updateTeacherProfile(actorUserId, roleIds.teacherId, input.teacher, locale);
    }

    if (roleIds.audience === "parent" && input.parent && roleIds.parentId) {
      await ParentProfileService.updateProfile(actorUserId, roleIds.parentId, toParentRepoInput(input.parent), locale);
    }

    if (roleIds.audience === "staff" && input.staff && roleIds.staffProfileId) {
      await ManagerProfileService.updateManagerProfile(actorUserId, roleIds.staffProfileId, input.staff, locale);
    }

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
