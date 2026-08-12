import { AppPermission } from "@/backend/enum";
import type { UserPermissionContext } from "@/backend/services";

export type StudentsPageAudience = "admin" | "teacher" | "parent";

const STUDENTS_PAGE_PERMISSIONS = [
  AppPermission.STUDENTS_LIST,
  AppPermission.TEACHER_VIEW_STUDENTS,
  AppPermission.PARENT_VIEW_STUDENTS,
] as const;

export function getStudentsPagePermissions(): readonly AppPermission[] {
  return STUDENTS_PAGE_PERMISSIONS;
}

export function resolveStudentsPageAudience(context: UserPermissionContext): StudentsPageAudience | null {
  const { permissions, isSuperAdmin } = context;

  if (isSuperAdmin || permissions.includes(AppPermission.STUDENTS_LIST)) {
    return "admin";
  }
  if (permissions.includes(AppPermission.TEACHER_VIEW_STUDENTS)) {
    return "teacher";
  }
  if (permissions.includes(AppPermission.PARENT_VIEW_STUDENTS)) {
    return "parent";
  }

  return null;
}
