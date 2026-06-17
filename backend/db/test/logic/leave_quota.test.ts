import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { testLogger } from "@/shared/lib/testlogger";
import type { LeaveQuotaUsageEntity, ParentEntity, StudentEntity, TeacherEntity, UserEntity } from "../../../types";
import { leaveQuotaUsage, parents, students, systemSettings, teachers, users } from "../../schema";
import { type DbTransaction, runInRollback } from "../test-utils";

async function createTestTeacher(tx: DbTransaction, name: string, email: string): Promise<TeacherEntity> {
  const now = new Date();
  const [user] = (await tx
    .insert(users)
    .values({
      name,
      email,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [UserEntity];

  const [teacher] = (await tx
    .insert(teachers)
    .values({
      userId: user.id,
      status: "ACTIVATED",
      timezone: "UTC",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [TeacherEntity];

  return teacher;
}

async function createTestStudent(tx: DbTransaction, studentName: string, parentEmail: string): Promise<StudentEntity> {
  const now = new Date();
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

  const [student] = (await tx
    .insert(students)
    .values({
      parentId: parent.id,
      name: studentName,
      status: "REGULAR",
      classesTotal: 10,
      classesRemaining: 5,
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [StudentEntity];

  return student;
}

async function expectLeaveQuotaExceeded(fn: () => Promise<unknown>) {
  try {
    await fn();
    expect(true).toBe(false);
  } catch (error) {
    const err = error as Error & { cause?: { message?: string } };
    const message = err.cause?.message || err.message || "";
    expect(message).toContain("Leave quota exceeded");
  }
}

async function insertLeaveQuota(
  tx: DbTransaction,
  params: { teacherId?: string; studentId?: string; year: number; month: number; count: number }
): Promise<LeaveQuotaUsageEntity> {
  const [quota] = (await tx
    .insert(leaveQuotaUsage)
    .values({
      teacherId: params.teacherId,
      studentId: params.studentId,
      periodYear: params.year,
      periodMonth: params.month,
      usedCount: params.count,
    })
    .returning()) as [LeaveQuotaUsageEntity];
  return quota;
}

async function setLeaveLimit(tx: DbTransaction, key: "teacher_max_leaves" | "student_max_leaves", value: string) {
  await tx
    .insert(systemSettings)
    .values({
      key,
      value,
      dataType: "number",
      category: "leave",
      description: `${key === "teacher_max_leaves" ? "Teacher" : "Student"} maximum leaves per month`,
      updatedAt: new Date(),
    })
    .execute();
}

async function withTeacher(tx: DbTransaction, fn: (teacher: TeacherEntity) => Promise<void>) {
  const email = `teacher-leave-${randomUUID()}@example.com`;
  const teacher = await createTestTeacher(tx, "Quota Teacher", email);
  await fn(teacher);
}

async function withStudent(tx: DbTransaction, fn: (student: StudentEntity) => Promise<void>) {
  const email = `parent-leave-${randomUUID()}@example.com`;
  const student = await createTestStudent(tx, "Quota Student", email);
  await fn(student);
}

async function testInsertQuota(params: {
  tx: DbTransaction;
  id: { teacherId?: string; studentId?: string };
  count: number;
  shouldSucceed: boolean;
  year?: number;
  month?: number;
}) {
  const { tx, id, count, shouldSucceed, year = 2026, month = 6 } = params;
  const insertParams = { ...id, year, month, count };
  if (shouldSucceed) {
    const quota = await insertLeaveQuota(tx, insertParams);
    expect(quota.usedCount).toBe(count);
    return quota;
  }
  await expectLeaveQuotaExceeded(() => insertLeaveQuota(tx, insertParams));
  return null;
}

async function verifyCustomLeaveLimit(params: {
  tx: DbTransaction;
  key: "teacher_max_leaves" | "student_max_leaves";
  id: { teacherId?: string; studentId?: string };
  limit: string;
  countWithin: number;
  countExceed: number;
}) {
  const { tx, key, id, limit, countWithin, countExceed } = params;
  await setLeaveLimit(tx, key, limit);
  await testInsertQuota({ tx, id, count: countWithin, shouldSucceed: true });
  await testInsertQuota({ tx, id, count: countExceed, shouldSucceed: false, year: 2026, month: 7 });
}

async function runWithEntity(
  tx: DbTransaction,
  type: "teacher" | "student",
  fn: (id: { teacherId?: string; studentId?: string }) => Promise<unknown>
) {
  if (type === "teacher") {
    await withTeacher(tx, async teacher => {
      await fn({ teacherId: teacher.id });
    });
  } else {
    await withStudent(tx, async student => {
      await fn({ studentId: student.id });
    });
  }
}

describe("Leave Quota Limits Trigger", () => {
  test("Allows inserting leave quota usage within the default limit of two", async () => {
    testLogger.info("Testing default leave limit check (success)...");
    await runInRollback(async tx => {
      await runWithEntity(tx, "teacher", id => testInsertQuota({ tx, id, count: 2, shouldSucceed: true }));
      await runWithEntity(tx, "student", id => testInsertQuota({ tx, id, count: 1, shouldSucceed: true }));
    });
    testLogger.info("Default leave limit check (success) passed.");
  });

  const failureScenarios = [
    { role: "teacher" as const, count: 3 },
    { role: "student" as const, count: 4 },
  ];

  for (const { role, count } of failureScenarios) {
    test(`Blocks inserting ${role} leave quota usage exceeding the default limit of two`, async () => {
      testLogger.info(`Testing default ${role} leave limit check (failure)...`);
      await runInRollback(tx =>
        runWithEntity(tx, role, id => testInsertQuota({ tx, id, count, shouldSucceed: false }))
      );
      testLogger.info(`Default ${role} leave limit check (failure) passed.`);
    });
  }

  const customLimitScenarios = [
    {
      role: "teacher" as const,
      setting: "teacher_max_leaves" as const,
      limit: "5",
      valid: 4,
      invalid: 6,
    },
    {
      role: "student" as const,
      setting: "student_max_leaves" as const,
      limit: "3",
      valid: 3,
      invalid: 4,
    },
  ];

  for (const { role, setting, limit, valid, invalid } of customLimitScenarios) {
    test(`Allows inserting leave quota usage within custom ${role} limit`, async () => {
      testLogger.info(`Testing custom ${role} leave limit check...`);
      await runInRollback(tx =>
        runWithEntity(tx, role, id =>
          verifyCustomLeaveLimit({
            tx,
            key: setting,
            id,
            limit,
            countWithin: valid,
            countExceed: invalid,
          })
        )
      );
      testLogger.info(`Custom ${role} leave limit check passed.`);
    });
  }

  test("Prevents updating used count beyond the limit", async () => {
    testLogger.info("Testing leave limit update block...");
    await runInRollback(async tx => {
      await runWithEntity(tx, "teacher", async id => {
        const quota = await testInsertQuota({ tx, id, count: 1, shouldSucceed: true });
        if (!quota) return;

        // Update to 2 leaves (allowed under default limit of 2)
        await tx.update(leaveQuotaUsage).set({ usedCount: 2 }).where(eq(leaveQuotaUsage.id, quota.id)).execute();

        // Update to 3 leaves (blocked under default limit of 2)
        await expectLeaveQuotaExceeded(() =>
          tx.update(leaveQuotaUsage).set({ usedCount: 3 }).where(eq(leaveQuotaUsage.id, quota.id)).execute()
        );
      });
    });
    testLogger.info("Leave limit update block test passed.");
  });
});
