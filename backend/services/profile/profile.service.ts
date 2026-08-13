import { ParentRepository } from "@/backend/db/repo/parents";
import { StudentRepository } from "@/backend/db/repo/students";
import { StaffProfileRepository, TeacherRepository } from "@/backend/db/repo/teachers";
import { UserRepository } from "@/backend/db/repo/users";
import { AppPermission, ProfileAudience, ProfileMode, ProfileScope } from "@/backend/enum";
import { PermissionsService, type UserPermissionContext } from "@/backend/services/auth/permissions.service";
import { MeetingConfigService } from "@/backend/services/meeting/meeting-config.service";
import { ParentPortalService } from "@/backend/services/parent/parent-portal.service";
import { ParentProfileService } from "@/backend/services/parent/parent-profile.service";
import { PaymentMethodService } from "@/backend/services/payment-method/payment-method.service";
import {
  canEditProfileFieldGroup,
  collectProfileEditGroupsFromUpdate,
  type FieldFilterContext,
  filterProfileByFieldGroups,
} from "@/backend/services/profile/profile-field-filter";
import { ManagerProfileService } from "@/backend/services/staff/manager-profile.service";
import { StaffProfileService } from "@/backend/services/staff/staff-profile.service";
import { AuditService } from "@/backend/services/system/audit.service";
import { TeacherPortalService } from "@/backend/services/teacher/teacher-portal.service";
import type {
  CoreUserProfileFields,
  ManagerDirectoryRow,
  ParentAdminProfileUpdateInput,
  ParentAssignedStudentsResult,
  ParentOwnProfileReturnType,
  ParentOwnProfileUpdateInput,
  ParentProfileResult,
  ParentProfileUpdateInput,
  PaymentMethodDefaults,
  ProfilePageContext,
  ProfilePageResolution,
  StaffPermissionGroupReturnType,
  StaffPermissionOverrideReturnType,
  TeacherAssignedStudentsResult,
  TeacherOwnProfileReturnType,
  TeacherProfileReturnType,
  TeacherProfileUpdateInputType,
  UnifiedProfileReturnType,
  UpdateOwnProfileInput,
  UpdateUserProfileInput,
  UserMeetingConfigReturnType,
  UserPaymentMethodReturnType,
} from "@/backend/types";
import { PROFILE_FIELD_GROUPS, STUDENT_FIELD_GROUPS } from "@/backend/types";
import { parseAccountStatus, parseIanaTimezoneOrNull } from "@/shared/lib/enum";
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

function throwInsufficientPermissions(locale?: string): never {
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
  throwInsufficientPermissions(locale);
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

export namespace ProfileService {
  async function loadTeacherRoleProfiles(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    roleIds: ResolvedRoleIds,
    locale?: string
  ) {
    if (roleIds.audience !== ProfileAudience.TEACHER || !roleIds.teacherId) {
      return {
        teacherOwnProfile: null,
        teacherAdminProfile: null,
        assignedStudents: null,
      };
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
      return {
        parentOwnProfile: null,
        parentAdminProfile: null,
        associatedStudents: null,
      };
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
      return {
        staffProfile: null,
        staffPermissionGroups: null,
        staffPermissionOverrides: null,
      };
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
      teacherOwnProfile: TeacherOwnProfileReturnType | null;
      teacherAdminProfile: TeacherProfileReturnType | null;
      parentOwnProfile: ParentOwnProfileReturnType | null;
      parentAdminProfile: ParentProfileResult | null;
      associatedStudents: ParentAssignedStudentsResult | null;
      staffProfile: ManagerDirectoryRow | null;
      staffPermissionGroups: StaffPermissionGroupReturnType[] | null;
      staffPermissionOverrides: StaffPermissionOverrideReturnType[] | null;
      meetingConfigs: readonly UserMeetingConfigReturnType[] | null;
      paymentMethods: readonly UserPaymentMethodReturnType[] | null;
      paymentMethodDefaults: PaymentMethodDefaults | null;
      assignedStudents: TeacherAssignedStudentsResult | null;
    }>
  ): UnifiedProfileReturnType {
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
      timezone: parseIanaTimezoneOrNull(user.timezone),
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
    const baseProfile = buildBaseProfileObject(user, targetUserId, ProfileAudience.STUDENT, effectiveScope, {});
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
      }),
      filterCtx
    );
  }

  async function updateCoreUserFields(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    core: CoreUserProfileFields | undefined,
    locale?: string
  ): Promise<void> {
    if (!core) {
      return;
    }

    const identityKeys = ["name", "email", "avatarUrl", "displayCurrency"] as const;
    const contactKeys = ["phone", "timezone"] as const;
    const touchesIdentity = identityKeys.some(key => core[key] !== undefined);
    const touchesContact = contactKeys.some(key => core[key] !== undefined);
    const touchesStatus = core.status !== undefined;

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

    if (touchesStatus) {
      await handleStatusUpdate(actorUserId, targetUserId, scope, core, locale);
    }

    await UserRepository.updateProfileFields(targetUserId, core, locale);
    if (core.timezone) {
      await UserRepository.updateTimezone(targetUserId, core.timezone, undefined, locale);
    }
  }

  async function handleStatusUpdate(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    core: CoreUserProfileFields,
    locale?: string
  ): Promise<void> {
    const statusPermission =
      scope === ProfileScope.OWN
        ? AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN
        : AppPermission.PROFILE_CORE_IDENTITY_EDIT_OTHER;
    if (!(await PermissionsService.hasPermission(actorUserId, statusPermission))) {
      const errorsTranslations = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(errorsTranslations.insufficientPermissions);
    }
    // core.status is non-null here because touchesStatus means status !== undefined
    // but it can still be null or undefined, so we guard against that
    if (core.status === null || core.status === undefined) {
      return;
    }
    const newStatus = core.status;
    await UserRepository.updateStatus(targetUserId, newStatus, undefined, locale);

    // Audit log for status change
    await AuditService.createManyAdminAuditLogs([
      {
        actorUserId,
        targetUserId,
        action: "USER_STATUS_CHANGED",
        description: `User status changed to ${newStatus}`,
        newState: { newStatus },
      },
    ]);
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
      // When scope is OWN, staffInput must be StaffOwnProfileUpdateInput
      // Use a type guard to narrow the type
      if ("phone" in staffInput) {
        // Type is narrowed by the type guard
        await ManagerProfileService.updateOwnStaffProfile(
          actorUserId,
          roleIds.staffProfileId,
          {
            phone: staffInput.phone ?? null,
          },
          locale
        );
      }
      return;
    }

    // When scope is OTHER, staffInput must be StaffAdminProfileUpdateInput
    if ("status" in staffInput || "hourlyRate" in staffInput || "rateCurrency" in staffInput) {
      // Type is narrowed by the type guard
      // Parse the status string to AccountStatus enum if provided
      const parsedStatus = staffInput.status ? parseAccountStatus(staffInput.status) : null;
      await ManagerProfileService.updateManagerProfile(
        actorUserId,
        roleIds.staffProfileId,
        {
          status: parsedStatus ?? undefined,
        },
        locale
      );
    }
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
        throwInsufficientPermissions(locale);
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
