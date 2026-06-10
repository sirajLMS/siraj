import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import type { ParentEntity, StudentEntity, TeacherEntity, UserEntity } from "../../types";
import type { ClassInstanceEntity } from "../../types/scheduling.types";
import { db } from "../drizzleDb";
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
      
      // Setup: Parent, Student, Teacher
      const [userP] = (await tx.insert(users).values({ name: "Parent", email: `p-${randomUUID()}@x.com`, password: "p", createdAt: now, updatedAt: now }).returning()) as [UserEntity];
      const [parent] = (await tx.insert(parents).values({ userId: userP.id, status: "REGULAR", createdAt: now, updatedAt: now }).returning()) as [ParentEntity];
      const [userT] = (await tx.insert(users).values({ name: "Teacher", email: `t-${randomUUID()}@x.com`, password: "t", createdAt: now, updatedAt: now }).returning()) as [UserEntity];
      const [teacher] = (await tx.insert(teachers).values({ userId: userT.id, status: "ACTIVATED", timezone: "UTC", createdAt: now, updatedAt: now }).returning()) as [TeacherEntity];
      const [student] = (await tx.insert(students).values({ parentId: parent.id, name: "Student", status: "ON_TRIAL", createdAt: now, updatedAt: now }).returning()) as [StudentEntity];

      // Assign Teacher
      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: now,
      });

      // Create Class Instance
      const startTime = new Date(now.getTime() + 3600000); // 1 hour later
      const endTime = new Date(startTime.getTime() + 3600000); // 2 hours later

      await tx.insert(classInstances).values({
        studentId: student.id,
        teacherId: teacher.id,
        scheduledStartAt: startTime,
        scheduledEndAt: endTime,
        durationMinutes: 60,
        classType: "REGULAR",
        createdAt: now,
        updatedAt: now,
      });

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
      
      const [userP] = (await tx.insert(users).values({ name: "Parent", email: `p-${randomUUID()}@x.com`, password: "p", createdAt: now, updatedAt: now }).returning()) as [UserEntity];
      const [parent] = (await tx.insert(parents).values({ userId: userP.id, status: "REGULAR", createdAt: now, updatedAt: now }).returning()) as [ParentEntity];
      const [userT] = (await tx.insert(users).values({ name: "Teacher", email: `t-${randomUUID()}@x.com`, password: "t", createdAt: now, updatedAt: now }).returning()) as [UserEntity];
      const [teacher] = (await tx.insert(teachers).values({ userId: userT.id, status: "ACTIVATED", timezone: "UTC", createdAt: now, updatedAt: now }).returning()) as [TeacherEntity];
      const [student] = (await tx.insert(students).values({ parentId: parent.id, name: "Student", status: "ON_TRIAL", createdAt: now, updatedAt: now }).returning()) as [StudentEntity];

      // DO NOT assign teacher

      const startTime = new Date(now.getTime() + 3600000);
      const endTime = new Date(startTime.getTime() + 3600000);

      try {
        await tx.insert(classInstances).values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: startTime,
          scheduledEndAt: endTime,
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
        });
        expect(true).toBe(false); // Should fail
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("is not assigned to student");
      }
    });
    testLogger.info("Class creation with non-assigned teacher failed as expected.");
  });

  test("Updating a class to a non-assigned teacher fails", async () => {
    testLogger.info("Testing class update to non-assigned teacher...");
    await runInRollback(async tx => {
      const now = new Date();
      
      const [userP] = (await tx.insert(users).values({ name: "Parent", email: `p-${randomUUID()}@x.com`, password: "p", createdAt: now, updatedAt: now }).returning()) as [UserEntity];
      const [parent] = (await tx.insert(parents).values({ userId: userP.id, status: "REGULAR", createdAt: now, updatedAt: now }).returning()) as [ParentEntity];
      const [userT1] = (await tx.insert(users).values({ name: "T1", email: `t1-${randomUUID()}@x.com`, password: "t", createdAt: now, updatedAt: now }).returning()) as [UserEntity];
      const [teacher1] = (await tx.insert(teachers).values({ userId: userT1.id, status: "ACTIVATED", timezone: "UTC", createdAt: now, updatedAt: now }).returning()) as [TeacherEntity];
      const [userT2] = (await tx.insert(users).values({ name: "T2", email: `t2-${randomUUID()}@x.com`, password: "t", createdAt: now, updatedAt: now }).returning()) as [UserEntity];
      const [teacher2] = (await tx.insert(teachers).values({ userId: userT2.id, status: "ACTIVATED", timezone: "UTC", createdAt: now, updatedAt: now }).returning()) as [TeacherEntity];
      const [student] = (await tx.insert(students).values({ parentId: parent.id, name: "Student", status: "ON_TRIAL", createdAt: now, updatedAt: now }).returning()) as [StudentEntity];

      // Assign only Teacher 1
      await tx.insert(teacherAssignments).values({ studentId: student.id, teacherId: teacher1.id, assignedAt: now });

      const startTime = new Date(now.getTime() + 3600000);
      const endTime = new Date(startTime.getTime() + 3600000);

      const [classInst] = (await tx.insert(classInstances).values({
        studentId: student.id,
        teacherId: teacher1.id,
        scheduledStartAt: startTime,
        scheduledEndAt: endTime,
        durationMinutes: 60,
        classType: "REGULAR",
        createdAt: now,
        updatedAt: now,
      }).returning()) as [ClassInstanceEntity];

      try {
        // Try updating to Teacher 2
        await tx.update(classInstances).set({ teacherId: teacher2.id }).where(eq(classInstances.id, classInst.id));
        expect(true).toBe(false); // Should fail
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("is not assigned to student");
      }
    });
    testLogger.info("Class update to non-assigned teacher failed as expected.");
  });

  test("Fails if the assignment has already ended", async () => {
    testLogger.info("Testing class creation with ended assignment...");
    await runInRollback(async tx => {
      const now = new Date();
      const past = new Date(now.getTime() - 86400000); // 1 day ago
      
      const [userP] = (await tx.insert(users).values({ name: "Parent", email: `p-${randomUUID()}@x.com`, password: "p", createdAt: now, updatedAt: now }).returning()) as [UserEntity];
      const [parent] = (await tx.insert(parents).values({ userId: userP.id, status: "REGULAR", createdAt: now, updatedAt: now }).returning()) as [ParentEntity];
      const [userT] = (await tx.insert(users).values({ name: "Teacher", email: `t-${randomUUID()}@x.com`, password: "t", createdAt: now, updatedAt: now }).returning()) as [UserEntity];
      const [teacher] = (await tx.insert(teachers).values({ userId: userT.id, status: "ACTIVATED", timezone: "UTC", createdAt: now, updatedAt: now }).returning()) as [TeacherEntity];
      const [student] = (await tx.insert(students).values({ parentId: parent.id, name: "Student", status: "ON_TRIAL", createdAt: now, updatedAt: now }).returning()) as [StudentEntity];

      // Assign Teacher but end it in the past
      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: past,
        endedAt: past,
      });

      const startTime = new Date(now.getTime() + 3600000);
      const endTime = new Date(startTime.getTime() + 3600000);

      try {
        await tx.insert(classInstances).values({
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: startTime,
          scheduledEndAt: endTime,
          durationMinutes: 60,
          classType: "REGULAR",
          createdAt: now,
          updatedAt: now,
        });
        expect(true).toBe(false); // Should fail
      } catch (error) {
        const err = error as Error & { cause?: { message?: string } };
        const message = err.cause?.message || err.message || "";
        expect(message).toContain("is not assigned to student");
      }
    });
    testLogger.info("Class creation with ended assignment failed as expected.");
  });
});
