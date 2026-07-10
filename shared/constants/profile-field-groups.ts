/**
 * Frontend mirror of profile field group keys.
 * Backend uses dot-notation keys (profile.core_identity.view_own).
 * Frontend user store uses GraphQL enum names (PROFILE_CORE_IDENTITY_VIEW_OWN).
 * Resolve via shared/lib/field-group-permission-key.ts — not profileFieldPermissionKey().
 */
export const PROFILE_FIELD_GROUP_KEYS = [
  "core_identity",
  "core_contact",
  "teacher_professional",
  "teacher_identity",
  "parent_social",
  "parent_identity",
  "parent_billing",
  "parent_account",
  "parent_students",
  "teacher_students",
  "staff_role",
  "staff_permissions",
  "payment_methods",
  "meeting_configs",
] as const;

export type ProfileFieldGroupKey = (typeof PROFILE_FIELD_GROUP_KEYS)[number];

export const STUDENT_FIELD_GROUP_KEYS = [
  "student_identity",
  "student_academic",
  "student_teacher",
  "student_parent",
  "student_schedule",
  "student_history",
  "student_quota_edit",
] as const;

export type StudentFieldGroupKey = (typeof STUDENT_FIELD_GROUP_KEYS)[number];

export function profileFieldPermissionKey(
  group: ProfileFieldGroupKey,
  action: "view_own" | "view_other" | "edit_own" | "edit_other"
): string {
  return `profile.${group}.${action}`;
}

export function studentFieldPermissionKey(
  group: StudentFieldGroupKey,
  action: "view_own" | "view_other" | "edit_own" | "edit_other"
): string {
  return `student.${group}.${action}`;
}
