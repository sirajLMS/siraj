import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { studentStatusHistory, students } from "@/backend/db/schema";
import { createTestUser, setupStudent } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { StudentStatus } from "@/backend/enum";
import type { StudentStatusHistorySelectType } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

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

function getFullErrorMessage(error: Error): string {
  const cause = error.cause as { message?: string } | undefined;
  return `${error.message} ${cause?.message ?? ""}`;
}

describe("Student Status Transitions & History", () => {
  test("Initial student creation logs status history with null old status", async () => {
    testLogger.info("Testing initial status history log...");
    await runInRollback(async tx => {
      const { student } = await setupStudent(
        tx,
        { name: "Test Parent", email: `parent-${randomUUID()}@example.com` },
        {},
        { name: "Test Student", status: StudentStatus.ON_TRIAL }
      );

      const history = (await tx
        .select()
        .from(studentStatusHistory)
        .where(eq(studentStatusHistory.studentId, student.id))) as StudentStatusHistorySelectType[];

      expect(history).toHaveLength(1);
      expect(history[0].oldStatus).toBeNull();
      expect(history[0].newStatus).toBe(StudentStatus.ON_TRIAL);
    });
    testLogger.info("Initial status history log test passed.");
  });

  test("Valid transition (ON_TRIAL -> REGULAR) succeeds and logs history", async () => {
    testLogger.info("Testing valid status transition...");
    await runInRollback(async tx => {
      const { student } = await setupStudent(
        tx,
        { name: "Parent", email: `parent-valid-${randomUUID()}@example.com` },
        {},
        { name: "Student", status: StudentStatus.ON_TRIAL }
      );

      await tx
        .update(students)
        .set({ status: StudentStatus.REGULAR, updatedAt: new Date() })
        .where(eq(students.id, student.id));

      const history = (await tx
        .select()
        .from(studentStatusHistory)
        .where(eq(studentStatusHistory.studentId, student.id))
        .orderBy(studentStatusHistory.createdAt)) as StudentStatusHistorySelectType[];

      expect(history).toHaveLength(2);
      expect(history[1].oldStatus).toBe(StudentStatus.ON_TRIAL);
      expect(history[1].newStatus).toBe(StudentStatus.REGULAR);
    });
    testLogger.info("Valid status transition test passed.");
  });

  test("Invalid transition (REGULAR -> ON_TRIAL) is blocked by trigger", async () => {
    testLogger.info("Testing invalid status transition enforcement...");
    await runInRollback(async tx => {
      const { student } = await setupStudent(
        tx,
        { name: "Parent", email: `parent-invalid-${randomUUID()}@example.com` },
        {},
        { name: "Student", status: StudentStatus.REGULAR }
      );

      const error = await expectRepoError(() =>
        tx.update(students).set({ status: StudentStatus.ON_TRIAL }).where(eq(students.id, student.id))
      );
      expect(getFullErrorMessage(error)).toContain("Invalid status transition: REGULAR to ON_TRIAL");
    });
    testLogger.info("Invalid status transition enforcement test passed.");
  });

  test("Captures actor user ID in history if available in session", async () => {
    testLogger.info("Testing actor capture in status history...");
    await runInRollback(async tx => {
      const emailP = `parent-actor-${randomUUID()}@example.com`;
      const emailA = `admin-actor-${randomUUID()}@example.com`;

      const userA = await createTestUser(tx, { name: "Admin", email: emailA });

      // Set session actor
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userA.id}, true)`);

      const { student } = await setupStudent(
        tx,
        { name: "Parent", email: emailP },
        {},
        { name: "Student", status: StudentStatus.ON_TRIAL }
      );

      const history = (await tx
        .select()
        .from(studentStatusHistory)
        .where(eq(studentStatusHistory.studentId, student.id))) as StudentStatusHistorySelectType[];

      expect(history).toHaveLength(1);
      expect(history[0].changedByUserId).toBe(userA.id);
    });
    testLogger.info("Actor capture in status history test passed.");
  });
});
