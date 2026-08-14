import { beforeAll, describe, expect, spyOn, test } from "bun:test";
import { SessionRepository } from "@/backend/db/repo/shared";
import { UserRole } from "@/backend/enum";
import type { CustomJWTPayload } from "@/backend/lib/auth/jwt";
import { PermissionGroupSimulationService } from "@/backend/services/auth/permission-group-simulation.service";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

const ACTOR_ID = "11111111-1111-1111-1111-111111111111";
const SESSION_ID = "session-raw-id";

let tErrors: ErrorsLabels;

beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

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
  if (error instanceof Error) return error;
  throw new Error(String(error));
}

describe("PermissionGroupSimulationService.assertCanSimulateGroup", () => {
  test("rejects non-super-admin actor", async () => {
    const actorSpy = mockNonSuperAdminActor();
    const groupSpy = mockGroupContext();
    const error = await expectRejection(() =>
      PermissionGroupSimulationService.assertCanSimulateGroup(ACTOR_ID, "teacher", tErrors)
    );
    expect(error.message).toContain("not allowed");
    actorSpy.mockRestore();
    groupSpy.mockRestore();
  });

  test("allows super admin for valid group slug", async () => {
    const actorSpy = mockSuperAdminActor();
    const groupContextSpy = mockGroupContext();
    await PermissionGroupSimulationService.assertCanSimulateGroup(ACTOR_ID, "teacher_default", tErrors);
    expect(actorSpy).toHaveBeenCalledWith(ACTOR_ID);
    expect(groupContextSpy).toHaveBeenCalledWith("teacher_default");
    actorSpy.mockRestore();
    groupContextSpy.mockRestore();
  });

  test("rejects simulating a group the actor already has", async () => {
    const actorSpy = mockSuperAdminActor();
    const error = await expectRejection(() =>
      PermissionGroupSimulationService.assertCanSimulateGroup(ACTOR_ID, "super_admin", tErrors)
    );
    expect(error.message).toContain("already have");
    actorSpy.mockRestore();
  });
});

describe("PermissionGroupSimulationService.resolveGroupSimulationFromToken", () => {
  test("falls back to session payload when access token lacks simulation claims", async () => {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const findSessionSpy = spyOn(SessionRepository, "findSessionById").mockResolvedValue({
      hashedId: "hashed",
      userId: ACTOR_ID,
      ipAddress: null,
      userAgent: null,
      payload: JSON.stringify({
        groupSimulation: {
          groupSlug: "teacher_default",
          startedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
      }),
      lastActivity: BigInt(Date.now()),
    });
    const getSimulationSpy = spyOn(SessionRepository, "getSessionGroupSimulation").mockResolvedValue({
      data: {
        groupSlug: "teacher_default",
        startedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      expiresAt,
    });
    const groupSpy = mockGroupContext();

    const payload = {
      userId: ACTOR_ID,
      email: "admin@example.com",
      type: "access",
    } as CustomJWTPayload;

    const resolved = await PermissionGroupSimulationService.resolveGroupSimulationFromToken(payload, SESSION_ID);

    expect(resolved).toEqual({
      realUserId: ACTOR_ID,
      isSimulatingGroup: true,
      simulatedGroupSlug: "teacher_default",
    });

    findSessionSpy.mockRestore();
    getSimulationSpy.mockRestore();
    groupSpy.mockRestore();
  });
});
