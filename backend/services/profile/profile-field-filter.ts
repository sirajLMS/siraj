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

  const lastSegment = segments.at(-1);
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
 * Uses O(1) direct property access instead of O(N) Object.entries array iteration.
 */
function lookupProfileGroup(key: string): ProfileFieldGroupDefinition | undefined {
  if (Object.hasOwn(PROFILE_FIELD_GROUP_BY_KEY, key)) {
    return PROFILE_FIELD_GROUP_BY_KEY[key as keyof typeof PROFILE_FIELD_GROUP_BY_KEY];
  }
  return undefined;
}

function lookupStudentGroup(key: string): StudentFieldGroupDefinition | undefined {
  if (Object.hasOwn(STUDENT_FIELD_GROUP_BY_KEY, key)) {
    return STUDENT_FIELD_GROUP_BY_KEY[key as keyof typeof STUDENT_FIELD_GROUP_BY_KEY];
  }
  return undefined;
}

export function canViewProfileFieldGroup(ctx: FieldFilterContext, groupKey: string): boolean {
  const group = lookupProfileGroup(groupKey);
  if (!group || !shouldApplyProfileGroup(group, ctx)) {
    return false;
  }
  return hasProfileGroupViewPermission(ctx, group);
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

export function assertProfileEditFieldGroups(ctx: FieldFilterContext, submittedGroupKeys: readonly string[]): void {
  for (const groupKey of submittedGroupKeys) {
    if (!canEditProfileFieldGroup(ctx, groupKey)) {
      throw new Error("insufficientPermissions");
    }
  }
}

const KEY_INCLUDES = (keys: readonly string[], key: string): boolean => keys.includes(key);

function collectCoreGroups(core: Record<string, unknown>, groups: Set<string>): void {
  if (["name", "email", "avatarUrl", "displayCurrency"].some(key => key in core)) {
    groups.add("core_identity");
  }
  if (["phone", "timezone"].some(key => key in core)) {
    groups.add("core_contact");
  }
}

function collectTeacherGroups(teacher: Record<string, unknown>, scope: ProfileScope, groups: Set<string>): void {
  const teacherKeys = Object.keys(teacher);

  if (teacherKeys.some(key => ["qualifications", "hourlyRate", "rateCurrency"].includes(key))) {
    groups.add("teacher_professional");
  }
  if (teacherKeys.some(key => ["nationalId", "dateOfBirth", "gender", "address", "timezone", "status"].includes(key))) {
    groups.add(scope === ProfileScope.OTHER ? "teacher_identity" : "teacher_professional");
  }
  if (KEY_INCLUDES(teacherKeys, "phone")) {
    groups.add("core_contact");
  }
}

function collectParentGroups(parent: Record<string, unknown>, groups: Set<string>): void {
  const parentKeys = Object.keys(parent);

  if (parentKeys.some(key => ["facebook", "whatsapp", "twitter"].includes(key))) {
    groups.add("parent_social");
  }
  if (parentKeys.some(key => ["nationality", "address", "timezone"].includes(key))) {
    groups.add("parent_identity");
  }
  if (parentKeys.some(key => ["invoiceType", "feeAmount", "currency", "lifecycleStatus"].includes(key))) {
    groups.add("parent_billing");
  }
  if (KEY_INCLUDES(parentKeys, "phone")) {
    groups.add("core_contact");
  }
}

function collectStaffGroups(staff: Record<string, unknown>, groups: Set<string>): void {
  const staffKeys = Object.keys(staff);

  if (KEY_INCLUDES(staffKeys, "phone")) {
    groups.add("core_contact");
  }
  if (KEY_INCLUDES(staffKeys, "status") || staffKeys.some(key => ["hourlyRate", "rateCurrency"].includes(key))) {
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
