import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { Gender } from "@/shared/lib/enum";
import { testLogger } from "@/shared/lib/testlogger";
import type { StudentEntity, TeacherEntity, UserEntity } from "../../../types";
import { SchedulingRepository } from "../../repo";
import { students, teacherAssignments, teachers, users } from "../../schema";
import { createTestParent, createTestUser } from "../entity-setup";
import { type DbTransaction, runInRollback } from "../test-utils";

async function setupTestParent(tx: DbTransaction) {
  const user = await createTestUser(tx, {
    name: "Overlap Parent",
    email: `parent-overlap-${randomUUID()}@example.com`,
  });
  return createTestParent(tx, user.id);
}

async function createTestTeachers(tx: DbTransaction, now: Date) {
  const teachersData = [
    { name: "Overlap Teacher 1", email: `teacher1-${randomUUID()}@example.com` },
    { name: "Overlap Teacher 2", email: `teacher2-${randomUUID()}@example.com` },
  ];

  const createdTeachers: TeacherEntity[] = [];
  for (const data of teachersData) {
    const [user] = (await tx
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
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
        timezone: "UTC",
        createdAt: now,
        updatedAt: now,
      })
      .returning()) as [TeacherEntity];
    createdTeachers.push(teacher);
  }
  return createdTeachers;
}

async function createTestStudents(tx: DbTransaction, parentId: string, now: Date) {
  const studentsData = [
    { name: "Overlap Student 1", gender: Gender.MALE },
    { name: "Overlap Student 2", gender: Gender.FEMALE },
  ];

  const createdStudents: StudentEntity[] = [];
  for (const data of studentsData) {
    const [student] = (await tx
      .insert(students)
      .values({
        parentId,
        name: data.name,
        gender: data.gender,
        status: "REGULAR",
        classesRemaining: 10,
        createdAt: now,
        updatedAt: now,
        idempotencyKey: randomUUID(),
      })
      .returning()) as [StudentEntity];
    createdStudents.push(student);
  }
  return createdStudents;
}

async function setupTestContext(tx: DbTransaction) {
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

async function testTeacherOverlaps(tx: DbTransaction, student1Id: string, student2Id: string, teacher1Id: string) {
  // 1. Two non-overlapping classes for the same teacher
  await SchedulingRepository.createClassInstance(
    {
      studentId: student1Id,
      teacherId: teacher1Id,
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
        studentId: student2Id,
        teacherId: teacher1Id,
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
}

async function testStudentOverlap(tx: DbTransaction, student1Id: string, teacher2Id: string) {
  // 3. Attempt Overlapping Student
  try {
    await SchedulingRepository.createClassInstance(
      {
        studentId: student1Id,
        teacherId: teacher2Id,
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
}

async function testZoomUrlOverlap(args: {
  tx: DbTransaction;
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
        studentId: student2Id,
        teacherId: teacher2Id,
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
