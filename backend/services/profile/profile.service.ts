import {
  ParentRepository,
  StaffProfileRepository,
  StudentRepository,
  TeacherRepository,
  UserRepository,
} from "@/backend/db";
import { AppPermission, ProfileAudience, ProfileMode, ProfileScope } from "@/backend/enum";
import {
  ManagerProfileService,
  ParentPortalService,
  ParentProfileService,
  PermissionsService,
  StaffProfileService,
  TeacherPortalService,
} from "@/backend/services";
import { MeetingConfigService } from "@/backend/services/meeting/meeting-config.service";
import { PaymentMethodService } from "@/backend/services/payment-method/payment-method.service";
import {
  canEditProfileFieldGroup,
  collectProfileEditGroupsFromUpdate,
  type FieldFilterContext,
  filterProfileByFieldGroups,
} from "@/backend/services/profile/profile-field-filter";
import type {
  ParentAdminProfileUpdateInput,
  ParentOwnProfileUpdateInput,
  ProfilePageContext,
  ProfilePageResolution,
  UnifiedProfileReturnType,
  UpdateOwnProfileInput,
  UpdateUserProfileInput,
} from "@/backend/types";
import type { UserMeetingConfigReturnType } from "@/backend/types/meeting/meeting-config.types";
import type { ParentProfileUpdateInput } from "@/backend/types/parents/parent.types";
import { PROFILE_FIELD_GROUPS } from "@/backend/types/profile/profile-field-manifest";
import type { TeacherProfileUpdateInputType } from "@/backend/types/teachers/teacher.types";
import { getServerTranslations } from "@/shared/locale";

type ResolvedRoleIds = {
  readonly audience: ProfileAudience;
  readonly teacherId?: string;
  readonly parentId?: string;
  readonly staffProfileId?: string;
};

async function resolveRoleIdsForUser(userId: string): Promise<ResolvedRoleIds | null> {
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

  return null;
}

export function isRedirect(result: ProfilePageResolution): result is { redirect: string } {
  return "redirect" in result;
}

export function toParentRepoInput(
  input: ParentOwnProfileUpdateInput | ParentAdminProfileUpdateInput
): ParentProfileUpdateInput {
  return {
    nationality: "nationality" in input ? input.nationality : undefined,
    address: "address" in input ? input.address : undefined,
    facebook: input.facebook,
    whatsapp: input.whatsapp,
    twitter: input.twitter,
    invoiceType: "invoiceType" in input ? input.invoiceType : undefined,
    feeAmount: "feeAmount" in input ? input.feeAmount : undefined,
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
    [ProfileAudience.TEACHER]: AppPermission.TEACHER_VIEW_OWN_PROFILE,
    [ProfileAudience.PARENT]: AppPermission.PARENT_VIEW_OWN_PROFILE,
  },
  audienceBypass: [ProfileAudience.STAFF],
};

const VIEW_OTHER_PERMISSIONS: OtherScopePermissionSet = {
  genericPermission: AppPermission.USER_VIEW_PROFILE,
  audiencePermissions: {
    [ProfileAudience.PARENT]: AppPermission.PARENT_VIEW_PROFILE,
    [ProfileAudience.TEACHER]: AppPermission.TEACHER_VIEW_PROFILE,
  },
};

const EDIT_OWN_PERMISSIONS: OwnScopePermissionSet = {
  authPermission: AppPermission.AUTH_EDIT_OWN_PROFILE,
  audiencePermissions: {
    [ProfileAudience.TEACHER]: AppPermission.TEACHER_EDIT_OWN_PROFILE,
    [ProfileAudience.PARENT]: AppPermission.PARENT_EDIT_OWN_PROFILE,
  },
  audienceBypass: [ProfileAudience.STAFF],
};

