import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import type { ParentEntity, StudentEntity, TeacherEntity, UserEntity } from "../../types";
import { db } from "../drizzleDb";
import { classInstances, parents, students, teachers, users } from "../schema";

describe("Class Instances Overlap Prevention", () => {
  let parentUser: UserEntity | null = null;
  let teacherUser1: UserEntity | null = null;
  let teacherUser2: UserEntity | null = null;
  let testParent: ParentEntity | null = null;
  let testTeacher1: TeacherEntity | null = null;
  let testTeacher2: TeacherEntity | null = null;
  let testStudent1: StudentEntity | null = null;
  let testStudent2: StudentEntity | null = null;

  beforeAll(async () => {
    testLogger.info("Setting up data for class instances overlap tests...");
    const now = new Date();

    const parentEmail = `parent-overlap-${randomUUID()}@example.com`;
    [parentUser] = await db
      .insert(users)
      .values({ name: "Overlap Parent", email: parentEmail, password: "pw", createdAt: now, updatedAt: now })
      .returning();
    [testParent] = await db
      .insert(parents)
      .values({ userId: parentUser.id, status: "REGULAR", createdAt: now, updatedAt: now })
      .returning();

    const teacherEmail1 = `teacher1-overlap-${randomUUID()}@example.com`;
    const teacherEmail2 = `teacher2-overlap-${randomUUID()}@example.com`;
    [teacherUser1] = await db
      .insert(users)
      .values({ name: "Overlap Teacher 1", email: teacherEmail1, password: "pw", createdAt: now, updatedAt: now })
      .returning();
    [teacherUser2] = await db
      .insert(users)
      .values({ name: "Overlap Teacher 2", email: teacherEmail2, password: "pw", createdAt: now, updatedAt: now })
      .returning();

    [testTeacher1] = await db
      .insert(teachers)
      .values({ userId: teacherUser1.id, status: "ACTIVATED", timezone: "UTC", createdAt: now, updatedAt: now })
      .returning();
    [testTeacher2] = await db
      .insert(teachers)
      .values({ userId: teacherUser2.id, status: "ACTIVATED", timezone: "UTC", createdAt: now, updatedAt: now })
      .returning();

    [testStudent1] = await db
      .insert(students)
      .values({
        parentId: testParent.id,
        primaryTeacherId: testTeacher1.id,
        name: "Overlap Student 1",
        status: "REGULAR",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    [testStudent2] = await db
      .insert(students)
      .values({
        parentId: testParent.id,
        primaryTeacherId: testTeacher1.id,
        name: "Overlap Student 2",
        status: "REGULAR",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    testLogger.info("Setup complete.");
  });

  afterAll(async () => {
    testLogger.info("Cleaning up overlap test records...");
    try {
      // Soft delete class instances
      if (testStudent1) await db.delete(classInstances).where(sql`student_id = ${testStudent1.id}`);
      if (testStudent2) await db.delete(classInstances).where(sql`student_id = ${testStudent2.id}`);

      // Note: We skip hard-deleting students, teachers, and users here because
      // the soft-deleted class_instances still reference them via ON DELETE RESTRICT foreign keys.
      // Since test data uses unique UUIDs, leaving them in the test DB is safe.
      testLogger.info("Cleanup successful.");
    } catch (error) {
      testLogger.error("Error during cleanup:", error);
    }
  });

  test("Allows non-overlapping instances", async () => {
    if (!testStudent1 || !testTeacher1) throw new Error("Not initialized");
    const now = new Date();

    await db.insert(classInstances).values({
      studentId: testStudent1.id,
      teacherId: testTeacher1.id,
      scheduledStartAt: new Date("2026-06-10T10:00:00Z"),
      scheduledEndAt: new Date("2026-06-10T11:00:00Z"),
      durationMinutes: 60,
      classType: "REGULAR",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(classInstances).values({
      studentId: testStudent1.id,
      teacherId: testTeacher1.id,
      scheduledStartAt: new Date("2026-06-10T11:00:00Z"),
      scheduledEndAt: new Date("2026-06-10T12:00:00Z"),
      durationMinutes: 60,
      classType: "REGULAR",
      createdAt: now,
      updatedAt: now,
    });

    testLogger.info("Non-overlapping instances inserted successfully.");
  });

  test("Prevents teacher overlap", async () => {
    if (!testStudent2 || !testTeacher1) throw new Error("Not initialized");
    const now = new Date();

    try {
      await db
        .insert(classInstances)
        .values({
          studentId: testStudent2.id,
          teacherId: testTeacher1.id,
          scheduledStartAt: new Date("2026-06-10T10:30:00Z"),
          scheduledEndAt: new Date("2026-06-10T11:30:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      expect(true).toBe(false);
    } catch (error) {
      const err = error as Error & { cause?: { message?: string } };
      const message = err.cause?.message || err.message || "";
      expect(message).toContain("Teacher is already booked for this time period");
    }
    testLogger.info("Teacher overlap prevented.");
  });

  test("Prevents student overlap", async () => {
    if (!testStudent1 || !testTeacher2) throw new Error("Not initialized");
    const now = new Date();

    try {
      await db
        .insert(classInstances)
        .values({
          studentId: testStudent1.id,
          teacherId: testTeacher2.id,
          scheduledStartAt: new Date("2026-06-10T09:30:00Z"),
          scheduledEndAt: new Date("2026-06-10T10:30:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      expect(true).toBe(false);
    } catch (error) {
      const err = error as Error & { cause?: { message?: string } };
      const message = err.cause?.message || err.message || "";
      expect(message).toContain("Student is already booked for this time period");
    }
    testLogger.info("Student overlap prevented.");
  });

  test("Prevents Zoom URL overlap", async () => {
    if (!testStudent2 || !testTeacher2 || !testStudent1 || !testTeacher1) throw new Error("Not initialized");
    const now = new Date();
    const zoomUrl = `https://zoom.us/j/${randomUUID()}`;

    await db.insert(classInstances).values({
      studentId: testStudent2.id,
      teacherId: testTeacher2.id,
      scheduledStartAt: new Date("2026-06-10T13:00:00Z"),
      scheduledEndAt: new Date("2026-06-10T14:00:00Z"),
      durationMinutes: 60,
      classType: "REGULAR",
      zoomMeetingUrl: zoomUrl,
      createdAt: now,
      updatedAt: now,
    });

    try {
      await db
        .insert(classInstances)
        .values({
          studentId: testStudent1.id,
          teacherId: testTeacher1.id,
          scheduledStartAt: new Date("2026-06-10T13:30:00Z"),
          scheduledEndAt: new Date("2026-06-10T14:30:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          zoomMeetingUrl: zoomUrl,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      expect(true).toBe(false);
    } catch (error) {
      const err = error as Error & { cause?: { message?: string } };
      const message = err.cause?.message || err.message || "";
      expect(message).toContain("Zoom meeting URL is already in use for this time period");
    }
    testLogger.info("Zoom URL overlap prevented.");
  });

  test("Allows overlapping with a soft-deleted instance", async () => {
    if (!testStudent2 || !testTeacher2) throw new Error("Not initialized");
    const now = new Date();

    const [instance] = await db
      .insert(classInstances)
      .values({
        studentId: testStudent2.id,
        teacherId: testTeacher2.id,
        scheduledStartAt: new Date("2026-06-11T10:00:00Z"),
        scheduledEndAt: new Date("2026-06-11T11:00:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await db.delete(classInstances).where(sql`id = ${instance.id}`);

    await db.insert(classInstances).values({
      studentId: testStudent2.id,
      teacherId: testTeacher2.id,
      scheduledStartAt: new Date("2026-06-11T10:00:00Z"),
      scheduledEndAt: new Date("2026-06-11T11:00:00Z"),
      durationMinutes: 60,
      classType: "REGULAR",
      createdAt: now,
      updatedAt: now,
    });

    testLogger.info("Overlap with soft-deleted instance allowed.");
  });
});
