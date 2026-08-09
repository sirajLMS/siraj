import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { SchedulingRepository } from "@/backend/db/repo";
import { classInstances, parents, students, teacherAssignments, teachers, users } from "@/backend/db/schema";
import { ensureTestSubjectId } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CurrencyCode, Gender } from "@/backend/enum";
import type { ClassInstanceInsertType } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

async function createTestUser(tx: DBTransaction, name: string, email: string, now: Date) {
  const [user] = await tx
    .insert(users)
    .values({ name, email, password: "password", createdAt: now, updatedAt: now })
    .returning();
  return user;
}

async function setupTestData(
  tx: DBTransaction,
  options: { prefix: string; gender?: Gender; classesRemaining?: number }
) {
  const { prefix, gender = Gender.MALE, classesRemaining = 5 } = options;
  const now = new Date();
  const pUser = await createTestUser(tx, `${prefix} Parent`, `${prefix}-p-${randomUUID()}@example.com`, now);
  const [parent] = await tx
    .insert(parents)
    .values({ userId: pUser.id, status: "REGULAR", createdAt: now, updatedAt: now })
    .returning();

  const tUser = await createTestUser(tx, `${prefix} Teacher`, `${prefix}-t-${randomUUID()}@example.com`, now);
  const [teacher] = await tx.insert(teachers).values({ userId: tUser.id, createdAt: now, updatedAt: now }).returning();

  const sUser = await createTestUser(tx, `${prefix} Student User`, `${prefix}-su-${randomUUID()}@example.com`, now);
  const [student] = await tx
    .insert(students)
    .values({
      parentId: parent.id,
      userId: sUser.id,
      name: `${prefix} Student`,
      gender,
      status: "REGULAR",
      classesRemaining,
      createdAt: now,
      updatedAt: now,
      idempotencyKey: randomUUID(),
    })
    .returning();

  await tx.insert(teacherAssignments).values({ studentId: student.id, teacherId: teacher.id, assignedAt: now });
  return { parentUser: pUser, parent, teacherUser: tUser, teacher, student, now };
}

async function createTestClass(
  tx: DBTransaction,
  studentId: string,
  teacherId: string,
  overrides: Partial<Omit<ClassInstanceInsertType, "createdAt" | "updatedAt">> = {}
) {
  const subjectId = overrides.subjectId ?? (await ensureTestSubjectId(tx));
  return SchedulingRepository.createClassInstance(
    {
      studentId,
      teacherId,
      scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
      scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
      durationMinutes: 60,
      classType: "REGULAR",
      idempotencyKey: randomUUID(),
      ...overrides,
      subjectId,
    },
    tx
  );
}

async function createOriginalClassWithRate(tx: DBTransaction, studentId: string, teacherId: string) {
  return createTestClass(tx, studentId, teacherId, {
    quotaDeducted: true,
    rateAmount: "50.00",
    rateCurrency: CurrencyCode.USD,
  });
}

async function rescheduleTestClass(
  tx: DBTransaction,
  originalId: string,
  studentId: string,
  teacherId: string,
  overrides: Partial<Omit<ClassInstanceInsertType, "createdAt" | "updatedAt">> = {}
) {
  const subjectId = overrides.subjectId ?? (await ensureTestSubjectId(tx));
  return SchedulingRepository.rescheduleClassInstance(
    originalId,
    {
      studentId,
      teacherId,
      scheduledStartAt: new Date("2026-06-26T10:00:00Z"),
      scheduledEndAt: new Date("2026-06-26T11:00:00Z"),
      durationMinutes: 60,
      classType: "REGULAR",
      idempotencyKey: randomUUID(),
      ...overrides,
      subjectId,
    },
    tx
  );
}

async function insertClassInstance(tx: DBTransaction, values: Partial<ClassInstanceInsertType>) {
  const now = new Date();
  const [instance] = await tx
    .insert(classInstances)
    .values({
      scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
      scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
      durationMinutes: 60,
      classType: "REGULAR",
      createdAt: now,
      updatedAt: now,
      idempotencyKey: randomUUID(),
      ...values,
      subjectId: values.subjectId ?? (await ensureTestSubjectId(tx)),
    } as ClassInstanceInsertType)
    .returning();
  return instance;
}

async function insertRescheduledInstance(
  tx: DBTransaction,
  studentId: string,
  teacherId: string,
  overrides: Partial<ClassInstanceInsertType> = {}
) {
  return insertClassInstance(tx, {
    studentId,
    teacherId,
    isRescheduled: true,
    ...overrides,
  });
}

async function expectConstraintViolation(fn: () => Promise<unknown>, constraintName: string) {
  try {
    await fn();
    throw new Error(`Expected constraint violation "${constraintName}" but none was thrown`);
  } catch (error) {
    let causeStr = "";
    if (error instanceof Error && error.cause) {
      causeStr = error.cause instanceof Error ? error.cause.message : JSON.stringify(error.cause);
    }
    const fullError = causeStr ? `${String(error)}: ${causeStr}` : String(error);
    expect(fullError).toContain(constraintName);
  }
}

async function expectStudentQuota(tx: DBTransaction, studentId: string, expected: number) {
  const [student] = await tx.select().from(students).where(eq(students.id, studentId));
  expect(student.classesRemaining).toBe(expected);
}

async function expectViolation(
  tx: DBTransaction,
  prefix: string,
  constraint: string,
  action: (tx: DBTransaction, studentId: string, teacherId: string) => Promise<unknown>
) {
  const { student, teacher } = await setupTestData(tx, { prefix });
  await expectConstraintViolation(() => action(tx, student.id, teacher.id), constraint);
}

