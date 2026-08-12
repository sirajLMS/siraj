import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { DBTransaction } from "@/backend/types";
import { ImpersonationRepository } from "@/backend/db/repo/auth";
import { impersonationSessions } from "@/backend/db/schema/auth/impersonation";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";

async function expectConstraintViolation(fn: () => Promise<unknown>): Promise<void> {
  let didThrow = false;
  try {
    await fn();
  } catch {
    didThrow = true;
  }
  expect(didThrow).toBe(true);
}

async function setupUsers(tx: DBTransaction) {
  const actor = await createTestUser(tx, {
    name: "Constraint Actor",
    email: `constraint-actor-${randomUUID()}@test.com`,
    isSuperAdmin: true,
  });
  const targetA = await createTestUser(tx, {
    name: "Constraint Target A",
    email: `constraint-target-a-${randomUUID()}@test.com`,
  });
  const targetB = await createTestUser(tx, {
    name: "Constraint Target B",
    email: `constraint-target-b-${randomUUID()}@test.com`,
  });
  return { actor, targetA, targetB };
}

describe("Impersonation sessions database logic", () => {
  test("partial unique index allows only one active session per actor", async () => {
    await runInRollback(async tx => {
      const { actor, targetA, targetB } = await setupUsers(tx);
      const now = new Date();

      await tx.insert(impersonationSessions).values({
        actorUserId: actor.id,
        targetUserId: targetA.id,
        sessionId: `sess-a-${randomUUID()}`,
        startedAt: now,
        isActive: true,
      });

      await expectConstraintViolation(() =>
        tx.insert(impersonationSessions).values({
          actorUserId: actor.id,
          targetUserId: targetB.id,
          sessionId: `sess-b-${randomUUID()}`,
          startedAt: now,
          isActive: true,
        })
      );
    });
  });

  test("ending active session via repository allows starting a new one", async () => {
    await runInRollback(async tx => {
      const { actor, targetA, targetB } = await setupUsers(tx);

      await ImpersonationRepository.createSession(
        {
          actorUserId: actor.id,
          targetUserId: targetA.id,
          sessionId: `sess-first-${randomUUID()}`,
        },
        tx
      );

      await ImpersonationRepository.endActiveForActor(actor.id, tx);

      const replacement = await ImpersonationRepository.createSession(
        {
          actorUserId: actor.id,
          targetUserId: targetB.id,
          sessionId: `sess-second-${randomUUID()}`,
        },
        tx
      );

      const active = await ImpersonationRepository.findActiveByActor(actor.id, tx);

      expect(replacement.isActive).toBe(true);
      expect(active?.id).toBe(replacement.id);
      expect(active?.targetUserId).toBe(targetB.id);
    });
  });

  test("multiple inactive sessions for the same actor are allowed", async () => {
    await runInRollback(async tx => {
      const { actor, targetA, targetB } = await setupUsers(tx);
      const now = new Date();

      const [first] = await tx
        .insert(impersonationSessions)
        .values({
          actorUserId: actor.id,
          targetUserId: targetA.id,
          sessionId: `inactive-a-${randomUUID()}`,
          startedAt: now,
          endedAt: now,
          isActive: false,
        })
        .returning();

      const [second] = await tx
        .insert(impersonationSessions)
        .values({
          actorUserId: actor.id,
          targetUserId: targetB.id,
          sessionId: `inactive-b-${randomUUID()}`,
          startedAt: now,
          endedAt: now,
          isActive: false,
        })
        .returning();

      expect(first.isActive).toBe(false);
      expect(second.isActive).toBe(false);
    });
  });
});
