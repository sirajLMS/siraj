import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { SessionRepository } from "@/backend/db/repo/shared";
import type { CustomJWTPayload } from "@/backend/lib/auth/jwt";
import { ImpersonationService } from "@/backend/services/auth/impersonation.service";
import { PermissionGroupSimulationService } from "@/backend/services/auth/permission-group-simulation.service";
import type { SessionSelectType } from "@/backend/types";

const ACTOR_ID = "00000000-0000-0000-0000-000000000001";
const SESSION_ID = "session-raw-id";

function makeMockSession(userId: string | null): SessionSelectType {
  return {
    hashedId: "hashed",
    userId,
    ipAddress: null,
    userAgent: null,
    payload: JSON.stringify({}),
    lastActivity: BigInt(Date.now()),
  };
}

const basePayload: CustomJWTPayload = {
  userId: ACTOR_ID,
  email: "test@example.com",
  type: "access",
} satisfies CustomJWTPayload;

function restoreSpies(...spies: ReturnType<typeof spyOn>[]) {
  for (const spy of spies) spy.mockRestore();
}

describe("R3-6: deduplicate findSessionById in context creation", () => {
  let findSessionSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    findSessionSpy = spyOn(SessionRepository, "findSessionById");
  });

  afterEach(() => {
    findSessionSpy.mockRestore();
  });

  test("resolveAuthIdentityFromToken: uses preloaded session, does not call findSessionById", async () => {
    const preloaded = makeMockSession(ACTOR_ID);
    findSessionSpy.mockResolvedValue(preloaded);

    const identity = await ImpersonationService.resolveAuthIdentityFromToken(basePayload, SESSION_ID, preloaded);

    expect(identity).not.toBeNull();
    expect(findSessionSpy).not.toHaveBeenCalled();
  });

  test("resolveAuthIdentityFromToken: calls findSessionById when no preloaded session provided", async () => {
    findSessionSpy.mockResolvedValue(makeMockSession(ACTOR_ID));

    const identity = await ImpersonationService.resolveAuthIdentityFromToken(basePayload, SESSION_ID);

    expect(identity).not.toBeNull();
    expect(findSessionSpy).toHaveBeenCalledTimes(1);
  });

  test("resolveGroupSimulationFromToken: uses preloaded session, does not call findSessionById", async () => {
    const preloaded = makeMockSession(ACTOR_ID);
    findSessionSpy.mockResolvedValue(preloaded);
    const grpSimSpy = spyOn(SessionRepository, "getSessionGroupSimulation").mockResolvedValue(null);

    const resolved = await PermissionGroupSimulationService.resolveGroupSimulationFromToken(
      basePayload,
      SESSION_ID,
      preloaded
    );

    expect(resolved).not.toBeNull();
    expect(findSessionSpy).not.toHaveBeenCalled();
    restoreSpies(grpSimSpy);
  });

  test("resolveGroupSimulationFromToken: calls findSessionById when no preloaded session provided", async () => {
    findSessionSpy.mockResolvedValue(makeMockSession(ACTOR_ID));
    const grpSimSpy = spyOn(SessionRepository, "getSessionGroupSimulation").mockResolvedValue(null);

    const resolved = await PermissionGroupSimulationService.resolveGroupSimulationFromToken(basePayload, SESSION_ID);

    expect(resolved).not.toBeNull();
    expect(findSessionSpy).toHaveBeenCalledTimes(1);
    restoreSpies(grpSimSpy);
  });

  test("both resolvers share the same preloaded session — findSessionById called zero times combined", async () => {
    const preloaded = makeMockSession(ACTOR_ID);
    findSessionSpy.mockResolvedValue(preloaded);
    const grpSimSpy = spyOn(SessionRepository, "getSessionGroupSimulation").mockResolvedValue(null);

    const authIdentity = await ImpersonationService.resolveAuthIdentityFromToken(basePayload, SESSION_ID, preloaded);
    const groupSimIdentity = await PermissionGroupSimulationService.resolveGroupSimulationFromToken(
      basePayload,
      SESSION_ID,
      preloaded
    );

    expect(authIdentity).not.toBeNull();
    expect(groupSimIdentity).not.toBeNull();
    expect(findSessionSpy).not.toHaveBeenCalled();
    restoreSpies(grpSimSpy);
  });

  test("both resolvers without preloaded session — findSessionById called twice (backward compat)", async () => {
    findSessionSpy.mockResolvedValue(makeMockSession(ACTOR_ID));
    const grpSimSpy = spyOn(SessionRepository, "getSessionGroupSimulation").mockResolvedValue(null);

    await ImpersonationService.resolveAuthIdentityFromToken(basePayload, SESSION_ID);
    await PermissionGroupSimulationService.resolveGroupSimulationFromToken(basePayload, SESSION_ID);

    expect(findSessionSpy).toHaveBeenCalledTimes(2);
    restoreSpies(grpSimSpy);
  });

  test("undefined and null preloaded session both skip findSessionById and return non-impersonating identity", async () => {
    const NO_SESSION: string | undefined = undefined;

    const [authUndef, grpUndef] = await Promise.all([
      ImpersonationService.resolveAuthIdentityFromToken(basePayload, NO_SESSION),
      PermissionGroupSimulationService.resolveGroupSimulationFromToken(basePayload, NO_SESSION),
    ]);
    const [authNull, grpNull] = await Promise.all([
      ImpersonationService.resolveAuthIdentityFromToken(basePayload, SESSION_ID, null),
      PermissionGroupSimulationService.resolveGroupSimulationFromToken(basePayload, SESSION_ID, null),
    ]);

    expect(authUndef).toEqual({ effectiveUserId: ACTOR_ID, isImpersonating: false });
    expect(grpUndef).toEqual({ realUserId: ACTOR_ID, isSimulatingGroup: false });
    expect(authNull).toEqual({ effectiveUserId: ACTOR_ID, isImpersonating: false });
    expect(grpNull).toEqual({ realUserId: ACTOR_ID, isSimulatingGroup: false });
    expect(findSessionSpy).not.toHaveBeenCalled();
  });
});

