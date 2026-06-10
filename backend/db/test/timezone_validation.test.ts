import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { testLogger } from "../../../lib/testlogger";
import type { ParentEntity, RecurringScheduleEntity, StudentEntity, TeacherEntity, UserEntity } from "../../types";
import { db } from "../drizzleDb";
import { parents, recurringSchedules, students, teachers, users } from "../schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function runInRollback(fn: (tx: DbTransaction) => Promise<void>): Promise<void> {
  let assertionError: unknown = null;
  try {
    await db.transaction(async tx => {
      try {
        await fn(tx);
      } catch (error) {
        assertionError = error;
      }
      tx.rollback();
    });
  } catch {
    // Ignore expected Drizzle transaction rollback error
  }
  if (assertionError) {
    throw assertionError;
  }
}

describe("Timezone Validation Constraints", () => {
  test("Allows valid timezones for teachers", async () => {
    testLogger.info("Testing valid timezones for teachers...");
    await runInRollback(async tx => {
      const now = new Date();
      const email = `teacher-tz-${randomUUID()}@example.com`;
      const [user] = (await tx
        .insert(users)
        .values({
          name: "Valid Teacher User",
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
          timezone: "America/New_York",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      expect(teacher).toBeDefined();
      expect(teacher.timezone).toBe("America/New_York");
    });
    testLogger.info("Valid teacher timezone test passed.");
  });

  test("Prevents invalid timezones for teachers", async () => {
    testLogger.info("Testing invalid timezones for teachers...");
    await runInRollback(async tx => {
      const now = new Date();
      const email = `teacher-tz-inv-${randomUUID()}@example.com`;
      const [user] = (await tx
        .insert(users)
        .values({
          name: "Invalid Teacher User",
          email,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      try {
        await tx
          .insert(teachers)
          .values({
            userId: user.id,
            status: "ACTIVATED",
            timezone: "Invalid/Timezone_Name",
            createdAt: now,
            updatedAt: now,
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
      const now = new Date();
      const parentEmail = `parent-tz-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-tz-sch-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Schedule Parent User",
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

      const [teacherUser] = (await tx
        .insert(users)
        .values({
          name: "Schedule Teacher User",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher] = (await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      const [student] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Schedule Student",
          status: "REGULAR",
          idempotencyKey: randomUUID(),
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      const [schedule] = (await tx
        .insert(recurringSchedules)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          durationMinutes: 60,
          defaultStartTime: "09:00:00",
          timezone: "Europe/London",
          createdAt: now,
          updatedAt: now,
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
      const now = new Date();
      const parentEmail = `parent-tz-inv-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-tz-sch-inv-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Schedule Parent User",
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

      const [teacherUser] = (await tx
        .insert(users)
        .values({
          name: "Schedule Teacher User",
          email: teacherEmail,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher] = (await tx
        .insert(teachers)
        .values({
          userId: teacherUser.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      const [student] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Schedule Student",
          status: "REGULAR",
          idempotencyKey: randomUUID(),
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [StudentEntity];

      try {
        await tx
          .insert(recurringSchedules)
          .values({
            studentId: student.id,
            teacherId: teacher.id,
            durationMinutes: 60,
            defaultStartTime: "09:00:00",
            timezone: "NotATimezone",
            createdAt: now,
            updatedAt: now,
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
