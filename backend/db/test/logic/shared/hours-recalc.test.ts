import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { SoftDeleteRepository } from "@/backend/db/repo/shared";
import { recurringScheduleDays, recurringSchedules } from "@/backend/db/schema";
import { ensureTestSubjectId, setupStudent, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { DBTransaction } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { testLogger } from "@/shared/lib/logger/testlogger";

describe("hoursPerWeek Recalculation Triggers", () => {
  async function verifyStudentHours(tx: DBTransaction, studentId: string, expected: number): Promise<void> {
    const result = await tx.execute<{ hours_per_week: string | number }>(
      sql`SELECT id, hours_per_week FROM students WHERE id = ${studentId}`
    );
    const rows = (result as unknown as { rows?: unknown[] }).rows;
    const row = Array.isArray(rows) ? (rows[0] as { hours_per_week: string | number }) : null;
    if (!row) throw new Error("Student not found");
    expect(Number(row.hours_per_week)).toBe(expected);
  }

  test("hoursPerWeek recalculation across schedule insert, day activation, deactivation, duration update, deletion, and soft delete", async () => {
    await runInRollback(async tx => {
      // 1. Create Teacher first (recurringSchedules.teacherId is NOT NULL)
      const { teacher } = await setupTeacher(tx, {
        name: "Recalculation Teacher",
        email: `teacher-${randomUUID()}@example.com`,
      });

      // 2. Create Parent + Student (primaryTeacherId linked to teacher for schedule FK)
      const { student } = await setupStudent(
        tx,
        { email: `student-user-${randomUUID()}@example.com`, name: "Recalculation Student User" },
        {},
        { name: "Recalculation Student", primaryTeacherId: teacher.id }
      );

      // 3. Ensure subject exists
      const subjectId = await ensureTestSubjectId(tx);
      const now = new Date();

      // 4. Initial state: student starts with 0 hours
      await verifyStudentHours(tx, student.id, 0);
      testLogger.info("Verified initial student hoursPerWeek = 0.00");

      // 5. Create schedule with 60 minutes (no days active yet)
      await tx.insert(recurringSchedules).values({
        studentId: student.id,
        teacherId: teacher.id,
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
        .where(sql`student_id = ${student.id}`);
      expect(scheduleRows).toHaveLength(1);
      const scheduleId = scheduleRows[0].id;

      await verifyStudentHours(tx, student.id, 0);
      testLogger.info("Verified hoursPerWeek = 0 after schedule insert with no days.");

      // 6. Add MONDAY and WEDNESDAY active schedule days
      const [dayMonday] = await tx
        .insert(recurringScheduleDays)
        .values({
          recurringScheduleId: scheduleId,
          dayOfWeek: "MONDAY",
          startTime: "10:00:00",
          isActive: true,
        })
        .returning();

      const [dayWednesday] = await tx
        .insert(recurringScheduleDays)
        .values({
          recurringScheduleId: scheduleId,
          dayOfWeek: "WEDNESDAY",
          startTime: "12:00:00",
          isActive: true,
        })
        .returning();

      await verifyStudentHours(tx, student.id, 2);
      testLogger.info("Verified hoursPerWeek = 2.00 after inserting two active days.");

      // 7. Deactivate WEDNESDAY
      await tx.update(recurringScheduleDays).set({ isActive: false }).where(sql`id = ${dayWednesday.id}`);
      await verifyStudentHours(tx, student.id, 1);
      testLogger.info("Verified hoursPerWeek = 1.00 after deactivating WEDNESDAY.");

      // 8. Update schedule duration to 45 minutes
      await tx.update(recurringSchedules).set({ durationMinutes: 45 }).where(sql`id = ${scheduleId}`);
      await verifyStudentHours(tx, student.id, 0.75);
      testLogger.info("Verified hoursPerWeek = 0.75 after duration update.");

      // 9. Delete the active day (MONDAY)
      await tx.delete(recurringScheduleDays).where(sql`id = ${dayMonday.id}`);
      await verifyStudentHours(tx, student.id, 0);
      testLogger.info("Verified hoursPerWeek = 0.00 after deleting all active days.");

      // 10. Re-add active days for soft delete test
      await tx.insert(recurringScheduleDays).values({
        recurringScheduleId: scheduleId,
        dayOfWeek: "MONDAY",
        startTime: "10:00:00",
        isActive: true,
      });
      await tx.update(recurringScheduleDays).set({ isActive: true }).where(sql`id = ${dayWednesday.id}`);

      await verifyStudentHours(tx, student.id, 1.5);
      testLogger.info("Verified hoursPerWeek = 1.50 after re-adding active days.");

      // 11. Soft-delete the recurring schedule via repository (passing tx)
      await SoftDeleteRepository.softDeleteRecurringSchedule(scheduleId, null, tx);

      await verifyStudentHours(tx, student.id, 0);
      testLogger.info("Verified hoursPerWeek = 0.00 after soft-deleting the schedule.");
    });
  });
});
