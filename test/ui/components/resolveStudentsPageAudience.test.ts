import { describe, expect, test } from "bun:test";
import { AppPermission, UserRole } from "@/backend/enum";
import type { UserPermissionContext } from "@/backend/services/auth/permissions.service";
import {
  resolveStudentsPageAudience,
} from "@/app/(dashboard)/lib/resolve-students-page-audience";

function buildContext(permissions: AppPermission[], isSuperAdmin = false): UserPermissionContext {
  return {
    permissions,
    permissionGroups: [],
    isSuperAdmin,
    role: UserRole.TEACHER,
  };
}

describe("resolveStudentsPageAudience", () => {
  test("returns teacher for teacher portal users", () => {
    expect(
      resolveStudentsPageAudience(
        buildContext([AppPermission.TEACHER_VIEW_STUDENTS, AppPermission.TEACHER_VIEW_DASHBOARD])
      )
    ).toBe("teacher");
  });

  test("returns parent for parent portal users", () => {
    expect(resolveStudentsPageAudience(buildContext([AppPermission.PARENT_VIEW_STUDENTS]))).toBe("parent");
  });

  test("returns admin for directory users", () => {
    expect(resolveStudentsPageAudience(buildContext([AppPermission.STUDENTS_LIST]))).toBe("admin");
  });

  test("prefers admin when multiple student permissions are present", () => {
    expect(
      resolveStudentsPageAudience(
        buildContext([AppPermission.STUDENTS_LIST, AppPermission.TEACHER_VIEW_STUDENTS])
      )
    ).toBe("admin");
  });

  test("returns null when no student page permission is present", () => {
    expect(resolveStudentsPageAudience(buildContext([AppPermission.DASHBOARD_VIEW]))).toBeNull();
  });
});
