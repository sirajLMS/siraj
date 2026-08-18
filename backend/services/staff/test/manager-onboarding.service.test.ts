import { describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions";
import { UserRepository } from "@/backend/db/repo/users";
import { createTestUserWithDefaults, runInRollback } from "@/backend/db/test/test-utils";
import { AppPermission, ManagerAccountType, SystemPermissionGroupSlug, UserRole } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ManagerOnboardingService } from "@/backend/services/staff/manager-onboarding.service";
import type { ManagerOnboardingInput, ManagerOnboardingResult } from "@/backend/types";

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
  if (error instanceof Error) return error;
  return new Error(String(error));
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
    const actor = await createTestUserWithDefaults(txContext);
    const { hasPermissionSpy, getUserContextSpy } = mockSuperAdmin();
    const existsByEmailSpy = mockExistsByEmail(false);

    const result = await ManagerOnboardingService.createManager(actor.id, input, "en", txContext);

    expect(result.userId).toBeDefined();
    expect(result.assignedGroupSlug).toBe(expectedGroupSlug);
    extraAssertions?.(result);

    restoreSpies(hasPermissionSpy, getUserContextSpy, existsByEmailSpy);
  });
}

interface CreateManagerRejectionCase {
  context: UserContextMock;
  name: string;
  email: string;
  assertError: (error: Error) => void;
}

async function expectCreateManagerRejection({ context, name, email, assertError }: CreateManagerRejectionCase) {
  const { hasPermissionSpy, getUserContextSpy } = mockUserContext(context);

  const error = await expectRejection(() =>
    ManagerOnboardingService.createManager(
      DEFAULT_ACTOR_ID,
      {
        name,
        email,
        password: randomUUID(),
        accountType: ManagerAccountType.manager,
      },
      "en"
    )
  );

  assertError(error);

  restoreSpies(hasPermissionSpy, getUserContextSpy);
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
        password: randomUUID(),
        accountType: ManagerAccountType.manager,
      })
    );

    hasPermissionSpy.mockRestore();
  });

  test("rejects when actor is not super admin context-wise", async () => {
    await expectCreateManagerRejection({
      context: {
        hasPermission: true,
        permissions: [],
        permissionGroups: [SystemPermissionGroupSlug.STAFF_DEFAULT],
        isSuperAdmin: false,
        role: UserRole.STAFF,
      },
      name: "Test",
      email: "test@test.com",
      assertError: error => {
        expect(error.message).toBeDefined();
      },
    });
  });

  test("creates manager with manager account type", async () => {
    await testCreateManagerInRollback(
      {
        name: "New Manager",
        email: "newmanager@test.com",
        password: randomUUID(),
        accountType: ManagerAccountType.manager,
      },
      SystemPermissionGroupSlug.ACADEMY_ADMIN,
      result => {
        expect(result.staffProfileId).toBeDefined();
      }
    );
  });

  test("creates supervisor with supervisor account type", async () => {
    await testCreateManagerInRollback(
      {
        name: "New Supervisor",
        email: "newsupervisor@test.com",
        password: randomUUID(),
        accountType: ManagerAccountType.supervisor,
      },
      SystemPermissionGroupSlug.SUPERVISOR_DEFAULT,
      result => {
        expect(result.assignedGroupSlug).toBe(SystemPermissionGroupSlug.SUPERVISOR_DEFAULT);
      }
    );
  });

  test("rejects duplicate email", async () => {
    const { hasPermissionSpy, getUserContextSpy } = mockSuperAdmin();
    const existsByEmailSpy = mockExistsByEmail(true);

    const error = await expectRejection(() =>
      ManagerOnboardingService.createManager(
        DEFAULT_ACTOR_ID,
        {
          name: "Dup Manager",
          email: "existing@test.com",
          password: randomUUID(),
          accountType: ManagerAccountType.manager,
        },
        "en"
      )
    );

    expect(error.message).toBeDefined();

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
        password: randomUUID(),
        accountType: ManagerAccountType.manager,
      })
    );

    const exists = await UserRepository.existsByEmail(createdEmail);
    expect(exists).toBeFalse();

    restoreSpies(hasPermissionSpy, getUserContextSpy, existsByEmailSpy, listAllGroupsSpy);
  });

  test("academy admin cannot create manager", async () => {
    await expectCreateManagerRejection({
      context: {
        hasPermission: false,
        permissions: [AppPermission.TEACHERS_CREATE, AppPermission.PARENTS_CREATE],
        permissionGroups: [SystemPermissionGroupSlug.ACADEMY_ADMIN],
        isSuperAdmin: false,
        role: UserRole.ACADEMY_ADMIN,
      },
      name: "Should Fail",
      email: "fail@test.com",
      assertError: error => {
        expect(error.message).toContain("permission");
      },
    });
  });
});
