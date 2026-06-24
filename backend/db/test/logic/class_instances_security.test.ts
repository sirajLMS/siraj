import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { eq, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { classInstances, students } from "@/backend/db/schema";
import { setupTestEntities } from "@/backend/db/test/entity-setup";
import type { DBTransaction } from "@/backend/db/test/test-utils";
import { runInRollback, setupRlsRole, teardownRlsRole } from "@/backend/db/test/test-utils";
import { getErrorMessage } from "@/shared/utils/error";

async function createTestInstance(
  tx: DBTransaction,
  teacherId: string,
  studentId: string,
  overrides: Partial<typeof classInstances.$inferInsert> = {}
) {
  const [instance] = await tx
    .insert(classInstances)
    .values({
      teacherId,
      studentId,
      classType: "REGULAR",
      scheduledStartAt: new Date(),
      scheduledEndAt: new Date(Date.now() + 3600000),
      durationMinutes: 60,
      idempotencyKey: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      quotaDeducted: false,
      rateAmount: "100.00",
      rateCurrency: "USD",
      ...overrides,
    })
    .returning();
  return instance;
}

describe("Class Instances Security Logic", () => {
  beforeAll(async () => {
    await setupRlsRole();
    const triggerSql = readFileSync("backend/db/migration/class_instances_state_transition_trigger.sql", "utf-8");
    await db.execute(sql.raw(triggerSql));
    const rlsSql = readFileSync("backend/db/migration/class_instances_rls_policies.sql", "utf-8");
    await db.execute(sql.raw(rlsSql));
  });

  afterAll(async () => {
    await teardownRlsRole();
  });

  it("should rollback when a COMPLETED class instance is transitioned to RUNNING", () =>
    runInRollback(async tx => {
      const { teacher, student } = await setupTestEntities(tx, "SecLogic", { skipInstance: true });

      const instance = await createTestInstance(tx, teacher.id, student.id, {
        executionState: "COMPLETED",
        outcome: "TAKEN",
        actualStartAt: new Date(),
        actualEndAt: new Date(Date.now() + 3600000),
      });

      expect(instance.executionState).toBe("COMPLETED");

      const error = await tx
        .update(classInstances)
        .set({ executionState: "RUNNING", outcome: "PENDING" })
        .where(eq(classInstances.id, instance.id))
        .catch(e => e);

      expect(error).toBeInstanceOf(Error);
      expect(getErrorMessage(error)).toMatch(/Invalid transition: Cannot reactivate a COMPLETED class instance/);
    }));

  it("should enforce RLS policies for teachers blocking unauthorized SELECT", () =>
    runInRollback(async tx => {
      const scenario1 = await setupTestEntities(tx, "SecLogic", { skipInstance: true });
      await setupTestEntities(tx, "SecLogic", { skipInstance: true });

      await createTestInstance(tx, scenario1.teacher.id, scenario1.student.id);

      await tx.execute(sql`SET LOCAL ROLE test_rls_user`);
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${scenario1.teacherUser.id}, true)`);

      const instances = await tx.select().from(classInstances);
      expect(instances.length).toBeGreaterThanOrEqual(1);
      for (const inst of instances) {
        expect(inst.teacherId).toBe(scenario1.teacher.id);
      }
    }));

  it("should rollback negative quota updates via check constraint", () =>
    runInRollback(async tx => {
      const { student } = await setupTestEntities(tx, "SecLogic3", { skipInstance: true });

      await tx.update(students).set({ classesRemaining: 0 }).where(eq(students.id, student.id));

      const error = await tx
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} - 1` })
        .where(eq(students.id, student.id))
        .catch(e => e);

      expect(error).toBeInstanceOf(Error);
      expect(getErrorMessage(error)).toMatch(/students_classes_remaining_chk/);
    }));

  describe("Story 2: State Transitions", () => {
    const testOutcome = async (tx: DBTransaction, key: string, outcome: "ABSENT" | "LEAVE") => {
      const { teacher, student } = await setupTestEntities(tx, key, { skipInstance: true });
      const instance = await createTestInstance(tx, teacher.id, student.id, { executionState: "ACTIVATED" });

      await tx
        .update(classInstances)
        .set({ executionState: "COMPLETED", outcome })
        .where(eq(classInstances.id, instance.id));
    };

    it("allows ACTIVATED → COMPLETED with outcome=ABSENT", () =>
      runInRollback(async tx => {
        await testOutcome(tx, "S2-1", "ABSENT");
      }));

    it("allows ACTIVATED → COMPLETED with outcome=LEAVE", () =>
      runInRollback(async tx => {
        await testOutcome(tx, "S2-2", "LEAVE");
      }));

    it("blocks ACTIVATED → COMPLETED with outcome=TAKEN", () =>
      runInRollback(async tx => {
        const { teacher, student } = await setupTestEntities(tx, "S2-3", { skipInstance: true });
        const instance = await createTestInstance(tx, teacher.id, student.id, { executionState: "ACTIVATED" });

        const error = await tx
          .update(classInstances)
          .set({ executionState: "COMPLETED", outcome: "TAKEN" })
          .where(eq(classInstances.id, instance.id))
          .catch(e => e);
        expect(error).toBeInstanceOf(Error);
        expect(getErrorMessage(error)).toMatch(/Invalid transition:/);
      }));

    it("allows COMPLETED → NOT_ACTIVATED (reset)", () =>
      runInRollback(async tx => {
        const { teacher, student } = await setupTestEntities(tx, "S2-4", { skipInstance: true });
        const instance = await createTestInstance(tx, teacher.id, student.id, {
          executionState: "COMPLETED",
          outcome: "TAKEN",
          actualStartAt: new Date(),
          actualEndAt: new Date(Date.now() + 3600000),
        });

        await tx
          .update(classInstances)
          .set({ executionState: "NOT_ACTIVATED", outcome: "PENDING", actualStartAt: null, actualEndAt: null })
          .where(eq(classInstances.id, instance.id));
      }));

    it("allows ACTIVATED → NOT_ACTIVATED (reset)", () =>
      runInRollback(async tx => {
        const { teacher, student } = await setupTestEntities(tx, "S2-5", { skipInstance: true });
        const instance = await createTestInstance(tx, teacher.id, student.id, { executionState: "ACTIVATED" });

        await tx
          .update(classInstances)
          .set({ executionState: "NOT_ACTIVATED", outcome: "PENDING", actualStartAt: null, actualEndAt: null })
          .where(eq(classInstances.id, instance.id));
      }));
  });
});
