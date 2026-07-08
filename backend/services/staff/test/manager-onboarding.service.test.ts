import { describe, expect, spyOn, test } from "bun:test";
import { PermissionManagementRepository, UserRepository } from "@/backend/db/repo";
import { createTestUser, runInRollback } from "@/backend/db/test/test-utils";
import { AppPermission, SystemPermissionGroupSlug, UserRole } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  type ManagerOnboardingInput,
  type ManagerOnboardingResult,
  ManagerOnboardingService,
} from "@/backend/services/staff/manager-onboarding.service";

const DEFAULT_ACTOR_ID = "00000000-0000-0000-0000-000000000000";

interface UserContextMock {
  hasPermission: boolean;
  permissions: AppPermission[];
  permissionGroups: SystemPermissionGroupSlug[];
  isSuperAdmin: boolean;
  role: UserRole;
}

function mockUserContext(opts: UserContextMock) {
  const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(opts.hasPermission);
  const getUserContextSpy = spyOn(PermissionsService, "getUserContext").mockResolvedValue({
    permissions: opts.permissions,
    permissionGroups: opts.permissionGroups,
    isSuperAdmin: opts.isSuperAdmin,
    role: opts.role,
  });
  return { hasPermissionSpy, getUserContextSpy };
}

function mockSuperAdmin() {
  return mockUserContext({
    hasPermission: true,
    permissions: [],
    permissionGroups: [SystemPermissionGroupSlug.SUPER_ADMIN],
    isSuperAdmin: true,
    role: UserRole.SUPER_ADMIN,
  });
}

function mockExistsByEmail(value: boolean) {
  return spyOn(UserRepository, "existsByEmail").mockResolvedValue(value);
}

async function expectRejection(fn: () => Promise<unknown>): Promise<Error> {
  let error: unknown = null;
  try {
    await fn();
  } catch (e) {
    error = e;
  }
  expect(error).not.toBeNull();
  return error as Error;
}

function restoreSpies(...spies: { mockRestore: () => void }[]) {
  for (const spy of spies) spy.mockRestore();
}

async function testCreateManagerInRollback(
  input: ManagerOnboardingInput,
  expectedGroupSlug: SystemPermissionGroupSlug,
  extraAssertions?: (result: ManagerOnboardingResult) => void
) {
  await runInRollback(async txContext => {
    const actor = await createTestUser(txContext);
    const { hasPermissionSpy, getUserContextSpy } = mockSuperAdmin();
    const existsByEmailSpy = mockExistsByEmail(false);

    const result = await ManagerOnboardingService.createManager(actor.id, input, "en", txContext);

    expect(result.userId).toBeDefined();
    expect(result.assignedGroupSlug).toBe(expectedGroupSlug);
    extraAssertions?.(result);

    restoreSpies(hasPermissionSpy, getUserContextSpy, existsByEmailSpy);
  });
}

describe("ManagerOnboardingService.createManager", () => {
  test("rejects non-super-admin user", async () => {
    const { hasPermissionSpy } = mockUserContext({
      hasPermission: false,
      permissions: [],
      permissionGroups: [],
      isSuperAdmin: false,
      role: UserRole.USER,
    });

    await expectRejection(() =>
      ManagerOnboardingService.createManager(DEFAULT_ACTOR_ID, {
        name: "Test",
        email: "test@test.com",
        password: "password123",
        accountType: "manager",
      })
    );

    hasPermissionSpy.mockRestore();
  });

  test("rejects when actor is not super admin context-wise", async () => {
    const { hasPermissionSpy, getUserContextSpy } = mockUserContext({
      hasPermission: true,
      permissions: [],
      permissionGroups: [SystemPermissionGroupSlug.STAFF_DEFAULT],
      isSuperAdmin: false,
      role: UserRole.STAFF,
    });

    const error = await expectRejection(() =>
      ManagerOnboardingService.createManager(DEFAULT_ACTOR_ID, {
        name: "Test",
        email: "test@test.com",
        password: "password123",
        accountType: "manager",
      })
    );

    expect(error.message).toContain("create manager");

    restoreSpies(hasPermissionSpy, getUserContextSpy);
  });

  test("creates manager with admin account type", async () => {
    await testCreateManagerInRollback(
      {
        name: "New Admin",
        email: "newadmin@test.com",
        password: "password123",
        accountType: "admin",
      },
      SystemPermissionGroupSlug.ACADEMY_ADMIN,
      result => {
        expect(result.staffProfileId).toBeDefined();
      }
    );
  });

  test("creates manager with manager account type", async () => {
    await testCreateManagerInRollback(
      {
        name: "New Manager",
        email: "newmanager@test.com",
        password: "password123",
        accountType: "manager",
      },
      SystemPermissionGroupSlug.STAFF_DEFAULT
    );
  });

  test("rejects duplicate email", async () => {
    const { hasPermissionSpy, getUserContextSpy } = mockSuperAdmin();
    const existsByEmailSpy = mockExistsByEmail(true);

    const error = await expectRejection(() =>
      ManagerOnboardingService.createManager(DEFAULT_ACTOR_ID, {
        name: "Dup Manager",
        email: "existing@test.com",
        password: "password123",
        accountType: "manager",
      })
    );

    expect(error.message).toContain("email");

    restoreSpies(hasPermissionSpy, getUserContextSpy, existsByEmailSpy);
  });

  test("rolls back transaction on subsequent failure", async () => {
    const { hasPermissionSpy, getUserContextSpy } = mockSuperAdmin();
    const existsByEmailSpy = mockExistsByEmail(false);

    const createdEmail = "rollback-manager@test.com";
    const listAllGroupsSpy = spyOn(PermissionManagementRepository, "listAllGroups").mockRejectedValue(
      new Error("Database failure")
    );

    await expectRejection(() =>
      ManagerOnboardingService.createManager(DEFAULT_ACTOR_ID, {
        name: "Rollback Manager",
        email: createdEmail,
        password: "password123",
        accountType: "manager",
      })
    );

    const exists = await UserRepository.existsByEmail(createdEmail);
    expect(exists).toBeFalse();

    restoreSpies(hasPermissionSpy, getUserContextSpy, existsByEmailSpy, listAllGroupsSpy);
  });

  test("academy admin cannot create manager", async () => {
    const { hasPermissionSpy, getUserContextSpy } = mockUserContext({
      hasPermission: false,
      permissions: [AppPermission.TEACHERS_CREATE, AppPermission.PARENTS_CREATE],
      permissionGroups: [SystemPermissionGroupSlug.ACADEMY_ADMIN],
      isSuperAdmin: false,
      role: UserRole.ACADEMY_ADMIN,
    });

    const error = await expectRejection(() =>
      ManagerOnboardingService.createManager(
        DEFAULT_ACTOR_ID,
        {
          name: "Should Fail",
          email: "fail@test.com",
          password: "password123",
          accountType: "manager",
        },
        "en"
      )
    );

    expect(error.message).toContain("permission");

    restoreSpies(hasPermissionSpy, getUserContextSpy);
  });
});
