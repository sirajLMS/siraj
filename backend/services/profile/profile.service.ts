import {
  ParentRepository,
  StaffProfileRepository,
  StudentRepository,
  TeacherRepository,
  UserRepository,
} from "@/backend/db/repo";
import { AccountStatus, AppPermission, ProfileAudience, ProfileMode, ProfileScope, UserRole } from "@/backend/enum";
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
import { PROFILE_FIELD_GROUPS } from "@/backend/services/profile/profile-field-manifest";
import { AuditService } from "@/backend/services/system/audit.service";
import type {
  ParentAdminProfileUpdateInput,
  ParentOwnProfileUpdateInput,
  ProfileAccessOptions,
  ProfilePageContext,
  ProfilePageResolution,
  ProfilePermissionContext,
  UnifiedProfileReturnType,
  UpdateOwnProfileInput,
  UpdateUserProfileInput,
  UserPermissionContext,
} from "@/backend/types";
import type { UserMeetingConfigReturnType } from "@/backend/types/meeting/meeting-config.types";
import type { ParentProfileUpdateInput } from "@/backend/types/parents/parent.types";
import type { TeacherProfileUpdateInputType } from "@/backend/types/teachers/teacher.types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

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

/** Pure admins (no role-specific row) still have a core profile when permitted. */
async function resolveRoleIdsWithFallback(
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

export function isRedirect(result: ProfilePageResolution): result is { redirect: string } {
  return "redirect" in result;
}

export function toParentRepoInput(
  input: ParentOwnProfileUpdateInput | ParentAdminProfileUpdateInput
): ParentProfileUpdateInput {
  return {
    phone: "phone" in input ? input.phone : undefined,
    timezone: "timezone" in input ? input.timezone : undefined,
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
  authPermission: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN,
  audiencePermissions: {
    [ProfileAudience.TEACHER]: AppPermission.PROFILE_TEACHER_PROFESSIONAL_VIEW_OWN,
    [ProfileAudience.PARENT]: AppPermission.PROFILE_PARENT_SOCIAL_VIEW_OWN,
    [ProfileAudience.STUDENT]: AppPermission.STUDENT_IDENTITY_VIEW_OWN,
    [ProfileAudience.STAFF]: AppPermission.PROFILE_STAFF_ROLE_VIEW_OWN,
  },
  audienceBypass: [],
};

const VIEW_OTHER_PERMISSIONS: OtherScopePermissionSet = {
  genericPermission: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER,
  audiencePermissions: {
    [ProfileAudience.PARENT]: AppPermission.PROFILE_PARENT_SOCIAL_VIEW_OTHER,
    [ProfileAudience.TEACHER]: AppPermission.PROFILE_TEACHER_PROFESSIONAL_VIEW_OTHER,
  },
};

const EDIT_OWN_PERMISSIONS: OwnScopePermissionSet = {
  authPermission: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
  audiencePermissions: {
    [ProfileAudience.TEACHER]: AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OWN,
    [ProfileAudience.PARENT]: AppPermission.PROFILE_PARENT_SOCIAL_EDIT_OWN,
    [ProfileAudience.STUDENT]: AppPermission.STUDENT_IDENTITY_EDIT_OWN,
    [ProfileAudience.STAFF]: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
  },
  audienceBypass: [],
};

const EDIT_OTHER_PERMISSIONS: OtherScopePermissionSet = {
  genericPermission: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OTHER,
  audiencePermissions: {
    [ProfileAudience.PARENT]: AppPermission.PROFILE_PARENT_SOCIAL_EDIT_OTHER,
    [ProfileAudience.TEACHER]: AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER,
    [ProfileAudience.STAFF]: AppPermission.PROFILE_STAFF_ROLE_EDIT_OTHER,
  },
};

type PermissionCheckContext = UserPermissionContext & { readonly actorUserId: string };

async function resolvePermCtx(
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

function contextHasPermission(ctx: PermissionCheckContext, permissionKey: AppPermission): boolean {
  return ctx.isSuperAdmin || ctx.permissions.includes(permissionKey);
}

function contextHasAnyPermission(ctx: PermissionCheckContext, permissionKeys: AppPermission[]): boolean {
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
  const viewOwnKeys = PROFILE_FIELD_GROUPS.map(group => group.viewOwn);
  return contextHasAnyPermission(ctx, viewOwnKeys);
}

function checkOwnScopePermission(
  ctx: PermissionCheckContext,
  audience: ProfileAudience,
  permissionSet: OwnScopePermissionSet
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
  return hasAnyProfileViewOwnPermission(ctx);
}

function checkOtherScopePermission(
  ctx: PermissionCheckContext,
  audience: ProfileAudience,
  permissionSet: OtherScopePermissionSet
): boolean {
  if (contextHasPermission(ctx, permissionSet.genericPermission)) {
    return true;
  }
  return hasAudiencePermission(ctx, audience, permissionSet.audiencePermissions);
}

function getErrors(locale?: string): ErrorsLabels {
  return getServerTranslations(locale ?? "en").errorsTranslations;
}

function throwInsufficientPermissions(locale?: string): never {
  throw new Error(getErrors(locale).insufficientPermissions);
}

const IANA_TIMEZONE_VALUES: ReadonlySet<string> = new Set(Object.values(IanaTimezone));

function isIanaTimezone(value: string): value is IanaTimezone {
  return IANA_TIMEZONE_VALUES.has(value);
}

function toIanaTimezone(value: string): IanaTimezone {
  return isIanaTimezone(value) ? value : IanaTimezone.UTC;
}

async function assertOwnScopeOrThrow(
  ctx: PermissionCheckContext,
  audience: ProfileAudience,
  permissionSet: OwnScopePermissionSet,
  locale?: string
): Promise<boolean> {
  if (!checkOwnScopePermission(ctx, audience, permissionSet)) {
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
  locale?: string
): Promise<void> {
  if (scope === ProfileScope.OWN) {
    await assertOwnScopeOrThrow(ctx, audience, ownPermissionSet, locale);
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
function resolveEffectiveScope(
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
  if (checkOwnScopePermission(ctx, audience, ownPermissionSet)) {
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

function hasAnyProfileViewOtherPermission(ctx: PermissionCheckContext): boolean {
  const viewOtherKeys = PROFILE_FIELD_GROUPS.map(group => group.viewOther);
  return contextHasAnyPermission(ctx, viewOtherKeys);
}

async function assertCanViewProfile(
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

  await assertProfilePermission(ctx, scope, audience, VIEW_OWN_PERMISSIONS, VIEW_OTHER_PERMISSIONS, locale);
}

async function assertCanEditProfile(
  ctx: PermissionCheckContext,
  _targetUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  locale?: string
): Promise<void> {
  await assertProfilePermission(ctx, scope, audience, EDIT_OWN_PERMISSIONS, EDIT_OTHER_PERMISSIONS, locale);
}

export namespace ProfileService {
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

  async function loadRoleProfiles(
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

  async function safeLoadMeetingConfigs(
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

  function buildProfileFilterContext(
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

  async function resolveUserOrThrow(targetUserId: string, locale?: string) {
    const user = await UserRepository.findSafeById(targetUserId);
    if (!user) {
      throw new Error(getErrors(locale).userNotFound(targetUserId));
    }
    return user;
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

  async function updateCoreUserFields(
    permCtx: PermissionCheckContext,
    targetUserId: string,
    scope: ProfileScope,
    core: UpdateOwnProfileInput["core"],
    locale?: string
  ): Promise<void> {
    if (!core) {
      return;
    }

    const requiredPermission =
      scope === ProfileScope.OWN ? AppPermission.AUTH_EDIT_OWN_PROFILE : AppPermission.USER_EDIT_PROFILE;
    if (!contextHasPermission(permCtx, requiredPermission)) {
      throw new Error(getErrors(locale).insufficientPermissions);
    }

    if (core.status !== undefined) {
      await handleStatusUpdate(permCtx, targetUserId, scope, core, locale);
    }

    await UserRepository.updateProfileFields(targetUserId, core, locale);

    if (core.timezone) {
      await UserRepository.updateTimezone(targetUserId, core.timezone, undefined, locale);
    }
  }

  async function handleStatusUpdate(
    permCtx: PermissionCheckContext,
    targetUserId: string,
    scope: ProfileScope,
    core: NonNullable<UpdateOwnProfileInput["core"]>,
    locale?: string
  ): Promise<void> {
    const statusPermission =
      scope === ProfileScope.OWN
        ? AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN
        : AppPermission.PROFILE_CORE_IDENTITY_EDIT_OTHER;
    if (!contextHasPermission(permCtx, statusPermission)) {
      throw new Error(getErrors(locale).insufficientPermissions);
    }
    if (core.status == null) {
      return;
    }
    const newStatus = core.status;
    await UserRepository.updateStatus(targetUserId, newStatus, undefined, locale);

    await AuditService.createManyAdminAuditLogs([
      {
        actorUserId: permCtx.actorUserId,
        targetUserId,
        action: "USER_STATUS_CHANGED",
        description: `User status changed to ${newStatus}`,
        newState: { newStatus },
      },
    ]);
  }

  type RoleSpecificUpdateInput = {
    readonly teacher?: NonNullable<UpdateOwnProfileInput["teacher"]> | NonNullable<UpdateUserProfileInput["teacher"]>;
    readonly parent?: NonNullable<UpdateOwnProfileInput["parent"]> | NonNullable<UpdateUserProfileInput["parent"]>;
    readonly staff?: NonNullable<UpdateOwnProfileInput["staff"]> | NonNullable<UpdateUserProfileInput["staff"]>;
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
      await TeacherPortalService.updateOwnProfile(actorUserId, roleIds.teacherId, teacherInput, getErrors(locale));
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

    if ("timezone" in parentInput) {
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

  const ACCOUNT_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(AccountStatus));

  function isStaffOwnInput(
    input: NonNullable<UpdateOwnProfileInput["staff"] | UpdateUserProfileInput["staff"]>
  ): input is NonNullable<UpdateOwnProfileInput["staff"]> {
    return "phone" in input;
  }

  function isAccountStatus(value: unknown): value is AccountStatus {
    return typeof value === "string" && ACCOUNT_STATUS_VALUES.has(value);
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

    if (scope === ProfileScope.OWN && isStaffOwnInput(staffInput)) {
      await ManagerProfileService.updateOwnStaffProfile(
        actorUserId,
        roleIds.staffProfileId,
        {
          phone: staffInput.phone ?? null,
        },
        locale
      );
      return;
    }

    if (!isStaffOwnInput(staffInput)) {
      const status = staffInput.status != null && isAccountStatus(staffInput.status) ? staffInput.status : null;
      await ManagerProfileService.updateManagerProfile(
        actorUserId,
        roleIds.staffProfileId,
        {
          status,
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

  async function resolveRoleIdsOrThrow(userId: string, locale?: string): Promise<ResolvedRoleIds> {
    const roleIds = await resolveRoleIdsForUser(userId);
    if (!roleIds) {
      throw new Error(getErrors(locale).notFound);
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
