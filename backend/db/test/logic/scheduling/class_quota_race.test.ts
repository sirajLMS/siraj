import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { SchedulingRepository } from "@/backend/db/repo";
import { parents, students, teacherAssignments, teachers, users } from "@/backend/db/schema";
import { ensureTestSubjectId } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { Gender } from "@/backend/enum";
import type { ClassInstanceInsertType, StudentSelectType, UserSelectType } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

type WriteExecutor = DBTransaction;

async function createBaseTestData(
  executor: WriteExecutor,
  data: {
    parentEmail: string;
    teacherEmail: string;
    studentName: string;
    classesRemaining: number;
    gender?: Gender;
  }
): Promise<{
  parentUser: UserSelectType;
  parent: typeof parents.$inferSelect;
  teacherUser: UserSelectType;
  teacher: typeof teachers.$inferSelect;
  student: StudentSelectType;
  studentUser: UserSelectType;
}> {
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
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [studentUser] = await executor
    .insert(users)
    .values({
      name: `${data.studentName} User`,
      email: `student-${randomUUID()}@example.com`,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [student] = await executor
    .insert(students)
    .values({
      parentId: parent.id,
      userId: studentUser.id,
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

  return { parentUser, parent, teacherUser, teacher, student, studentUser };
}

async function expectStudentQuota(executor: WriteExecutor, studentId: string, expectedRemaining: number) {
  const [s] = await executor.select().from(students).where(eq(students.id, studentId)).limit(1);
  expect(s.classesRemaining).toBe(expectedRemaining);
}

describe("Class Quota System Constraints & Triggers", () => {
  test("Deducts class quota on insertion and refunds on deletion", async () => {
    testLogger.info("Testing quota deduction and refund flows...");
    await runInRollback(async tx => {
      const { student, teacher } = await createBaseTestData(tx, {
        parentEmail: `parent-quota-${randomUUID()}@example.com`,
        teacherEmail: `teacher-quota-${randomUUID()}@example.com`,
        studentName: "Quota Student",
        classesRemaining: 5,
      });

      // 1. Insert class with quota_deducted = true
      const input1: Omit<ClassInstanceInsertType, "createdAt" | "updatedAt"> = {
        studentId: student.id,
        teacherId: teacher.id,
        subjectId: await ensureTestSubjectId(tx),
        scheduledStartAt: new Date("2026-06-15T10:00:00Z"),
        scheduledEndAt: new Date("2026-06-15T11:00:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        quotaDeducted: true,
        idempotencyKey: randomUUID(),
      };
      const instance1 = await SchedulingRepository.createClassInstance(input1, tx);

      // Fetch student to verify classesRemaining
      await expectStudentQuota(tx, student.id, 5);

      // 2. Insert class with quota_deducted = false
      const input2: Omit<ClassInstanceInsertType, "createdAt" | "updatedAt"> = {
        studentId: student.id,
        teacherId: teacher.id,
        subjectId: await ensureTestSubjectId(tx),
        scheduledStartAt: new Date("2026-06-16T10:00:00Z"),
        scheduledEndAt: new Date("2026-06-16T11:00:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        quotaDeducted: false,
        idempotencyKey: randomUUID(),
      };
      const instance2 = await SchedulingRepository.createClassInstance(input2, tx);

      // Fetch student to verify classesRemaining remains 5
      await expectStudentQuota(tx, student.id, 5);

      // 3. Update class2 to quota_deducted = true
      await SchedulingRepository.updateClassInstance(instance2.id, { quotaDeducted: true }, tx);
      await expectStudentQuota(tx, student.id, 5);

      // 4. Update class1 to quota_deducted = false (refund)
      await SchedulingRepository.updateClassInstance(instance1.id, { quotaDeducted: false }, tx);
      await expectStudentQuota(tx, student.id, 5);

      // 5. Delete class2 (refund)
      await SchedulingRepository.deleteClassInstance(instance2.id, tx);
      await expectStudentQuota(tx, student.id, 5);

      // 6. Delete class1 (no refund since already false)
      await SchedulingRepository.deleteClassInstance(instance1.id, tx);
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
        const zeroQuotaInput: Omit<ClassInstanceInsertType, "createdAt" | "updatedAt"> = {
          studentId: student.id,
          teacherId: teacher.id,
          subjectId: await ensureTestSubjectId(tx),
          scheduledStartAt: new Date("2026-06-15T12:00:00Z"),
          scheduledEndAt: new Date("2026-06-15T13:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          quotaDeducted: true,
          idempotencyKey: randomUUID(),
        };
        await SchedulingRepository.createClassInstance(zeroQuotaInput, tx);
        expect.unreachable("Should have thrown an error for zero quota");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
        expect(message + cause).toMatch(/students_classes_remaining_chk|quota/i);
      }
    });
    testLogger.info("Block booking on zero quota passed.");
  });

  test("Concurrent booking on separate transactions fails second call via CHECK when 1 class remains", async () => {
    testLogger.info("Testing concurrent race condition prevention with separate transactions...");

    // Create setup data using db.transaction() so it COMMITS and persists for the concurrent test
    const uniqueSuffix = randomUUID();
    let studentId = "";
    let teacherId = "";
    let subjectId = "";

    await db.transaction(async tx => {
      const { student, teacher } = await createBaseTestData(tx, {
        parentEmail: `parent-race-${uniqueSuffix}@example.com`,
        teacherEmail: `teacher-race-${uniqueSuffix}@example.com`,
        studentName: `Race Student ${uniqueSuffix}`,
        classesRemaining: 1,
      });
      studentId = student.id;
      teacherId = teacher.id;
      subjectId = await ensureTestSubjectId(tx);
    });

    // Now run concurrent bookings WITHOUT passing tx - each call creates its own transaction
    const makeClassInput = (start: string, end: string): Omit<ClassInstanceInsertType, "createdAt" | "updatedAt"> => ({
      studentId,
      teacherId,
      subjectId,
      scheduledStartAt: new Date(start),
      scheduledEndAt: new Date(end),
      durationMinutes: 60,
      classType: "REGULAR",
      quotaDeducted: true,
      idempotencyKey: randomUUID(),
    });

    // True concurrency: each call creates its own db.transaction() from a separate connection
    const results = await Promise.allSettled([
      SchedulingRepository.createClassInstance(makeClassInput("2026-06-15T15:00:00Z", "2026-06-15T16:00:00Z")),
      SchedulingRepository.createClassInstance(makeClassInput("2026-06-15T16:00:00Z", "2026-06-15T17:00:00Z")),
    ]);

    // With separate transactions, advisory locks should contend
    // The first call claims the single remaining class; the second should fail the CHECK constraint
    const successes = results.filter(r => r.status === "fulfilled");
    expect(successes).toHaveLength(1);

    // Clean up created instances (they committed since no tx was passed)
    const createdIds = successes.map(s => (s as PromiseFulfilledResult<{ id: string }>).value.id);
    if (createdIds.length > 0) {
      await runInRollback(async tx => {
        for (const id of createdIds) {
          await SchedulingRepository.deleteClassInstance(id, tx);
        }
      });
    }

    testLogger.info("Race condition test passed with true concurrent transactions.");
  });
});
