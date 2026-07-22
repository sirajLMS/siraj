import { AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";
import type { FieldFilterContext, StudentFieldFilterContext } from "@/backend/services/profile/profile-field-filter";
import type { ProfileFieldGroupDefinition, ProfileFieldGroupKey } from "@/backend/types/profile/profile-field-manifest";
import { getProfileEditPermission, getProfileViewPermission } from "@/backend/types/profile/profile-field-manifest";
import type {
  StudentFieldGroupDefinition,
  StudentFieldGroupKey,
} from "@/backend/types/students/student-field-manifest";

const PARENT_VIEW_OTHER_GROUPS: readonly ProfileFieldGroupKey[] = [
  "parent_social",
  "parent_identity",
  "parent_billing",
  "parent_account",
  "parent_students",
];

const TEACHER_VIEW_OWN_GROUPS: readonly ProfileFieldGroupKey[] = [
  "core_identity",
  "core_contact",
  "teacher_professional",
  "payment_methods",
  "meeting_configs",
];

const PARENT_VIEW_OWN_GROUPS: readonly ProfileFieldGroupKey[] = [
  "core_identity",
  "core_contact",
  "parent_social",
  "parent_students",
  "payment_methods",
  "meeting_configs",
];

const STAFF_VIEW_OTHER_GROUPS: readonly ProfileFieldGroupKey[] = ["staff_role", "staff_permissions"];

const ASSOCIATED_STUDENT_VIEW_OWN_GROUPS = new Set<StudentFieldGroupKey>([
  "student_identity",
  "student_academic",
  "student_teacher",
  "student_schedule",
  "student_history",
]);

const ASSOCIATED_STUDENT_VIEW_OTHER_GROUPS = new Set<StudentFieldGroupKey>([
  "student_identity",
  "student_academic",
  "student_teacher",
  "student_parent",
  "student_schedule",
  "student_history",
]);

const STAFF_EDIT_OTHER_GROUPS: readonly ProfileFieldGroupKey[] = [
  "staff_role",
  "staff_permissions",
  "core_identity",
  "core_contact",
];

function permissionsInclude(permissions: ReadonlySet<AppPermission>, key: AppPermission): boolean {
  return permissions.has(key);
}

function checkPermissionOrLegacy(
  permissions: ReadonlySet<AppPermission>,
  permission: AppPermission,
  legacyFallback: () => boolean
): boolean {
  if (permissionsInclude(permissions, permission)) {
    return true;
  }
  return legacyFallback();
}

const TEACHER_VIEW_OTHER_ALLOWED_GROUPS = new Set<ProfileFieldGroupKey>([
  "core_identity",
  "core_contact",
  "teacher_professional",
  "teacher_identity",
  "teacher_students",
]);

function matchPermission(
  permissions: ReadonlySet<AppPermission>,
  audience: ProfileAudience,
  expectedAudience: ProfileAudience,
  permission: AppPermission,
  groupKey: ProfileFieldGroupKey,
  allowedGroups: readonly ProfileFieldGroupKey[]
): boolean {
  return (
    audience === expectedAudience && permissionsInclude(permissions, permission) && allowedGroups.includes(groupKey)
  );
}

function hasLegacyProfileGroupViewOwn(
  permissions: ReadonlySet<AppPermission>,
  audience: ProfileAudience,
  groupKey: ProfileFieldGroupKey
): boolean {
  // Users should always be able to view their own core identity and contact info
  if (groupKey === "core_identity" || groupKey === "core_contact") {
    if (permissionsInclude(permissions, AppPermission.AUTH_VIEW_OWN_PROFILE)) {
      return true;
    }
  }

  if (
    matchPermission(
      permissions,
      audience,
      ProfileAudience.TEACHER,
      AppPermission.TEACHER_VIEW_OWN_PROFILE,
      groupKey,
      TEACHER_VIEW_OWN_GROUPS
    )
  ) {
    return true;
  }

  if (
    matchPermission(
      permissions,
      audience,
      ProfileAudience.PARENT,
      AppPermission.PARENT_VIEW_OWN_PROFILE,
      groupKey,
      PARENT_VIEW_OWN_GROUPS
    )
  ) {
    return true;
  }

  // Staff users should also be able to view their own core profile fields
  if (audience === ProfileAudience.STAFF && (groupKey === "core_identity" || groupKey === "core_contact")) {
    if (permissionsInclude(permissions, AppPermission.STAFF_EDIT_PROFILE)) {
      return true;
    }
  }

  return false;
}

function hasLegacyProfileGroupViewOther(
  permissions: ReadonlySet<AppPermission>,
  audience: ProfileAudience,
  groupKey: ProfileFieldGroupKey
): boolean {
  if (permissionsInclude(permissions, AppPermission.USER_VIEW_PROFILE)) {
    return true;
  }

  if (
    matchPermission(
      permissions,
      audience,
      ProfileAudience.PARENT,
      AppPermission.PARENT_VIEW_PROFILE,
      groupKey,
      PARENT_VIEW_OTHER_GROUPS
    )
  ) {
    return true;
  }

  if (
    audience === ProfileAudience.TEACHER &&
    permissionsInclude(permissions, AppPermission.TEACHER_VIEW_PROFILE) &&
    TEACHER_VIEW_OTHER_ALLOWED_GROUPS.has(groupKey)
  ) {
    return true;
  }

  return matchPermission(
    permissions,
    audience,
    ProfileAudience.STAFF,
    AppPermission.STAFF_EDIT_PROFILE,
    groupKey,
    STAFF_VIEW_OTHER_GROUPS
  );
}

function hasLegacyProfileGroupView(ctx: FieldFilterContext, group: ProfileFieldGroupDefinition): boolean {
  const { permissions, scope, audience } = ctx;
  const groupKey = group.groupKey;

  if (scope === ProfileScope.OWN) {
    return hasLegacyProfileGroupViewOwn(permissions, audience, groupKey);
  }

  return hasLegacyProfileGroupViewOther(permissions, audience, groupKey);
}

export function hasProfileGroupViewPermission(ctx: FieldFilterContext, group: ProfileFieldGroupDefinition): boolean {
  const viewPermission = getProfileViewPermission(group, ctx.scope);
  return checkPermissionOrLegacy(ctx.permissions, viewPermission, () => hasLegacyProfileGroupView(ctx, group));
}

function shouldApplyProfileGroupForEdit(ctx: FieldFilterContext, group: ProfileFieldGroupDefinition): boolean {
  if (!group.audiences.includes(ctx.audience)) {
    return false;
  }
  return group.scopes.includes(ctx.scope);
}

function hasLegacyProfileGroupEdit(ctx: FieldFilterContext, group: ProfileFieldGroupDefinition): boolean {
  const { permissions, scope, audience } = ctx;
  const groupKey = group.groupKey;

  if (scope === ProfileScope.OTHER && permissionsInclude(permissions, AppPermission.USER_EDIT_PROFILE)) {
    return shouldApplyProfileGroupForEdit(ctx, group);
  }

  return matchPermission(
    permissions,
    audience,
    ProfileAudience.STAFF,
    AppPermission.STAFF_EDIT_PROFILE,
    groupKey,
    STAFF_EDIT_OTHER_GROUPS
  );
}

export function hasProfileGroupEditPermission(ctx: FieldFilterContext, group: ProfileFieldGroupDefinition): boolean {
  const editPermission = getProfileEditPermission(group, ctx.scope);
  return checkPermissionOrLegacy(ctx.permissions, editPermission, () => hasLegacyProfileGroupEdit(ctx, group));
}

function hasLegacyStudentGroupView(ctx: StudentFieldFilterContext, group: StudentFieldGroupDefinition): boolean {
  const { permissions, isAssociatedViewer } = ctx;
  const groupKey = group.groupKey;

  if (permissionsInclude(permissions, AppPermission.STUDENT_VIEW_ASSOCIATED)) {
    if (isAssociatedViewer && ASSOCIATED_STUDENT_VIEW_OWN_GROUPS.has(groupKey)) {
      return true;
    }
    if (!isAssociatedViewer && ASSOCIATED_STUDENT_VIEW_OTHER_GROUPS.has(groupKey)) {
      return true;
    }
  }

  if (groupKey === "student_history" && permissionsInclude(permissions, AppPermission.HISTORY_VIEW_CALENDAR)) {
    return true;
  }

  if (groupKey === "student_quota_edit" && permissionsInclude(permissions, AppPermission.STUDENT_EDIT_QUOTA)) {
    return true;
  }

  return false;
}

function hasLegacyStudentGroupEdit(ctx: StudentFieldFilterContext, group: StudentFieldGroupDefinition): boolean {
  const { permissions } = ctx;
  const groupKey = group.groupKey;

  if (groupKey === "student_academic" && permissionsInclude(permissions, AppPermission.STUDENT_MANAGE_STATUS)) {
    return true;
  }

  if (groupKey === "student_quota_edit" && permissionsInclude(permissions, AppPermission.STUDENT_EDIT_QUOTA)) {
    return true;
  }

  return false;
}

export function hasStudentGroupViewPermission(
  ctx: StudentFieldFilterContext,
  group: StudentFieldGroupDefinition
): boolean {
  const viewPermission = getStudentScope(ctx) === ProfileScope.OWN ? group.viewOwn : group.viewOther;
  return checkPermissionOrLegacy(ctx.permissions, viewPermission, () => hasLegacyStudentGroupView(ctx, group));
}

export function hasStudentGroupEditPermission(
  ctx: StudentFieldFilterContext,
  group: StudentFieldGroupDefinition
): boolean {
  const editPermission = getStudentScope(ctx) === ProfileScope.OWN ? group.editOwn : group.editOther;
  return checkPermissionOrLegacy(ctx.permissions, editPermission, () => hasLegacyStudentGroupEdit(ctx, group));
}

function getStudentScope(ctx: StudentFieldFilterContext): ProfileScope {
  return ctx.isAssociatedViewer ? ProfileScope.OWN : ProfileScope.OTHER;
}
