import { ProfileScope } from "@/backend/enum";
import type { FieldFilterContext, StudentFieldFilterContext } from "@/backend/services/profile/profile-field-filter";
import {
  getProfileEditPermission,
  getProfileViewPermission,
  type ProfileFieldGroupDefinition,
  type StudentFieldGroupDefinition,
} from "@/backend/types";

export function hasProfileGroupViewPermission(ctx: FieldFilterContext, group: ProfileFieldGroupDefinition): boolean {
  const viewPermission = getProfileViewPermission(group, ctx.scope);
  return ctx.permissions.has(viewPermission);
}

export function hasProfileGroupEditPermission(ctx: FieldFilterContext, group: ProfileFieldGroupDefinition): boolean {
  const editPermission = getProfileEditPermission(group, ctx.scope);
  return ctx.permissions.has(editPermission);
}

export function hasStudentGroupViewPermission(
  ctx: StudentFieldFilterContext,
  group: StudentFieldGroupDefinition
): boolean {
  const viewPermission = getStudentScope(ctx) === ProfileScope.OWN ? group.viewOwn : group.viewOther;
  return ctx.permissions.has(viewPermission);
}

export function hasStudentGroupEditPermission(
  ctx: StudentFieldFilterContext,
  group: StudentFieldGroupDefinition
): boolean {
  const editPermission = getStudentScope(ctx) === ProfileScope.OWN ? group.editOwn : group.editOther;
  return ctx.permissions.has(editPermission);
}

function getStudentScope(ctx: StudentFieldFilterContext): ProfileScope {
  return ctx.actorUserId === ctx.studentUserId ? ProfileScope.OWN : ProfileScope.OTHER;
}