describe("Class Rescheduling Business Rules & Constraints", () => {
  test("Allows rescheduling and inherits rate from original class", async () => {
    testLogger.info("Testing rate inheritance on reschedule...");
    await runInRollback(async tx => {
      const { teacher, student } = await setupTestData(tx, { prefix: "resched" });
      const original = await createOriginalClassWithRate(tx, student.id, teacher.id);

      const rescheduled = await rescheduleTestClass(tx, original.id, student.id, teacher.id);

      expect(rescheduled.rateAmount).toBe("50.00");
      expect(rescheduled.originalClassId).toBe(original.id);
    });
    testLogger.info("Rate inheritance test passed.");
  });

  test("Allows rescheduling with overridden rate", async () => {
    testLogger.info("Testing overridden rate on reschedule...");
    await runInRollback(async tx => {
      const { teacher, student } = await setupTestData(tx, { prefix: "override", gender: Gender.FEMALE });
      const original = await createOriginalClassWithRate(tx, student.id, teacher.id);

      const rescheduled = await rescheduleTestClass(tx, original.id, student.id, teacher.id, {
        rateAmount: "60.00",
        rateCurrency: CurrencyCode.USD,
        isRateOverridden: true,
      });

      expect(rescheduled.rateAmount).toBe("60.00");
    });
    testLogger.info("Overridden rate test passed.");
  });

  test("Updates original class to rescheduled and refunds quota", async () => {
    testLogger.info("Testing original class updates and quota refund...");
    await runInRollback(async tx => {
      const { teacher, student } = await setupTestData(tx, { prefix: "refund" });
      const original = await createTestClass(tx, student.id, teacher.id, { quotaDeducted: true });

      await expectStudentQuota(tx, student.id, 5);

      await rescheduleTestClass(tx, original.id, student.id, teacher.id);

      await expectStudentQuota(tx, student.id, 5);

      const [updatedOriginal] = await tx.select().from(classInstances).where(eq(classInstances.id, original.id));
      expect(updatedOriginal.isRescheduled).toBe(true);
      expect(updatedOriginal.quotaDeducted).toBe(false);
    });
    testLogger.info("Original class updates and quota refund test passed.");
  });

  test("Prevents rescheduling completed or taken classes", async () => {
    testLogger.info("Testing completed or taken class reschedule prevention...");
    await runInRollback(async tx => {
      const { teacher, student, now } = await setupTestData(tx, { prefix: "prev" });
      const original = await createTestClass(tx, student.id, teacher.id, {
        executionState: "COMPLETED",
        outcome: "TAKEN",
        actualStartAt: now,
      });

      await expectConstraintViolation(
        () => rescheduleTestClass(tx, original.id, student.id, teacher.id),
        "Cannot reschedule a completed session"
      );
    });
    testLogger.info("Completed or taken class reschedule prevention test passed.");
  });

  test("Prevents rescheduling a class that was already rescheduled", async () => {
    testLogger.info("Testing double reschedule prevention...");
    await runInRollback(async tx => {
      const { teacher, student } = await setupTestData(tx, { prefix: "double", gender: Gender.FEMALE });
      const original = await createTestClass(tx, student.id, teacher.id);

      await rescheduleTestClass(tx, original.id, student.id, teacher.id);

      await expectConstraintViolation(
        () =>
          rescheduleTestClass(tx, original.id, student.id, teacher.id, {
            scheduledStartAt: new Date("2026-06-27T10:00:00Z"),
            scheduledEndAt: new Date("2026-06-27T11:00:00Z"),
          }),
        "Cannot reschedule a session that has already been rescheduled"
      );
    });
    testLogger.info("Double reschedule prevention test passed.");
  });

  test("Enforces unique index on original_class_id", async () => {
    testLogger.info("Testing unique index on original_class_id with disabled triggers...");
    await runInRollback(async tx => {
      await expectViolation(tx, "uniq", "class_instances_original_class_uniq_idx", async (txConn, sid, tid) => {
        const original = await insertClassInstance(txConn, { studentId: sid, teacherId: tid });

        // Insert two rescheduled instances targeting the same original
        await insertClassInstance(txConn, { studentId: sid, teacherId: tid, originalClassId: original.id });
        await insertClassInstance(txConn, { studentId: sid, teacherId: tid, originalClassId: original.id });
      });
    });
    testLogger.info("Unique index constraint test passed.");
  });

  test("Enforces self-referencing check constraint", async () => {
    testLogger.info("Testing self-referencing check constraint...");
    await runInRollback(async tx => {
      await expectViolation(tx, "self", "class_instances_reschedule_not_self_chk", async (txConn, sid, tid) => {
        const instance = await insertClassInstance(txConn, { studentId: sid, teacherId: tid });
        await txConn
          .update(classInstances)
          .set({ originalClassId: instance.id })
          .where(eq(classInstances.id, instance.id));
      });
    });
    testLogger.info("Self-referencing check constraint test passed.");
  });

  const rescheduledConstraintTests = [
    {
      name: "Enforces rescheduled no quota check constraint",
      prefix: "noQuota",
      overrides: { quotaDeducted: true },
      constraint: "class_instances_rescheduled_no_quota_chk",
    },
    {
      name: "Enforces rescheduled no complete check constraint",
      prefix: "noComplete",
      overrides: { executionState: "COMPLETED", outcome: "TAKEN", actualStartAt: new Date() },
      constraint: "class_instances_rescheduled_no_complete_chk",
    },
  ];

  for (const { name, prefix, overrides, constraint } of rescheduledConstraintTests) {
    test(name, async () => {
      testLogger.info(`Testing ${name.toLowerCase()}...`);
      await runInRollback(tx =>
        expectViolation(tx, prefix, constraint, (_txConn, sid, tid) =>
          insertRescheduledInstance(tx, sid, tid, overrides)
        )
      );
      testLogger.info(`${name} test passed.`);
    });
  }
});