describe("R3-6: preloaded session propagates correct userId to both resolvers", () => {
  test("session.userId is used by resolveAuthIdentityFromToken for ownership check", async () => {
    const session = makeMockSession(ACTOR_ID);
    const findSessionSpy = spyOn(SessionRepository, "findSessionById");

    const identity = await ImpersonationService.resolveAuthIdentityFromToken(basePayload, SESSION_ID, session);

    expect(identity).toEqual({ effectiveUserId: ACTOR_ID, isImpersonating: false });
    expect(findSessionSpy).not.toHaveBeenCalled();
    restoreSpies(findSessionSpy);
  });

  test("session.userId is used by resolveGroupSimulationFromToken for ownership check", async () => {
    const session = makeMockSession(ACTOR_ID);
    const findSessionSpy = spyOn(SessionRepository, "findSessionById");
    const grpSimSpy = spyOn(SessionRepository, "getSessionGroupSimulation").mockResolvedValue(null);

    const resolved = await PermissionGroupSimulationService.resolveGroupSimulationFromToken(
      basePayload,
      SESSION_ID,
      session
    );

    expect(resolved).toEqual({ realUserId: ACTOR_ID, isSimulatingGroup: false });
    expect(findSessionSpy).not.toHaveBeenCalled();
    restoreSpies(findSessionSpy, grpSimSpy);
  });

  test("session with different userId does not match payload userId", async () => {
    const otherUserId = "00000000-0000-0000-0000-000000000002";
    const session = makeMockSession(otherUserId);
    const findSessionSpy = spyOn(SessionRepository, "findSessionById");
    const grpSimSpy = spyOn(SessionRepository, "getSessionGroupSimulation");

    const resolved = await PermissionGroupSimulationService.resolveGroupSimulationFromToken(
      basePayload,
      SESSION_ID,
      session
    );

    expect(resolved).toEqual({ realUserId: ACTOR_ID, isSimulatingGroup: false });
    expect(findSessionSpy).not.toHaveBeenCalled();
    expect(grpSimSpy).not.toHaveBeenCalled();
    restoreSpies(findSessionSpy, grpSimSpy);
  });
});

describe("R3-6: backward compatibility — no preloadedSession arg (existing callers)", () => {
  test("server-auth.ts path: resolveAuthIdentityFromToken without 3rd arg still works", async () => {
    const findSessionSpy = spyOn(SessionRepository, "findSessionById").mockResolvedValue(makeMockSession(ACTOR_ID));

    const identity = await ImpersonationService.resolveAuthIdentityFromToken(basePayload, SESSION_ID);

    expect(identity).not.toBeNull();
    expect(findSessionSpy).toHaveBeenCalledTimes(1);
    restoreSpies(findSessionSpy);
  });

  test("server-auth.ts path: resolveGroupSimulationFromToken without 3rd arg still works", async () => {
    const findSessionSpy = spyOn(SessionRepository, "findSessionById").mockResolvedValue(makeMockSession(ACTOR_ID));
    const grpSimSpy = spyOn(SessionRepository, "getSessionGroupSimulation").mockResolvedValue(null);

    const resolved = await PermissionGroupSimulationService.resolveGroupSimulationFromToken(basePayload, SESSION_ID);

    expect(resolved).not.toBeNull();
    expect(findSessionSpy).toHaveBeenCalledTimes(1);
    restoreSpies(findSessionSpy, grpSimSpy);
  });
});
