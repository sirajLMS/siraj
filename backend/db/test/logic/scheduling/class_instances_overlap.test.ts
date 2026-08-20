import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { students, teacherAssignments, teachers, users } from "@/backend/db/schema";
import { createTestParent, createTestUser, ensureTestSubjectId } from "@/backend/db/test/entity-setup";
import { generateTestPassword, runInRollback } from "@/backend/db/test/test-utils";
import { Gender } from "@/backend/enum";
import type { DBTransaction, StudentSelectType, TeacherSelectType } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

async function setupTestParent(tx: DBTransaction) {
  const user = await createTestUser(tx, {
    name: "Overlap Parent",
    email: `parent-overlap-${randomUUID()}@example.com`,
  });
  return createTestParent(tx, user.id);
}

async function createTestTeachers(tx: DBTransaction, now: Date): Promise<TeacherSelectType[]> {
  const teachersData = [
    { name: "Overlap Teacher 1", email: `teacher1-${randomUUID()}@example.com` },
    { name: "Overlap Teacher 2", email: `teacher2-${randomUUID()}@example.com` },
  ];

  return Promise.all(
    teachersData.map(async (data): Promise<TeacherSelectType> => {
      const [user] = await tx
        .insert(users)
        .values({
          name: data.name,
          email: data.email,
          password: generateTestPassword(),
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [teacher] = await tx
        .insert(teachers)
        .values({
          userId: user.id,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return teacher;
    })
  );
}

async function createTestStudents(tx: DBTransaction, parentId: string, now: Date): Promise<StudentSelectType[]> {
  const studentsData = [
    { name: "Overlap Student 1", gender: Gender.MALE },
    { name: "Overlap Student 2", gender: Gender.FEMALE },
  ];

  return Promise.all(
    studentsData.map(async (data): Promise<StudentSelectType> => {
      const studentUser = await createTestUser(tx, {
        name: `${data.name} User`,
        email: `student-${randomUUID()}@example.com`,
      });
      const [student] = await tx
        .insert(students)
        .values({
          parentId,
          userId: studentUser.id,
          name: data.name,
          gender: data.gender,
          status: "REGULAR",
          classesRemaining: 10,
          createdAt: now,
          updatedAt: now,
          idempotencyKey: randomUUID(),
        })
        .returning();
      return student;
    })
  );
}

async function setupTestContext(tx: DBTransaction) {
  const now = new Date();

  const parent = await setupTestParent(tx);
  const [teacher1, teacher2] = await createTestTeachers(tx, now);
  const [student1, student2] = await createTestStudents(tx, parent.id, now);

  await tx.insert(teacherAssignments).values([
    { studentId: student1.id, teacherId: teacher1.id, assignedAt: now },
    { studentId: student1.id, teacherId: teacher2.id, assignedAt: now },
    { studentId: student2.id, teacherId: teacher1.id, assignedAt: now },
    { studentId: student2.id, teacherId: teacher2.id, assignedAt: now },
  ]);

  return { student1, student2, teacher1, teacher2 };
}

async function expectOverlapError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  if (!(errorCaught instanceof Error)) {
    throw new Error("Expected caught error to be an instance of Error");
  }
  return errorCaught;
}

async function testTeacherOverlaps(tx: DBTransaction, student1Id: string, student2Id: string, teacher1Id: string) {
  // 1. Two non-overlapping classes for the same teacher
  await SchedulingRepository.createClassInstance(
    {
      studentId: student1Id,
      teacherId: teacher1Id,
      subjectId: await ensureTestSubjectId(tx),
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
      studentId: student2Id,
      teacherId: teacher1Id,
      subjectId: await ensureTestSubjectId(tx),
      scheduledStartAt: new Date("2026-06-20T11:00:00Z"),
      scheduledEndAt: new Date("2026-06-20T12:00:00Z"),
      durationMinutes: 60,
      classType: "REGULAR",
      idempotencyKey: randomUUID(),
    },
    tx
  );

  // 2. Attempt Overlapping Teacher
  const teacherError = await expectOverlapError(async () =>
    SchedulingRepository.createClassInstance(
      {
        studentId: student2Id,
        teacherId: teacher1Id,
        subjectId: await ensureTestSubjectId(tx),
        scheduledStartAt: new Date("2026-06-20T10:30:00Z"),
        scheduledEndAt: new Date("2026-06-20T11:30:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        idempotencyKey: randomUUID(),
      },
      tx
    )
  );
  expect(teacherError).toBeTruthy();
  expect(teacherError.message).toContain("Teacher is already booked at this time.");
}

async function testStudentOverlap(tx: DBTransaction, student1Id: string, teacher2Id: string) {
  // 3. Attempt Overlapping Student
  const studentError = await expectOverlapError(async () =>
    SchedulingRepository.createClassInstance(
      {
        studentId: student1Id,
        teacherId: teacher2Id,
        subjectId: await ensureTestSubjectId(tx),
        scheduledStartAt: new Date("2026-06-20T10:30:00Z"),
        scheduledEndAt: new Date("2026-06-20T11:30:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        idempotencyKey: randomUUID(),
      },
      tx
    )
  );
  expect(studentError).toBeTruthy();
  expect(studentError.message).toContain("Student is already booked at this time.");
}

async function testZoomUrlOverlap(args: {
  tx: DBTransaction;
  student1Id: string;
  student2Id: string;
  teacher1Id: string;
  teacher2Id: string;
}) {
  const { tx, student1Id, student2Id, teacher1Id, teacher2Id } = args;
  // 4. Zoom URL Overlap
  const zoomUrl = `https://zoom.us/j/${randomUUID()}`;
  await SchedulingRepository.createClassInstance(
    {
      studentId: student1Id,
      teacherId: teacher1Id,
      subjectId: await ensureTestSubjectId(tx),
      scheduledStartAt: new Date("2026-06-21T10:00:00Z"),
      scheduledEndAt: new Date("2026-06-21T11:00:00Z"),
      durationMinutes: 60,
      classType: "REGULAR",
      meetingJoinUrl: zoomUrl,
      idempotencyKey: randomUUID(),
    },
    tx
  );

  const zoomError = await expectOverlapError(async () =>
    SchedulingRepository.createClassInstance(
      {
        studentId: student2Id,
        teacherId: teacher2Id,
        subjectId: await ensureTestSubjectId(tx),
        scheduledStartAt: new Date("2026-06-21T10:30:00Z"),
        scheduledEndAt: new Date("2026-06-21T11:30:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        meetingJoinUrl: zoomUrl,
        idempotencyKey: randomUUID(),
      },
      tx
    )
  );
  expect(zoomError).toBeTruthy();
  expect(zoomError.message).toContain("Meeting URL is already in use.");
}

describe("Class Instances Overlap Prevention", () => {
  test("Correctly detects and prevents overlaps", async () => {
    testLogger.info("Running overlap prevention tests...");
    await runInRollback(async tx => {
      const { student1, student2, teacher1, teacher2 } = await setupTestContext(tx);

      await testTeacherOverlaps(tx, student1.id, student2.id, teacher1.id);
      await testStudentOverlap(tx, student1.id, teacher2.id);
      await testZoomUrlOverlap({
        tx,
        student1Id: student1.id,
        student2Id: student2.id,
        teacher1Id: teacher1.id,
        teacher2Id: teacher2.id,
      });
    });
    testLogger.info("Overlap detection tests passed.");
  });
});
