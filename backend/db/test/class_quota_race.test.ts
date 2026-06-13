import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { Gender } from "../../../lib/enum";
import { testLogger } from "../../../lib/testlogger";
import { db } from "../drizzleDb";
import { SchedulingRepository } from "../repo";
import { parents, students, teacherAssignments, teachers, users } from "../schema";
import { type DbTransaction, runInRollback } from "./test-utils";

async function createBaseTestData(
  executor: DbTransaction | typeof db,
  data: {
    parentEmail: string;
    teacherEmail: string;
    studentName: string;
    classesRemaining: number;
    gender?: Gender;
  }
) {
  const now = new Date();
  const [parentUser] = await executor
    .insert(users)
    .values({
      name: "Test Parent",
      email: data.parentEmail,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [parent] = await executor
    .insert(parents)
    .values({
      userId: parentUser.id,
      status: "REGULAR",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [teacherUser] = await executor
    .insert(users)
    .values({
      name: "Test Teacher",
      email: data.teacherEmail,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [teacher] = await executor
    .insert(teachers)
    .values({
      userId: teacherUser.id,
      status: "ACTIVATED",
      timezone: "UTC",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [student] = await executor
    .insert(students)
    .values({
      parentId: parent.id,
      name: data.studentName,
      gender: data.gender ?? Gender.MALE,
      status: "REGULAR",
      classesTotal: 10,
      classesRemaining: data.classesRemaining,
      createdAt: now,
      updatedAt: now,
      idempotencyKey: randomUUID(),
    })
    .returning();

  await executor.insert(teacherAssignments).values({
    studentId: student.id,
    teacherId: teacher.id,
    assignedAt: now,
  });

  return { parentUser, parent, teacherUser, teacher, student };
}

async function expectStudentQuota(executor: DbTransaction | typeof db, studentId: string, expectedRemaining: number) {
  const [s] = await executor.select().from(students).where(eq(students.id, studentId)).limit(1);
  expect(s.classesRemaining).toBe(expectedRemaining);
}

async function cleanupRaceTestData(data: {
  studentId: string;
  parentUserId: string;
  teacherUserId: string;
  parentId: string;
  teacherId: string;
}) {
  // 1. Soft delete class instances first (set deleted_at), then hard delete
  //    This is required because of the soft_delete_row_trigger_fn trigger
  await db.execute(sql.raw(`UPDATE class_instances SET deleted_at = NOW() WHERE student_id = '${data.studentId}'`));
  await db.execute(sql.raw(`DELETE FROM class_instances WHERE student_id = '${data.studentId}'`));

  // 2. Delete teacher assignments
  await db.delete(teacherAssignments).where(eq(teacherAssignments.studentId, data.studentId));

  // 3. Delete the student
  await db.delete(students).where(eq(students.id, data.studentId));

  // 4. Delete teacher and parent
  await db.delete(teachers).where(eq(teachers.id, data.teacherId));
  await db.delete(parents).where(eq(parents.id, data.parentId));

  // 5. Delete users
  await db.delete(users).where(eq(users.id, data.parentUserId));
  await db.delete(users).where(eq(users.id, data.teacherUserId));
}

describe("Class Quota System Constraints & Triggers", () => {
  test("Deducts class quota on insertion and refunds on deletion", async () => {
    testLogger.info("Testing quota deduction and refund flows...");
    await runInRollback(async tx => {
      const now = new Date();
      const { student, teacher } = await createBaseTestData(tx, {
        parentEmail: `parent-quota-${randomUUID()}@example.com`,
        teacherEmail: `teacher-quota-${randomUUID()}@example.com`,
        studentName: "Quota Student",
        classesRemaining: 5,
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
      await expectStudentQuota(tx, student.id, 4);

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
      await expectStudentQuota(tx, student.id, 4);

      // 3. Update class2 to quota_deducted = true
      await SchedulingRepository.updateClassInstance(instance2.id, { quotaDeducted: true }, tx);
      await expectStudentQuota(tx, student.id, 3);

      // 4. Update class1 to quota_deducted = false (refund)
      await SchedulingRepository.updateClassInstance(instance1.id, { quotaDeducted: false }, tx);
      await expectStudentQuota(tx, student.id, 4);

      // 5. Soft delete class2 (refunds the quota)
      await SchedulingRepository.updateClassInstance(instance2.id, { deletedAt: now }, tx);
      await expectStudentQuota(tx, student.id, 5);
    });
    testLogger.info("Deduction and refund tests passed.");
  });

  test("Blocks booking if classes_remaining is zero", async () => {
    testLogger.info("Testing block booking on empty quota...");
    await runInRollback(async tx => {
      const { student, teacher } = await createBaseTestData(tx, {
        parentEmail: `parent-block-${randomUUID()}@example.com`,
        teacherEmail: `teacher-block-${randomUUID()}@example.com`,
        studentName: "Block Student",
        classesRemaining: 0,
        gender: Gender.FEMALE,
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
    const { student, teacher, parentUser, teacherUser, parent } = await createBaseTestData(db, {
      parentEmail: `parent-race-${randomUUID()}@example.com`,
      teacherEmail: `teacher-race-${randomUUID()}@example.com`,
      studentName: "Race Student",
      classesRemaining: 1,
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
    await expectStudentQuota(db, student.id, 0);

    // Clean up created records since they were outside runInRollback
    try {
      await cleanupRaceTestData({
        studentId: student.id,
        parentUserId: parentUser.id,
        teacherUserId: teacherUser.id,
        parentId: parent.id,
        teacherId: teacher.id,
      });
      testLogger.info("Race condition test passed with cleanup completed.");
    } catch (cleanupError) {
      testLogger.error("Cleanup failed:", cleanupError);
      throw cleanupError;
    }
  });
});
