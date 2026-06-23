import { describe, expect, spyOn, test } from "bun:test";
import { PermissionManagementRepository, UserRepository } from "@/backend/db/repo";
import { createTestUser, runInRollback } from "@/backend/db/test/test-utils";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ManagerOnboardingService } from "@/backend/services/staff/manager-onboarding.service";
import { AppPermission, SystemPermissionGroupSlug } from "@/shared/lib/enum";

describe("ManagerOnboardingService.createManager", () => {
  test("rejects non-super-admin user", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);

    let error: unknown = null;
    try {
      await ManagerOnboardingService.createManager("00000000-0000-0000-0000-000000000000", {
        name: "Test",
        email: "test@test.com",
        password: "password123",
        accountType: "manager",
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    hasPermissionSpy.mockRestore();
  });

  test("rejects when actor is not super admin context-wise", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const getUserContextSpy = spyOn(PermissionsService, "getUserContext").mockResolvedValue({
      permissions: [],
      permissionGroups: [SystemPermissionGroupSlug.STAFF_DEFAULT],
      isSuperAdmin: false,
      role: "Staff",
    });

    let error: unknown = null;
    try {
      await ManagerOnboardingService.createManager("00000000-0000-0000-0000-000000000000", {
        name: "Test",
        email: "test@test.com",
        password: "password123",
        accountType: "manager",
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("create manager");

    hasPermissionSpy.mockRestore();
    getUserContextSpy.mockRestore();
  });

  test("creates manager with admin account type", async () => {
    await runInRollback(async txContext => {
      const actor = await createTestUser(txContext);
      const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
      const getUserContextSpy = spyOn(PermissionsService, "getUserContext").mockResolvedValue({
        permissions: [],
        permissionGroups: [SystemPermissionGroupSlug.SUPER_ADMIN],
        isSuperAdmin: true,
        role: "Super Admin",
      });
      const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

      const result = await ManagerOnboardingService.createManager(
        actor.id,
        {
          name: "New Admin",
          email: "newadmin@test.com",
          password: "password123",
          accountType: "admin",
        },
        "en",
        txContext
      );

      expect(result.userId).toBeDefined();
      expect(result.staffProfileId).toBeDefined();
      expect(result.assignedGroupSlug).toBe(SystemPermissionGroupSlug.ACADEMY_ADMIN);

      hasPermissionSpy.mockRestore();
      getUserContextSpy.mockRestore();
      existsByEmailSpy.mockRestore();
    });
  });

  test("creates manager with manager account type", async () => {
    await runInRollback(async txContext => {
      const actor = await createTestUser(txContext);
      const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
      const getUserContextSpy = spyOn(PermissionsService, "getUserContext").mockResolvedValue({
        permissions: [],
        permissionGroups: [SystemPermissionGroupSlug.SUPER_ADMIN],
        isSuperAdmin: true,
        role: "Super Admin",
      });
      const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

      const result = await ManagerOnboardingService.createManager(
        actor.id,
        {
          name: "New Manager",
          email: "newmanager@test.com",
          password: "password123",
          accountType: "manager",
        },
        "en",
        txContext
      );

      expect(result.userId).toBeDefined();
      expect(result.assignedGroupSlug).toBe(SystemPermissionGroupSlug.STAFF_DEFAULT);

      hasPermissionSpy.mockRestore();
      getUserContextSpy.mockRestore();
      existsByEmailSpy.mockRestore();
    });
  });

  test("rejects duplicate email", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const getUserContextSpy = spyOn(PermissionsService, "getUserContext").mockResolvedValue({
      permissions: [],
      permissionGroups: [SystemPermissionGroupSlug.SUPER_ADMIN],
      isSuperAdmin: true,
      role: "Super Admin",
    });
    const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(true);

    let error: unknown = null;
    try {
      await ManagerOnboardingService.createManager("00000000-0000-0000-0000-000000000000", {
        name: "Dup Manager",
        email: "existing@test.com",
        password: "password123",
        accountType: "manager",
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("email");

    hasPermissionSpy.mockRestore();
    getUserContextSpy.mockRestore();
    existsByEmailSpy.mockRestore();
  });

  test("rolls back transaction on subsequent failure", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const getUserContextSpy = spyOn(PermissionsService, "getUserContext").mockResolvedValue({
      permissions: [],
      permissionGroups: [SystemPermissionGroupSlug.SUPER_ADMIN],
      isSuperAdmin: true,
      role: "Super Admin",
    });
    const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

    const createdEmail = "rollback-manager@test.com";
    const listAllGroupsSpy = spyOn(PermissionManagementRepository, "listAllGroups").mockRejectedValue(
      new Error("Database failure")
    );

    let error: unknown = null;
    try {
      await ManagerOnboardingService.createManager("00000000-0000-0000-0000-000000000000", {
        name: "Rollback Manager",
        email: createdEmail,
        password: "password123",
        accountType: "manager",
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();

    // Verify user doesn't exist in DB outside transaction
    const exists = await UserRepository.existsByEmail(createdEmail);
    expect(exists).toBeFalse();

    hasPermissionSpy.mockRestore();
    getUserContextSpy.mockRestore();
    existsByEmailSpy.mockRestore();
    listAllGroupsSpy.mockRestore();
  });

  test("academy admin cannot create manager", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);
    const getUserContextSpy = spyOn(PermissionsService, "getUserContext").mockResolvedValue({
      permissions: [AppPermission.TEACHERS_CREATE, AppPermission.PARENTS_CREATE],
      permissionGroups: [SystemPermissionGroupSlug.ACADEMY_ADMIN],
      isSuperAdmin: false,
      role: "Academy Admin",
    });

    let error: unknown = null;
    try {
      await ManagerOnboardingService.createManager(
        "00000000-0000-0000-0000-000000000000",
        {
          name: "Should Fail",
          email: "fail@test.com",
          password: "password123",
          accountType: "manager",
        },
        "en"
      );
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("permission");

    hasPermissionSpy.mockRestore();
    getUserContextSpy.mockRestore();
  });
});
