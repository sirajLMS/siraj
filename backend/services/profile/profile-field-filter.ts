import { type AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";
import type { ProfileFieldGroupDefinition } from "@/backend/types/profile/profile-field-manifest";
import {
  getProfileEditPermission,
  getProfileViewPermission,
  PROFILE_FIELD_GROUPS,
} from "@/backend/types/profile/profile-field-manifest";
import type { StudentFieldGroupDefinition } from "@/backend/types/students/student-field-manifest";
import { STUDENT_FIELD_GROUPS } from "@/backend/types/students/student-field-manifest";

export type FieldFilterContext = {
  readonly actorUserId: string;
  readonly targetUserId: string;
  readonly scope: ProfileScope;
  readonly audience: ProfileAudience;
  readonly permissions: ReadonlySet<AppPermission>;
};

export type StudentFieldFilterContext = {
  readonly actorUserId: string;
  readonly studentId: string;
  readonly isAssociatedViewer: boolean;
  readonly permissions: ReadonlySet<AppPermission>;
};

function hasPermission(permissions: ReadonlySet<AppPermission>, key: AppPermission): boolean {
  return permissions.has(key);
}

function setValueAtPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split(".");
  let current: Record<string, unknown> = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const next = current[segment];
    if (next == null || typeof next !== "object") {
      return;
    }
    current = next as Record<string, unknown>;
  }

  current[segments[segments.length - 1]] = value;
}

function cloneForFiltering<T>(payload: T): T {
  return structuredClone(payload);
}

function shouldApplyProfileGroup(group: ProfileFieldGroupDefinition, ctx: FieldFilterContext): boolean {
  if (!group.audiences.includes(ctx.audience)) {
    return false;
  }
  return group.scopes.includes(ctx.scope);
}

function stripProfileGroupPaths<T extends Record<string, unknown>>(
  filtered: T,
  group: ProfileFieldGroupDefinition
): void {
  for (const path of group.paths) {
    setValueAtPath(filtered, path, null);
  }
}

export function filterProfileByFieldGroups<T extends Record<string, unknown>>(payload: T, ctx: FieldFilterContext): T {
  const filtered = cloneForFiltering(payload);

  for (const group of PROFILE_FIELD_GROUPS) {
    if (!shouldApplyProfileGroup(group, ctx)) {
      continue;
    }

    const viewPermission = getProfileViewPermission(group, ctx.scope);
    if (!hasPermission(ctx.permissions, viewPermission)) {
      stripProfileGroupPaths(filtered, group);
    }
  }

  return filtered;
}

function getStudentScope(ctx: StudentFieldFilterContext): ProfileScope {
  return ctx.isAssociatedViewer ? ProfileScope.OWN : ProfileScope.OTHER;
}

function getStudentViewPermission(group: StudentFieldGroupDefinition, ctx: StudentFieldFilterContext): AppPermission {
  return getStudentScope(ctx) === ProfileScope.OWN ? group.viewOwn : group.viewOther;
}

export function getStudentEditPermission(
  group: StudentFieldGroupDefinition,
  ctx: StudentFieldFilterContext
): AppPermission {
  return getStudentScope(ctx) === ProfileScope.OWN ? group.editOwn : group.editOther;
}

export function filterStudentProfileByFieldGroups<T extends Record<string, unknown>>(
  payload: T,
  ctx: StudentFieldFilterContext
): T {
  const filtered = cloneForFiltering(payload);

  for (const group of STUDENT_FIELD_GROUPS) {
    const viewPermission = getStudentViewPermission(group, ctx);
    if (!hasPermission(ctx.permissions, viewPermission)) {
      for (const path of group.paths) {
        setValueAtPath(filtered, path, null);
      }
    }
  }

  return filtered;
}

export function canViewProfileFieldGroup(ctx: FieldFilterContext, groupKey: string): boolean {
  const group = PROFILE_FIELD_GROUPS.find(entry => entry.groupKey === groupKey);
  if (!group || !shouldApplyProfileGroup(group, ctx)) {
    return false;
  }
  return hasPermission(ctx.permissions, getProfileViewPermission(group, ctx.scope));
}

export function canEditProfileFieldGroup(ctx: FieldFilterContext, groupKey: string): boolean {
  const group = PROFILE_FIELD_GROUPS.find(entry => entry.groupKey === groupKey);
  if (!group || !shouldApplyProfileGroup(group, ctx)) {
    return false;
  }
  return hasPermission(ctx.permissions, getProfileEditPermission(group, ctx.scope));
}

export function assertProfileEditFieldGroups(ctx: FieldFilterContext, submittedGroupKeys: readonly string[]): void {
  for (const groupKey of submittedGroupKeys) {
    if (!canEditProfileFieldGroup(ctx, groupKey)) {
      throw new Error("insufficientPermissions");
    }
  }
}

export function collectProfileEditGroupsFromUpdate(
  audience: ProfileAudience,
  scope: ProfileScope,
  input: {
    readonly core?: Record<string, unknown> | null;
    readonly teacher?: Record<string, unknown> | null;
    readonly parent?: Record<string, unknown> | null;
    readonly staff?: Record<string, unknown> | null;
  }
): string[] {
  const groups = new Set<string>();

  if (input.core) {
    if ("name" in input.core || "email" in input.core || "avatarUrl" in input.core || "displayCurrency" in input.core) {
      groups.add("core_identity");
    }
    if ("phone" in input.core) {
      groups.add("core_contact");
    }
  }

  if (input.teacher && audience === ProfileAudience.TEACHER) {
    const teacherKeys = Object.keys(input.teacher);
    if (teacherKeys.some(key => ["qualifications", "hourlyRate", "rateCurrency"].includes(key))) {
      groups.add("teacher_professional");
    }
    if (
      teacherKeys.some(key => ["nationalId", "dateOfBirth", "gender", "address", "timezone", "status"].includes(key))
    ) {
      groups.add(scope === ProfileScope.OTHER ? "teacher_identity" : "teacher_professional");
    }
    if (teacherKeys.includes("phone")) {
      groups.add("core_contact");
    }
  }

  if (input.parent && audience === ProfileAudience.PARENT) {
    const parentKeys = Object.keys(input.parent);
    if (parentKeys.some(key => ["facebook", "whatsapp", "twitter"].includes(key))) {
      groups.add("parent_social");
    }
    if (parentKeys.some(key => ["nationality", "address", "timezone"].includes(key))) {
      groups.add("parent_identity");
    }
    if (parentKeys.some(key => ["invoiceType", "feeAmount", "currency", "lifecycleStatus"].includes(key))) {
      groups.add("parent_billing");
    }
    if (parentKeys.includes("phone")) {
      groups.add("core_contact");
    }
  }

  if (input.staff && audience === ProfileAudience.STAFF) {
    const staffKeys = Object.keys(input.staff);
    if (staffKeys.includes("phone")) {
      groups.add("core_contact");
    }
    if (staffKeys.includes("status")) {
      groups.add("staff_role");
    }
  }

  return [...groups];
}
