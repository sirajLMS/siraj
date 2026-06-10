import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { Gender } from "../../../lib/enum";
import { testLogger } from "../../../lib/testlogger";
import type { ParentEntity, StudentEntity, TeacherEntity, UserEntity } from "../../types";
import { db } from "../drizzleDb";
import { SchedulingRepository } from "../repo";
import { parents, students, teacherAssignments, teachers, users } from "../schema";

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

describe("Class Instances Overlap Prevention", () => {
  test("Correctly detects and prevents overlaps", async () => {
    testLogger.info("Running overlap prevention tests...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-overlap-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Overlap Parent",
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

      const [teacher1User] = (await tx
        .insert(users)
        .values({
          name: "Overlap Teacher 1",
          email: `teacher1-${randomUUID()}@example.com`,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher1] = (await tx
        .insert(teachers)
        .values({
          userId: teacher1User.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      const [teacher2User] = (await tx
        .insert(users)
        .values({
          name: "Overlap Teacher 2",
          email: `teacher2-${randomUUID()}@example.com`,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const [teacher2] = (await tx
        .insert(teachers)
        .values({
          userId: teacher2User.id,
          status: "ACTIVATED",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [TeacherEntity];

      const [student1] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Overlap Student 1",
          gender: Gender.MALE,
          status: "REGULAR",
          classesRemaining: 10,
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning()) as [StudentEntity];

      const [student2] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "Overlap Student 2",
          gender: Gender.FEMALE,
          status: "REGULAR",
          classesRemaining: 10,
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning()) as [StudentEntity];

      await tx.insert(teacherAssignments).values([
        { studentId: student1.id, teacherId: teacher1.id, assignedAt: now },
        { studentId: student1.id, teacherId: teacher2.id, assignedAt: now },
        { studentId: student2.id, teacherId: teacher1.id, assignedAt: now },
        { studentId: student2.id, teacherId: teacher2.id, assignedAt: now },
      ]);

      // 1. Two non-overlapping classes for the same teacher
      await SchedulingRepository.createClassInstance(
        {
          studentId: student1.id,
          teacherId: teacher1.id,
          scheduledStartAt: new Date("2026-06-20T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-20T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          idempotencyKey: randomUUID(),
        },
        tx
      );

      await SchedulingRepository.createClassInstance(
        {
          studentId: student2.id,
          teacherId: teacher1.id,
          scheduledStartAt: new Date("2026-06-20T11:00:00Z"),
          scheduledEndAt: new Date("2026-06-20T12:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          idempotencyKey: randomUUID(),
        },
        tx
      );

      // 2. Attempt Overlapping Teacher
      try {
        await SchedulingRepository.createClassInstance(
          {
            studentId: student2.id,
            teacherId: teacher1.id,
            scheduledStartAt: new Date("2026-06-20T10:30:00Z"),
            scheduledEndAt: new Date("2026-06-20T11:30:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            idempotencyKey: randomUUID(),
          },
          tx
        );
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain("Teacher is already booked for this time period");
      }

      // 3. Attempt Overlapping Student
      try {
        await SchedulingRepository.createClassInstance(
          {
            studentId: student1.id,
            teacherId: teacher2.id,
            scheduledStartAt: new Date("2026-06-20T10:30:00Z"),
            scheduledEndAt: new Date("2026-06-20T11:30:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            idempotencyKey: randomUUID(),
          },
          tx
        );
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain("Student is already booked for this time period");
      }

      // 4. Zoom URL Overlap
      const zoomUrl = `https://zoom.us/j/${randomUUID()}`;
      await SchedulingRepository.createClassInstance(
        {
          studentId: student1.id,
          teacherId: teacher1.id,
          scheduledStartAt: new Date("2026-06-21T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-21T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          zoomMeetingUrl: zoomUrl,
          idempotencyKey: randomUUID(),
        },
        tx
      );

      try {
        await SchedulingRepository.createClassInstance(
          {
            studentId: student2.id,
            teacherId: teacher2.id,
            scheduledStartAt: new Date("2026-06-21T10:30:00Z"),
            scheduledEndAt: new Date("2026-06-21T11:30:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            zoomMeetingUrl: zoomUrl,
            idempotencyKey: randomUUID(),
          },
          tx
        );
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain("Zoom meeting URL is already in use for this time period");
      }
    });
    testLogger.info("Overlap detection tests passed.");
  });
});
