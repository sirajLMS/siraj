import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { Gender } from "../../../lib/enum";
import { testLogger } from "../../../lib/testlogger";
import type { UserEntity } from "../../types/auth.types";
import type { ParentEntity } from "../../types/parent.types";
import type { StudentEntity } from "../../types/student.types";
import type { TeacherEntity } from "../../types/teacher.types";
import { db } from "../drizzleDb";
import { SchedulingRepository } from "../repo";
import { parents, students, teacherAssignments, teachers, users } from "../schema";

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

      const parentUsers: UserEntity[] = await tx
        .insert(users)
        .values({
          name: "Quota Parent",
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
          name: "Quota Teacher",
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
          name: "Quota Student",
          gender: Gender.MALE,
          status: "REGULAR",
          classesTotal: 10,
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

      // 1. Insert class with quota_deducted = true
      const instance1 = await SchedulingRepository.createClassInstance(
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-15T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-15T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          quotaDeducted: true,
          idempotencyKey: randomUUID(),
        },
        tx
      );

      // Fetch student to verify classesRemaining decremented to 4
      const studentsAfter1: StudentEntity[] = await tx
        .select()
        .from(students)
        .where(eq(students.id, student.id))
        .limit(1);
      expect(studentsAfter1[0].classesRemaining).toBe(4);

      // 2. Insert class with quota_deducted = false
      const instance2 = await SchedulingRepository.createClassInstance(
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-16T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-16T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          quotaDeducted: false,
          idempotencyKey: randomUUID(),
        },
        tx
      );

      // Fetch student to verify classesRemaining remains 4
      const studentsAfter2: StudentEntity[] = await tx
        .select()
        .from(students)
        .where(eq(students.id, student.id))
        .limit(1);
      expect(studentsAfter2[0].classesRemaining).toBe(4);

      // 3. Update class2 to quota_deducted = true
      await SchedulingRepository.updateClassInstance(instance2.id, { quotaDeducted: true }, tx);

      const studentsAfter3: StudentEntity[] = await tx
        .select()
        .from(students)
        .where(eq(students.id, student.id))
        .limit(1);
      expect(studentsAfter3[0].classesRemaining).toBe(3);

      // 4. Update class1 to quota_deducted = false (refund)
      await SchedulingRepository.updateClassInstance(instance1.id, { quotaDeducted: false }, tx);

      const studentsAfter4: StudentEntity[] = await tx
        .select()
        .from(students)
        .where(eq(students.id, student.id))
        .limit(1);
      expect(studentsAfter4[0].classesRemaining).toBe(4);

      // 5. Soft delete class2 (refunds the quota)
      await SchedulingRepository.updateClassInstance(instance2.id, { deletedAt: now }, tx);

      const studentsAfter5: StudentEntity[] = await tx
        .select()
        .from(students)
        .where(eq(students.id, student.id))
        .limit(1);
      expect(studentsAfter5[0].classesRemaining).toBe(5);
    });
    testLogger.info("Deduction and refund tests passed.");
  });

  test("Blocks booking if classes_remaining is zero", async () => {
    testLogger.info("Testing block booking on empty quota...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-block-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-block-${randomUUID()}@example.com`;

      const parentUsers: UserEntity[] = await tx
        .insert(users)
        .values({
          name: "Block Parent",
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
          name: "Quota Teacher",
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
          name: "Block Student",
          gender: Gender.FEMALE,
          status: "REGULAR",
          classesTotal: 5,
          classesRemaining: 0,
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

      try {
        await SchedulingRepository.createClassInstance(
          {
            studentId: student.id,
            teacherId: teacher.id,
            scheduledStartAt: new Date("2026-06-15T12:00:00Z"),
            scheduledEndAt: new Date("2026-06-15T13:00:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            quotaDeducted: true,
            idempotencyKey: randomUUID(),
          },
          tx
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
        expect(message + cause).toContain("students_classes_remaining_chk");
      }
    });
    testLogger.info("Block booking on zero quota passed.");
  });

  test("Prevents concurrent race conditions via Advisory Locks", async () => {
    testLogger.info("Testing concurrent race condition prevention...");
    const now = new Date();
    const parentEmail = `parent-race-${randomUUID()}@example.com`;
    const teacherEmail = `teacher-race-${randomUUID()}@example.com`;

    const parentUsers: UserEntity[] = await db
      .insert(users)
      .values({
        name: "Race Parent",
        email: parentEmail,
        password: "password",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    const parentUser = parentUsers[0];

    const parentsResult: ParentEntity[] = await db
      .insert(parents)
      .values({
        userId: parentUser.id,
        status: "REGULAR",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    const parent = parentsResult[0];

    const teacherUsers: UserEntity[] = await db
      .insert(users)
      .values({
        name: "Race Teacher",
        email: teacherEmail,
        password: "password",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    const teacherUser = teacherUsers[0];

    const teachersResult: TeacherEntity[] = await db
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

    // Student has exactly 1 remaining class
    const studentsResult: StudentEntity[] = await db
      .insert(students)
      .values({
        parentId: parent.id,
        name: "Race Student",
        gender: Gender.MALE,
        status: "REGULAR",
        classesTotal: 10,
        classesRemaining: 1,
        createdAt: now,
        updatedAt: now,
        idempotencyKey: randomUUID(),
      })
      .returning();
    const student = studentsResult[0];

    await db.insert(teacherAssignments).values({
      studentId: student.id,
      teacherId: teacher.id,
      assignedAt: now,
    });

    // Execute two concurrent insertions targeting the same student
    const resultPromises = Promise.allSettled([
      SchedulingRepository.createClassInstance({
        studentId: student.id,
        teacherId: teacher.id,
        scheduledStartAt: new Date("2026-06-15T15:00:00Z"),
        scheduledEndAt: new Date("2026-06-15T16:00:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        quotaDeducted: true,
        idempotencyKey: randomUUID(),
      }),
      SchedulingRepository.createClassInstance({
        studentId: student.id,
        teacherId: teacher.id,
        scheduledStartAt: new Date("2026-06-15T16:00:00Z"),
        scheduledEndAt: new Date("2026-06-15T17:00:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        quotaDeducted: true,
        idempotencyKey: randomUUID(),
      }),
    ]);

    const results = await resultPromises;

    const successes = results.filter(r => r.status === "fulfilled");
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");

    // Exactly one insertion should succeed, and one should fail
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    const failReason: unknown = failures[0].reason;
    const message = failReason instanceof Error ? failReason.message : String(failReason);
    const cause = failReason instanceof Error && failReason.cause instanceof Error ? failReason.cause.message : "";
    expect(message + cause).toContain("students_classes_remaining_chk");

    // Verify final state in DB has classesRemaining = 0
    const finalStudents: StudentEntity[] = await db.select().from(students).where(eq(students.id, student.id)).limit(1);
    expect(finalStudents[0].classesRemaining).toBe(0);

    // Clean up created records since they were outside runInRollback
    // Delete in correct order to avoid foreign key violations
    try {
      // 1. Soft delete class instances first (set deleted_at), then hard delete
      //    This is required because of the soft_delete_row_trigger_fn trigger
      await db.execute(sql.raw(`UPDATE class_instances SET deleted_at = NOW() WHERE student_id = '${student.id}'`));
      await db.execute(sql.raw(`DELETE FROM class_instances WHERE student_id = '${student.id}'`));
      testLogger.info(`Force deleted class_instances for race student`);

      // 2. Delete teacher assignments
      await db.delete(teacherAssignments).where(eq(teacherAssignments.studentId, student.id));

      // 3. Delete the student
      await db.delete(students).where(eq(students.id, student.id));

      // 4. Delete teacher and parent
      await db.delete(teachers).where(eq(teachers.id, teacher.id));
      await db.delete(parents).where(eq(parents.id, parent.id));

      // 5. Delete users
      await db.delete(users).where(eq(users.id, parentUser.id));
      await db.delete(users).where(eq(users.id, teacherUser.id));

      testLogger.info("Race condition test passed with cleanup completed.");
    } catch (cleanupError) {
      testLogger.error("Cleanup failed:", cleanupError);
      // Log what remains for debugging
      const remainingInstances = await db.execute(
        sql.raw(`SELECT id, student_id, created_at, deleted_at FROM class_instances WHERE student_id = '${student.id}'`)
      );
      testLogger.error(`Remaining class_instances: ${JSON.stringify(remainingInstances.rows)}`);
      throw cleanupError;
    }
  });
});
