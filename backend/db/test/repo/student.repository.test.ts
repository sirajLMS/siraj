import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { StudentRepository } from "@/backend/db/repo";
import { students } from "@/backend/db/schema";
import { setupStudent } from "../entity-setup";
import { runInRollback } from "../test-utils";

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

describe("StudentRepository — setClassesRemaining", () => {
  test("throws studentNotFound for unknown studentId", async () => {
    await runInRollback(async tx => {
      const unknownId = randomUUID();
      const error = await expectRepoError(() => StudentRepository.setClassesRemaining(unknownId, 5, undefined, tx));
      expect(error.message).toContain("not found");
    });
  });

  test("successfully sets classesRemaining to a valid value", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(
        tx,
        { name: "Quota Parent", email: `qp-${randomUUID()}@test.com` },
        {},
        { classesTotal: 10, classesRemaining: 5 }
      );

      const result = await StudentRepository.setClassesRemaining(student.id, 8, student.version, tx);

      expect(result.classesRemaining).toBe(8);
      expect(result.version).toBe(student.version + 1);

      // Verify in DB via tx
      const [updated] = await tx
        .select({ classesRemaining: students.classesRemaining, version: students.version })
        .from(students)
        .where(eq(students.id, student.id));
      expect(updated.classesRemaining).toBe(8);
      expect(updated.version).toBe(student.version + 1);
    });
  });

  test("throws on version mismatch (optimistic locking)", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(
        tx,
        { name: "Version Parent", email: `vp-${randomUUID()}@test.com` },
        {},
        { classesTotal: 10, classesRemaining: 5 }
      );

      const wrongVersion = student.version + 999;
      const error = await expectRepoError(() => StudentRepository.setClassesRemaining(student.id, 3, wrongVersion, tx));
      expect(error.message).toContain("Version mismatch");
    });
  });

  test("sets classesRemaining to 0 successfully", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(
        tx,
        { name: "Zero Parent", email: `zp-${randomUUID()}@test.com` },
        {},
        { classesTotal: 10, classesRemaining: 5 }
      );

      const result = await StudentRepository.setClassesRemaining(student.id, 0, student.version, tx);
      expect(result.classesRemaining).toBe(0);
    });
  });
});
