import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
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

describe("Class Rescheduling Business Rules & Constraints", () => {
  test("Allows rescheduling and inherits rate from original class", async () => {
    testLogger.info("Testing rate inheritance on reschedule...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-rescheduled-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-rescheduled-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Rescheduled Parent",
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
          name: "Rescheduled Teacher",
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
          name: "Rescheduled Student",
          status: "REGULAR",
          classesTotal: 10,
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      // Insert original class with specific rate
      const [original] = (await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-15T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-15T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          rateAmount: "50.00",
          rateCurrency: "USD",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ClassInstanceEntity];

      // Insert rescheduled class without specifying rate
      const [rescheduled] = (await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          originalClassId: original.id,
          scheduledStartAt: new Date("2026-06-16T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-16T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ClassInstanceEntity];

      expect(rescheduled.rateAmount).toBe("50.00");
      expect(rescheduled.rateCurrency).toBe("USD");
    });
    testLogger.info("Rate inheritance test passed.");
  });

  test("Allows rescheduling with overridden rate", async () => {
    testLogger.info("Testing overridden rate on reschedule...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-override-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-override-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Rescheduled Parent",
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
          name: "Rescheduled Teacher",
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
          name: "Rescheduled Student",
          status: "REGULAR",
          classesTotal: 10,
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      const [original] = (await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-15T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-15T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          rateAmount: "50.00",
          rateCurrency: "USD",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ClassInstanceEntity];

      // Overriding the rate explicitly to $60.00
      const [rescheduled] = (await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          originalClassId: original.id,
          scheduledStartAt: new Date("2026-06-16T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-16T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          rateAmount: "60.00",
          rateCurrency: "USD",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ClassInstanceEntity];

      expect(rescheduled.rateAmount).toBe("60.00");
      expect(rescheduled.rateCurrency).toBe("USD");
    });
    testLogger.info("Overridden rate test passed.");
  });

  test("Updates original class to rescheduled and refunds quota", async () => {
    testLogger.info("Testing original class updates and quota refund...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-refund-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-refund-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Rescheduled Parent",
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
          name: "Rescheduled Teacher",
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
          name: "Rescheduled Student",
          status: "REGULAR",
          classesTotal: 10,
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      // 1. Insert original class with quota deducted
      const [original] = (await tx
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

      // Student classes remaining should be 4 now
      const [studentAfterOriginal] = await tx.select().from(students).where(eq(students.id, student.id));
      expect(studentAfterOriginal.classesRemaining).toBe(4);

      // 2. Reschedule to new class (which also has quota_deducted = true)
      await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          originalClassId: original.id,
          scheduledStartAt: new Date("2026-06-16T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-16T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          quotaDeducted: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Check original class was updated by trigger
      const [updatedOriginal] = await tx.select().from(classInstances).where(eq(classInstances.id, original.id));

      expect(updatedOriginal.isRescheduled).toBe(true);
      expect(updatedOriginal.quotaDeducted).toBe(false);

      // Student classes remaining should still be 4
      // (1 deducted for original, refunded because rescheduled, and 1 deducted for new class)
      const [studentAfterReschedule] = await tx.select().from(students).where(eq(students.id, student.id));
      expect(studentAfterReschedule.classesRemaining).toBe(4);
    });
    testLogger.info("Original class updates and quota refund test passed.");
  });

  test("Prevents rescheduling completed or taken classes", async () => {
    testLogger.info("Testing completed or taken class reschedule prevention...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-complete-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-complete-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Rescheduled Parent",
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
          name: "Rescheduled Teacher",
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
          name: "Rescheduled Student",
          status: "REGULAR",
          classesTotal: 10,
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      // 1. Create a class that is completed/taken
      const [original] = (await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-15T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-15T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          executionState: "COMPLETED",
          outcome: "TAKEN",
          actualStartAt: new Date("2026-06-15T10:00:00Z"),
          actualEndAt: new Date("2026-06-15T11:00:00Z"),
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ClassInstanceEntity];

      // 2. Try to reschedule it
      try {
        await tx
          .insert(classInstances)
          .values({
            studentId: student.id,
            teacherId: teacher.id,
            originalClassId: original.id,
            scheduledStartAt: new Date("2026-06-16T10:00:00Z"),
            scheduledEndAt: new Date("2026-06-16T11:00:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("Cannot reschedule a completed or taken class");
      }
    });
    testLogger.info("Completed or taken class reschedule prevention test passed.");
  });

  test("Prevents rescheduling a class that was already rescheduled", async () => {
    testLogger.info("Testing double reschedule prevention...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-double-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-double-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Rescheduled Parent",
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
          name: "Rescheduled Teacher",
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
          name: "Rescheduled Student",
          status: "REGULAR",
          classesTotal: 10,
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      const [original] = (await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-15T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-15T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ClassInstanceEntity];

      // First reschedule
      await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          originalClassId: original.id,
          scheduledStartAt: new Date("2026-06-16T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-16T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Second reschedule from same original class should fail
      try {
        await tx
          .insert(classInstances)
          .values({
            studentId: student.id,
            teacherId: teacher.id,
            originalClassId: original.id,
            scheduledStartAt: new Date("2026-06-17T10:00:00Z"),
            scheduledEndAt: new Date("2026-06-17T11:00:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("Cannot reschedule a class that has already been rescheduled");
      }
    });
    testLogger.info("Double reschedule prevention test passed.");
  });

  test("Enforces unique index on original_class_id", async () => {
    testLogger.info("Testing unique index on original_class_id with disabled triggers...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-uniq-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-uniq-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Rescheduled Parent",
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
          name: "Rescheduled Teacher",
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
          name: "Rescheduled Student",
          status: "REGULAR",
          classesTotal: 10,
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      const [original] = (await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-15T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-15T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ClassInstanceEntity];

      await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          originalClassId: original.id,
          scheduledStartAt: new Date("2026-06-16T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-16T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .execute();

      const [rescheduled2] = (await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-17T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-17T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ClassInstanceEntity];

      // Disable triggers to bypass "already rescheduled" trigger check and hit index directly
      await tx.execute(sql`ALTER TABLE class_instances DISABLE TRIGGER ALL`);

      try {
        await tx
          .update(classInstances)
          .set({ originalClassId: original.id })
          .where(eq(classInstances.id, rescheduled2.id))
          .execute();
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("class_instances_original_class_uniq_idx");
      }
    });
    testLogger.info("Unique index constraint test passed.");
  });

  test("Enforces self-referencing check constraint", async () => {
    testLogger.info("Testing self-referencing check constraint...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-self-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-self-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Rescheduled Parent",
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
          name: "Rescheduled Teacher",
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
          name: "Rescheduled Student",
          status: "REGULAR",
          classesTotal: 10,
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      const [original] = (await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-15T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-15T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ClassInstanceEntity];

      await tx.execute(sql`ALTER TABLE class_instances DISABLE TRIGGER ALL`);

      try {
        await tx
          .update(classInstances)
          .set({ originalClassId: original.id })
          .where(eq(classInstances.id, original.id))
          .execute();
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("class_instances_reschedule_not_self_chk");
      }
    });
    testLogger.info("Self-referencing check constraint test passed.");
  });

  test("Enforces rescheduled no quota check constraint", async () => {
    testLogger.info("Testing rescheduled no quota check constraint...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-noq-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-noq-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Rescheduled Parent",
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
          name: "Rescheduled Teacher",
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
          name: "Rescheduled Student",
          status: "REGULAR",
          classesTotal: 10,
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      const [original] = (await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-15T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-15T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ClassInstanceEntity];

      await tx.execute(sql`ALTER TABLE class_instances DISABLE TRIGGER ALL`);

      try {
        await tx
          .update(classInstances)
          .set({ isRescheduled: true, quotaDeducted: true })
          .where(eq(classInstances.id, original.id))
          .execute();
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("class_instances_rescheduled_no_quota_chk");
      }
    });
    testLogger.info("Rescheduled no quota check constraint test passed.");
  });

  test("Enforces rescheduled no complete check constraint", async () => {
    testLogger.info("Testing rescheduled no complete check constraint...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-noc-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-noc-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Rescheduled Parent",
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
          name: "Rescheduled Teacher",
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
          name: "Rescheduled Student",
          status: "REGULAR",
          classesTotal: 10,
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      const [original] = (await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-15T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-15T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [ClassInstanceEntity];

      await tx.execute(sql`ALTER TABLE class_instances DISABLE TRIGGER ALL`);

      try {
        await tx
          .update(classInstances)
          .set({ isRescheduled: true, executionState: "COMPLETED", outcome: "TAKEN" })
          .where(eq(classInstances.id, original.id))
          .execute();
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("class_instances_rescheduled_no_complete_chk");
      }
    });
    testLogger.info("Rescheduled no complete check constraint test passed.");
  });
});
