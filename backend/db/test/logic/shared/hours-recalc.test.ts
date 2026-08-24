import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { isSqlite } from "@/backend/db";
import { SoftDeleteRepository } from "@/backend/db/repo/shared";
import { recurringScheduleDays, recurringSchedules, students } from "@/backend/db/schema";
import { ensureTestSubjectId, setupStudent, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { DBTransaction } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { testLogger } from "@/shared/lib/logger/testlogger";

async function verifyStudentHours(tx: DBTransaction, studentId: string, expected: number): Promise<void> {
  const [row] = await tx
    .select({ hoursPerWeek: students.hoursPerWeek })
    .from(students)
    .where(eq(students.id, studentId));
  if (!row) throw new Error("Student not found");
  expect(Number(row.hoursPerWeek)).toBe(expected);
}

async function setupRecalcTestEntities(tx: DBTransaction): Promise<{ studentId: string; teacherId: string }> {
  const { teacher } = await setupTeacher(tx, {
    name: "Recalculation Teacher",
    email: `teacher-${randomUUID()}@example.com`,
  });

  const { student } = await setupStudent(
    tx,
    { email: `student-user-${randomUUID()}@example.com`, name: "Recalculation Student User" },
    {},
    { name: "Recalculation Student", primaryTeacherId: teacher.id }
  );

  return { studentId: student.id, teacherId: teacher.id };
}

async function createSchedule(
  tx: DBTransaction,
  studentId: string,
  teacherId: string,
  subjectId: string
): Promise<string> {
  const now = new Date();
  await tx.insert(recurringSchedules).values({
    studentId,
    teacherId,
    subjectId,
    durationMinutes: 60,
    defaultStartTime: "10:00:00",
    timezone: IanaTimezone.UTC,
    createdAt: now,
    updatedAt: now,
  });

  const scheduleRows = await tx
    .select({ id: recurringSchedules.id })
    .from(recurringSchedules)
    .where(sql`student_id = ${studentId}`);
  expect(scheduleRows).toHaveLength(1);
  return scheduleRows[0].id;
}

async function insertActiveDay(
  tx: DBTransaction,
  scheduleId: string,
  dayOfWeek: string,
  startTime: string
): Promise<string> {
  const [day] = await tx
    .insert(recurringScheduleDays)
    .values({ recurringScheduleId: scheduleId, dayOfWeek, startTime, isActive: true })
    .returning();
  return day.id;
}

describe.skipIf(isSqlite())("hoursPerWeek Recalculation Triggers", () => {
  test("hoursPerWeek recalculation across schedule insert, day activation, deactivation, duration update, deletion, and soft delete", async () => {
    await runInRollback(async tx => {
      const { studentId, teacherId } = await setupRecalcTestEntities(tx);
      const subjectId = await ensureTestSubjectId(tx);

      // 1. Initial state: student starts with 0 hours
      await verifyStudentHours(tx, studentId, 0);
      testLogger.info("Verified initial student hoursPerWeek = 0.00");

      // 2. Create schedule with 60 minutes (no days active yet)
      const scheduleId = await createSchedule(tx, studentId, teacherId, subjectId);
      await verifyStudentHours(tx, studentId, 0);
      testLogger.info("Verified hoursPerWeek = 0 after schedule insert with no days.");

      // 3. Add MONDAY and WEDNESDAY active schedule days
      const dayMondayId = await insertActiveDay(tx, scheduleId, "MONDAY", "10:00:00");
      const dayWednesdayId = await insertActiveDay(tx, scheduleId, "WEDNESDAY", "12:00:00");
      await verifyStudentHours(tx, studentId, 2);
      testLogger.info("Verified hoursPerWeek = 2.00 after inserting two active days.");

      // 4. Deactivate WEDNESDAY
      await tx.update(recurringScheduleDays).set({ isActive: false }).where(sql`id = ${dayWednesdayId}`);
      await verifyStudentHours(tx, studentId, 1);
      testLogger.info("Verified hoursPerWeek = 1.00 after deactivating WEDNESDAY.");

      // 5. Update schedule duration to 45 minutes
      await tx.update(recurringSchedules).set({ durationMinutes: 45 }).where(sql`id = ${scheduleId}`);
      await verifyStudentHours(tx, studentId, 0.75);
      testLogger.info("Verified hoursPerWeek = 0.75 after duration update.");

      // 6. Delete the active day (MONDAY)
      await tx.delete(recurringScheduleDays).where(sql`id = ${dayMondayId}`);
      await verifyStudentHours(tx, studentId, 0);
      testLogger.info("Verified hoursPerWeek = 0.00 after deleting all active days.");

      // 7. Re-add active days for soft delete test
      await insertActiveDay(tx, scheduleId, "MONDAY", "10:00:00");
      await tx.update(recurringScheduleDays).set({ isActive: true }).where(sql`id = ${dayWednesdayId}`);
      await verifyStudentHours(tx, studentId, 1.5);
      testLogger.info("Verified hoursPerWeek = 1.50 after re-adding active days.");

      // 8. Soft-delete the recurring schedule via repository (passing tx)
      await SoftDeleteRepository.softDeleteRecurringSchedule(scheduleId, null, tx);
      await verifyStudentHours(tx, studentId, 0);
      testLogger.info("Verified hoursPerWeek = 0.00 after soft-deleting the schedule.");
    });
  });
});
