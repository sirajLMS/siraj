import { describe, expect, test } from "bun:test";
import { AppPermission, UserRole } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import type { UserPermissionContext } from "@/backend/types";

const PAYROLL_PAGE_REQUIREMENT: readonly AppPermission[] = [AppPermission.ACCOUNTING_PAYROLL_VIEW];

function permissionContext(overrides: Partial<UserPermissionContext>): UserPermissionContext {
  return {
    permissions: [],
    permissionGroups: [],
    isSuperAdmin: false,
    role: UserRole.ACADEMY_ADMIN,
    ...overrides,
  };
}

describe("page permission guard — payroll requirement", () => {
  test("resolves for an actor holding the accounting payroll view permission", async () => {
    const context = permissionContext({
      permissions: [AppPermission.ACCOUNTING_PAYROLL_VIEW],
    });

    const outcome = await requirePermissionForPage("user-payroll-operator", PAYROLL_PAGE_REQUIREMENT, "en", context);

    expect(outcome).toBeUndefined();
  });

  test("resolves for a super admin even without payroll permissions", async () => {
    const context = permissionContext({ isSuperAdmin: true });

    const outcome = await requirePermissionForPage("user-super-admin", PAYROLL_PAGE_REQUIREMENT, "en", context);

    expect(outcome).toBeUndefined();
  });

  test("rejects a manage-only actor because the payroll page requires view", () => {
    const context = permissionContext({
      permissions: [AppPermission.ACCOUNTING_PAYROLL_MANAGE],
    });

    // The denial leg never resolves silently — the concrete throw is
    // environment-dependent (redirect, prefetch forbidden, or request-scope
    // error outside a server request).
    return expect(
      requirePermissionForPage("user-manage-only", PAYROLL_PAGE_REQUIREMENT, "en", context)
    ).rejects.toThrow();
  });

  test("rejects an actor without any payroll permission", () => {
    const context = permissionContext({
      permissions: [AppPermission.AUTH_LOGIN, AppPermission.DASHBOARD_VIEW_METRICS],
      role: UserRole.TEACHER,
    });

    return expect(requirePermissionForPage("user-teacher", PAYROLL_PAGE_REQUIREMENT, "en", context)).rejects.toThrow();
  });
});
