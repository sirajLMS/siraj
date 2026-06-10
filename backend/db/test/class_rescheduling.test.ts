import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { Gender } from "../../../lib/enum";
import { testLogger } from "../../../lib/testlogger";
import type { UserEntity } from "../../types/auth.types";
import type { ParentEntity } from "../../types/parent.types";
import type { StudentEntity } from "../../types/student.types";
import type { TeacherEntity } from "../../types/teacher.types";
import { db } from "../drizzleDb";
import { SchedulingRepository } from "../repo";
import { classInstances, parents, students, teacherAssignments, teachers, users } from "../schema";

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
      const parentEmail = `parent-resched-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-resched-${randomUUID()}@example.com`;

      const [parentUser] = await tx
        .insert(users)
        .values({
          name: "Resched Parent",
          email: parentEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [parent] = await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [teacherUser] = await tx
        .insert(users)
        .values({
          name: "Resched Teacher",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [teacher] = await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [student] = await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Resched Student",
          gender: Gender.MALE,
          status: "REGULAR",
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning();

      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: now,
      });

      const original = await SchedulingRepository.createClassInstance(
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          quotaDeducted: true,
          rateAmount: "50.00",
          rateCurrency: "USD",
          idempotencyKey: randomUUID(),
        },
        tx
      );

      // Reschedule
      const rescheduled = await SchedulingRepository.rescheduleClassInstance(
        original.id,
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-26T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-26T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          idempotencyKey: randomUUID(),
        },
        tx
      );

      expect(rescheduled.rateAmount).toBe("50.00");
      expect(rescheduled.originalClassId).toBe(original.id);
    });
    testLogger.info("Rate inheritance test passed.");
  });

  test("Allows rescheduling with overridden rate", async () => {
    testLogger.info("Testing overridden rate on reschedule...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-override-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-override-${randomUUID()}@example.com`;

      const [parentUser] = await tx
        .insert(users)
        .values({
          name: "Override Parent",
          email: parentEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [parent] = await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [teacherUser] = await tx
        .insert(users)
        .values({
          name: "Override Teacher",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [teacher] = await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [student] = await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Override Student",
          gender: Gender.FEMALE,
          status: "REGULAR",
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning();

      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: now,
      });

      const original = await SchedulingRepository.createClassInstance(
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          quotaDeducted: true,
          rateAmount: "50.00",
          rateCurrency: "USD",
          idempotencyKey: randomUUID(),
        },
        tx
      );

      const rescheduled = await SchedulingRepository.rescheduleClassInstance(
        original.id,
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-26T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-26T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          rateAmount: "60.00",
          rateCurrency: "USD",
          isRateOverridden: true,
          idempotencyKey: randomUUID(),
        },
        tx
      );

      expect(rescheduled.rateAmount).toBe("60.00");
    });
    testLogger.info("Overridden rate test passed.");
  });

  test("Updates original class to rescheduled and refunds quota", async () => {
    testLogger.info("Testing original class updates and quota refund...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-refund-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-refund-${randomUUID()}@example.com`;

      const parentUsers: UserEntity[] = await tx
        .insert(users)
        .values({
          name: "Refund Parent",
          email: parentEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const parentUser = parentUsers[0];

      const parentsResult: ParentEntity[] = await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const parent = parentsResult[0];

      const teacherUsers: UserEntity[] = await tx
        .insert(users)
        .values({
          name: "Refund Teacher",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const teacherUser = teacherUsers[0];

      const teachersResult: TeacherEntity[] = await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const teacher = teachersResult[0];

      const studentsResult: StudentEntity[] = await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Refund Student",
          gender: Gender.MALE,
          status: "REGULAR",
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning();
      const student = studentsResult[0];

      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: now,
      });

      const original = await SchedulingRepository.createClassInstance(
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          quotaDeducted: true,
          idempotencyKey: randomUUID(),
        },
        tx
      );

      // Student classes remaining should be 4
      const [studentAfterOriginal] = await tx.select().from(students).where(eq(students.id, student.id));
      expect(studentAfterOriginal.classesRemaining).toBe(4);

      // Reschedule
      await SchedulingRepository.rescheduleClassInstance(
        original.id,
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-26T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-26T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          idempotencyKey: randomUUID(),
        },
        tx
      );

      // Student classes remaining should be 5 now (original refunded)
      const [studentAfterReschedule] = await tx.select().from(students).where(eq(students.id, student.id));
      expect(studentAfterReschedule.classesRemaining).toBe(5);

      // Original class should be closed
      const [updatedOriginal] = await tx.select().from(classInstances).where(eq(classInstances.id, original.id));
      expect(updatedOriginal.isRescheduled).toBe(true);
      expect(updatedOriginal.quotaDeducted).toBe(false);
    });
    testLogger.info("Original class updates and quota refund test passed.");
  });

  test("Prevents rescheduling completed or taken classes", async () => {
    testLogger.info("Testing completed or taken class reschedule prevention...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-prevention-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-prevention-${randomUUID()}@example.com`;

      const parentUsers: UserEntity[] = await tx
        .insert(users)
        .values({
          name: "Prevention Parent",
          email: parentEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const parentUser = parentUsers[0];

      const parentsResult: ParentEntity[] = await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const parent = parentsResult[0];

      const teacherUsers: UserEntity[] = await tx
        .insert(users)
        .values({
          name: "Prevention Teacher",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const teacherUser = teacherUsers[0];

      const teachersResult: TeacherEntity[] = await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const teacher = teachersResult[0];

      const studentsResult: StudentEntity[] = await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Prevention Student",
          gender: Gender.MALE,
          status: "REGULAR",
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning();
      const student = studentsResult[0];

      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: now,
      });

      const original = await SchedulingRepository.createClassInstance(
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          executionState: "COMPLETED",
          outcome: "TAKEN",
          actualStartAt: now,
          idempotencyKey: randomUUID(),
        },
        tx
      );

      try {
        await SchedulingRepository.rescheduleClassInstance(
          original.id,
          {
            studentId: student.id,
            teacherId: teacher.id,
            scheduledStartAt: new Date("2026-06-26T10:00:00Z"),
            scheduledEndAt: new Date("2026-06-26T11:00:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            idempotencyKey: randomUUID(),
          },
          tx
        );
        expect(true).toBe(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
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

      const parentUsers: UserEntity[] = await tx
        .insert(users)
        .values({
          name: "Double Parent",
          email: parentEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const parentUser = parentUsers[0];

      const parentsResult: ParentEntity[] = await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const parent = parentsResult[0];

      const teacherUsers: UserEntity[] = await tx
        .insert(users)
        .values({
          name: "Double Teacher",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const teacherUser = teacherUsers[0];

      const teachersResult: TeacherEntity[] = await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const teacher = teachersResult[0];

      const studentsResult: StudentEntity[] = await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Double Student",
          gender: Gender.FEMALE,
          status: "REGULAR",
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning();
      const student = studentsResult[0];

      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: now,
      });

      const original = await SchedulingRepository.createClassInstance(
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          idempotencyKey: randomUUID(),
        },
        tx
      );

      // First reschedule
      await SchedulingRepository.rescheduleClassInstance(
        original.id,
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-26T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-26T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          idempotencyKey: randomUUID(),
        },
        tx
      );

      // Second attempt to reschedule the SAME original class
      try {
        await SchedulingRepository.rescheduleClassInstance(
          original.id,
          {
            studentId: student.id,
            teacherId: teacher.id,
            scheduledStartAt: new Date("2026-06-27T10:00:00Z"),
            scheduledEndAt: new Date("2026-06-27T11:00:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            idempotencyKey: randomUUID(),
          },
          tx
        );
        expect(true).toBe(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
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

      const parentUsers: UserEntity[] = await tx
        .insert(users)
        .values({
          name: "Uniq Parent",
          email: parentEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const parentUser = parentUsers[0];

      const parentsResult: ParentEntity[] = await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const parent = parentsResult[0];

      const teacherUsers: UserEntity[] = await tx
        .insert(users)
        .values({
          name: "Uniq Teacher",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const teacherUser = teacherUsers[0];

      const teachersResult: TeacherEntity[] = await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const teacher = teachersResult[0];

      const studentsResult: StudentEntity[] = await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Uniq Student",
          gender: Gender.MALE,
          status: "REGULAR",
          classesRemaining: 5,
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning();
      const student = studentsResult[0];

      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: now,
      });

      const [original] = await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning();

      // Insert two rescheduled instances targeting the same original
      await tx.insert(classInstances).values({
        studentId: student.id,
        teacherId: teacher.id,
        originalClassId: original.id,
        scheduledStartAt: new Date("2026-06-26T10:00:00Z"),
        scheduledEndAt: new Date("2026-06-26T11:00:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        createdAt: now,
        updatedAt: now,
        idempotencyKey: randomUUID(),
      });

      try {
        await tx.insert(classInstances).values({
          studentId: student.id,
          teacherId: teacher.id,
          originalClassId: original.id,
          scheduledStartAt: new Date("2026-06-27T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-27T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        });
        expect(true).toBe(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
        expect(message + cause).toContain("class_instances_original_class_uniq_idx");
      }
    });
    testLogger.info("Unique index constraint test passed.");
  });

  test("Enforces self-referencing check constraint", async () => {
    testLogger.info("Testing self-referencing check constraint...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-self-${randomUUID()}@example.com`;
      const [parentUser] = await tx
        .insert(users)
        .values({
          name: "Self Parent",
          email: parentEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [parent] = await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [student] = await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Self Student",
          gender: Gender.MALE,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning();

      const [teacherUser] = await tx
        .insert(users)
        .values({
          name: "Self Teacher",
          email: `teacher-self-${randomUUID()}@example.com`,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [teacher] = await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [instance] = await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning();

      try {
        await tx.update(classInstances).set({ originalClassId: instance.id }).where(eq(classInstances.id, instance.id));
        expect(true).toBe(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
        expect(message + cause).toContain("class_instances_reschedule_not_self_chk");
      }
    });
    testLogger.info("Self-referencing check constraint test passed.");
  });

  test("Enforces rescheduled no quota check constraint", async () => {
    testLogger.info("Testing rescheduled no quota check constraint...");
    await runInRollback(async tx => {
      const now = new Date();
      const [parentUser] = await tx
        .insert(users)
        .values({
          name: "noQuota Parent",
          email: `parent-noQuota-${randomUUID()}@example.com`,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [parent] = await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [teacherUser] = await tx
        .insert(users)
        .values({
          name: "noQuota Teacher",
          email: `teacher-noQuota-${randomUUID()}@example.com`,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [teacher] = await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [student] = await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "noQuota Student",
          gender: Gender.FEMALE,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning();

      try {
        await tx.insert(classInstances).values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          isRescheduled: true,
          quotaDeducted: true,
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        });
        expect(true).toBe(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
        expect(message + cause).toContain("class_instances_rescheduled_no_quota_chk");
      }
    });
    testLogger.info("Rescheduled no quota check constraint test passed.");
  });

  test("Enforces rescheduled no complete check constraint", async () => {
    testLogger.info("Testing rescheduled no complete check constraint...");
    await runInRollback(async tx => {
      const now = new Date();
      const [parentUser] = await tx
        .insert(users)
        .values({
          name: "noComplete Parent",
          email: `parent-noComplete-${randomUUID()}@example.com`,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [parent] = await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [teacherUser] = await tx
        .insert(users)
        .values({
          name: "noComplete Teacher",
          email: `teacher-noComplete-${randomUUID()}@example.com`,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [teacher] = await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [student] = await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "noComplete Student",
          gender: Gender.MALE,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning();

      try {
        await tx.insert(classInstances).values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          isRescheduled: true,
          executionState: "COMPLETED",
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        });
        expect(true).toBe(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
        expect(message + cause).toContain("class_instances_rescheduled_no_complete_chk");
      }
    });
    testLogger.info("Rescheduled no complete check constraint test passed.");
  });
});
