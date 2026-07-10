import { AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";
import type { FieldFilterContext, StudentFieldFilterContext } from "@/backend/services/profile/profile-field-filter";
import type { ProfileFieldGroupDefinition, ProfileFieldGroupKey } from "@/backend/types/profile/profile-field-manifest";
import {
  getProfileEditPermission,
  getProfileViewPermission,
  PROFILE_FIELD_GROUPS,
} from "@/backend/types/profile/profile-field-manifest";
import type {
  StudentFieldGroupDefinition,
  StudentFieldGroupKey,
} from "@/backend/types/students/student-field-manifest";
import { STUDENT_FIELD_GROUPS } from "@/backend/types/students/student-field-manifest";

const PARENT_VIEW_OTHER_GROUPS: readonly ProfileFieldGroupKey[] = [
  "parent_social",
  "parent_identity",
  "parent_billing",
  "parent_account",
  "parent_students",
];

const TEACHER_VIEW_OWN_GROUPS: readonly ProfileFieldGroupKey[] = [
  "teacher_professional",
  "payment_methods",
  "meeting_configs",
];

const PARENT_VIEW_OWN_GROUPS: readonly ProfileFieldGroupKey[] = [
  "parent_social",
  "parent_students",
  "payment_methods",
  "meeting_configs",
];

const STAFF_VIEW_OTHER_GROUPS: readonly ProfileFieldGroupKey[] = ["staff_role", "staff_permissions"];

const ASSOCIATED_STUDENT_VIEW_OWN_GROUPS: readonly StudentFieldGroupKey[] = [
  "student_identity",
  "student_academic",
  "student_teacher",
  "student_schedule",
  "student_history",
];

const ASSOCIATED_STUDENT_VIEW_OTHER_GROUPS: readonly StudentFieldGroupKey[] = [
  "student_identity",
  "student_academic",
  "student_teacher",
  "student_parent",
  "student_schedule",
  "student_history",
];

const STAFF_EDIT_OTHER_GROUPS: readonly ProfileFieldGroupKey[] = [
  "staff_role",
  "staff_permissions",
  "core_identity",
  "core_contact",
];

function permissionsInclude(permissions: ReadonlySet<AppPermission>, key: AppPermission): boolean {
  return permissions.has(key);
}

function hasLegacyProfileGroupView(ctx: FieldFilterContext, group: ProfileFieldGroupDefinition): boolean {
  const { permissions, scope, audience } = ctx;
  const groupKey = group.groupKey;

  if (scope === ProfileScope.OWN) {
    if (
      permissionsInclude(permissions, AppPermission.AUTH_VIEW_OWN_PROFILE) &&
      (groupKey === "core_identity" || groupKey === "core_contact")
    ) {
      return true;
    }

    if (
      audience === ProfileAudience.TEACHER &&
      permissionsInclude(permissions, AppPermission.TEACHER_VIEW_OWN_PROFILE) &&
      TEACHER_VIEW_OWN_GROUPS.includes(groupKey)
    ) {
      return true;
    }

    if (
      audience === ProfileAudience.PARENT &&
      permissionsInclude(permissions, AppPermission.PARENT_VIEW_OWN_PROFILE) &&
      PARENT_VIEW_OWN_GROUPS.includes(groupKey)
    ) {
      return true;
    }

    return false;
  }

  if (permissionsInclude(permissions, AppPermission.USER_VIEW_PROFILE)) {
    return true;
  }

  if (
    audience === ProfileAudience.PARENT &&
    permissionsInclude(permissions, AppPermission.PARENT_VIEW_PROFILE) &&
    PARENT_VIEW_OTHER_GROUPS.includes(groupKey)
  ) {
    return true;
  }

  if (
    audience === ProfileAudience.TEACHER &&
    permissionsInclude(permissions, AppPermission.TEACHER_VIEW_PROFILE) &&
    (groupKey === "core_identity" ||
      groupKey === "core_contact" ||
      groupKey === "teacher_professional" ||
      groupKey === "teacher_identity" ||
      groupKey === "teacher_students")
  ) {
    return true;
  }

  if (
    audience === ProfileAudience.STAFF &&
    permissionsInclude(permissions, AppPermission.STAFF_EDIT_PROFILE) &&
    STAFF_VIEW_OTHER_GROUPS.includes(groupKey)
  ) {
    return true;
  }

  return false;
}

export function hasProfileGroupViewPermission(ctx: FieldFilterContext, group: ProfileFieldGroupDefinition): boolean {
  const viewPermission = getProfileViewPermission(group, ctx.scope);
  if (permissionsInclude(ctx.permissions, viewPermission)) {
    return true;
  }
  return hasLegacyProfileGroupView(ctx, group);
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

  if (
    scope === ProfileScope.OTHER &&
    audience === ProfileAudience.STAFF &&
    permissionsInclude(permissions, AppPermission.STAFF_EDIT_PROFILE) &&
    STAFF_EDIT_OTHER_GROUPS.includes(groupKey)
  ) {
    return true;
  }

  return false;
}

export function hasProfileGroupEditPermission(ctx: FieldFilterContext, group: ProfileFieldGroupDefinition): boolean {
  const editPermission = getProfileEditPermission(group, ctx.scope);
  if (permissionsInclude(ctx.permissions, editPermission)) {
    return true;
  }
  return hasLegacyProfileGroupEdit(ctx, group);
}

function hasLegacyStudentGroupView(ctx: StudentFieldFilterContext, group: StudentFieldGroupDefinition): boolean {
  const { permissions, isAssociatedViewer } = ctx;
  const groupKey = group.groupKey;

  if (permissionsInclude(permissions, AppPermission.STUDENT_VIEW_ASSOCIATED)) {
    if (isAssociatedViewer && ASSOCIATED_STUDENT_VIEW_OWN_GROUPS.includes(groupKey)) {
      return true;
    }
    if (!isAssociatedViewer && ASSOCIATED_STUDENT_VIEW_OTHER_GROUPS.includes(groupKey)) {
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
  if (permissionsInclude(ctx.permissions, viewPermission)) {
    return true;
  }
  return hasLegacyStudentGroupView(ctx, group);
}

export function hasStudentGroupEditPermission(
  ctx: StudentFieldFilterContext,
  group: StudentFieldGroupDefinition
): boolean {
  const editPermission = getStudentScope(ctx) === ProfileScope.OWN ? group.editOwn : group.editOther;
  if (permissionsInclude(ctx.permissions, editPermission)) {
    return true;
  }
  return hasLegacyStudentGroupEdit(ctx, group);
}

function getStudentScope(ctx: StudentFieldFilterContext): ProfileScope {
  return ctx.isAssociatedViewer ? ProfileScope.OWN : ProfileScope.OTHER;
}

export { PROFILE_FIELD_GROUPS, STUDENT_FIELD_GROUPS };
