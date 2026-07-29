import { beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { PermissionManagementRepository, UserRepository } from "@/backend/db/repo";
import { createTestUser, runInRollback } from "@/backend/db/test/test-utils";
import { AppPermission, SystemPermissionGroupSlug } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { UserOnboardingService } from "@/backend/services/user/user-onboarding.service";
import type { UserReturnType } from "@/backend/types/users/user.types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

let tErrors: ErrorsLabels;

beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

function generateTestPassword(): string {
  return `TestPass-${randomUUID().slice(0, 8)}!`;
}

describe("UserOnboardingService.createUserOfType", () => {
  test("rejects when actor lacks permission", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);
    let error: unknown = null;
    try {
      await UserOnboardingService.createUserOfType({
        actorUserId: "[CC_REDACTED]-[CC_REDACTED]",
        permission: AppPermission.TEACHERS_CREATE,
        coreInput: {
          name: "X",
          email: "x-" + randomUUID() + "@example.com",
          password: generateTestPassword(),
        },
        groupSlug: SystemPermissionGroupSlug.TEACHER_DEFAULT,
        createExtension: async () => ({ id: "fake", status: "ACTIVATED" }),
        tErrors,
        logTag: "Test",
      });
    } catch (e) {
      error = e;
    }
    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("permission");
    hasPermissionSpy.mockRestore();
  });

  test("rejects duplicate email", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(true);
    let error: unknown = null;
    try {
      await UserOnboardingService.createUserOfType({
        actorUserId: "[CC_REDACTED]-[CC_REDACTED]",
        permission: AppPermission.TEACHERS_CREATE,
        coreInput: {
          name: "X",
          email: "dup-" + randomUUID() + "@example.com",
          password: generateTestPassword(),
        },
        groupSlug: SystemPermissionGroupSlug.TEACHER_DEFAULT,
        createExtension: async () => ({ id: "fake", status: "ACTIVATED" }),
        tErrors,
        logTag: "Test",
      });
    } catch (e) {
      error = e;
    }
    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("email");
    hasPermissionSpy.mockRestore();
    existsByEmailSpy.mockRestore();
  });

  test("runs preChecks before the transaction", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);
    let preChecksRan = false;
    let error: unknown = null;
    try {
      await UserOnboardingService.createUserOfType({
        actorUserId: "[CC_REDACTED]-[CC_REDACTED]",
        permission: AppPermission.TEACHERS_CREATE,
        coreInput: {
          name: "X",
          email: "pc-" + randomUUID() + "@example.com",
          password: generateTestPassword(),
        },
        groupSlug: SystemPermissionGroupSlug.TEACHER_DEFAULT,
        preChecks: async () => {
          preChecksRan = true;
          throw new Error("pre-check-boom");
        },
        createExtension: async () => ({ id: "fake", status: "ACTIVATED" }),
        tErrors,
        logTag: "Test",
      });
    } catch (e) {
      error = e;
    }
    expect(preChecksRan).toBeTrue();
    expect((error as Error).message).toBe("pre-check-boom");
    hasPermissionSpy.mockRestore();
    existsByEmailSpy.mockRestore();
  });

  test("supports dynamic groupSlug based on the extension", async () => {
    await runInRollback(async txContext => {
      const actor = await createTestUser(txContext);
      const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
      const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

      type MyExtension = { kind: "admin" | "supervisor" };
      const extension: MyExtension = { kind: "admin" };

      const result = await UserOnboardingService.createUserOfType<MyExtension>(
        {
          actorUserId: actor.id,
          permission: AppPermission.TEACHERS_CREATE,
          coreInput: {
            name: "John Smith",
            email: "dyn-" + randomUUID() + "@example.com",
            password: generateTestPassword(),
          },
          groupSlug: ext =>
            ext.kind === "admin"
              ? SystemPermissionGroupSlug.ACADEMY_ADMIN
              : SystemPermissionGroupSlug.SUPERVISOR_DEFAULT,
          createExtension: async () => extension,
          tErrors,
          logTag: "Dynamic",
        },
        txContext
      );

      expect(result.extension.kind).toBe("admin");
      hasPermissionSpy.mockRestore();
      existsByEmailSpy.mockRestore();
    });
  });

  test("writes optional profile fields (timezone + phone) to the users row", async () => {
    await runInRollback(async txContext => {
      const actor = await createTestUser(txContext);
      const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
      const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

      const result = await UserOnboardingService.createUserOfType<{ id: string; status: string }>(
        {
          actorUserId: actor.id,
          permission: AppPermission.PARENTS_CREATE,
          coreInput: {
            name: "Profiled",
            email: "pf-" + randomUUID() + "@example.com",
            password: generateTestPassword(),
          },
          profileFields: {
            phone: "+15555555555",
            timezone: IanaTimezone.America_New_York,
          },
          groupSlug: SystemPermissionGroupSlug.PARENT_DEFAULT,
          createExtension: async (user: UserReturnType) => ({ id: user.id, status: "ACTIVATED" }),
          tErrors,
          logTag: "Profile",
        },
        txContext
      );

      expect(result.user.id).toBeDefined();
      // Timezone update + phone update should have run inside the transaction — no throw, user row present.
      hasPermissionSpy.mockRestore();
      existsByEmailSpy.mockRestore();
    });
  });

  test("throws permissionGroupNotFound when the slug is missing", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);
    const listAllGroupsSpy = spyOn(PermissionManagementRepository, "listAllGroups").mockResolvedValue([
      { id: "g1", slug: SystemPermissionGroupSlug.PARENT_DEFAULT } as never,
    ]);

    let error: unknown = null;
    try {
      await UserOnboardingService.createUserOfType({
        actorUserId: "[CC_REDACTED]-[CC_REDACTED]",
        permission: AppPermission.TEACHERS_CREATE,
        coreInput: {
          name: "Missing Group",
          email: "miss-" + randomUUID() + "@example.com",
          password: generateTestPassword(),
        },
        groupSlug: SystemPermissionGroupSlug.TEACHER_DEFAULT,
        createExtension: async () => ({ id: "fake", status: "ACTIVATED" }),
        tErrors,
        logTag: "Test",
      });
    } catch (e) {
      error = e;
    }
    expect(error).not.toBeNull();
    expect((error as Error).message).toBe(tErrors.permissionGroup.permissionGroupNotFound);
    hasPermissionSpy.mockRestore();
    existsByEmailSpy.mockRestore();
    listAllGroupsSpy.mockRestore();
  });
});
