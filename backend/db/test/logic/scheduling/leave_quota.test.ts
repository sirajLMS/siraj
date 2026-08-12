import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { leaveQuotaUsage, systemSettings } from "@/backend/db/schema";
import { setupStudent, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import type {
  DBTransaction,
  LeaveQuotaUsageSelectType,
  StudentSelectType,
  TeacherSelectType,
  UserSelectType,
} from "@/backend/types";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { getServerTranslations } from "@/shared/locale";

async function expectLeaveQuotaExceeded(fn: () => Promise<unknown>) {
  let errorCaught: Error | null = null;
  try {
    await fn();
  } catch (error) {
    if (error instanceof Error) {
      errorCaught = error;
    }
  }
  expect(errorCaught).not.toBeNull();
  if (errorCaught) {
    const cause = errorCaught.cause;
    const causeMessage =
      cause && typeof cause === "object" && "message" in cause
        ? String((cause as Record<string, unknown>).message)
        : undefined;
    const message = causeMessage || errorCaught.message || "";
    expect(message).toContain("Leave quota exceeded");
  }
}

async function insertLeaveQuota(
  tx: DBTransaction,
  params: { teacherId?: string; studentId?: string; year: number; month: number; count: number }
): Promise<LeaveQuotaUsageSelectType> {
  const result = await tx
    .insert(leaveQuotaUsage)
    .values({
      teacherId: params.teacherId,
      studentId: params.studentId,
      periodYear: params.year,
      periodMonth: params.month,
      usedCount: params.count,
    })
    .returning();
  const quota = result[0];
  if (!quota) {
    throw new Error("Failed to insert leave quota - no result returned");
  }
  return quota;
}

async function setLeaveLimit(tx: DBTransaction, key: "teacher_max_leaves" | "student_max_leaves", value: string) {
  await tx
    .insert(systemSettings)
    .values({
      key,
      value,
      dataType: SystemSettingDataType.Integer,
      category: SystemSettingCategory.Scheduling,
      description: `${key === "teacher_max_leaves" ? "Teacher" : "Student"} maximum leaves per month`,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value, updatedAt: new Date() },
    })
    .execute();
}

async function withTeacher(tx: DBTransaction, fn: (teacher: TeacherSelectType) => Promise<void>) {
  const { teacher } = await setupTeacher(tx, {
    name: "Quota Teacher",
    email: `teacher-leave-${randomUUID()}@example.com`,
  });
  await fn(teacher);
}

async function withStudent(tx: DBTransaction, fn: (student: StudentSelectType) => Promise<void>) {
  const { student } = await setupStudent(
    tx,
    { name: "Quota Parent", email: `parent-leave-${randomUUID()}@example.com` },
    {},
    { name: "Quota Student", classesTotal: 10, classesRemaining: 5 }
  );
  await fn(student);
}

async function testInsertQuota(params: {
  tx: DBTransaction;
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
  tx: DBTransaction;
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
  tx: DBTransaction,
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

describe("Leave Quota Repository Methods", () => {
  const currentYear = new Date().getUTCFullYear();
  const currentMonth = new Date().getUTCMonth() + 1;

  test("getTeacherLeaveQuotaUsage returns 0 when no row exists for the period", async () => {
    testLogger.info("Testing getTeacherLeaveQuotaUsage with no existing row...");
    await runInRollback(async tx => {
      const { teacher } = await setupTeacherAndStudent(tx);
      const usage = await SchedulingRepository.getTeacherLeaveQuotaUsage(teacher.id, currentYear, currentMonth, tx);
      expect(usage).toBe(0);
    });
    testLogger.info("getTeacherLeaveQuotaUsage returns 0 when no row exists.");
  });

  test("getTeacherLeaveQuotaUsage returns correct count when row exists", async () => {
    testLogger.info("Testing getTeacherLeaveQuotaUsage with existing row...");
    await runInRollback(async tx => {
      const { teacher } = await setupTeacherAndStudent(tx);
      await insertLeaveQuota(tx, { teacherId: teacher.id, year: currentYear, month: currentMonth, count: 1 });
      const usage = await SchedulingRepository.getTeacherLeaveQuotaUsage(teacher.id, currentYear, currentMonth, tx);
      expect(usage).toBe(1);
    });
    testLogger.info("getTeacherLeaveQuotaUsage returns correct count.");
  });

  test("incrementTeacherLeaveQuota creates row on first call and increments on subsequent calls", async () => {
    testLogger.info("Testing incrementTeacherLeaveQuota atomic increment...");
    await runInRollback(async tx => {
      const { teacher } = await setupTeacherAndStudent(tx);
      const tErrors = getServerTranslations("en").errorsTranslations;

      await SchedulingRepository.incrementTeacherLeaveQuota(teacher.id, tx, tErrors);
      const usage1 = await SchedulingRepository.getTeacherLeaveQuotaUsage(teacher.id, currentYear, currentMonth, tx);
      expect(usage1).toBe(1);

      await SchedulingRepository.incrementTeacherLeaveQuota(teacher.id, tx, tErrors);
      const usage2 = await SchedulingRepository.getTeacherLeaveQuotaUsage(teacher.id, currentYear, currentMonth, tx);
      expect(usage2).toBe(2);
    });
    testLogger.info("incrementTeacherLeaveQuota atomic increment passed.");
  });

  test("incrementTeacherLeaveQuota triggers DB error when incrementing beyond limit", async () => {
    testLogger.info("Testing incrementTeacherLeaveQuota trigger block...");
    await runInRollback(async tx => {
      const { teacher } = await setupTeacherAndStudent(tx);
      await insertLeaveQuota(tx, { teacherId: teacher.id, year: currentYear, month: currentMonth, count: 2 });
      const tErrors = getServerTranslations("en").errorsTranslations;

      await expectLeaveQuotaExceeded(() => SchedulingRepository.incrementTeacherLeaveQuota(teacher.id, tx, tErrors));
    });
    testLogger.info("incrementTeacherLeaveQuota trigger block passed.");
  });

  test("getTeacherByUserId resolves teacher record from user ID", async () => {
    testLogger.info("Testing getTeacherByUserId...");
    await runInRollback(async tx => {
      const { user, teacher } = await setupTeacherAndStudent(tx);
      const result = await SchedulingRepository.getTeacherByUserId(user.id, tx);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(teacher.id);
      expect(result?.userId).toBe(user.id);
    });
    testLogger.info("getTeacherByUserId passed.");
  });

  test("getTeacherByUserId returns null for non-existent user", async () => {
    testLogger.info("Testing getTeacherByUserId with non-existent user...");
    await runInRollback(async tx => {
      const result = await SchedulingRepository.getTeacherByUserId(randomUUID(), tx);
      expect(result).toBeNull();
    });
    testLogger.info("getTeacherByUserId returns null for non-existent user.");
  });
});

async function setupTeacherAndStudent(
  tx: DBTransaction
): Promise<{ user: UserSelectType; teacher: TeacherSelectType; student: StudentSelectType }> {
  const { user, teacher } = await setupTeacher(tx, {
    name: "Quota Teacher User",
    email: `quota-teacher-${randomUUID()}@example.com`,
  });

  const { student } = await setupStudent(
    tx,
    { name: "Quota Parent User", email: `quota-parent-${randomUUID()}@example.com` },
    {},
    { name: "Quota Student", classesTotal: 10, classesRemaining: 10 }
  );

  return { user: user, teacher, student };
}
