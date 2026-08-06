import {
  ParentRepository,
  StaffProfileRepository,
  StudentRepository,
  TeacherRepository,
  UserRepository,
} from "@/backend/db";
import { AppPermission, ProfileAudience, ProfileMode, ProfileScope } from "@/backend/enum";
import type { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import {
  ManagerProfileService,
  ParentPortalService,
  ParentProfileService,
  PermissionsService,
  StaffProfileService,
  TeacherPortalService,
  type UserPermissionContext,
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
import { STUDENT_FIELD_GROUPS } from "@/backend/types/students/student-field-manifest";
import type { TeacherProfileUpdateInputType } from "@/backend/types/teachers/teacher.types";
import { getServerTranslations } from "@/shared/locale";

type ResolvedRoleIds = {
  readonly audience: ProfileAudience;
  readonly teacherId?: string;
  readonly parentId?: string;
  readonly staffProfileId?: string;
  readonly studentId?: string;
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

  const studentId = await StudentRepository.getStudentIdByUserId(userId);
  if (studentId) {
    return { audience: ProfileAudience.STUDENT, studentId };
  }

  return null;
}

/** Users without teacher/parent/staff/student rows (e.g. pure admins) still have core profile when permitted. */
async function resolveRoleIdsWithFallback(
  targetUserId: string,
  actorUserId: string,
  scope: ProfileScope,
  permissionContext?: ProfilePermissionContext
): Promise<ResolvedRoleIds | null> {
  const roleIds = await resolveRoleIdsForUser(targetUserId);
  if (roleIds) {
    return roleIds;
  }

  const canViewCoreProfile = async (): Promise<boolean> => {
    if (scope === ProfileScope.OWN) {
      const viewOwn = getProfilePermissionsForAudience(ProfileAudience.STAFF, ProfileScope.OWN, "view");
      if (await hasAnyPermissionForProfile(actorUserId, viewOwn, permissionContext)) {
        return true;
      }
      return await hasAnyProfileViewOtherPermission(actorUserId, permissionContext);
    }
    if (await hasAnyProfileViewOtherPermission(actorUserId, permissionContext)) {
      return true;
    }
    const viewOther = getProfilePermissionsForAudience(ProfileAudience.STAFF, ProfileScope.OTHER, "view");
    return hasAnyPermissionForProfile(actorUserId, viewOther, permissionContext);
  };

  if (!(await canViewCoreProfile())) {
    return null;
  }

  return { audience: ProfileAudience.STAFF };
}

export function isRedirect(result: ProfilePageResolution): result is { redirect: string } {
  return "redirect" in result;
}

export function toParentRepoInput(
  input: ParentOwnProfileUpdateInput | ParentAdminProfileUpdateInput
): ParentProfileUpdateInput {
  return {
    phone: input.phone,
    nationality: input.nationality,
    address: input.address,
    facebook: input.facebook,
    whatsapp: input.whatsapp,
    twitter: input.twitter,
    timezone: input.timezone,
    invoiceType: "invoiceType" in input ? input.invoiceType : undefined,
    feeAmount: "feeAmount" in input ? input.feeAmount : undefined,
    currency: "currency" in input ? input.currency : undefined,
  };
}

function getProfilePermissionsForAudience(
  audience: ProfileAudience,
  scope: ProfileScope,
  action: "view" | "edit"
): AppPermission[] {
  return PROFILE_FIELD_GROUPS.filter(group => group.audiences.includes(audience)).map(group => {
    if (action === "view") {
      return scope === ProfileScope.OWN ? group.viewOwn : group.viewOther;
    }
    return scope === ProfileScope.OWN ? group.editOwn : group.editOther;
  });
}

function getStudentProfilePermissions(scope: ProfileScope, action: "view" | "edit"): AppPermission[] {
  return STUDENT_FIELD_GROUPS.map(group => {
    if (action === "view") {
      return scope === ProfileScope.OWN ? group.viewOwn : group.viewOther;
    }
    return scope === ProfileScope.OWN ? group.editOwn : group.editOther;
  });
}

export type ProfilePermissionContext = Pick<UserPermissionContext, "permissions" | "isSuperAdmin">;

export type ProfileAccessOptions = {
  readonly permissionContext?: ProfilePermissionContext;
};

async function hasAnyPermissionForProfile(
  actorUserId: string,
  permissionKeys: AppPermission[],
  permissionContext?: ProfilePermissionContext
): Promise<boolean> {
  if (permissionKeys.length === 0) {
    return false;
  }
  if (permissionContext) {
    if (permissionContext.isSuperAdmin) {
      return true;
    }
    return permissionKeys.some(key => permissionContext.permissions.includes(key));
  }
  return PermissionsService.hasAnyPermission(actorUserId, permissionKeys);
}

async function throwInsufficientPermissions(locale?: string): Promise<never> {
  const errorsTranslations = getServerTranslations(locale ?? "ar").errorsTranslations;
  throw new Error(errorsTranslations.insufficientPermissions);
}

async function hasAnyProfileViewOtherPermission(
  actorUserId: string,
  permissionContext?: ProfilePermissionContext
): Promise<boolean> {
  const viewOtherKeys = PROFILE_FIELD_GROUPS.map(group => group.viewOther);
  return hasAnyPermissionForProfile(actorUserId, viewOtherKeys, permissionContext);
}

async function resolveEffectiveProfileScope(
  actorUserId: string,
  targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  permissionContext?: ProfilePermissionContext
): Promise<ProfileScope> {
  if (scope !== ProfileScope.OWN || actorUserId !== targetUserId) {
    return scope;
  }

  if (audience === ProfileAudience.STUDENT) {
    const viewOwn = getStudentProfilePermissions(ProfileScope.OWN, "view");
    if (await hasAnyPermissionForProfile(actorUserId, viewOwn, permissionContext)) {
      return ProfileScope.OWN;
    }
    const viewOther = getStudentProfilePermissions(ProfileScope.OTHER, "view");
    if (await hasAnyPermissionForProfile(actorUserId, viewOther, permissionContext)) {
      return ProfileScope.OTHER;
    }
    return scope;
  }

  const viewOwn = getProfilePermissionsForAudience(audience, ProfileScope.OWN, "view");
  if (await hasAnyPermissionForProfile(actorUserId, viewOwn, permissionContext)) {
    return ProfileScope.OWN;
  }

  const viewOther = getProfilePermissionsForAudience(audience, ProfileScope.OTHER, "view");
  if (await hasAnyPermissionForProfile(actorUserId, viewOther, permissionContext)) {
    return ProfileScope.OTHER;
  }

  if (await hasAnyProfileViewOtherPermission(actorUserId, permissionContext)) {
    return ProfileScope.OTHER;
  }

  return scope;
}

async function assertProfileAccess(
  actorUserId: string,
  targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  action: "view" | "edit",
  permissionContext?: ProfilePermissionContext
): Promise<boolean> {
  const isStudent = audience === ProfileAudience.STUDENT;
  const getPermissions = isStudent
    ? (s: ProfileScope) => getStudentProfilePermissions(s, action)
    : (s: ProfileScope) => getProfilePermissionsForAudience(audience, s, action);

  if (await hasScopeAccess(actorUserId, scope, getPermissions, permissionContext)) {
    return true;
  }

  if (actorUserId !== targetUserId) {
    return false;
  }

  if (await checkAlternateScope(actorUserId, scope, getPermissions, permissionContext)) {
    return true;
  }

  return checkFallbackAccess(isStudent, actorUserId, getPermissions, permissionContext, action);
}

async function checkAlternateScope(
  actorUserId: string,
  scope: ProfileScope,
  getPermissions: (s: ProfileScope) => AppPermission[],
  permissionContext?: ProfilePermissionContext
): Promise<boolean> {
  const alternateScope = scope === ProfileScope.OWN ? ProfileScope.OTHER : ProfileScope.OWN;
  return hasScopeAccess(actorUserId, alternateScope, getPermissions, permissionContext);
}

async function checkFallbackAccess(
  isStudent: boolean,
  actorUserId: string,
  getPermissions: (s: ProfileScope) => AppPermission[],
  permissionContext: ProfilePermissionContext | undefined,
  action: "view" | "edit"
): Promise<boolean> {
  if (isStudent) {
    return false;
  }
  return hasNonStudentFallbackAccess(actorUserId, getPermissions, permissionContext, action);
}

async function hasScopeAccess(
  actorUserId: string,
  scope: ProfileScope,
  getPermissions: (s: ProfileScope) => AppPermission[],
  permissionContext?: ProfilePermissionContext
): Promise<boolean> {
  const permissions = getPermissions(scope);
  return hasAnyPermissionForProfile(actorUserId, permissions, permissionContext);
}

async function hasNonStudentFallbackAccess(
  actorUserId: string,
  getPermissions: (s: ProfileScope) => AppPermission[],
  permissionContext: ProfilePermissionContext | undefined,
  action: "view" | "edit"
): Promise<boolean> {
  const otherScopePermissions = getPermissions(ProfileScope.OTHER);
  if (await hasAnyPermissionForProfile(actorUserId, otherScopePermissions, permissionContext)) {
    return true;
  }
  if (action === "edit") {
    return false;
  }
  return hasAnyProfileViewOtherPermission(actorUserId, permissionContext);
}

async function assertCanAccessProfile(
  actorUserId: string,
  targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  action: "view" | "edit",
  locale?: string,
  permissionContext?: ProfilePermissionContext
): Promise<void> {
  if (await assertProfileAccess(actorUserId, targetUserId, scope, audience, action, permissionContext)) {
    return;
  }
  await throwInsufficientPermissions(locale);
}

async function assertCanViewProfile(
  actorUserId: string,
  targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  locale?: string,
  permissionContext?: ProfilePermissionContext
): Promise<void> {
  return assertCanAccessProfile(actorUserId, targetUserId, scope, audience, "view", locale, permissionContext);
}

async function assertCanEditProfile(
  actorUserId: string,
  targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  locale?: string,
  permissionContext?: ProfilePermissionContext
): Promise<void> {
  return assertCanAccessProfile(actorUserId, targetUserId, scope, audience, "edit", locale, permissionContext);
}

function createNullRoleProfile<T extends Record<string, unknown>>(keys: (keyof T)[]): T {
  return keys.reduce((acc, key) => {
    acc[key] = null as T[keyof T];
    return acc;
  }, {} as T);
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
      return createNullRoleProfile<{
        teacherOwnProfile: unknown;
        teacherAdminProfile: unknown;
        assignedStudents: unknown;
      }>(["teacherOwnProfile", "teacherAdminProfile", "assignedStudents"]);
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
      teacherAdminProfile: await StaffProfileService.getTeacherProfileForView(actorUserId, roleIds.teacherId, locale),
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
      return createNullRoleProfile<{
        parentOwnProfile: unknown;
        parentAdminProfile: unknown;
        associatedStudents: unknown;
      }>(["parentOwnProfile", "parentAdminProfile", "associatedStudents"]);
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
      return createNullRoleProfile<{
        staffProfile: unknown;
        staffPermissionGroups: unknown;
        staffPermissionOverrides: unknown;
      }>(["staffProfile", "staffPermissionGroups", "staffPermissionOverrides"]);
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
    options: { readonly targetUserId?: string; readonly mode: ProfileMode } & ProfileAccessOptions,
    locale?: string
  ): Promise<ProfilePageResolution> {
    const permissionContext = options.permissionContext;
    const targetUserId = options.targetUserId ?? actorUserId;
    const scope: ProfileScope = targetUserId === actorUserId ? ProfileScope.OWN : ProfileScope.OTHER;
    const roleIds = await resolveRoleIdsWithFallback(targetUserId, actorUserId, scope, permissionContext);

    if (!roleIds) {
      return { redirect: "/dashboard" };
    }

    const effectiveScope = await resolveEffectiveProfileScope(
      actorUserId,
      targetUserId,
      scope,
      roleIds.audience,
      permissionContext
    );

    try {
      if (options.mode === ProfileMode.VIEW) {
        await assertCanViewProfile(
          actorUserId,
          targetUserId,
          effectiveScope,
          roleIds.audience,
          locale,
          permissionContext
        );
      } else {
        await assertCanEditProfile(
          actorUserId,
          targetUserId,
          effectiveScope,
          roleIds.audience,
          locale,
          permissionContext
        );
      }
    } catch {
      if (options.mode === ProfileMode.EDIT && effectiveScope === ProfileScope.OWN) {
        return { redirect: "/profile" };
      }
      return { redirect: "/dashboard" };
    }

    const actorPermissions =
      permissionContext?.permissions ?? (await PermissionsService.getUserContext(actorUserId)).permissions;

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
    audience: ProfileAudience,
    permissionContext?: ProfilePermissionContext
  ): Promise<FieldFilterContext> {
    const permissions =
      permissionContext?.permissions ?? (await PermissionsService.getUserContext(actorUserId)).permissions;
    return {
      actorUserId,
      targetUserId,
      scope,
      audience,
      permissions: new Set(permissions),
    };
  }

  async function resolveUserOrThrow(
    targetUserId: string,
    locale?: string
  ): Promise<NonNullable<Awaited<ReturnType<typeof UserRepository.findSafeById>>>> {
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
    locale?: string,
    accessOptions?: ProfileAccessOptions
  ): Promise<UnifiedProfileReturnType> {
    const { permissionContext, roleIds, effectiveScope, user } = await resolveProfileContext(
      actorUserId,
      targetUserId,
      locale,
      accessOptions
    );

    if (roleIds.audience === ProfileAudience.STUDENT) {
      return buildStudentProfile(user, targetUserId, effectiveScope, permissionContext, actorUserId);
    }

    return buildNonStudentProfile(user, targetUserId, roleIds, effectiveScope, permissionContext, actorUserId, locale);
  }

  async function resolveProfileContext(
    actorUserId: string,
    targetUserId: string,
    locale?: string,
    accessOptions?: ProfileAccessOptions
  ): Promise<{
    permissionContext: ProfilePermissionContext | undefined;
    roleIds: ResolvedRoleIds;
    effectiveScope: ProfileScope;
    user: NonNullable<Awaited<ReturnType<typeof UserRepository.findSafeById>>>;
  }> {
    const permissionContext = accessOptions?.permissionContext;
    const scope: ProfileScope = actorUserId === targetUserId ? ProfileScope.OWN : ProfileScope.OTHER;
    const roleIds = await resolveRoleIdsWithFallback(targetUserId, actorUserId, scope, permissionContext);

    if (!roleIds) {
      const errorsTranslations = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(errorsTranslations.notFound);
    }

    await assertCanViewProfile(actorUserId, targetUserId, scope, roleIds.audience, locale, permissionContext);

    const effectiveScope = await resolveEffectiveProfileScope(
      actorUserId,
      targetUserId,
      scope,
      roleIds.audience,
      permissionContext
    );

    const user = await resolveUserOrThrow(targetUserId, locale);

    return { permissionContext, roleIds, effectiveScope, user };
  }

  function buildBaseProfileObject(
    user: NonNullable<Awaited<ReturnType<typeof UserRepository.findSafeById>>>,
    targetUserId: string,
    audience: ProfileAudience,
    scope: ProfileScope,
    overrides: Partial<{
      teacherId: string | null;
      parentId: string | null;
      staffProfileId: string | null;
      teacherOwnProfile: unknown;
      teacherAdminProfile: unknown;
      parentOwnProfile: unknown;
      parentAdminProfile: unknown;
      associatedStudents: unknown;
      staffProfile: unknown;
      staffPermissionGroups: unknown;
      staffPermissionOverrides: unknown;
      meetingConfigs: unknown;
      paymentMethods: unknown;
      paymentMethodDefaults: unknown;
      assignedStudents: unknown;
    }>
  ) {
    return {
      id: targetUserId,
      userId: targetUserId,
      audience,
      scope,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      teacherId: overrides.teacherId ?? null,
      parentId: overrides.parentId ?? null,
      staffProfileId: overrides.staffProfileId ?? null,
      teacherOwnProfile: overrides.teacherOwnProfile ?? null,
      teacherAdminProfile: overrides.teacherAdminProfile ?? null,
      parentOwnProfile: overrides.parentOwnProfile ?? null,
      parentAdminProfile: overrides.parentAdminProfile ?? null,
      associatedStudents: overrides.associatedStudents ?? null,
      staffProfile: overrides.staffProfile ?? null,
      staffPermissionGroups: overrides.staffPermissionGroups ?? null,
      staffPermissionOverrides: overrides.staffPermissionOverrides ?? null,
      meetingConfigs: overrides.meetingConfigs ?? null,
      paymentMethods: overrides.paymentMethods ?? null,
      paymentMethodDefaults: overrides.paymentMethodDefaults ?? null,
      assignedStudents: overrides.assignedStudents ?? null,
      displayCurrency: user.displayCurrency ?? null,
      timezone: (user.timezone as IanaTimezone) ?? null,
      phone: user.phone ?? null,
    };
  }

  async function buildStudentProfile(
    user: NonNullable<Awaited<ReturnType<typeof UserRepository.findSafeById>>>,
    targetUserId: string,
    effectiveScope: ProfileScope,
    permissionContext: ProfilePermissionContext | undefined,
    actorUserId: string
  ): Promise<UnifiedProfileReturnType> {
    const filterCtx = await buildProfileFilterContext(
      actorUserId,
      targetUserId,
      effectiveScope,
      ProfileAudience.STUDENT,
      permissionContext
    );
    const baseProfile = buildBaseProfileObject(
      user,
      targetUserId,
      ProfileAudience.STUDENT,
      effectiveScope,
      {}
    ) as UnifiedProfileReturnType;
    return filterProfileByFieldGroups(baseProfile, filterCtx);
  }

  async function buildNonStudentProfile(
    user: NonNullable<Awaited<ReturnType<typeof UserRepository.findSafeById>>>,
    targetUserId: string,
    roleIds: ResolvedRoleIds,
    effectiveScope: ProfileScope,
    permissionContext: ProfilePermissionContext | undefined,
    actorUserId: string,
    locale?: string
  ): Promise<UnifiedProfileReturnType> {
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
    } = await loadRoleProfiles(actorUserId, targetUserId, effectiveScope, roleIds, locale);

    const meetingConfigs = await safeLoadMeetingConfigs(actorUserId, targetUserId, locale);

    const [paymentMethods, filterCtx] = await Promise.all([
      PaymentMethodService.listForProfile(actorUserId, targetUserId, effectiveScope, locale),
      buildProfileFilterContext(actorUserId, targetUserId, effectiveScope, roleIds.audience, permissionContext),
    ]);
    const paymentMethodDefaults = await PaymentMethodService.getDefaultsForProfile(
      actorUserId,
      targetUserId,
      effectiveScope,
      locale
    );

    return filterProfileByFieldGroups(
      buildBaseProfileObject(user, targetUserId, roleIds.audience, effectiveScope, {
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
      }) as UnifiedProfileReturnType,
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

    const identityKeys = ["name", "email", "avatarUrl", "displayCurrency"] as const;
    const contactKeys = ["phone", "timezone"] as const;
    const touchesIdentity = identityKeys.some(key => core[key] !== undefined);
    const touchesContact = contactKeys.some(key => core[key] !== undefined);

    if (touchesIdentity) {
      const identityPermission =
        scope === ProfileScope.OWN
          ? AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN
          : AppPermission.PROFILE_CORE_IDENTITY_EDIT_OTHER;
      if (!(await PermissionsService.hasPermission(actorUserId, identityPermission))) {
        const errorsTranslations = getServerTranslations(locale ?? "ar").errorsTranslations;
        throw new Error(errorsTranslations.insufficientPermissions);
      }
    }

    if (touchesContact) {
      const contactPermission =
        scope === ProfileScope.OWN
          ? AppPermission.PROFILE_CORE_CONTACT_EDIT_OWN
          : AppPermission.PROFILE_CORE_CONTACT_EDIT_OTHER;
      if (!(await PermissionsService.hasPermission(actorUserId, contactPermission))) {
        const errorsTranslations = getServerTranslations(locale ?? "ar").errorsTranslations;
        throw new Error(errorsTranslations.insufficientPermissions);
      }
    }

    await UserRepository.updateProfileFields(targetUserId, core, locale);
    if (core.timezone) {
      await UserRepository.updateTimezone(targetUserId, core.timezone, undefined, locale);
    }
  }

  type RoleSpecificUpdateInput = {
    readonly teacher?: Exclude<UpdateOwnProfileInput["teacher"] | UpdateUserProfileInput["teacher"], undefined>;
    readonly parent?: Exclude<UpdateOwnProfileInput["parent"] | UpdateUserProfileInput["parent"], undefined>;
    readonly staff?: Exclude<UpdateOwnProfileInput["staff"] | UpdateUserProfileInput["staff"], undefined>;
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

    if ("timezone" in parentInput && parentInput.timezone != null) {
      await UserRepository.updateTimezone(targetUserId, parentInput.timezone, undefined, locale);
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

  async function resolveRoleIdsOrThrow(
    targetUserId: string,
    actorUserId: string,
    scope: ProfileScope,
    locale?: string
  ): Promise<ResolvedRoleIds> {
    const roleIds = await resolveRoleIdsWithFallback(targetUserId, actorUserId, scope);
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
    const roleIds = await resolveRoleIdsOrThrow(targetUserId, actorUserId, scope, locale);
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
