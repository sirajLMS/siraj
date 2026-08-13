import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { upsertSeedClassInstance } from "@/backend/db/repo/scheduling";
import { classInstances } from "@/backend/db/schema";
import { ensureTestSubjectId, setupTestEntities } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";

describe("seed class instance upsert", () => {
  it("promotes an existing NOT_ACTIVATED shell to COMPLETED+TAKEN without trigger errors", () =>
    runInRollback(async tx => {
      const { teacher, student } = await setupTestEntities(tx, "SeedCiUpsert", { skipInstance: true });
      const subjectId = await ensureTestSubjectId(tx);
      const idempotencyKey = `seed_ci_test_${crypto.randomUUID()}`;
      const scheduledStartAt = new Date("2026-07-21T14:00:00.000Z");
      const scheduledEndAt = new Date("2026-07-21T14:45:00.000Z");
      const actualEndAt = new Date("2026-07-21T15:00:00.000Z");
      const updatedAt = new Date();

      await tx.insert(classInstances).values({
        teacherId: teacher.id,
        studentId: student.id,
        subjectId,
        classType: "REGULAR",
        scheduledStartAt,
        scheduledEndAt,
        durationMinutes: 45,
        executionState: "NOT_ACTIVATED",
        outcome: "PENDING",
        idempotencyKey,
        createdAt: updatedAt,
        updatedAt,
      });

      const seeded = await upsertSeedClassInstance(
        tx,
        {
          teacherId: teacher.id,
          studentId: student.id,
          subjectId,
          classType: "REGULAR",
          scheduledStartAt,
          scheduledEndAt,
          durationMinutes: 45,
          executionState: "COMPLETED",
          outcome: "TAKEN",
          actualStartAt: scheduledStartAt,
          actualEndAt,
          idempotencyKey,
          createdAt: updatedAt,
          updatedAt,
        },
        updatedAt
      );

      expect(seeded.executionState).toBe("COMPLETED");
      expect(seeded.outcome).toBe("TAKEN");

      const [row] = await tx.select().from(classInstances).where(eq(classInstances.idempotencyKey, idempotencyKey));
      expect(row?.executionState).toBe("COMPLETED");
      expect(row?.outcome).toBe("TAKEN");
    }));
});
