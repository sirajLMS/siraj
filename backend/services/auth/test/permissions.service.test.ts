import { describe, expect, test } from "bun:test";
import { AppPermission, UserRole } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { UserPermissionContext } from "@/backend/types";

function makeContext(overrides: Partial<UserPermissionContext> = {}): UserPermissionContext {
  return {
    permissions: overrides.permissions ?? [],
    permissionGroups: overrides.permissionGroups ?? [],
    isSuperAdmin: overrides.isSuperAdmin ?? false,
    role: overrides.role ?? UserRole.USER,
  };
}

const TEST_PERMISSION_A = AppPermission.DASHBOARD_VIEW;
const TEST_PERMISSION_B = AppPermission.DASHBOARD_VIEW_METRICS;
const TEST_PERMISSION_C = AppPermission.SCHEDULE_VIEW_ALL;

describe("PermissionsService.hasPermission (UserPermissionContext overload)", () => {
  test("superadmin fast-path returns true without checking permissions array", async () => {
    const context = makeContext({ isSuperAdmin: true, role: UserRole.SUPER_ADMIN });
    const result = await PermissionsService.hasPermission(context, TEST_PERMISSION_A);
    expect(result).toBe(true);
  });

  test("superadmin returns true even when permissions array is empty", async () => {
    const context = makeContext({ isSuperAdmin: true, permissions: [], role: UserRole.SUPER_ADMIN });
    const result = await PermissionsService.hasPermission(context, TEST_PERMISSION_A);
    expect(result).toBe(true);
  });

  test("returns true when permission is present in context.permissions", async () => {
    const context = makeContext({ permissions: [TEST_PERMISSION_A, TEST_PERMISSION_B] });
    const result = await PermissionsService.hasPermission(context, TEST_PERMISSION_A);
    expect(result).toBe(true);
  });

  test("returns false when permission is absent from context.permissions", async () => {
    const context = makeContext({ permissions: [TEST_PERMISSION_B] });
    const result = await PermissionsService.hasPermission(context, TEST_PERMISSION_A);
    expect(result).toBe(false);
  });

  test("returns false when permissions array is empty and not superadmin", async () => {
    const context = makeContext({ permissions: [] });
    const result = await PermissionsService.hasPermission(context, TEST_PERMISSION_A);
    expect(result).toBe(false);
  });
});

describe("PermissionsService.hasAnyPermission (UserPermissionContext overload)", () => {
  test("superadmin fast-path returns true without checking permissions array", async () => {
    const context = makeContext({ isSuperAdmin: true, role: UserRole.SUPER_ADMIN });
    const result = await PermissionsService.hasAnyPermission(context, [TEST_PERMISSION_A, TEST_PERMISSION_B]);
    expect(result).toBe(true);
  });

  test("superadmin returns true even when permissions array is empty", async () => {
    const context = makeContext({ isSuperAdmin: true, permissions: [], role: UserRole.SUPER_ADMIN });
    const result = await PermissionsService.hasAnyPermission(context, [TEST_PERMISSION_A]);
    expect(result).toBe(true);
  });

  test("returns true when at least one permission is present in context.permissions", async () => {
    const context = makeContext({ permissions: [TEST_PERMISSION_B, TEST_PERMISSION_C] });
    const result = await PermissionsService.hasAnyPermission(context, [TEST_PERMISSION_A, TEST_PERMISSION_B]);
    expect(result).toBe(true);
  });

  test("returns false when none of the requested permissions are present", async () => {
    const context = makeContext({ permissions: [TEST_PERMISSION_C] });
    const result = await PermissionsService.hasAnyPermission(context, [TEST_PERMISSION_A, TEST_PERMISSION_B]);
    expect(result).toBe(false);
  });

  test("returns false when permissions array is empty and not superadmin", async () => {
    const context = makeContext({ permissions: [] });
    const result = await PermissionsService.hasAnyPermission(context, [TEST_PERMISSION_A, TEST_PERMISSION_B]);
    expect(result).toBe(false);
  });

  test("returns false when permissionKeys array is empty (edge case)", async () => {
    const context = makeContext({ permissions: [TEST_PERMISSION_A] });
    const result = await PermissionsService.hasAnyPermission(context, []);
    expect(result).toBe(false);
  });

  test("returns true when all requested permissions are present", async () => {
    const context = makeContext({
      permissions: [TEST_PERMISSION_A, TEST_PERMISSION_B, TEST_PERMISSION_C],
    });
    const result = await PermissionsService.hasAnyPermission(context, [TEST_PERMISSION_A, TEST_PERMISSION_B]);
    expect(result).toBe(true);
  });
});
