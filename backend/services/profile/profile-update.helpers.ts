import { UserRepository } from "@/backend/db/repo";
import { AccountStatus, AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";
import {
  ManagerProfileService,
  ParentProfileService,
  StaffProfileService,
  TeacherPortalService,
} from "@/backend/services";
import {
  contextHasPermission,
  getErrors,
  type PermissionCheckContext,
} from "@/backend/services/profile/profile-permissions.helpers";
import type { ResolvedRoleIds } from "@/backend/services/profile/profile-role.helpers";
import { AuditService } from "@/backend/services/system/audit.service";
import type {
  ParentAdminProfileUpdateInput,
  ParentOwnProfileUpdateInput,
  ParentProfileUpdateInput,
  TeacherProfileUpdateInput,
  UpdateOwnProfileInput,
  UpdateUserProfileInput,
} from "@/backend/types";

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

export async function updateCoreUserFields(
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
    const teacherTimezone = (teacherInput as TeacherProfileUpdateInput).timezone;
    if (teacherTimezone != null) {
      await UserRepository.updateTimezone(targetUserId, teacherTimezone, undefined, locale);
    }
  }

  if (scope === ProfileScope.OWN) {
    await TeacherPortalService.updateOwnProfile(actorUserId, roleIds.teacherId, teacherInput, getErrors(locale));
    return;
  }

  const teacherUpdate = Object.fromEntries(
    Object.entries(teacherInput as TeacherProfileUpdateInput).filter(([key]) => key !== "timezone")
  ) as TeacherProfileUpdateInput;
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

export async function applyRoleSpecificUpdates(
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
