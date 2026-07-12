import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { classInstances, students } from "@/backend/db/schema";
import { setupTestEntities } from "@/backend/db/test/entity-setup";
import { runInRollback, setupRlsPolicies, setupRlsRole, teardownRlsRole } from "@/backend/db/test/test-utils";
import { CurrencyCode } from "@/backend/enum";
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
      rateCurrency: CurrencyCode.USD,
      ...overrides,
    })
    .returning();
  return instance;
}

describe("Class Instances Security Logic", () => {
  beforeAll(async () => {
    await setupRlsRole();
    await setupRlsPolicies([
      {
        table: "class_instances",
        name: "class_instances_select_policy",
        definition: "FOR SELECT USING (deleted_at IS NULL)",
      },
      {
        table: "class_instances",
        name: "class_instances_insert_policy",
        definition: "FOR INSERT WITH CHECK (deleted_at IS NULL)",
      },
      {
        table: "class_instances",
        name: "class_instances_update_policy",
        definition:
          "FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true'))",
      },
      { table: "class_instances", name: "class_instances_delete_policy", definition: "FOR DELETE USING (false)" },
      {
        table: "class_instances",
        name: "class_instances_access_select_policy",
        definition:
          "AS RESTRICTIVE FOR SELECT USING (deleted_at IS NULL AND ((NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()) AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())) OR (teacher_id = (SELECT id FROM teachers WHERE user_id = current_user_id())) OR (student_id IN (SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())))))",
      },
      {
        table: "class_instances",
        name: "class_instances_access_update_policy",
        definition:
          "AS RESTRICTIVE FOR UPDATE USING (deleted_at IS NULL AND ((NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()) AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())) OR (teacher_id = (SELECT id FROM teachers WHERE user_id = current_user_id())) OR (student_id IN (SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id()))))) WITH CHECK ((deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')) AND ((NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()) AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())) OR (teacher_id = (SELECT id FROM teachers WHERE user_id = current_user_id())) OR (student_id IN (SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())))))",
      },
    ]);
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

      let error: Error | null = null;
      try {
        await tx
          .update(classInstances)
          .set({ executionState: "RUNNING", outcome: "PENDING" })
          .where(eq(classInstances.id, instance.id));
      } catch (e) {
        error = e as Error;
      }
      expect(error).toBeTruthy();
      expect(getErrorMessage(error)).toMatch(/Invalid transition: Cannot reactivate a COMPLETED class instance/);
    }));

  it("should enforce RLS policies for teachers blocking unauthorized SELECT", async () => {
    await runInRollback(async tx => {
      const scenario1 = await setupTestEntities(tx, "SecLogic", { skipInstance: true });
      const otherTeacher = await setupTestEntities(tx, "SecLogicOther", { skipInstance: true });
      const ownInstance = await createTestInstance(tx, scenario1.teacher.id, scenario1.student.id);
      await createTestInstance(tx, otherTeacher.teacher.id, otherTeacher.student.id);

      await tx.execute(sql`SET LOCAL ROLE "test_rls_user"`);
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${scenario1.teacherUser.id}, true)`);

      const instances = await tx
        .select({ id: classInstances.id, teacherId: classInstances.teacherId })
        .from(classInstances);
      expect(instances.some(i => i.teacherId === ownInstance.teacherId)).toBe(true);
      expect(instances.some(i => i.id === ownInstance.id)).toBe(true);
      expect(instances.some(i => i.teacherId === otherTeacher.teacher.id)).toBe(false);
    });
  });

  it("should rollback negative quota updates via check constraint", () =>
    runInRollback(async tx => {
      const { student } = await setupTestEntities(tx, "SecLogic3", { skipInstance: true });

      await tx.update(students).set({ classesRemaining: 0 }).where(eq(students.id, student.id));

      let error: Error | null = null;
      try {
        await tx
          .update(students)
          .set({ classesRemaining: sql`${students.classesRemaining} - 1` })
          .where(eq(students.id, student.id));
      } catch (e) {
        error = e as Error;
      }
      expect(error).toBeTruthy();
      expect(getErrorMessage(error)).toMatch(/students_classes_remaining_chk/);
    }));

  describe("Story 2: State Transitions", () => {
    const testOutcome = async (tx: DBTransaction, instanceId: string, outcome: "ABSENT" | "LEAVE") => {
      await tx
        .update(classInstances)
        .set({ executionState: "COMPLETED", outcome })
        .where(eq(classInstances.id, instanceId));
    };

    it.each(["ABSENT", "LEAVE"] as const)("allows ACTIVATED → COMPLETED with outcome=%s", outcome =>
      runInRollback(async tx => {
        const { teacher, student } = await setupTestEntities(tx, `S2-${outcome}`, { skipInstance: true });
        const instance = await createTestInstance(tx, teacher.id, student.id, { executionState: "ACTIVATED" });

        await testOutcome(tx, instance.id, outcome);

        const [updated] = await tx
          .select({ executionState: classInstances.executionState, outcome: classInstances.outcome })
          .from(classInstances)
          .where(eq(classInstances.id, instance.id));
        expect(updated.executionState).toBe("COMPLETED");
        expect(updated.outcome).toBe(outcome);
      }));

    it("blocks ACTIVATED → COMPLETED with outcome=TAKEN", () =>
      runInRollback(async tx => {
        const { teacher, student } = await setupTestEntities(tx, "S2-3", { skipInstance: true });
        const instance = await createTestInstance(tx, teacher.id, student.id, { executionState: "ACTIVATED" });

        let error: Error | null = null;
        try {
          await tx
            .update(classInstances)
            .set({ executionState: "COMPLETED", outcome: "TAKEN" })
            .where(eq(classInstances.id, instance.id));
        } catch (e) {
          error = e as Error;
        }
        expect(error).toBeTruthy();
        expect(getErrorMessage(error)).toMatch(/Invalid transition:/);
      }));

    it("allows COMPLETED → NOT_ACTIVATED (reset)", () =>
      runInRollback(async tx => {
        const { teacher, student } = await setupTestEntities(tx, "S2-4", { skipInstance: true });
        const instance = await createTestInstance(tx, teacher.id, student.id, {
          executionState: "COMPLETED",
          outcome: "ABSENT",
          actualStartAt: new Date(),
          actualEndAt: new Date(Date.now() + 3600000),
        });

        await tx
          .update(classInstances)
          .set({ executionState: "NOT_ACTIVATED", outcome: "PENDING", actualStartAt: null, actualEndAt: null })
          .where(eq(classInstances.id, instance.id));

        const [resetInstance] = await tx
          .select({
            executionState: classInstances.executionState,
            outcome: classInstances.outcome,
            actualStartAt: classInstances.actualStartAt,
            actualEndAt: classInstances.actualEndAt,
          })
          .from(classInstances)
          .where(eq(classInstances.id, instance.id));
        expect(resetInstance.executionState).toBe("NOT_ACTIVATED");
        expect(resetInstance.outcome).toBe("PENDING");
        expect(resetInstance.actualStartAt).toBeNull();
        expect(resetInstance.actualEndAt).toBeNull();
      }));

    it("allows ACTIVATED → NOT_ACTIVATED (reset)", () =>
      runInRollback(async tx => {
        const { teacher, student } = await setupTestEntities(tx, "S2-5", { skipInstance: true });
        const instance = await createTestInstance(tx, teacher.id, student.id, { executionState: "ACTIVATED" });

        await tx
          .update(classInstances)
          .set({ executionState: "NOT_ACTIVATED", outcome: "PENDING", actualStartAt: null, actualEndAt: null })
          .where(eq(classInstances.id, instance.id));

        const [resetInstance] = await tx
          .select({
            executionState: classInstances.executionState,
            outcome: classInstances.outcome,
          })
          .from(classInstances)
          .where(eq(classInstances.id, instance.id));
        expect(resetInstance.executionState).toBe("NOT_ACTIVATED");
        expect(resetInstance.outcome).toBe("PENDING");
      }));
  });
});