const EDIT_OTHER_PERMISSIONS: OtherScopePermissionSet = {
  genericPermission: AppPermission.USER_EDIT_PROFILE,
  audiencePermissions: {
    [ProfileAudience.PARENT]: AppPermission.PARENTS_EDIT,
    [ProfileAudience.TEACHER]: AppPermission.STAFF_EDIT_PROFILE,
    [ProfileAudience.STAFF]: AppPermission.STAFF_EDIT_PROFILE,
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
  const errorsTranslations = getServerTranslations(locale ?? "ar").errorsTranslations;
  throw new Error(errorsTranslations.insufficientPermissions);
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
  if (scope === ProfileScope.OWN) {
    await assertOwnScopeOrThrow(actorUserId, audience, ownPermissionSet, locale);
    return;
  }

  const canAccessOther = await checkOtherScopePermission(actorUserId, audience, otherPermissionSet);
  if (!canAccessOther) {
    await throwInsufficientPermissions(locale);
  }
}

async function hasAnyProfileViewOtherPermission(actorUserId: string): Promise<boolean> {
  const viewOtherKeys = PROFILE_FIELD_GROUPS.map(group => group.viewOther);
  return PermissionsService.hasAnyPermission(actorUserId, viewOtherKeys);
}

async function assertCanViewProfile(
  actorUserId: string,
  targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  locale?: string
): Promise<void> {
  if (scope === ProfileScope.OTHER) {
    const canViewOther = await checkOtherScopePermission(actorUserId, audience, VIEW_OTHER_PERMISSIONS);
    if (canViewOther) {
      return;
    }
    if (await hasAnyProfileViewOtherPermission(actorUserId)) {
      return;
    }
    if (actorUserId === targetUserId) {
      return assertCanViewProfile(actorUserId, targetUserId, ProfileScope.OWN, audience, locale);
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
    if (roleIds.audience !== ProfileAudience.TEACHER || !roleIds.teacherId) {
      return { teacherOwnProfile: null, teacherAdminProfile: null, assignedStudents: null };
    }

    if (scope === ProfileScope.OWN) {
      const tErrors = getServerTranslations(locale ?? "ar").errorsTranslations;
      return {
        teacherOwnProfile: await TeacherPortalService.getOwnProfile(targetUserId, tErrors),
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
    if (roleIds.audience !== ProfileAudience.PARENT || !roleIds.parentId) {
      return { parentOwnProfile: null, parentAdminProfile: null, associatedStudents: null };
    }

    const parentOwnProfile =
      scope === ProfileScope.OWN ? await ParentPortalService.getOwnProfile(targetUserId, locale) : null;
    const parentAdminProfile =
      scope === ProfileScope.OTHER
        ? await ParentProfileService.getProfile(actorUserId, roleIds.parentId, locale)
        : null;
    const parentStudents = await ParentRepository.getAssociatedStudents(roleIds.parentId);
    const canViewAssociatedStudents = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.STUDENT_VIEW_ASSOCIATED
    );

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
    const scope: ProfileScope = targetUserId === actorUserId ? ProfileScope.OWN : ProfileScope.OTHER;
    const roleIds = await resolveRoleIdsForUser(targetUserId);

    if (!roleIds) {
      return { redirect: "/dashboard" };
    }

    try {
      if (options.mode === ProfileMode.VIEW) {
        await assertCanViewProfile(actorUserId, targetUserId, scope, roleIds.audience, locale);
      } else {
        await assertCanEditProfile(actorUserId, targetUserId, scope, roleIds.audience, locale);
      }
    } catch {
      if (options.mode === ProfileMode.EDIT && scope === ProfileScope.OWN) {
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

  async function safeLoadMeetingConfigs(
    actorUserId: string,
    targetUserId: string,
    locale?: string
  ): Promise<UserMeetingConfigReturnType[] | null> {
    try {
      const tErrors = getServerTranslations(locale ?? "ar").errorsTranslations;
      return await MeetingConfigService.listUserMeetingConfigs(actorUserId, targetUserId, tErrors);
    } catch {
      return null;
    }
  }

  async function buildProfileFilterContext(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    audience: ProfileAudience
  ): Promise<FieldFilterContext> {
    const permissionContext = await PermissionsService.getUserContext(actorUserId);
    return {
      actorUserId,
      targetUserId,
      scope,
      audience,
      permissions: new Set(permissionContext.permissions),
    };
  }

  async function resolveUserOrThrow(targetUserId: string, locale?: string) {
    const user = await UserRepository.findSafeById(targetUserId);
    if (!user) {
      const errorsTranslations = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(errorsTranslations.userNotFound(targetUserId));
    }
    return user;
  }

  export async function getProfileByUserId(
    actorUserId: string,
    targetUserId: string,
    locale?: string
  ): Promise<UnifiedProfileReturnType> {
    const scope: ProfileScope = actorUserId === targetUserId ? ProfileScope.OWN : ProfileScope.OTHER;
    const roleIds = await resolveRoleIdsForUser(targetUserId);

    if (!roleIds) {
      const errorsTranslations = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(errorsTranslations.notFound);
    }

    await assertCanViewProfile(actorUserId, targetUserId, scope, roleIds.audience, locale);

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
    } = await loadRoleProfiles(actorUserId, targetUserId, scope, roleIds, locale);

    const meetingConfigs = await safeLoadMeetingConfigs(actorUserId, targetUserId, locale);

    const [paymentMethods, filterCtx] = await Promise.all([
      PaymentMethodService.listForProfile(actorUserId, targetUserId, scope, locale),
      buildProfileFilterContext(actorUserId, targetUserId, scope, roleIds.audience),
    ]);
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
      },
      filterCtx
    );
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

    const requiredPermission =
      scope === ProfileScope.OWN ? AppPermission.AUTH_EDIT_OWN_PROFILE : AppPermission.USER_EDIT_PROFILE;
    const canEdit = await PermissionsService.hasPermission(actorUserId, requiredPermission);
    if (!canEdit) {
      const errorsTranslations = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(errorsTranslations.insufficientPermissions);
    }

    await UserRepository.updateProfileFields(targetUserId, core, locale);
  }

  type RoleSpecificUpdateInput = {
    readonly teacher?: UpdateOwnProfileInput["teacher"] | UpdateUserProfileInput["teacher"];
    readonly parent?: UpdateOwnProfileInput["parent"] | UpdateUserProfileInput["parent"];
    readonly staff?: UpdateOwnProfileInput["staff"] | UpdateUserProfileInput["staff"];
  };

  async function applyTeacherUpdate(
    actorUserId: string,
    scope: ProfileScope,
    targetUserId: string,
    roleIds: ResolvedRoleIds,
    teacherInput: NonNullable<UpdateOwnProfileInput["teacher"]>,
    locale?: string
  ): Promise<void> {
    if (!roleIds.teacherId) {
      return;
    }

    if (scope === ProfileScope.OTHER && "timezone" in teacherInput) {
      const teacherTimezone = (teacherInput as TeacherProfileUpdateInputType).timezone;
      if (teacherTimezone != null) {
        await UserRepository.updateTimezone(targetUserId, teacherTimezone, undefined, locale);
      }
    }

    if (scope === ProfileScope.OWN) {
      const tErrors = getServerTranslations(locale ?? "ar").errorsTranslations;
      await TeacherPortalService.updateOwnProfile(actorUserId, roleIds.teacherId, teacherInput, tErrors);
      return;
    }

    const teacherUpdate = Object.fromEntries(
      Object.entries(teacherInput as TeacherProfileUpdateInputType).filter(([key]) => key !== "timezone")
    ) as TeacherProfileUpdateInputType;
    if (Object.keys(teacherUpdate).length > 0) {
      await StaffProfileService.updateTeacherProfile(actorUserId, roleIds.teacherId, teacherUpdate, locale);
    }
  }

  async function applyParentUpdate(
    actorUserId: string,
    scope: ProfileScope,
    targetUserId: string,
    roleIds: ResolvedRoleIds,
    parentInput: NonNullable<UpdateOwnProfileInput["parent"]>,
    locale?: string
  ): Promise<void> {
    if (!roleIds.parentId) {
      return;
    }

    if (scope === ProfileScope.OTHER && "timezone" in parentInput) {
      const parentTimezone = (parentInput as ParentAdminProfileUpdateInput).timezone;
      if (parentTimezone != null) {
        await UserRepository.updateTimezone(targetUserId, parentTimezone, undefined, locale);
      }
    }

    if (scope === ProfileScope.OWN) {
      await ParentProfileService.updateOwnProfile(actorUserId, roleIds.parentId, parentInput, locale);
      return;
    }

    await ParentProfileService.updateProfile(actorUserId, roleIds.parentId, toParentRepoInput(parentInput), locale);
  }

  async function applyStaffUpdate(
    actorUserId: string,
    scope: ProfileScope,
    roleIds: ResolvedRoleIds,
    staffInput: NonNullable<UpdateOwnProfileInput["staff"] | UpdateUserProfileInput["staff"]>,
    locale?: string
  ): Promise<void> {
    if (!roleIds.staffProfileId) {
      return;
    }

    if (scope === ProfileScope.OWN) {
      const ownInput = staffInput as NonNullable<UpdateOwnProfileInput["staff"]>;
      await ManagerProfileService.updateOwnStaffProfile(
        actorUserId,
        roleIds.staffProfileId,
        {
          phone: ownInput.phone ?? null,
        },
        locale
      );
      return;
    }

    const adminInput = staffInput as NonNullable<UpdateUserProfileInput["staff"]>;
    await ManagerProfileService.updateManagerProfile(
      actorUserId,
      roleIds.staffProfileId,
      {
        status: adminInput.status as import("@/backend/enum").AccountStatus | null | undefined,
      },
      locale
    );
  }

  async function applyRoleSpecificUpdates(
    actorUserId: string,
    scope: ProfileScope,
    targetUserId: string,
    roleIds: ResolvedRoleIds,
    input: RoleSpecificUpdateInput,
    locale?: string
  ): Promise<void> {
    if (roleIds.audience === ProfileAudience.TEACHER && input.teacher) {
      await applyTeacherUpdate(actorUserId, scope, targetUserId, roleIds, input.teacher, locale);
    }

    if (roleIds.audience === ProfileAudience.PARENT && input.parent) {
      await applyParentUpdate(actorUserId, scope, targetUserId, roleIds, input.parent, locale);
    }

    if (roleIds.audience === ProfileAudience.STAFF && input.staff) {
      await applyStaffUpdate(actorUserId, scope, roleIds, input.staff, locale);
    }
  }

  async function resolveRoleIdsOrThrow(userId: string, locale?: string): Promise<ResolvedRoleIds> {
    const roleIds = await resolveRoleIdsForUser(userId);
    if (!roleIds) {
      const errorsTranslations = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(errorsTranslations.notFound);
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

    const permissionContext = await PermissionsService.getUserContext(actorUserId);
    const filterCtx: FieldFilterContext = {
      actorUserId,
      targetUserId,
      scope,
      audience: roleIds.audience,
      permissions: new Set(permissionContext.permissions),
    };
    const editGroups = collectProfileEditGroupsFromUpdate(roleIds.audience, scope, input);
    for (const groupKey of editGroups) {
      if (!canEditProfileFieldGroup(filterCtx, groupKey)) {
        await throwInsufficientPermissions(locale);
      }
    }

    await updateCoreUserFields(actorUserId, targetUserId, scope, input.core, locale);
    await applyRoleSpecificUpdates(actorUserId, scope, targetUserId, roleIds, input, locale);
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
