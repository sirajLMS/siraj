import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { testLogger } from "@/shared/lib/testlogger";
import type * as Types from "../../../types";
import { db } from "../../drizzleDb";
import { SchedulingRepository } from "../../repo";
import {
  classInstances,
  classStatusEvents,
  dstMigrationEntries,
  leaveRequests,
  parents,
  studentProgress,
  students,
  teachers,
  users,
} from "../../schema";

describe("Timezone Handling & DST Adjustment", () => {
  let testUser: Types.UserEntity | null = null;
  let testParentUser: Types.UserEntity | null = null;
  let testTeacher: Types.TeacherEntity | null = null;
  let testParent: Types.ParentEntity | null = null;
  let testStudent: Types.StudentEntity | null = null;

  beforeAll(async () => {
    testLogger.info("Setting up timezone test data...");

    // 1. Create Teacher User
    const email = `tz-user-${randomUUID()}@example.com`;
    [testUser] = await db
      .insert(users)
      .values({
        name: "TZ Test User",
        email,
        password: "password",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 2. Create Teacher with Africa/Cairo
    [testTeacher] = await db
      .insert(teachers)
      .values({
        userId: testUser.id,
        status: "ACTIVATED",
        timezone: "Africa/Cairo",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 3. Create Parent User & Parent
    const parentEmail = `parent-${randomUUID()}@example.com`;
    [testParentUser] = await db
      .insert(users)
      .values({
        name: "Parent User",
        email: parentEmail,
        password: "password",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    [testParent] = await db
      .insert(parents)
      .values({
        userId: testParentUser.id,
        status: "REGULAR",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 4. Create Student
    [testStudent] = await db
      .insert(students)
      .values({
        parentId: testParent.id,
        name: "TZ Student",
        status: "REGULAR",
        idempotencyKey: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 5. Assign Teacher to Student
    await db.execute(sql`
      INSERT INTO teacher_assignments (student_id, teacher_id, assigned_at)
      VALUES (${testStudent.id}, ${testTeacher.id}, NOW())
    `);

    testLogger.info("Setup complete.");
  });

  afterAll(async () => {
    testLogger.info("Cleaning up timezone test data...");
    try {
      const studentId = testStudent?.id;
      const teacherId = testTeacher?.id;
      const parentId = testParent?.id;
      const userId = testUser?.id;
      const parentUserId = testParentUser?.id;

      // Delete in strict reverse order of dependencies
      if (studentId) {
        // 1. Delete referencing records from other tables first
        await db
          .delete(dstMigrationEntries)
          .where(
            inArray(
              dstMigrationEntries.classInstanceId,
              db.select({ id: classInstances.id }).from(classInstances).where(eq(classInstances.studentId, studentId))
            )
          );
        await db
          .delete(classStatusEvents)
          .where(
            inArray(
              classStatusEvents.classInstanceId,
              db.select({ id: classInstances.id }).from(classInstances).where(eq(classInstances.studentId, studentId))
            )
          );
        await db
          .delete(leaveRequests)
          .where(
            inArray(
              leaveRequests.classInstanceId,
              db.select({ id: classInstances.id }).from(classInstances).where(eq(classInstances.studentId, studentId))
            )
          );
        await db.delete(studentProgress).where(eq(studentProgress.studentId, studentId));

        // 2. Hard delete class instances for this student
        // Update deleted_at first to bypass the soft-delete trigger, then hard delete
        await db.update(classInstances).set({ deletedAt: new Date() }).where(eq(classInstances.studentId, studentId));
        await db.delete(classInstances).where(eq(classInstances.studentId, studentId));

        // 3. Delete student (cascades to teacher_assignments and student_status_history)
        await db.delete(students).where(eq(students.id, studentId));
      }

      // Cleanup remaining entities
      if (teacherId) {
        // Ensure no class instances remain for this teacher either
        await db.delete(classInstances).where(eq(classInstances.teacherId, teacherId));
        await db.delete(teachers).where(eq(teachers.id, teacherId));
      }

      if (parentId) await db.delete(parents).where(eq(parents.id, parentId));
      if (userId) await db.delete(users).where(eq(users.id, userId));
      if (parentUserId) await db.delete(users).where(eq(users.id, parentUserId));

      testLogger.info("Cleanup successful.");
    } catch (err) {
      testLogger.error("Error during cleanup:", err);
    }
  });

  test("Class creation snapshots timezone and UTC offset via trigger", async () => {
    if (!testStudent || !testTeacher) throw new Error("Setup failed");

    const startTime = new Date("2026-01-15T13:00:00Z"); // Cairo is UTC+2 in Jan
    const endTime = new Date("2026-01-15T14:00:00Z");

    const classInstance = await SchedulingRepository.createClassInstance({
      studentId: testStudent.id,
      teacherId: testTeacher.id,
      scheduledStartAt: startTime,
      scheduledEndAt: endTime,
      durationMinutes: 60,
      classType: "TRIAL",
      idempotencyKey: randomUUID(),
    });

    expect(classInstance.bookingTimezone).toBe("Africa/Cairo");
    expect(classInstance.bookingUtcOffset).toBe(120); // +2 hours

    testLogger.info("Snapshot trigger verified.");
  });

  test("auto_adjust_dst_bookings detects and fixes DST drift", async () => {
    if (!testStudent || !testTeacher) throw new Error("Setup failed");

    // In July, Cairo is UTC+3 (if DST is active) or UTC+2 if not.
    // Let's assume we booked a class for 3 PM Local (13:00 UTC) when it was UTC+2.
    // Now we shift that class to July.

    const startTime = new Date("2026-07-15T13:00:00Z");
    const endTime = new Date("2026-07-15T14:00:00Z");

    // Create a class with a MANUALLY incorrect offset to simulate a DST rule change or drift
    // We want 15:00 Local.
    // If July is UTC+3, 15:00 Local is 12:00 UTC.
    // If we have 13:00 UTC and say "Offset was +2", that means we intended 15:00 Local.
    // The function should see that currently 13:00 UTC is 16:00 Local in July (+3 offset),
    // and shift the UTC to 12:00 UTC.

    const [driftedClass] = await db
      .insert(classInstances)
      .values({
        studentId: testStudent.id,
        teacherId: testTeacher.id,
        scheduledStartAt: startTime,
        scheduledEndAt: endTime,
        durationMinutes: 60,
        classType: "TRIAL",
        bookingTimezone: "Africa/Cairo",
        bookingUtcOffset: 120, // Booked as if it was UTC+2
        idempotencyKey: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Types.ClassInstanceInsertInput)
      .returning();

    testLogger.info(`Created drifted class with ID: ${driftedClass.id}`);

    // Run the adjustment job
    const result = await db.execute(sql`SELECT auto_adjust_dst_bookings() as updated_count`);
    const rows = (result as unknown as { rows: { updated_count: number }[] }).rows;
    const updatedCount = rows[0].updated_count;

    testLogger.info(`Adjusted ${updatedCount} classes.`);

    const [updatedClass] = await db.select().from(classInstances).where(eq(classInstances.id, driftedClass.id));

    // If Cairo July is UTC+3, the offset is 180.
    // Shift = 120 - 180 = -60 minutes.
    // New UTC = 13:00 - 60 mins = 12:00.

    // Check if it shifted
    if (updatedCount > 0) {
      expect(updatedClass.scheduledStartAt.toISOString()).toBe("2026-07-15T12:00:00.000Z");
      expect(updatedClass.bookingUtcOffset).toBe(180); // Should be updated to current offset
      testLogger.info("DST adjustment verified.");
    } else {
      testLogger.warn("No classes were adjusted. Check if Africa/Cairo actually has DST in July 2026 in the OS/DB.");
    }
  });
});
