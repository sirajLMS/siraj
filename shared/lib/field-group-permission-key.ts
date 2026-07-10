import {
  type ProfileFieldGroupKey,
  profileFieldPermissionKey,
  type StudentFieldGroupKey,
  studentFieldPermissionKey,
} from "@/shared/constants/profile-field-groups";

export type FieldGroupAction = "view_own" | "view_other" | "edit_own" | "edit_other";

/**
 * Converts a backend dot-notation permission key to the GraphQL AppPermission enum name
 * stored in the user store after mapBackendPermissionsToGraphql.
 *
 * profile.core_identity.view_own → PROFILE_CORE_IDENTITY_VIEW_OWN
 * student.student_identity.view_own → STUDENT_IDENTITY_VIEW_OWN
 */
export function backendPermissionKeyToGraphqlName(backendKey: string): string {
  if (backendKey.startsWith("profile.")) {
    const suffix = backendKey.slice("profile.".length).replaceAll(".", "_");
    return `PROFILE_${suffix.toUpperCase()}`;
  }

  if (backendKey.startsWith("student.")) {
    const suffix = backendKey.slice("student.".length).replaceAll(".", "_");
    return suffix.toUpperCase();
  }

  return backendKey;
}

export function profileFieldGroupGraphqlPermission(group: ProfileFieldGroupKey, action: FieldGroupAction): string {
  return backendPermissionKeyToGraphqlName(profileFieldPermissionKey(group, action));
}

export function studentFieldGroupGraphqlPermission(group: StudentFieldGroupKey, action: FieldGroupAction): string {
  return backendPermissionKeyToGraphqlName(studentFieldPermissionKey(group, action));
}
