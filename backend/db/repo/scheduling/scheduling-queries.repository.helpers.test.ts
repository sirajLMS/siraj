import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { SchedulingRepository } from "@/backend/db/repo";
import { classLifecycleAffectedUserIds } from "@/backend/db/repo/scheduling/scheduling-queries.repository.helpers";
import { classInstances } from "@/backend/db/schema";
import { createMockClassInstance, setupTestEntities } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";

/**
 * Coverage for `getClassInstanceAffectedUsers` — the helper used by all
 * class lifecycle dispatch sites in `ClassSessionService` /
 * `RecurringClassService` / `ScheduleDeletionService` /
 * `ClassInstanceExpiryService` (specs.md S5).
 *
 * Fixture (per `backend/db/test/AGENTS.md` rule 15):
 *   - Use `setupTestEntities` to create parent+user / student+user /
 *     teacher+user / assignment / class instance — never query seed data.
 *   - Use `runInRollback` for every case.
 *   - Pass `tx` to every repo call.
 *   - Use a known non-existent UUID for the "not found" case.
 *   - Never mix `db`-backed repo calls inside `runInRollback`.
 */
describe("SchedulingQueriesRepositoryHelpers — getClassInstanceAffectedUsers", () => {
  test("resolves parentUserId + studentId + studentUserId + teacherUserId for a live class instance", async () => {
    await runInRollback(async tx => {
      const { parentUser, student, teacherUser, teacher, instance } = await setupTestEntities(tx, "Affected1");
      if (!instance) throw new Error("setupTestEntities did not create an instance");

      const resolved = await SchedulingRepository.getClassInstanceAffectedUsers(instance.id, tx);

      expect(resolved).not.toBeNull();
      if (!resolved) return;
      expect(resolved.parentUserId).toBe(parentUser.id);
      expect(resolved.studentId).toBe(student.id);
      expect(resolved.studentUserId).toBe(student.userId);
      expect(resolved.teacherUserId).toBe(teacherUser.id);
      expect(teacher.userId).toBe(teacherUser.id);
      expect(classLifecycleAffectedUserIds(resolved)).toEqual([parentUser.id, teacherUser.id, student.userId]);
    });
  });

  test("returns null for a non-existent class instance id", async () => {
    await runInRollback(async tx => {
      const unknownId = "00000000-0000-0000-0000-000000000000";
      const resolved = await SchedulingRepository.getClassInstanceAffectedUsers(unknownId, tx);
      expect(resolved).toBeNull();
    });
  });

  test("returns null for an empty class instance id", async () => {
    await runInRollback(async tx => {
      const resolved = await SchedulingRepository.getClassInstanceAffectedUsers("", tx);
      expect(resolved).toBeNull();
    });
  });

  test("resolves the set for a one-off instance (no recurringScheduleId)", async () => {
    await runInRollback(async tx => {
      const { parentUser, student, teacherUser, teacher } = await setupTestEntities(tx, "AffectedOneOff", {
        skipInstance: true,
      });

      const instance = await createMockClassInstance(tx, student.id, teacher.id, {
        recurringScheduleId: null,
      });

      const resolved = await SchedulingRepository.getClassInstanceAffectedUsers(instance.id, tx);
      expect(resolved).not.toBeNull();
      expect(resolved?.parentUserId).toBe(parentUser.id);
      expect(resolved?.studentId).toBe(student.id);
      expect(resolved?.studentUserId).toBe(student.userId);
      expect(resolved?.teacherUserId).toBe(teacherUser.id);
    });
  });

  test("returns null after the class instance is soft-deleted", async () => {
    await runInRollback(async tx => {
      const { teacher, instance } = await setupTestEntities(tx, "AffectedSoftDel");
      if (!instance) throw new Error("setupTestEntities did not create an instance");

      const deleted = await SchedulingRepository.softDeleteClassInstance(instance.id, teacher.userId, tx);
      expect(deleted).not.toBeNull();

      const resolved = await SchedulingRepository.getClassInstanceAffectedUsers(instance.id, tx);
      expect(resolved).toBeNull();

      const [row] = await tx
        .select({ deletedAt: classInstances.deletedAt })
        .from(classInstances)
        .where(eq(classInstances.id, instance.id))
        .limit(1);
      expect(row?.deletedAt).not.toBeNull();
    });
  });

  test("resolves correctly when called inside the creating transaction (pre-commit visibility)", async () => {
    await runInRollback(async tx => {
      const { parentUser, student, teacherUser, instance } = await setupTestEntities(tx, "AffectedPreCommit");
      if (!instance) throw new Error("setupTestEntities did not create an instance");

      const resolved = await SchedulingRepository.getClassInstanceAffectedUsers(instance.id, tx);
      expect(resolved).not.toBeNull();
      expect(resolved?.parentUserId).toBe(parentUser.id);
      expect(resolved?.studentId).toBe(student.id);
      expect(resolved?.studentUserId).toBe(student.userId);
      expect(resolved?.teacherUserId).toBe(teacherUser.id);
    });
  });
});
