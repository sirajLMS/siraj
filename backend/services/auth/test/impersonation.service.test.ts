import { describe, expect, spyOn, test } from "bun:test";
import { UserRepository } from "@/backend/db/repo";
import { ImpersonationService } from "@/backend/services/auth/impersonation.service";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { UserRole } from "@/shared/lib/enum";

const ACTOR_ID = "11111111-1111-1111-1111-111111111111";
const TARGET_ID = "22222222-2222-2222-2222-222222222222";
const SUPER_TARGET_ID = "33333333-3333-3333-3333-333333333333";

function mockSuperAdminActor() {
  return spyOn(PermissionsService, "getUserContext").mockResolvedValue({
    permissions: [],
    permissionGroups: ["super_admin"],
    isSuperAdmin: true,
    role: UserRole.SUPER_ADMIN,
  });
}

function mockNonSuperAdminActor() {
  return spyOn(PermissionsService, "getUserContext").mockResolvedValue({
    permissions: [],
    permissionGroups: ["academy_admin"],
    isSuperAdmin: false,
    role: UserRole.ACADEMY_ADMIN,
  });
}

function mockTargetUser(overrides: Partial<{ isSuperAdmin: boolean; isActive: boolean; deletedAt: Date | null }> = {}) {
  return spyOn(UserRepository, "findById").mockResolvedValue({
    id: TARGET_ID,
    name: "Target User",
    email: "target@example.com",
    password: "hash",
    isActive: overrides.isActive ?? true,
    isSuperAdmin: overrides.isSuperAdmin ?? false,
    deletedAt: overrides.deletedAt ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerifiedAt: null,
    rememberTokenHash: null,
    avatarFilePath: null,
    avatarUrl: null,
    lastLoginAt: null,
  });
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

describe("ImpersonationService.assertCanImpersonate", () => {
  const locale = "en";

  test("rejects self-impersonation", async () => {
    const actorSpy = mockSuperAdminActor();
    const error = await expectRejection(() => ImpersonationService.assertCanImpersonate(ACTOR_ID, ACTOR_ID, locale));
    expect(error.message).toContain("yourself");
    actorSpy.mockRestore();
  });

  test("rejects non-super-admin actor", async () => {
    const actorSpy = mockNonSuperAdminActor();
    const error = await expectRejection(() => ImpersonationService.assertCanImpersonate(ACTOR_ID, TARGET_ID, locale));
    expect(error.message).toContain("not allowed");
    actorSpy.mockRestore();
  });

  test("rejects super admin target", async () => {
    const actorSpy = mockSuperAdminActor();
    const targetSpy = mockTargetUser({ isSuperAdmin: true });
    const error = await expectRejection(() =>
      ImpersonationService.assertCanImpersonate(ACTOR_ID, SUPER_TARGET_ID, locale)
    );
    expect(error.message).toContain("super administrator");
    actorSpy.mockRestore();
    targetSpy.mockRestore();
  });

  test("rejects inactive target", async () => {
    const actorSpy = mockSuperAdminActor();
    const targetSpy = mockTargetUser({ isActive: false });
    const error = await expectRejection(() => ImpersonationService.assertCanImpersonate(ACTOR_ID, TARGET_ID, locale));
    expect(error.message).toContain("inactive");
    actorSpy.mockRestore();
    targetSpy.mockRestore();
  });

  test("allows super admin to impersonate regular user", async () => {
    const actorSpy = mockSuperAdminActor();
    const targetSpy = mockTargetUser();
    await ImpersonationService.assertCanImpersonate(ACTOR_ID, TARGET_ID, locale);
    actorSpy.mockRestore();
    targetSpy.mockRestore();
  });
});
