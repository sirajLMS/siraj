import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { Gender } from "@/backend/enum";
import type { ParentEntity } from "@/backend/types/parent.types";
import type { StudentEntity } from "@/backend/types/student.types";
import type { TeacherEntity } from "@/backend/types/teacher.types";
import type { UserSelectType } from "@/backend/types/user.types";
import { testLogger } from "@/shared/lib/testlogger";
import { SchedulingRepository } from "../../repo";
import { classInstances, parents, students, teacherAssignments, teachers, users } from "../../schema";
import { runInRollback } from "../test-utils";

async function createTestUser(tx: DBTransaction, name: string, email: string) {
  const now = new Date();
  const [user] = ((await tx
    .insert(users)
    .values({
      name,
      email,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [UserSelectType]) ?? [{} as UserSelectType];
  return { user, now };
}

async function createTestParent(tx: DBTransaction, name: string, email: string) {
  const { user, now } = await createTestUser(tx, name, email);
  const [parent] = (await tx
    .insert(parents)
    .values({ userId: user.id, status: "REGULAR", createdAt: now, updatedAt: now })
    .returning()) as [ParentEntity];
  return parent;
}

async function createTestTeacher(tx: DBTransaction, name: string, email: string) {
  const { user, now } = await createTestUser(tx, name, email);
  const [teacher] = (await tx
    .insert(teachers)
    .values({ userId: user.id, status: "ACTIVATED", timezone: "UTC", createdAt: now, updatedAt: now })
    .returning()) as [TeacherEntity];
  return teacher;
}

async function createTestStudent(tx: DBTransaction, parentId: string, name: string, gender: Gender = Gender.MALE) {
  const now = new Date();
  const [student] = (await tx
    .insert(students)
    .values({
      parentId,
      name,
      gender,
      status: "REGULAR",
      createdAt: now,
      updatedAt: now,
      idempotencyKey: randomUUID(),
    })
    .returning()) as [StudentEntity];

  return student;
}

function getClassParams(studentId: string, teacherId: string) {
  return {
    studentId,
    teacherId,
    scheduledStartAt: new Date("2026-06-25T10:00:00Z"),
    scheduledEndAt: new Date("2026-06-25T11:00:00Z"),
    durationMinutes: 60,
    classType: "REGULAR" as const,
    idempotencyKey: randomUUID(),
  };
}

async function expectClassCreationToFail(tx: DBTransaction, studentId: string, teacherId: string) {
  try {
    await SchedulingRepository.createClassInstance(getClassParams(studentId, teacherId), tx);
    expect(true).toBe(false); // Should fail
  } catch (error) {
    expect((error as Error).message).toContain("is not assigned to student");
  }
}

describe("Class Teacher Assignment Integrity", () => {
  test("Creating a class with an assigned teacher succeeds", async () => {
    testLogger.info("Testing class creation with assigned teacher...");
    await runInRollback(async tx => {
      const now = new Date();
      const parent = await createTestParent(tx, "Assign Parent", `parent-assign-${randomUUID()}@example.com`);
      const teacher = await createTestTeacher(tx, "Assign Teacher", `teacher-assign-${randomUUID()}@example.com`);
      const student = await createTestStudent(tx, parent.id, "Assign Student");

      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: now,
      });

      await SchedulingRepository.createClassInstance(getClassParams(student.id, teacher.id), tx);

      const [insertedClass] = await tx.select().from(classInstances).where(eq(classInstances.studentId, student.id));
      expect(insertedClass).toBeDefined();
      expect(insertedClass.teacherId).toBe(teacher.id);
    });
    testLogger.info("Class creation with assigned teacher passed.");
  });

  test("Creating a class with a non-assigned teacher fails", async () => {
    testLogger.info("Testing class creation with non-assigned teacher...");
    await runInRollback(async tx => {
      const parent = await createTestParent(tx, "NonAssign Parent", `parent-nonassign-${randomUUID()}@example.com`);
      const teacher = await createTestTeacher(tx, "NonAssign Teacher", `teacher-nonassign-${randomUUID()}@example.com`);
      const student = await createTestStudent(tx, parent.id, "NonAssign Student", Gender.FEMALE);

      await expectClassCreationToFail(tx, student.id, teacher.id);
    });
    testLogger.info("Class creation with non-assigned teacher failed as expected.");
  });

  test("Updating a class to a non-assigned teacher fails", async () => {
    testLogger.info("Testing class update to non-assigned teacher...");
    await runInRollback(async tx => {
      const now = new Date();
      const parent = await createTestParent(
        tx,
        "UpdateAssign Parent",
        `parent-updateassign-${randomUUID()}@example.com`
      );
      const teacher1 = await createTestTeacher(tx, "Teacher 1", `teacher1-${randomUUID()}@example.com`);
      const teacher2 = await createTestTeacher(tx, "Teacher 2", `teacher2-${randomUUID()}@example.com`);
      const student = await createTestStudent(tx, parent.id, "UpdateAssign Student");

      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher1.id,
        assignedAt: now,
      });

      const classInst = await SchedulingRepository.createClassInstance(getClassParams(student.id, teacher1.id), tx);

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
      const parent = await createTestParent(tx, "Ended Parent", `parent-ended-${randomUUID()}@example.com`);
      const teacher = await createTestTeacher(tx, "Ended Teacher", `teacher-ended-${randomUUID()}@example.com`);
      const student = await createTestStudent(tx, parent.id, "Ended Student", Gender.FEMALE);

      await tx.insert(teacherAssignments).values({
        studentId: student.id,
        teacherId: teacher.id,
        assignedAt: new Date("2026-01-01T00:00:00Z"),
        endedAt: new Date("2026-02-01T00:00:00Z"),
      });

      await expectClassCreationToFail(tx, student.id, teacher.id);
    });
    testLogger.info("Class creation with ended assignment failed as expected.");
  });
});
