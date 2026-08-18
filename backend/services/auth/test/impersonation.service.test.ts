import { describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { UserRepository } from "@/backend/db/repo/users";
import { AccountStatus, UserRole } from "@/backend/enum";
import { ImpersonationService } from "@/backend/services/auth/impersonation.service";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { errorsEn } from "@/shared/locale/en/errors";

/* Test constants */

const ACTOR_ID = "11111111-1111-1111-1111-111111111111";
const TARGET_ID = "22222222-2222-2222-2222-222222222222";
const SUPER_TARGET_ID = "33333333-3333-3333-3333-333333333333";

const tErrors = errorsEn;

/* Test fixtures */

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

function mockTargetUser(overrides: Partial<{ isSuperAdmin: boolean; status: string; deletedAt: Date | null }> = {}) {
  return spyOn(UserRepository, "findById").mockResolvedValue({
    id: TARGET_ID,
    name: "Target User",
    email: "target@example.com",
    password: `TestPass-${randomUUID().slice(0, 8)}!`,
    status: overrides.status ?? AccountStatus.ACTIVATED,
    isSuperAdmin: overrides.isSuperAdmin ?? false,
    deletedAt: overrides.deletedAt ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerifiedAt: null,
    rememberTokenHash: null,
    avatarFilePath: null,
    avatarUrl: null,
    lastLoginAt: null,
    timezone: IanaTimezone.UTC,
    displayCurrency: null,
    phone: null,
  });
}

async function expectRejection(fn: () => Promise<unknown>) {
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

// Test helper functions
function mockActorAndTarget(
  actorType: "superAdmin" | "nonSuperAdmin",
  targetOverrides: Parameters<typeof mockTargetUser>[0],
  _targetId: string = TARGET_ID
) {
  const actorSpy = actorType === "superAdmin" ? mockSuperAdminActor() : mockNonSuperAdminActor();
  const targetSpy = mockTargetUser(targetOverrides);
  return { actorSpy, targetSpy };
}

function restoreSpies(spies: { actorSpy: ReturnType<typeof spyOn>; targetSpy?: ReturnType<typeof spyOn> }) {
  spies.actorSpy.mockRestore();
  spies.targetSpy?.mockRestore();
}

describe("ImpersonationService.assertCanImpersonate", () => {
  test("rejects self-impersonation", async () => {
    const actorSpy = mockSuperAdminActor();
    const error = await expectRejection(() => ImpersonationService.assertCanImpersonate(ACTOR_ID, ACTOR_ID, tErrors));
    expect(error.message).toContain("yourself");
    actorSpy.mockRestore();
  });

  test("rejects non-super-admin actor", async () => {
    const actorSpy = mockNonSuperAdminActor();
    const error = await expectRejection(() => ImpersonationService.assertCanImpersonate(ACTOR_ID, TARGET_ID, tErrors));
    expect(error.message).toContain("not allowed");
    actorSpy.mockRestore();
  });

  test("rejects super admin target", async () => {
    const spies = mockActorAndTarget("superAdmin", { isSuperAdmin: true }, SUPER_TARGET_ID);
    const error = await expectRejection(() =>
      ImpersonationService.assertCanImpersonate(ACTOR_ID, SUPER_TARGET_ID, tErrors)
    );
    expect(error.message).toContain("super administrator");
    restoreSpies(spies);
  });

  test("rejects inactive target", async () => {
    const spies = mockActorAndTarget("superAdmin", { status: AccountStatus.DEACTIVATED });
    const error = await expectRejection(() => ImpersonationService.assertCanImpersonate(ACTOR_ID, TARGET_ID, tErrors));
    expect(error.message).toContain("inactive");
    restoreSpies(spies);
  });

  test("allows super admin to impersonate regular user", async () => {
    const actorSpy = mockSuperAdminActor();
    const targetSpy = mockTargetUser();
    await ImpersonationService.assertCanImpersonate(ACTOR_ID, TARGET_ID, tErrors);
    expect(actorSpy).toHaveBeenCalled();
    expect(targetSpy).toHaveBeenCalled();
    actorSpy.mockRestore();
    targetSpy.mockRestore();
  });
});
