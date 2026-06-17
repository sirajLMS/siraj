import { describe, expect, test } from "bun:test";
import { testLogger } from "@/shared/lib/testlogger";
import type { RecurringScheduleEntity } from "../../../types";
import { recurringSchedules, teachers } from "../../schema";
import { setupStudent, setupTeacher } from "../entity-setup";
import { runInRollback } from "../test-utils";

describe("Timezone Validation Constraints", () => {
  test("Allows valid timezones for teachers", async () => {
    testLogger.info("Testing valid timezones for teachers...");
    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx, { name: "Valid Teacher User" }, { timezone: "America/New_York" });

      expect(teacher).toBeDefined();
      expect(teacher.timezone).toBe("America/New_York");
    });
    testLogger.info("Valid teacher timezone test passed.");
  });

  test("Prevents invalid timezones for teachers", async () => {
    testLogger.info("Testing invalid timezones for teachers...");
    await runInRollback(async tx => {
      const { user } = await setupTeacher(tx, { name: "Invalid Teacher User" });

      try {
        await tx
          .insert(teachers)
          .values({
            userId: user.id,
            status: "ACTIVATED",
            timezone: "Invalid/Timezone_Name",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .execute();
        expect(true).toBe(false); // Should not be reached
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toMatch(/teachers_timezone_chk|time zone .* not recognized/);
      }
    });
    testLogger.info("Invalid teacher timezone test passed.");
  });

  test("Allows valid timezones for recurring schedules", async () => {
    testLogger.info("Testing valid timezones for recurring schedules...");
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, { name: "Schedule Parent User" }, {}, { name: "Schedule Student" });
      const { teacher } = await setupTeacher(tx, { name: "Schedule Teacher User" });

      const [schedule] = (await tx
        .insert(recurringSchedules)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          durationMinutes: 60,
          defaultStartTime: "09:00:00",
          timezone: "Europe/London",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()) as [RecurringScheduleEntity];

      expect(schedule).toBeDefined();
      expect(schedule.timezone).toBe("Europe/London");
    });
    testLogger.info("Valid recurring schedule timezone test passed.");
  });

  test("Prevents invalid timezones for recurring schedules", async () => {
    testLogger.info("Testing invalid timezones for recurring schedules...");
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, { name: "Schedule Parent User" }, {}, { name: "Schedule Student" });
      const { teacher } = await setupTeacher(tx, { name: "Schedule Teacher User" });

      try {
        await tx
          .insert(recurringSchedules)
          .values({
            studentId: student.id,
            teacherId: teacher.id,
            durationMinutes: 60,
            defaultStartTime: "09:00:00",
            timezone: "NotATimezone",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .execute();
        expect(true).toBe(false); // Should not be reached
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toMatch(/recurring_schedules_timezone_chk|time zone .* not recognized/);
      }
    });
    testLogger.info("Invalid recurring schedule timezone test passed.");
  });
});
