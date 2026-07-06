import { describe, expect, spyOn, test } from "bun:test";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { PermissionGroupSimulationService } from "@/backend/services/auth/permission-group-simulation.service";
import { UserRole } from "@/shared/lib/enum";

const ACTOR_ID = "11111111-1111-1111-1111-111111111111";

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

function mockGroupContext() {
  return spyOn(PermissionsService, "getPermissionGroupContext").mockResolvedValue({
    permissions: [],
    permissionGroups: ["teacher_default"],
    isSuperAdmin: false,
    role: UserRole.TEACHER,
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

describe("PermissionGroupSimulationService.assertCanSimulateGroup", () => {
  const locale = "en";

  test("rejects non-super-admin actor", async () => {
    const actorSpy = mockNonSuperAdminActor();
    const groupSpy = mockGroupContext();
    const error = await expectRejection(() =>
      PermissionGroupSimulationService.assertCanSimulateGroup(ACTOR_ID, "teacher", locale)
    );
    expect(error.message).toContain("not allowed");
    actorSpy.mockRestore();
    groupSpy.mockRestore();
  });

  test("allows super admin for valid group slug", async () => {
    const actorSpy = mockSuperAdminActor();
    const groupSpy = mockGroupContext();
    await PermissionGroupSimulationService.assertCanSimulateGroup(ACTOR_ID, "teacher_default", locale);
    actorSpy.mockRestore();
    groupSpy.mockRestore();
  });

  test("rejects simulating a group the actor already has", async () => {
    const actorSpy = mockSuperAdminActor();
    const error = await expectRejection(() =>
      PermissionGroupSimulationService.assertCanSimulateGroup(ACTOR_ID, "super_admin", locale)
    );
    expect(error.message).toContain("already have");
    actorSpy.mockRestore();
  });
});
