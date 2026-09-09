import { ProfileAudience, ProfileScope } from "@/backend/enum";
import {
  hasProfileGroupEditPermission,
  hasProfileGroupViewPermission,
  hasStudentGroupEditPermission,
  hasStudentGroupViewPermission,
} from "@/backend/services/profile/profile-field-filter-bridge";
import { PROFILE_FIELD_GROUP_BY_KEY, PROFILE_FIELD_GROUPS } from "@/backend/services/profile/profile-field-manifest";
import { STUDENT_FIELD_GROUP_BY_KEY, STUDENT_FIELD_GROUPS } from "@/backend/services/student/student-field-manifest";
import type {
  FieldFilterContext,
  ProfileFieldGroupDefinition,
  StudentFieldFilterContext,
  StudentFieldGroupDefinition,
} from "@/backend/types";

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const PATH_SEGMENTS_CACHE = new Map<string, string[]>();

function getPathSegments(path: string): string[] {
  let segments = PATH_SEGMENTS_CACHE.get(path);
  if (!segments) {
    segments = path.split(".");
    PATH_SEGMENTS_CACHE.set(path, segments);
  }
  return segments;
}

function setValueAtPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const segments = getPathSegments(path);
  let current: Record<string, unknown> = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const next = current[segment];
    if (!isStringRecord(next)) {
      return;
    }
    current = next;
  }

  const lastSegment = segments[segments.length - 1];
  if (lastSegment !== undefined) {
    current[lastSegment] = value;
  }
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

function stripProfileGroupPaths(filtered: Record<string, unknown>, group: ProfileFieldGroupDefinition): void {
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

    if (!hasProfileGroupViewPermission(ctx, group)) {
      stripProfileGroupPaths(filtered, group);
    }
  }

  return filtered;
}

export function filterStudentProfileByFieldGroups<T extends Record<string, unknown>>(
  payload: T,
  ctx: StudentFieldFilterContext
): T {
  const filtered = cloneForFiltering(payload);

  for (const group of STUDENT_FIELD_GROUPS) {
    if (!hasStudentGroupViewPermission(ctx, group)) {
      for (const path of group.paths) {
        setValueAtPath(filtered, path, null);
      }
    }
  }

  return filtered;
}

/**
 * Assertion-free dictionary lookup so arbitrary client strings can never be
 * smuggled past the field-group gates (oxlint no-unsafe-type-assertion).
 */
function lookupProfileGroup(key: string): ProfileFieldGroupDefinition | undefined {
  const groups: Readonly<Record<string, ProfileFieldGroupDefinition>> = PROFILE_FIELD_GROUP_BY_KEY;
  return Object.hasOwn(groups, key) ? groups[key] : undefined;
}

function lookupStudentGroup(key: string): StudentFieldGroupDefinition | undefined {
  const groups: Readonly<Record<string, StudentFieldGroupDefinition>> = STUDENT_FIELD_GROUP_BY_KEY;
  return Object.hasOwn(groups, key) ? groups[key] : undefined;
}

export function canEditProfileFieldGroup(ctx: FieldFilterContext, groupKey: string): boolean {
  const group = lookupProfileGroup(groupKey);
  if (!group || !shouldApplyProfileGroup(group, ctx)) {
    return false;
  }
  return hasProfileGroupEditPermission(ctx, group);
}

export function canViewStudentFieldGroup(ctx: StudentFieldFilterContext, groupKey: string): boolean {
  const group = lookupStudentGroup(groupKey);
  if (!group) {
    return false;
  }
  return hasStudentGroupViewPermission(ctx, group);
}

export function canEditStudentFieldGroup(ctx: StudentFieldFilterContext, groupKey: string): boolean {
  const group = lookupStudentGroup(groupKey);
  if (!group) {
    return false;
  }
  return hasStudentGroupEditPermission(ctx, group);
}

function collectCoreGroups(core: Record<string, unknown>, groups: Set<string>): void {
  if ("name" in core || "email" in core || "avatarUrl" in core || "displayCurrency" in core) {
    groups.add("core_identity");
  }
  if ("phone" in core || "timezone" in core) {
    groups.add("core_contact");
  }
}

function collectTeacherGroups(teacher: Record<string, unknown>, scope: ProfileScope, groups: Set<string>): void {
  if ("qualifications" in teacher || "hourlyRate" in teacher || "rateCurrency" in teacher) {
    groups.add("teacher_professional");
  }
  if (
    "nationalId" in teacher ||
    "dateOfBirth" in teacher ||
    "gender" in teacher ||
    "address" in teacher ||
    "timezone" in teacher ||
    "status" in teacher
  ) {
    groups.add(scope === ProfileScope.OTHER ? "teacher_identity" : "teacher_professional");
  }
  if ("phone" in teacher) {
    groups.add("core_contact");
  }
}

function collectParentGroups(parent: Record<string, unknown>, groups: Set<string>): void {
  if ("facebook" in parent || "whatsapp" in parent || "twitter" in parent) {
    groups.add("parent_social");
  }
  if ("nationality" in parent || "address" in parent || "timezone" in parent) {
    groups.add("parent_identity");
  }
  if ("invoiceType" in parent || "feeAmount" in parent || "currency" in parent || "lifecycleStatus" in parent) {
    groups.add("parent_billing");
  }
  if ("phone" in parent) {
    groups.add("core_contact");
  }
}

function collectStaffGroups(staff: Record<string, unknown>, groups: Set<string>): void {
  if ("phone" in staff) {
    groups.add("core_contact");
  }
  if ("status" in staff || "hourlyRate" in staff || "rateCurrency" in staff) {
    groups.add("staff_role");
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
    collectCoreGroups(input.core, groups);
  }
  if (input.teacher && audience === ProfileAudience.TEACHER) {
    collectTeacherGroups(input.teacher, scope, groups);
  }
  if (input.parent && audience === ProfileAudience.PARENT) {
    collectParentGroups(input.parent, groups);
  }
  if (input.staff && audience === ProfileAudience.STAFF) {
    collectStaffGroups(input.staff, groups);
  }

  return [...groups];
}
