import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { SystemRulesService } from "@/backend/services/system/system-rules.service";
import type { TeacherEntity, UserEntity } from "@/backend/types";
import { testLogger } from "@/shared/lib/testlogger";
import { leaveQuotaUsage, systemSettings, teachers, users } from "../../../db/schema";
import { type DbTransaction, runInRollback } from "../../../db/test/test-utils";

async function setupTeacher(tx: DbTransaction): Promise<{ user: UserEntity; teacher: TeacherEntity }> {
  const now = new Date();
  const [user] = (await tx
    .insert(users)
    .values({
      name: "Rules Test Teacher",
      email: `rules-teacher-${randomUUID()}@example.com`,
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

  return { user, teacher };
}

async function setTeacherMaxLeaves(tx: DbTransaction, value: string) {
  await tx
    .insert(systemSettings)
    .values({
      key: "teacher_max_leaves",
      value,
      dataType: "number",
      category: "leave",
      description: "Teacher maximum leaves per month",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value, updatedAt: new Date() },
    })
    .execute();
}

describe("SystemRulesService.assertLeaveQuotaAvailable", () => {
  const currentYear = new Date().getUTCFullYear();
  const currentMonth = new Date().getUTCMonth() + 1;

  test("passes when teacher has no quota usage", async () => {
    testLogger.info("Testing assertLeaveQuotaAvailable with no usage...");
    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx);
      await SystemRulesService.assertLeaveQuotaAvailable(teacher.id, "en", tx);
    });
    testLogger.info("assertLeaveQuotaAvailable passes with no usage.");
  });

  test("passes when teacher usage is below maximum", async () => {
    testLogger.info("Testing assertLeaveQuotaAvailable with usage below max...");
    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx);
      await tx.insert(leaveQuotaUsage).values({
        teacherId: teacher.id,
        periodYear: currentYear,
        periodMonth: currentMonth,
        usedCount: 1,
      });
      await SystemRulesService.assertLeaveQuotaAvailable(teacher.id, "en", tx);
    });
    testLogger.info("assertLeaveQuotaAvailable passes with usage below max.");
  });

  test("throws when teacher usage equals maximum", async () => {
    testLogger.info("Testing assertLeaveQuotaAvailable with usage at max...");
    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx);
      await tx.insert(leaveQuotaUsage).values({
        teacherId: teacher.id,
        periodYear: currentYear,
        periodMonth: currentMonth,
        usedCount: 2,
      });

      let errorThrown: unknown = null;
      try {
        await SystemRulesService.assertLeaveQuotaAvailable(teacher.id, "en", tx);
      } catch (error) {
        errorThrown = error;
      }
      expect(errorThrown).not.toBeNull();
      expect((errorThrown as Error).message).toContain("quota");
    });
    testLogger.info("assertLeaveQuotaAvailable throws when usage at max.");
  });

  test("respects custom teacher_max_leaves setting", async () => {
    testLogger.info("Testing assertLeaveQuotaAvailable with custom max_leaves...");
    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx);
      await setTeacherMaxLeaves(tx, "5");

      await tx.insert(leaveQuotaUsage).values({
        teacherId: teacher.id,
        periodYear: currentYear,
        periodMonth: currentMonth,
        usedCount: 4,
      });

      await SystemRulesService.assertLeaveQuotaAvailable(teacher.id, "en", tx);

      await tx
        .update(leaveQuotaUsage)
        .set({ usedCount: 5 })
        .where(
          and(
            eq(leaveQuotaUsage.teacherId, teacher.id),
            eq(leaveQuotaUsage.periodYear, currentYear),
            eq(leaveQuotaUsage.periodMonth, currentMonth)
          )
        );

      let errorThrown: unknown = null;
      try {
        await SystemRulesService.assertLeaveQuotaAvailable(teacher.id, "en", tx);
      } catch (error) {
        errorThrown = error;
      }
      expect(errorThrown).not.toBeNull();
      expect((errorThrown as Error).message).toContain("quota");
    });
    testLogger.info("assertLeaveQuotaAvailable respects custom max_leaves.");
  });

  test("passes when usage exists for a different period", async () => {
    testLogger.info("Testing assertLeaveQuotaAvailable with different period...");
    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx);
      const differentMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const differentYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      await tx.insert(leaveQuotaUsage).values({
        teacherId: teacher.id,
        periodYear: differentYear,
        periodMonth: differentMonth,
        usedCount: 2,
      });

      await SystemRulesService.assertLeaveQuotaAvailable(teacher.id, "en", tx);
    });
    testLogger.info("assertLeaveQuotaAvailable passes with different period.");
  });
});
