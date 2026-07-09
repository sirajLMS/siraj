import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { DBTransaction } from "@/backend/db/db.types";
import { ImpersonationRepository } from "@/backend/db/repo";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { StartImpersonationInput } from "@/backend/types";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

function impersonationTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      await fn(tx);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

async function setupActorAndTarget(tx: DBTransaction) {
  const actor = await createTestUser(tx, {
    name: "Impersonation Actor",
    email: `actor-${randomUUID()}@test.com`,
    isSuperAdmin: true,
  });
  const target = await createTestUser(tx, {
    name: "Impersonation Target",
    email: `target-${randomUUID()}@test.com`,
  });
  return { actor, target };
}

function buildSessionInput(
  actorUserId: string,
  targetUserId: string,
  overrides: Partial<StartImpersonationInput> = {}
): StartImpersonationInput {
  return {
    actorUserId,
    targetUserId,
    sessionId: `sess-${randomUUID()}`,
    reason: "Support investigation",
    ipAddress: "192.168.1.10", // NOSONAR
    userAgent: "TestAgent/1.0",
    ...overrides,
  };
}

describe("ImpersonationRepository", () => {
  impersonationTest("createSession inserts an active impersonation row", async tx => {
    const { actor, target } = await setupActorAndTarget(tx);
    const input = buildSessionInput(actor.id, target.id);

    const created = await ImpersonationRepository.createSession(input, tx);

    expect(created.id).toBeDefined();
    expect(created.actorUserId).toBe(actor.id);
    expect(created.targetUserId).toBe(target.id);
    expect(created.sessionId).toBe(input.sessionId);
    expect(created.reason).toBe(input.reason ?? null);
    expect(created.userAgent).toBe(input.userAgent ?? null);
    expect(created.isActive).toBe(true);
    expect(created.endedAt).toBeNull();
    expect(created.startedAt).toBeInstanceOf(Date);
    expect(String(created.ipAddress)).toBe("192.168.1.10"); // NOSONAR
  });

  impersonationTest("createSession sanitizes invalid IP addresses to 127.0.0.1", async tx => {
    const { actor, target } = await setupActorAndTarget(tx);
    const input = buildSessionInput(actor.id, target.id, { ipAddress: "not-an-ip" });

    const created = await ImpersonationRepository.createSession(input, tx);

    expect(String(created.ipAddress)).toBe("127.0.0.1");
  });

  impersonationTest("createSession strips IPv4 from IPv4:port form", async tx => {
    const { actor, target } = await setupActorAndTarget(tx);
    const input = buildSessionInput(actor.id, target.id, { ipAddress: "10.0.0.5:443" });

    const created = await ImpersonationRepository.createSession(input, tx);

    expect(String(created.ipAddress)).toBe("10.0.0.5"); // NOSONAR
  });

  impersonationTest("createSession stores null IP when omitted", async tx => {
    const { actor, target } = await setupActorAndTarget(tx);
    const input = buildSessionInput(actor.id, target.id, { ipAddress: null });

    const created = await ImpersonationRepository.createSession(input, tx);

    expect(created.ipAddress).toBeNull();
  });

  impersonationTest("findActiveByActor returns the active session for an actor", async tx => {
    const { actor, target } = await setupActorAndTarget(tx);
    const input = buildSessionInput(actor.id, target.id);
    const created = await ImpersonationRepository.createSession(input, tx);

    const found = await ImpersonationRepository.findActiveByActor(actor.id, tx);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.sessionId).toBe(input.sessionId);
  });

  impersonationTest("findActiveByActor returns null when no active session exists", async tx => {
    const { actor } = await setupActorAndTarget(tx);

    const found = await ImpersonationRepository.findActiveByActor(actor.id, tx);

    expect(found).toBeNull();
  });

  impersonationTest("findActiveBySessionId returns the active session", async tx => {
    const { actor, target } = await setupActorAndTarget(tx);
    const input = buildSessionInput(actor.id, target.id);
    const created = await ImpersonationRepository.createSession(input, tx);

    const found = await ImpersonationRepository.findActiveBySessionId(input.sessionId, tx);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
  });

  impersonationTest("findActiveBySessionId returns null for unknown session id", async tx => {
    const found = await ImpersonationRepository.findActiveBySessionId(`missing-${randomUUID()}`, tx);

    expect(found).toBeNull();
  });

  impersonationTest("endById deactivates an active session", async tx => {
    const { actor, target } = await setupActorAndTarget(tx);
    const created = await ImpersonationRepository.createSession(buildSessionInput(actor.id, target.id), tx);

    const ended = await ImpersonationRepository.endById(created.id, tx);

    expect(ended).not.toBeNull();
    expect(ended?.isActive).toBe(false);
    expect(ended?.endedAt).toBeInstanceOf(Date);

    const stillActive = await ImpersonationRepository.findActiveByActor(actor.id, tx);
    expect(stillActive).toBeNull();
  });

  impersonationTest("endById returns null for unknown session id", async tx => {
    const ended = await ImpersonationRepository.endById(NIL_UUID, tx);

    expect(ended).toBeNull();
  });

  impersonationTest("endById returns null when session is already inactive", async tx => {
    const { actor, target } = await setupActorAndTarget(tx);
    const created = await ImpersonationRepository.createSession(buildSessionInput(actor.id, target.id), tx);
    await ImpersonationRepository.endById(created.id, tx);

    const secondEnd = await ImpersonationRepository.endById(created.id, tx);

    expect(secondEnd).toBeNull();
  });

  impersonationTest("endActiveForActor deactivates the actor's active session", async tx => {
    const { actor, target } = await setupActorAndTarget(tx);
    const created = await ImpersonationRepository.createSession(buildSessionInput(actor.id, target.id), tx);

    const ended = await ImpersonationRepository.endActiveForActor(actor.id, tx);

    expect(ended).not.toBeNull();
    expect(ended?.id).toBe(created.id);
    expect(ended?.isActive).toBe(false);
    expect(ended?.endedAt).toBeInstanceOf(Date);
  });

  impersonationTest("endActiveForActor returns null when actor has no active session", async tx => {
    const { actor } = await setupActorAndTarget(tx);

    const ended = await ImpersonationRepository.endActiveForActor(actor.id, tx);

    expect(ended).toBeNull();
  });

  impersonationTest("endActiveForActor then createSession allows a new active session", async tx => {
    const { actor, target } = await setupActorAndTarget(tx);
    const otherTarget = await createTestUser(tx, {
      name: "Second Target",
      email: `target2-${randomUUID()}@test.com`,
    });

    const first = await ImpersonationRepository.createSession(buildSessionInput(actor.id, target.id), tx);
    await ImpersonationRepository.endActiveForActor(actor.id, tx);

    const second = await ImpersonationRepository.createSession(buildSessionInput(actor.id, otherTarget.id), tx);

    expect(second.id).not.toBe(first.id);
    expect(second.targetUserId).toBe(otherTarget.id);
    expect(second.isActive).toBe(true);

    const active = await ImpersonationRepository.findActiveByActor(actor.id, tx);
    expect(active?.id).toBe(second.id);
  });

  impersonationTest("createSession rejects invalid actor user id via foreign key", async tx => {
    const { target } = await setupActorAndTarget(tx);
    const input = buildSessionInput(NIL_UUID, target.id);

    const error = await expectRepoError(() => ImpersonationRepository.createSession(input, tx));

    expect(error.message.toLowerCase()).toContain("foreign key");
  });

  impersonationTest("createSession rejects invalid target user id via foreign key", async tx => {
    const { actor } = await setupActorAndTarget(tx);
    const input = buildSessionInput(actor.id, NIL_UUID);

    const error = await expectRepoError(() => ImpersonationRepository.createSession(input, tx));

    expect(error.message.toLowerCase()).toContain("foreign key");
  });

  impersonationTest("inactive sessions do not block a new active session for the same actor", async tx => {
    const { actor, target } = await setupActorAndTarget(tx);
    const first = await ImpersonationRepository.createSession(buildSessionInput(actor.id, target.id), tx);
    await ImpersonationRepository.endById(first.id, tx);

    const second = await ImpersonationRepository.createSession(buildSessionInput(actor.id, target.id), tx);

    expect(second.isActive).toBe(true);

    const active = await ImpersonationRepository.findActiveByActor(actor.id, tx);
    expect(active?.id).toBe(second.id);
  });
});
