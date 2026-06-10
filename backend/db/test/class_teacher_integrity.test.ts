import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { Gender } from "../../../lib/enum";
import { testLogger } from "../../../lib/testlogger";
import type { ParentEntity, StudentEntity, TeacherEntity, UserEntity } from "../../types";
import { db } from "../drizzleDb";
import { SchedulingRepository } from "../repo";
import { classInstances, parents, students, teacherAssignments, teachers, users } from "../schema";

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

describe("Class Teacher Assignment Integrity", () => {
  test("Creating a class with an assigned teacher succeeds", async () => {
    testLogger.info("Testing class creation with assigned teacher...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-assign-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-assign-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Assign Parent",
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
          name: "Assign Teacher",
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
          name: "Assign Student",
          gender: Gender.MALE,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning()) as [StudentEntity];

      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: now,
      });

      await SchedulingRepository.createClassInstance(
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          idempotencyKey: randomUUID(),
        },
        tx
      );

      const [insertedClass] = await tx.select().from(classInstances).where(eq(classInstances.studentId, student.id));
      expect(insertedClass).toBeDefined();
      expect(insertedClass.teacherId).toBe(teacher.id);
    });
    testLogger.info("Class creation with assigned teacher passed.");
  });

  test("Creating a class with a non-assigned teacher fails", async () => {
    testLogger.info("Testing class creation with non-assigned teacher...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-nonassign-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-nonassign-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "NonAssign Parent",
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
          name: "NonAssign Teacher",
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
          name: "NonAssign Student",
          gender: Gender.FEMALE,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning()) as [StudentEntity];

      // No teacher assignment created here

      try {
        await SchedulingRepository.createClassInstance(
          {
            studentId: student.id,
            teacherId: teacher.id,
            scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
            scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            idempotencyKey: randomUUID(),
          },
          tx
        );
        expect(true).toBe(false); // Should fail
      } catch (error) {
        expect((error as Error).message).toContain("is not assigned to student");
      }
    });
    testLogger.info("Class creation with non-assigned teacher failed as expected.");
  });

  test("Updating a class to a non-assigned teacher fails", async () => {
    testLogger.info("Testing class update to non-assigned teacher...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-updateassign-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "UpdateAssign Parent",
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
          name: "Teacher 1",
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
          name: "Teacher 2",
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

      const [student] = (await tx
        .insert(students)
        .values({
          parentId: parent.id,
          name: "UpdateAssign Student",
          gender: Gender.MALE,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning()) as [StudentEntity];

      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher1.id,
        assignedAt: now,
      });

      const classInst = await SchedulingRepository.createClassInstance(
        {
          studentId: student.id,
          teacherId: teacher1.id,
          scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          idempotencyKey: randomUUID(),
        },
        tx
      );

      try {
        await SchedulingRepository.updateClassInstance(classInst.id, { teacherId: teacher2.id }, tx);
        expect(true).toBe(false); // Should fail
      } catch (error) {
        expect((error as Error).message).toContain("is not assigned to student");
      }
    });
    testLogger.info("Class update to non-assigned teacher failed as expected.");
  });

  test("Fails if the assignment has already ended", async () => {
    testLogger.info("Testing class creation with ended assignment...");
    await runInRollback(async tx => {
      const now = new Date();
      const parentEmail = `parent-ended-${randomUUID()}@example.com`;
      const teacherEmail = `teacher-ended-${randomUUID()}@example.com`;

      const [parentUser] = (await tx
        .insert(users)
        .values({
          name: "Ended Parent",
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
          name: "Ended Teacher",
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
          name: "Ended Student",
          gender: Gender.FEMALE,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning()) as [StudentEntity];

      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: new Date("2026-01-01T00:00:00Z"),
        endedAt: new Date("2026-02-01T00:00:00Z"),
      });

      try {
        await SchedulingRepository.createClassInstance(
          {
            studentId: student.id,
            teacherId: teacher.id,
            scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
            scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            idempotencyKey: randomUUID(),
          },
          tx
        );
        expect(true).toBe(false); // Should fail
      } catch (error) {
        expect((error as Error).message).toContain("is not assigned to student");
      }
    });
    testLogger.info("Class creation with ended assignment failed as expected.");
  });
});
