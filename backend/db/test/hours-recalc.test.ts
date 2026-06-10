import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import type { ParentEntity, StudentEntity, TeacherEntity, UserEntity } from "../../types";
import { db } from "../drizzleDb";
import { SoftDeleteRepository } from "../repo";
import { parents, recurringScheduleDays, recurringSchedules, students, teachers, users } from "../schema";

describe("hoursPerWeek Recalculation Triggers", () => {
  let parentUser: UserEntity | null = null;
  let teacherUser: UserEntity | null = null;
  let testParent: ParentEntity | null = null;
  let testTeacher: TeacherEntity | null = null;
  let testStudent: StudentEntity | null = null;

  beforeAll(async () => {
    testLogger.info("Setting up parent, teacher, and student for hoursPerWeek recalculation tests...");
    const now = new Date();

    // 1. Create Parent User & Parent
    const parentEmail = `parent-user-${randomUUID()}@example.com`;
    [parentUser] = await db
      .insert(users)
      .values({
        name: "Recalculation Parent",
        email: parentEmail,
        password: "securePassword",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    [testParent] = await db
      .insert(parents)
      .values({
        userId: parentUser.id,
        status: "REGULAR",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // 2. Create Teacher User & Teacher
    const teacherEmail = `teacher-user-${randomUUID()}@example.com`;
    [teacherUser] = await db
      .insert(users)
      .values({
        name: "Recalculation Teacher",
        email: teacherEmail,
        password: "securePassword",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    [testTeacher] = await db
      .insert(teachers)
      .values({
        userId: teacherUser.id,
        status: "ACTIVATED",
        timezone: "UTC",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // 3. Create Student
    [testStudent] = await db
      .insert(students)
      .values({
        parentId: testParent.id,
        primaryTeacherId: testTeacher.id,
        name: "Recalculation Student",
        status: "REGULAR",
        idempotencyKey: randomUUID(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    testLogger.info(`Setup complete. Student ID: ${testStudent.id}`);
  });

  afterAll(async () => {
    testLogger.info("Cleaning up hoursPerWeek recalculation test records...");
    try {
      if (testStudent) {
        await db.delete(recurringScheduleDays);
        await db.delete(recurringSchedules).where(sql`student_id = ${testStudent.id}`);
        await db.delete(students).where(sql`id = ${testStudent.id}`);
      }
      if (testParent) {
        await db.delete(parents).where(sql`id = ${testParent.id}`);
      }
      if (testTeacher) {
        await db.delete(teachers).where(sql`id = ${testTeacher.id}`);
      }
      if (parentUser) {
        await db.delete(users).where(sql`id = ${parentUser.id}`);
      }
      if (teacherUser) {
        await db.delete(users).where(sql`id = ${teacherUser.id}`);
      }
      testLogger.info("Hours recalculation test records cleaned up successfully.");
    } catch (error) {
      testLogger.error("Error during cleanup:", error);
    }
  });

  test("Recalculation flows correctly from schedule insert, days insert, deactivation, duration update, day deletion, and soft delete", async () => {
    if (!testStudent || !testTeacher) {
      throw new Error("testStudent or testTeacher is not initialized");
    }
    const now = new Date();

    // 1. Initial State: Check that student starts with 0 hours per week
    const [initialStudent] = await db
      .select()
      .from(students)
      .where(sql`id = ${testStudent.id}`);
    expect(Number(initialStudent.hoursPerWeek)).toBe(0);
    testLogger.info("Verified initial student hoursPerWeek = 0.00");

    // 2. Schedule Insert: Create schedule with 60 minutes duration (no days active yet)
    testLogger.info("Inserting recurring schedule for student...");
    const [schedule] = await db
      .insert(recurringSchedules)
      .values({
        studentId: testStudent.id,
        teacherId: testTeacher.id,
        durationMinutes: 60,
        defaultStartTime: "10:00:00",
        timezone: "UTC",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Verify hoursPerWeek is still 0
    const [studentAfterSchedule] = await db
      .select()
      .from(students)
      .where(sql`id = ${testStudent.id}`);
    expect(Number(studentAfterSchedule.hoursPerWeek)).toBe(0);
    testLogger.info("Verified hoursPerWeek is 0 after schedule insert with no days.");

    // 3. Active Days Insert: Add MONDAY and WEDNESDAY active schedule days
    testLogger.info("Inserting active schedule days MONDAY and WEDNESDAY (60 mins each)...");
    const [dayMonday] = await db
      .insert(recurringScheduleDays)
      .values({
        recurringScheduleId: schedule.id,
        dayOfWeek: "MONDAY",
        startTime: "10:00:00",
        isActive: true,
      })
      .returning();

    const [dayWednesday] = await db
      .insert(recurringScheduleDays)
      .values({
        recurringScheduleId: schedule.id,
        dayOfWeek: "WEDNESDAY",
        startTime: "12:00:00",
        isActive: true,
      })
      .returning();

    // Verify hoursPerWeek = (60 * 2) / 60.0 = 2.00
    const [studentAfterDays] = await db
      .select()
      .from(students)
      .where(sql`id = ${testStudent.id}`);
    expect(Number(studentAfterDays.hoursPerWeek)).toBe(2);
    testLogger.info("Verified hoursPerWeek = 2.00 after inserting two active days.");

    // 4. Day Deactivation: Set WEDNESDAY isActive = false
    testLogger.info("Deactivating WEDNESDAY schedule day...");
    await db
      .update(recurringScheduleDays)
      .set({ isActive: false })
      .where(sql`id = ${dayWednesday.id}`);

    // Verify hoursPerWeek = (60 * 1) / 60.0 = 1.00
    const [studentAfterDeactivate] = await db
      .select()
      .from(students)
      .where(sql`id = ${testStudent.id}`);
    expect(Number(studentAfterDeactivate.hoursPerWeek)).toBe(1);
    testLogger.info("Verified hoursPerWeek = 1.00 after deactivating WEDNESDAY.");

    // 5. Duration Update: Update schedule duration to 45 minutes
    testLogger.info("Updating schedule duration to 45 minutes...");
    await db
      .update(recurringSchedules)
      .set({ durationMinutes: 45 })
      .where(sql`id = ${schedule.id}`);

    // Verify hoursPerWeek = (45 * 1) / 60.0 = 0.75
    const [studentAfterDurationUpdate] = await db
      .select()
      .from(students)
      .where(sql`id = ${testStudent.id}`);
    expect(Number(studentAfterDurationUpdate.hoursPerWeek)).toBe(0.75);
    testLogger.info("Verified hoursPerWeek = 0.75 after duration update.");

    // 6. Day Deletion: Delete the active day (MONDAY)
    testLogger.info("Deleting MONDAY schedule day...");
    await db.delete(recurringScheduleDays).where(sql`id = ${dayMonday.id}`);

    // Verify hoursPerWeek = 0.00
    const [studentAfterDeleteDay] = await db
      .select()
      .from(students)
      .where(sql`id = ${testStudent.id}`);
    expect(Number(studentAfterDeleteDay.hoursPerWeek)).toBe(0);
    testLogger.info("Verified hoursPerWeek = 0.00 after deleting all active days.");

    // Reactivate WEDNESDAY and insert MONDAY again to verify soft-delete recalculation
    testLogger.info("Re-adding active schedule days for soft delete test...");
    await db.insert(recurringScheduleDays).values({
      recurringScheduleId: schedule.id,
      dayOfWeek: "MONDAY",
      startTime: "10:00:00",
      isActive: true,
    });
    await db
      .update(recurringScheduleDays)
      .set({ isActive: true })
      .where(sql`id = ${dayWednesday.id}`);

    // Verify hoursPerWeek = (45 * 2) / 60.0 = 1.50
    const [studentBeforeSoftDelete] = await db
      .select()
      .from(students)
      .where(sql`id = ${testStudent.id}`);
    expect(Number(studentBeforeSoftDelete.hoursPerWeek)).toBe(1.5);

    // 7. Schedule Soft Delete via repository (no SECURITY DEFINER trigger)
    testLogger.info("Soft-deleting recurring schedule...");
    await SoftDeleteRepository.softDeleteRecurringSchedule(schedule.id);

    // Verify hoursPerWeek = 0.00 (since schedule is soft-deleted, rs.deleted_at IS NULL condition excludes it)
    const [studentAfterSoftDelete] = await db
      .select()
      .from(students)
      .where(sql`id = ${testStudent.id}`);
    expect(Number(studentAfterSoftDelete.hoursPerWeek)).toBe(0);
    testLogger.info("Verified hoursPerWeek = 0.00 after soft-deleting the schedule.");
  });
});
