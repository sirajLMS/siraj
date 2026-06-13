import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { StudentStatus } from "../../../lib/enum";
import { testLogger } from "../../../lib/testlogger";
import type { ParentEntity, StudentEntity, StudentStatusHistorySelectType, UserEntity } from "../../types";
import { parents, studentStatusHistory, students, users } from "../schema";
import { runInRollback } from "./test-utils";

describe("Student Status Transitions & History", () => {
  test("Initial student creation logs status history with null old status", async () => {
    testLogger.info("Testing initial status history log...");
    await runInRollback(async tx => {
      const now = new Date();
      const email = `parent-${randomUUID()}@example.com`;

      const [user] = (await tx
        .insert(users)
        .values({
          name: "Test Parent",
          email,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [parent] = (await tx
        .insert(parents)
        .values({
          userId: user.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ParentEntity];

      const [student] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Test Student",
          status: StudentStatus.ON_TRIAL,
          idempotencyKey: randomUUID(),
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      const history = (await tx
        .select()
        .from(studentStatusHistory)
        .where(eq(studentStatusHistory.studentId, student.id))) as StudentStatusHistorySelectType[];

      expect(history.length).toBe(1);
      expect(history[0].oldStatus).toBeNull();
      expect(history[0].newStatus).toBe(StudentStatus.ON_TRIAL);
    });
    testLogger.info("Initial status history log test passed.");
  });

  test("Valid transition (ON_TRIAL -> REGULAR) succeeds and logs history", async () => {
    testLogger.info("Testing valid status transition...");
    await runInRollback(async tx => {
      const now = new Date();
      const email = `parent-valid-${randomUUID()}@example.com`;

      const [user] = (await tx
        .insert(users)
        .values({ name: "Parent", email, password: "password", createdAt: now, updatedAt: now })
        .returning()) as [UserEntity];
      const [parent] = (await tx
        .insert(parents)
        .values({ userId: user.id, status: "REGULAR", createdAt: now, updatedAt: now })
        .returning()) as [ParentEntity];
      const [student] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Student",
          status: StudentStatus.ON_TRIAL,
          idempotencyKey: randomUUID(),
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      await tx
        .update(students)
        .set({ status: StudentStatus.REGULAR, updatedAt: new Date() })
        .where(eq(students.id, student.id));

      const history = (await tx
        .select()
        .from(studentStatusHistory)
        .where(eq(studentStatusHistory.studentId, student.id))
        .orderBy(studentStatusHistory.createdAt)) as StudentStatusHistorySelectType[];

      expect(history.length).toBe(2);
      expect(history[1].oldStatus).toBe(StudentStatus.ON_TRIAL);
      expect(history[1].newStatus).toBe(StudentStatus.REGULAR);
    });
    testLogger.info("Valid status transition test passed.");
  });

  test("Invalid transition (REGULAR -> ON_TRIAL) is blocked by trigger", async () => {
    testLogger.info("Testing invalid status transition enforcement...");
    await runInRollback(async tx => {
      const now = new Date();
      const email = `parent-invalid-${randomUUID()}@example.com`;

      const [user] = (await tx
        .insert(users)
        .values({ name: "Parent", email, password: "password", createdAt: now, updatedAt: now })
        .returning()) as [UserEntity];
      const [parent] = (await tx
        .insert(parents)
        .values({ userId: user.id, status: "REGULAR", createdAt: now, updatedAt: now })
        .returning()) as [ParentEntity];
      const [student] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Student",
          status: StudentStatus.REGULAR,
          idempotencyKey: randomUUID(),
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      try {
        await tx.update(students).set({ status: StudentStatus.ON_TRIAL }).where(eq(students.id, student.id));
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("Invalid status transition: REGULAR to ON_TRIAL");
      }
    });
    testLogger.info("Invalid status transition enforcement test passed.");
  });

  test("Terminal state (GRADUATED) cannot be changed", async () => {
    testLogger.info("Testing terminal status enforcement...");
    await runInRollback(async tx => {
      const now = new Date();
      const email = `parent-terminal-${randomUUID()}@example.com`;

      const [user] = (await tx
        .insert(users)
        .values({ name: "Parent", email, password: "password", createdAt: now, updatedAt: now })
        .returning()) as [UserEntity];
      const [parent] = (await tx
        .insert(parents)
        .values({ userId: user.id, status: "REGULAR", createdAt: now, updatedAt: now })
        .returning()) as [ParentEntity];
      const [student] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Student",
          status: StudentStatus.GRADUATED,
          idempotencyKey: randomUUID(),
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      try {
        await tx.update(students).set({ status: StudentStatus.REGULAR }).where(eq(students.id, student.id));
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("Cannot change status of a GRADUATED student");
      }
    });
    testLogger.info("Terminal status enforcement test passed.");
  });

  test("Captures actor user ID in history if available in session", async () => {
    testLogger.info("Testing actor capture in status history...");
    await runInRollback(async tx => {
      const now = new Date();
      const emailP = `parent-actor-${randomUUID()}@example.com`;
      const emailA = `admin-actor-${randomUUID()}@example.com`;

      const [userP] = (await tx
        .insert(users)
        .values({ name: "Parent", email: emailP, password: "password", createdAt: now, updatedAt: now })
        .returning()) as [UserEntity];
      const [userA] = (await tx
        .insert(users)
        .values({ name: "Admin", email: emailA, password: "password", createdAt: now, updatedAt: now })
        .returning()) as [UserEntity];
      const [parent] = (await tx
        .insert(parents)
        .values({ userId: userP.id, status: "REGULAR", createdAt: now, updatedAt: now })
        .returning()) as [ParentEntity];

      // Set session actor
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userA.id}, true)`);

      const [student] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Student",
          status: StudentStatus.ON_TRIAL,
          idempotencyKey: randomUUID(),
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      const history = (await tx
        .select()
        .from(studentStatusHistory)
        .where(eq(studentStatusHistory.studentId, student.id))) as StudentStatusHistorySelectType[];

      expect(history.length).toBe(1);
      expect(history[0].changedByUserId).toBe(userA.id);
    });
    testLogger.info("Actor capture in status history test passed.");
  });
});
