import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { recurringSchedules, users } from "@/backend/db/schema";
import { ensureTestSubjectId, setupStudent, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { testLogger } from "@/shared/lib/logger/testlogger";

interface ErrorWithCause extends Error {
  cause?: { message?: string };
}

function isErrorWithCause(value: unknown): value is ErrorWithCause {
  return value instanceof Error;
}

/**
 * Runs an operation expected to violate a database constraint and asserts an error is thrown.
 * Returns the caught error so the caller can assert on its message.
 */
async function expectConstraintError(insertFn: () => Promise<unknown>): Promise<ErrorWithCause> {
  let errorCaught: unknown = null;
  try {
    await insertFn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  if (isErrorWithCause(errorCaught)) {
    return errorCaught;
  }
  throw new Error(String(errorCaught));
}

describe("Timezone Validation Constraints", () => {
  test("Allows valid timezones for users", async () => {
    testLogger.info("Testing valid timezones for users...");
    await runInRollback(async tx => {
      const { user } = await setupTeacher(tx, { name: "Valid Teacher User", timezone: IanaTimezone.America_New_York });

      expect(user).toBeDefined();
      expect(user.timezone).toBe(IanaTimezone.America_New_York);
    });
    testLogger.info("Valid user timezone test passed.");
  });

  test("Prevents invalid timezones for users", async () => {
    testLogger.info("Testing invalid timezones for users...");
    await runInRollback(async tx => {
      const error = await expectConstraintError(() =>
        tx
          .insert(users)
          .values({
            name: "Invalid Timezone User",
            email: `invalid-tz-${randomUUID()}@example.com`,
            password: "password",
            timezone: "Invalid/Timezone_Name",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .execute()
      );
      const message = error.cause?.message || error.message || "";
      expect(message).toMatch(/users_timezone_chk|time zone .* not recognized/);
    });
    testLogger.info("Invalid user timezone test passed.");
  });

  test("Allows valid timezones for recurring schedules", async () => {
    testLogger.info("Testing valid timezones for recurring schedules...");
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, { name: "Schedule Parent User" }, {}, { name: "Schedule Student" });
      const { teacher } = await setupTeacher(tx, { name: "Schedule Teacher User" });

      const [schedule] = await tx
        .insert(recurringSchedules)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          subjectId: await ensureTestSubjectId(tx),
          durationMinutes: 60,
          defaultStartTime: "09:00:00",
          timezone: IanaTimezone.Europe_London,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      expect(schedule).toBeDefined();
      expect(schedule.timezone).toBe(IanaTimezone.Europe_London);
    });
    testLogger.info("Valid recurring schedule timezone test passed.");
  });

  test("Prevents invalid timezones for recurring schedules", async () => {
    testLogger.info("Testing invalid timezones for recurring schedules...");
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, { name: "Schedule Parent User" }, {}, { name: "Schedule Student" });
      const { teacher } = await setupTeacher(tx, { name: "Schedule Teacher User" });

      const subjectId = await ensureTestSubjectId(tx);
      const error = await expectConstraintError(() =>
        tx
          .insert(recurringSchedules)
          .values({
            studentId: student.id,
            teacherId: teacher.id,
            subjectId,
            durationMinutes: 60,
            defaultStartTime: "09:00:00",
            timezone: "NotATimezone",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .execute()
      );
      const message = error.cause?.message || error.message || "";
      expect(message).toMatch(/recurring_schedules_timezone_chk|time zone .* not recognized/);
    });
    testLogger.info("Invalid recurring schedule timezone test passed.");
  });
});
