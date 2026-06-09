import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import type { ClassInstanceEntity, ParentEntity, StudentEntity, TeacherEntity, UserEntity } from "../../types";
import { db } from "../drizzleDb";
import { classInstances, parents, students, teachers, users } from "../schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function runInRollback(fn: (tx: DbTransaction) => Promise<void>): Promise<void> {
  let assertionError: unknown = null;
  try {
    await db.transaction(async tx => {
      try {
        await fn(tx);
      } catch (error) {
        assertionError = error;
      }
      tx.rollback();
    });
  } catch {
    // Ignore expected Drizzle transaction rollback error
  }
  if (assertionError) {
    throw assertionError;
  }
}

describe("Class Quota System Constraints & Triggers", () => {
  test("Deducts class quota on insertion and refunds on deletion", async () => {
    testLogger.info("Testing quota deduction and refund flows...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-quota-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-quota-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Quota Parent",
          email: parentEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [parent] = (await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ParentEntity];

      const [teacherUser] = (await tx
        .insert(users)
        .values({
          name: "Quota Teacher",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher] = (await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      const [student] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Quota Student",
          status: "REGULAR",
          classesTotal: 10,
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      // 1. Insert class with quota_deducted = true
      const [instance1] = (await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-15T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-15T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          quotaDeducted: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ClassInstanceEntity];

      // Fetch student to verify classesRemaining decremented to 4
      const [updatedStudent1] = (await tx.select().from(students).where(eq(students.id, student.id)).limit(1)) as [
        StudentEntity,
      ];
      expect(updatedStudent1.classesRemaining).toBe(4);

      // 2. Insert class with quota_deducted = false
      const [instance2] = (await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-16T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-16T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          quotaDeducted: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ClassInstanceEntity];

      // Fetch student to verify classesRemaining remains 4
      const [updatedStudent2] = (await tx.select().from(students).where(eq(students.id, student.id)).limit(1)) as [
        StudentEntity,
      ];
      expect(updatedStudent2.classesRemaining).toBe(4);

      // 3. Update class2 to quota_deducted = true
      await tx.update(classInstances).set({ quotaDeducted: true }).where(eq(classInstances.id, instance2.id));

      const [updatedStudent3] = (await tx.select().from(students).where(eq(students.id, student.id)).limit(1)) as [
        StudentEntity,
      ];
      expect(updatedStudent3.classesRemaining).toBe(3);

      // 4. Update class1 to quota_deducted = false (refund)
      await tx.update(classInstances).set({ quotaDeducted: false }).where(eq(classInstances.id, instance1.id));

      const [updatedStudent4] = (await tx.select().from(students).where(eq(students.id, student.id)).limit(1)) as [
        StudentEntity,
      ];
      expect(updatedStudent4.classesRemaining).toBe(4);

      // 5. Soft delete class2 (refunds the quota)
      await tx.update(classInstances).set({ deletedAt: now }).where(eq(classInstances.id, instance2.id));

      const [updatedStudent5] = (await tx.select().from(students).where(eq(students.id, student.id)).limit(1)) as [
        StudentEntity,
      ];
      expect(updatedStudent5.classesRemaining).toBe(5);
    });
    testLogger.info("Deduction and refund tests passed.");
  });

  test("Blocks booking if classes_remaining is zero", async () => {
    testLogger.info("Testing block booking on empty quota...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-block-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-block-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Block Parent",
          email: parentEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [parent] = (await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ParentEntity];

      const [teacherUser] = (await tx
        .insert(users)
        .values({
          name: "Block Teacher",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher] = (await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      const [student] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Block Student",
          status: "REGULAR",
          classesTotal: 5,
          classesRemaining: 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      try {
        await tx
          .insert(classInstances)
          .values({
            studentId: student.id,
            teacherId: teacher.id,
            scheduledStartAt: new Date("2026-06-15T12:00:00Z"),
            scheduledEndAt: new Date("2026-06-15T13:00:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            quotaDeducted: true,
            createdAt: now,
            updatedAt: now,
          })
          .execute();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("students_classes_remaining_chk");
      }
    });
    testLogger.info("Block booking on zero quota passed.");
  });

  test("Prevents concurrent race conditions via CHECK constraint", async () => {
    testLogger.info("Testing concurrent race condition prevention...");
    const now = new Date();
    const parentEmail = `parent-race-${randomUUID()}@example.com`;
    const teacherEmail = `teacher-race-${randomUUID()}@example.com`;

    const [parentUser] = (await db
      .insert(users)
      .values({
        name: "Race Parent",
        email: parentEmail,
        password: "password",
        createdAt: now,
        updatedAt: now,
      })
      .returning()) as [UserEntity];

    const [parent] = (await db
      .insert(parents)
      .values({
        userId: parentUser.id,
        status: "REGULAR",
        createdAt: now,
        updatedAt: now,
      })
      .returning()) as [ParentEntity];

    const [teacherUser] = (await db
      .insert(users)
      .values({
        name: "Race Teacher",
        email: teacherEmail,
        password: "password",
        createdAt: now,
        updatedAt: now,
      })
      .returning()) as [UserEntity];

    const [teacher] = (await db
      .insert(teachers)
      .values({
        userId: teacherUser.id,
        status: "ACTIVATED",
        timezone: "UTC",
        createdAt: now,
        updatedAt: now,
      })
      .returning()) as [TeacherEntity];

    // Student has exactly 1 remaining class
    const [student] = (await db
      .insert(students)
      .values({
        parentId: parent.id,
        name: "Race Student",
        status: "REGULAR",
        classesTotal: 10,
        classesRemaining: 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning()) as [StudentEntity];

    // Execute two concurrent insertions targeting the same student
    const resultPromises = Promise.allSettled([
      db.insert(classInstances).values({
        studentId: student.id,
        teacherId: teacher.id,
        scheduledStartAt: new Date("2026-06-15T15:00:00Z"),
        scheduledEndAt: new Date("2026-06-15T16:00:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        quotaDeducted: true,
        createdAt: now,
        updatedAt: now,
      }),
      db.insert(classInstances).values({
        studentId: student.id,
        teacherId: teacher.id,
        scheduledStartAt: new Date("2026-06-15T16:00:00Z"),
        scheduledEndAt: new Date("2026-06-15T17:00:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        quotaDeducted: true,
        createdAt: now,
        updatedAt: now,
      }),
    ]);

    const results = await resultPromises;

    const successes = results.filter(r => r.status === "fulfilled");
    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );

    // Exactly one insertion should succeed, and one should fail
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    const failReason = failures[0].reason as Error & { cause?: { message?: string } };
    const errMsg = failReason.cause?.message || failReason.message || "";
    expect(errMsg).toContain("students_classes_remaining_chk");

    // Verify final state in DB has classesRemaining = 0
    const [finalStudent] = (await db.select().from(students).where(eq(students.id, student.id)).limit(1)) as [
      StudentEntity,
    ];
    expect(finalStudent.classesRemaining).toBe(0);

    // Clean up created records since they were outside runInRollback
    // Note: We skip hard-deleting students, teachers, and users because
    // the soft-deleted class_instances still reference them via ON DELETE RESTRICT foreign keys.
    await db.delete(classInstances).where(eq(classInstances.studentId, student.id));

    testLogger.info("Race condition test passed.");
  });
});
