import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { SoftDeleteRepository } from "@/backend/db/repo";
import { parents, recurringScheduleDays, recurringSchedules, students, teachers, users } from "@/backend/db/schema";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type { ParentEntity, StudentEntity, TeacherEntity } from "@/backend/types";
import type { UserReturnType } from "@/backend/types/users/user.types";
import { testLogger } from "@/shared/lib/logger/testlogger";

describe("hoursPerWeek Recalculation Triggers", () => {
  let parentUser: Pick<UserReturnType, "id"> | null = null;
  let teacherUser: Pick<UserReturnType, "id"> | null = null;
  let testParent: ParentEntity | null = null;
  let testTeacher: TeacherEntity | null = null;
  let testStudent: StudentEntity | null = null;

  let scheduleId: string;
  let dayMondayId: string;
  let dayWednesdayId: string;

  async function verifyStudentHours(expected: number) {
    if (!testStudent || !testParent || !testTeacher) throw new Error("test entities not initialized");
    const [student] = await db.select().from(students).where(sql`id = ${testStudent.id}`);
    expect(Number(student.hoursPerWeek)).toBe(expected);
  }

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
        password: randomUUID(),
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
        password: randomUUID(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    [testTeacher] = await db
      .insert(teachers)
      .values({
        userId: teacherUser.id,
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

  test("Initial State: Check that student starts with 0 hours per week", async () => {
    await verifyStudentHours(0);
    testLogger.info("Verified initial student hoursPerWeek = 0.00");
  });

  test("Schedule Insert: Create schedule with 60 minutes duration (no days active yet)", async () => {
    if (!testStudent || !testParent || !testTeacher) throw new Error("test entities not initialized");
    const now = new Date();
    testLogger.info("Inserting recurring schedule for student...");
    const [schedule] = await db
      .insert(recurringSchedules)
      .values({
        studentId: testStudent.id,
        teacherId: testTeacher.id,
        durationMinutes: 60,
        defaultStartTime: "10:00:00",
        timezone: IanaTimezone.UTC,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    scheduleId = schedule.id;

    await verifyStudentHours(0);
    testLogger.info("Verified hoursPerWeek is 0 after schedule insert with no days.");
  });

  test("Active Days Insert: Add MONDAY and WEDNESDAY active schedule days", async () => {
    testLogger.info("Inserting active schedule days MONDAY and WEDNESDAY (60 mins each)...");
    const [dayMonday] = await db
      .insert(recurringScheduleDays)
      .values({
        recurringScheduleId: scheduleId,
        dayOfWeek: "MONDAY",
        startTime: "10:00:00",
        isActive: true,
      })
      .returning();
    dayMondayId = dayMonday.id;

    const [dayWednesday] = await db
      .insert(recurringScheduleDays)
      .values({
        recurringScheduleId: scheduleId,
        dayOfWeek: "WEDNESDAY",
        startTime: "12:00:00",
        isActive: true,
      })
      .returning();
    dayWednesdayId = dayWednesday.id;

    await verifyStudentHours(2);
    testLogger.info("Verified hoursPerWeek = 2.00 after inserting two active days.");
  });

  test("Day Deactivation: Set WEDNESDAY isActive = false", async () => {
    testLogger.info("Deactivating WEDNESDAY schedule day...");
    await db.update(recurringScheduleDays).set({ isActive: false }).where(sql`id = ${dayWednesdayId}`);

    await verifyStudentHours(1);
    testLogger.info("Verified hoursPerWeek = 1.00 after deactivating WEDNESDAY.");
  });

  test("Duration Update: Update schedule duration to 45 minutes", async () => {
    testLogger.info("Updating schedule duration to 45 minutes...");
    await db.update(recurringSchedules).set({ durationMinutes: 45 }).where(sql`id = ${scheduleId}`);

    await verifyStudentHours(0.75);
    testLogger.info("Verified hoursPerWeek = 0.75 after duration update.");
  });

  test("Day Deletion: Delete the active day (MONDAY)", async () => {
    testLogger.info("Deleting MONDAY schedule day...");
    await db.delete(recurringScheduleDays).where(sql`id = ${dayMondayId}`);

    await verifyStudentHours(0);
    testLogger.info("Verified hoursPerWeek = 0.00 after deleting all active days.");
  });

  test("Schedule Soft Delete via repository", async () => {
    testLogger.info("Re-adding active schedule days for soft delete test...");
    await db.insert(recurringScheduleDays).values({
      recurringScheduleId: scheduleId,
      dayOfWeek: "MONDAY",
      startTime: "10:00:00",
      isActive: true,
    });
    await db.update(recurringScheduleDays).set({ isActive: true }).where(sql`id = ${dayWednesdayId}`);

    await verifyStudentHours(1.5);

    testLogger.info("Soft-deleting recurring schedule...");
    await SoftDeleteRepository.softDeleteRecurringSchedule(scheduleId);

    await verifyStudentHours(0);
    testLogger.info("Verified hoursPerWeek = 0.00 after soft-deleting the schedule.");
  });
});
