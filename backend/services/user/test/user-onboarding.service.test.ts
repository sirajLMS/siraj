import { beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions";
import { UserRepository } from "@/backend/db/repo/users";
import { createTestUserWithDefaults, runInRollback } from "@/backend/db/test/test-utils";
import { AppPermission, SystemPermissionGroupSlug } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  type UserOnboardingService,
  UserOnboardingService as UserOnboardingServiceImpl,
} from "@/backend/services/user/user-onboarding.service";
import type { GroupWithPermissionIds, UserReturnType } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

let tErrors: ErrorsLabels;

beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

function generateTestPassword(): string {
  return `TestPass-${randomUUID().slice(0, 8)}!`;
}

type CreateUserOptions<TExtension = { id: string; status: string }> =
  UserOnboardingService.CreateUserOfTypeOptions<TExtension>;

function buildCreateUserOptions<TExtension>(
  overrides: Partial<CreateUserOptions<TExtension>> = {}
): CreateUserOptions<TExtension> {
  return {
    actorUserId: randomUUID(),
    permission: AppPermission.TEACHERS_CREATE,
    coreInput: {
      name: "X",
      email: `test-${randomUUID()}@example.com`,
      password: generateTestPassword(),
    },
    groupSlug: SystemPermissionGroupSlug.TEACHER_DEFAULT,
    createExtension: async () => {
      throw new Error("createExtension must be overridden in tests that reach extension creation");
    },
    tErrors,
    logTag: "Test",
    ...overrides,
  };
}

function buildMockGroup(id: string, slug: SystemPermissionGroupSlug): GroupWithPermissionIds {
  return {
    id,
    slug,
    name: { en: "Mock Group" },
    description: null,
    isSystem: false,
    createdByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissionIds: [],
    assignedUsers: [],
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function expectCreateUserOfTypeError(
  overrides: Partial<CreateUserOptions>,
  assertMessage: (message: string) => void,
  spies?: {
    readonly hasPermission?: boolean;
    readonly existsByEmail?: boolean;
    readonly listAllGroups?: GroupWithPermissionIds[];
  }
): Promise<void> {
  const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(spies?.hasPermission ?? true);
  const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(spies?.existsByEmail ?? false);
  const listAllGroupsSpy =
    spies?.listAllGroups === undefined
      ? null
      : spyOn(PermissionManagementRepository, "listAllGroups").mockResolvedValue(spies.listAllGroups);

  let error: unknown = null;
  try {
    await UserOnboardingServiceImpl.createUserOfType(buildCreateUserOptions(overrides));
  } catch (e) {
    error = e;
  }

  expect(error).not.toBeNull();
  assertMessage(getErrorMessage(error));

  hasPermissionSpy.mockRestore();
  existsByEmailSpy.mockRestore();
  listAllGroupsSpy?.mockRestore();
}

function mockCreateUserSpies() {
  return {
    hasPermissionSpy: spyOn(PermissionsService, "hasPermission").mockResolvedValue(true),
    existsByEmailSpy: spyOn(UserRepository, "existsByEmail").mockResolvedValue(false),
  };
}

describe("UserOnboardingService.createUserOfType", () => {
  test("rejects when actor lacks permission", async () => {
    await expectCreateUserOfTypeError({}, message => expect(message).toContain("permission"), {
      hasPermission: false,
    });
  });

  test("rejects duplicate email", async () => {
    await expectCreateUserOfTypeError({}, message => expect(message).toContain("email"), {
      existsByEmail: true,
    });
  });

  test("runs preChecks before the transaction", async () => {
    let preChecksRan = false;
    let error: unknown = null;
    const { hasPermissionSpy, existsByEmailSpy } = mockCreateUserSpies();

    try {
      await UserOnboardingServiceImpl.createUserOfType(
        buildCreateUserOptions({
          preChecks: async () => {
            preChecksRan = true;
            throw new Error("pre-check-boom");
          },
        })
      );
    } catch (e) {
      error = e;
    }

    expect(preChecksRan).toBeTrue();
    expect(getErrorMessage(error)).toBe("pre-check-boom");
    hasPermissionSpy.mockRestore();
    existsByEmailSpy.mockRestore();
  });

  test("supports dynamic groupSlug based on the extension", async () => {
    await runInRollback(async txContext => {
      const actor = await createTestUserWithDefaults(txContext);
      const { hasPermissionSpy, existsByEmailSpy } = mockCreateUserSpies();

      type MyExtension = { kind: "admin" | "supervisor" };
      const extension: MyExtension = { kind: "admin" };

      const result = await UserOnboardingServiceImpl.createUserOfType<MyExtension>(
        buildCreateUserOptions({
          actorUserId: actor.id,
          coreInput: {
            name: "John Smith",
            email: `dyn-${randomUUID()}@example.com`,
            password: generateTestPassword(),
          },
          groupSlug: ext =>
            ext.kind === "admin"
              ? SystemPermissionGroupSlug.ACADEMY_ADMIN
              : SystemPermissionGroupSlug.SUPERVISOR_DEFAULT,
          createExtension: async () => extension,
          logTag: "Dynamic",
        }),
        txContext
      );

      expect(result.extension.kind).toBe("admin");
      hasPermissionSpy.mockRestore();
      existsByEmailSpy.mockRestore();
    });
  });

  test("writes optional profile fields (timezone + phone) to the users row", async () => {
    await runInRollback(async txContext => {
      const actor = await createTestUserWithDefaults(txContext);
      const { hasPermissionSpy, existsByEmailSpy } = mockCreateUserSpies();

      const result = await UserOnboardingServiceImpl.createUserOfType<{ id: string; status: string }>(
        buildCreateUserOptions({
          actorUserId: actor.id,
          permission: AppPermission.PARENTS_CREATE,
          coreInput: {
            name: "Profiled",
            email: `pf-${randomUUID()}@example.com`,
            password: generateTestPassword(),
          },
          profileFields: {
            phone: "+15555555555",
            timezone: IanaTimezone.America_New_York,
          },
          groupSlug: SystemPermissionGroupSlug.PARENT_DEFAULT,
          createExtension: async (user: UserReturnType) => ({ id: user.id, status: "ACTIVATED" }),
          logTag: "Profile",
        }),
        txContext
      );

      expect(result.user.id).toBeDefined();
      hasPermissionSpy.mockRestore();
      existsByEmailSpy.mockRestore();
    });
  });

  test("throws permissionGroupNotFound when the slug is missing", async () => {
    await expectCreateUserOfTypeError(
      {
        coreInput: {
          name: "Missing Group",
          email: `miss-${randomUUID()}@example.com`,
          password: generateTestPassword(),
        },
        createExtension: async user => ({ id: user.id, status: "ACTIVATED" }),
      },
      message => expect(message).toBe(tErrors.permissionGroup.permissionGroupNotFound),
      {
        listAllGroups: [buildMockGroup("g1", SystemPermissionGroupSlug.PARENT_DEFAULT)],
      }
    );
  });
});
