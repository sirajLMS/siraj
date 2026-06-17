import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { classInstances, parents, students, teacherAssignments, teachers, users } from "@/backend/db/schema";
import { type DbTransaction, runInRollback } from "../test-utils";

/**
 * HELPER: setupTestEntities
 */
async function setupTestEntities(tx: DbTransaction, prefix: string) {
  const now = new Date();

  const [parentUser] = await tx
    .insert(users)
    .values({
      name: `${prefix} ParentUser`,
      email: `${prefix}-parent-${randomUUID()}@example.com`,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [parent] = await tx
    .insert(parents)
    .values({
      userId: parentUser.id,
      status: "REGULAR",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [student] = await tx
    .insert(students)
    .values({
      parentId: parent.id,
      name: `${prefix} Student`,
      status: "REGULAR",
      classesRemaining: 10,
      classesTotal: 10,
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [teacherUser] = await tx
    .insert(users)
    .values({
      name: `${prefix} TeacherUser`,
      email: `${prefix}-teacher-${randomUUID()}@example.com`,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [teacher] = await tx
    .insert(teachers)
    .values({
      userId: teacherUser.id,
      status: "ACTIVATED",
      timezone: "UTC",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [assignment] = await tx
    .insert(teacherAssignments)
    .values({
      studentId: student.id,
      teacherId: teacher.id,
      assignedAt: now,
    })
    .returning();

  return { parentUser, parent, student, teacherUser, teacher, assignment, now };
}

/**
 * HELPER: createMockClassInstance
 */
async function createMockClassInstance(
  tx: DbTransaction,
  studentId: string,
  teacherId: string,
  overrides: Partial<typeof classInstances.$inferInsert> = {}
) {
  const now = new Date();
  const [instance] = await tx
    .insert(classInstances)
    .values({
      studentId,
      teacherId,
      scheduledStartAt: new Date(now.getTime() + 1000 * 60 * 60),
      scheduledEndAt: new Date(now.getTime() + 1000 * 60 * 120),
      durationMinutes: 60,
      classType: "REGULAR",
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning();
  return instance;
}

async function expectRepositoryError(fn: () => Promise<unknown>) {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
}

/**
 * HELPER: testRepoError
 * Wrapper to drastically reduce CodeScene structural duplication issues.
 */
function testRepoError(name: string, logic: (tx: DbTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(async tx => {
      await expectRepositoryError(() => logic(tx));
    });
  });
}

describe("Scheduling Repository logic", () => {
  describe("createClassInstance", () => {
    const getCreatePayload = (
      studentId: string,
      teacherId: string,
      start: Date,
      end: Date,
      overrides: Partial<typeof classInstances.$inferInsert> = {}
    ) => ({
      studentId,
      teacherId,
      scheduledStartAt: start,
      scheduledEndAt: end,
      durationMinutes: 60,
      classType: "REGULAR" as const,
      idempotencyKey: randomUUID(),
      ...overrides,
    });

    test("creates successfully with valid data and handles quota deduction", async () => {
      await runInRollback(async tx => {
        const { student, teacher, now } = await setupTestEntities(tx, "Create1");
        const [studentBefore] = await tx.select().from(students).where(eq(students.id, student.id));

        const start = new Date(now.getTime() + 86400000); // tomorrow
        const end = new Date(start.getTime() + 3600000); // +1 hour

        const created = await SchedulingRepository.createClassInstance(
          getCreatePayload(student.id, teacher.id, start, end, { quotaDeducted: true }),
          tx
        );
        expect(created.quotaDeducted).toBe(true);

        const [studentAfter] = await tx.select().from(students).where(eq(students.id, student.id));
        expect(studentAfter.classesRemaining).toBe(studentBefore.classesRemaining - 1);
      });
    });

    testRepoError("throws if teacher is not assigned to student", async tx => {
      const { student, now } = await setupTestEntities(tx, "Create2");
      const { teacher } = await setupTestEntities(tx, "CreateUnassigned");
      await SchedulingRepository.createClassInstance(
        getCreatePayload(
          student.id,
          teacher.id,
          new Date(now.getTime() + 86400000),
          new Date(now.getTime() + 90000000)
        ),
        tx
      );
    });

    testRepoError("throws on teacher overlap", async tx => {
      const { student, teacher, now } = await setupTestEntities(tx, "Create3");
      const start = new Date(now.getTime() + 86400000);
      const end = new Date(start.getTime() + 3600000);
      await createMockClassInstance(tx, student.id, teacher.id, { scheduledStartAt: start, scheduledEndAt: end });
      const { student: student2 } = await setupTestEntities(tx, "Create4");
      await tx.insert(teacherAssignments).values({ studentId: student2.id, teacherId: teacher.id, assignedAt: now });
      await SchedulingRepository.createClassInstance(getCreatePayload(student2.id, teacher.id, start, end), tx);
    });

    testRepoError("throws on student overlap", async tx => {
      const { student, teacher, now } = await setupTestEntities(tx, "CreateStudentOver");
      const start = new Date(now.getTime() + 86400000);
      const end = new Date(start.getTime() + 3600000);
      await createMockClassInstance(tx, student.id, teacher.id, { scheduledStartAt: start, scheduledEndAt: end });
      const { teacher: teacher2 } = await setupTestEntities(tx, "CreateStudentOver2");
      await tx.insert(teacherAssignments).values({ studentId: student.id, teacherId: teacher2.id, assignedAt: now });
      await SchedulingRepository.createClassInstance(getCreatePayload(student.id, teacher2.id, start, end), tx);
    });

    testRepoError("throws on zoomUrl overlap", async tx => {
      const { student, teacher, now } = await setupTestEntities(tx, "CreateZoom");
      const start = new Date(now.getTime() + 86400000);
      const end = new Date(start.getTime() + 3600000);
      const zoomUrl = "https://zoom.us/j/123456789";
      await createMockClassInstance(tx, student.id, teacher.id, {
        scheduledStartAt: start,
        scheduledEndAt: end,
        zoomMeetingUrl: zoomUrl,
      });
      const { student: s2, teacher: t2 } = await setupTestEntities(tx, "CreateZoom2");
      await SchedulingRepository.createClassInstance(
        getCreatePayload(s2.id, t2.id, start, end, { zoomMeetingUrl: zoomUrl }),
        tx
      );
    });
  });

  describe("updateClassInstance", () => {
    testRepoError("throws if class instance not found", async tx => {
      await SchedulingRepository.updateClassInstance(randomUUID(), {}, tx);
    });

    test("toggles quota deduction and updates student classesRemaining correctly", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "UpdateQuota");
        const [studentBefore] = await tx.select().from(students).where(eq(students.id, student.id));
        const instance = await createMockClassInstance(tx, student.id, teacher.id, { quotaDeducted: false });

        await SchedulingRepository.updateClassInstance(instance.id, { quotaDeducted: true }, tx);
        const [s1] = await tx.select().from(students).where(eq(students.id, student.id));
        expect(s1.classesRemaining).toBe(studentBefore.classesRemaining - 1);

        await SchedulingRepository.updateClassInstance(instance.id, { quotaDeducted: false }, tx);
        const [s2] = await tx.select().from(students).where(eq(students.id, student.id));
        expect(s2.classesRemaining).toBe(studentBefore.classesRemaining);
      });
    });

    test("skips validation when soft deleting (deletedAt is set)", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "UpdateDelete");
        const instance = await createMockClassInstance(tx, student.id, teacher.id);
        const deletedAt = new Date();
        const updated = await SchedulingRepository.updateClassInstance(instance.id, { deletedAt }, tx);
        expect(updated.deletedAt).toEqual(deletedAt);
      });
    });

    test("swapping student adjusts both quotas if quotaDeducted is true", async () => {
      await runInRollback(async tx => {
        const { student: student1, teacher, now } = await setupTestEntities(tx, "UpdateSwap1");
        const { student: student2 } = await setupTestEntities(tx, "UpdateSwap2");
        await tx.insert(teacherAssignments).values({ studentId: student2.id, teacherId: teacher.id, assignedAt: now });
        const instance = await createMockClassInstance(tx, student1.id, teacher.id, { quotaDeducted: true });

        const [s1Before] = await tx.select().from(students).where(eq(students.id, student1.id));
        const [s2Before] = await tx.select().from(students).where(eq(students.id, student2.id));

        await SchedulingRepository.updateClassInstance(instance.id, { studentId: student2.id }, tx);

        const [s1After] = await tx.select().from(students).where(eq(students.id, student1.id));
        const [s2After] = await tx.select().from(students).where(eq(students.id, student2.id));

        expect(s1After.classesRemaining).toBe(s1Before.classesRemaining + 1);
        expect(s2After.classesRemaining).toBe(s2Before.classesRemaining - 1);
      });
    });
  });

  describe("deleteClassInstance", () => {
    testRepoError("throws if class instance not found", async tx => {
      await SchedulingRepository.deleteClassInstance(randomUUID(), tx);
    });

    test("soft deletes and refunds quota if quotaDeducted was true", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "DeleteClass");
        const instance = await createMockClassInstance(tx, student.id, teacher.id, { quotaDeducted: true });
        const [sBefore] = await tx.select().from(students).where(eq(students.id, student.id));

        const deleted = await SchedulingRepository.deleteClassInstance(instance.id, tx);
        expect(deleted.deletedAt).not.toBeNull();

        const [sAfter] = await tx.select().from(students).where(eq(students.id, student.id));
        expect(sAfter.classesRemaining).toBe(sBefore.classesRemaining + 1);
      });
    });
  });

  describe("rescheduleClassInstance", () => {
    const getReschedulePayload = (
      studentId: string,
      teacherId: string,
      overrides: Partial<typeof classInstances.$inferInsert> = {}
    ) => ({
      studentId,
      teacherId,
      scheduledStartAt: new Date(),
      scheduledEndAt: new Date(),
      durationMinutes: 60,
      classType: "REGULAR" as const,
      idempotencyKey: randomUUID(),
      ...overrides,
    });

    testRepoError("throws if original class not found", async tx => {
      const { student, teacher } = await setupTestEntities(tx, "Resched1");
      await SchedulingRepository.rescheduleClassInstance(
        randomUUID(),
        getReschedulePayload(student.id, teacher.id),
        tx
      );
    });

    testRepoError("throws if rescheduling to self", async tx => {
      const { student, teacher } = await setupTestEntities(tx, "Resched2");
      const instance = await createMockClassInstance(tx, student.id, teacher.id);
      await SchedulingRepository.rescheduleClassInstance(
        instance.id,
        getReschedulePayload(student.id, teacher.id, { id: instance.id }),
        tx
      );
    });

    testRepoError("throws if original is completed or taken", async tx => {
      const { student, teacher, now } = await setupTestEntities(tx, "Resched3");
      const instance = await createMockClassInstance(tx, student.id, teacher.id, {
        executionState: "COMPLETED",
        outcome: "TAKEN",
        actualStartAt: now,
        actualEndAt: new Date(now.getTime() + 3600000),
      });
      await SchedulingRepository.rescheduleClassInstance(instance.id, getReschedulePayload(student.id, teacher.id), tx);
    });

    testRepoError("throws if already rescheduled", async tx => {
      const { student, teacher } = await setupTestEntities(tx, "Resched4");
      const instance = await createMockClassInstance(tx, student.id, teacher.id, { isRescheduled: true });
      await SchedulingRepository.rescheduleClassInstance(instance.id, getReschedulePayload(student.id, teacher.id), tx);
    });

    test("creates new instance, marks old as rescheduled, and refunds quota", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "ReschedSuccess");
        const original = await createMockClassInstance(tx, student.id, teacher.id, { quotaDeducted: true });
        const [sBefore] = await tx.select().from(students).where(eq(students.id, student.id));

        const now = new Date();
        const start = new Date(now.getTime() + 86400000 * 2);
        const end = new Date(start.getTime() + 3600000);

        const newInstance = await SchedulingRepository.rescheduleClassInstance(
          original.id,
          getReschedulePayload(student.id, teacher.id, { scheduledStartAt: start, scheduledEndAt: end }),
          tx
        );
        expect(newInstance.originalClassId).toBe(original.id);
        expect(newInstance.quotaDeducted).toBe(false);

        const [updatedOriginal] = await tx.select().from(classInstances).where(eq(classInstances.id, original.id));
        expect(updatedOriginal.isRescheduled).toBe(true);
        expect(updatedOriginal.outcome).toBe("PENDING");

        const [sAfter] = await tx.select().from(students).where(eq(students.id, student.id));
        expect(sAfter.classesRemaining).toBe(sBefore.classesRemaining + 1);
      });
    });
  });

  describe("getDailyMetrics and getDailySchedule", () => {
    test("returns correct metrics and schedule for a given date", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "Metrics");
        const testDate = new Date("2028-01-01T12:00:00Z");

        const initialMetrics = await SchedulingRepository.getDailyMetrics(testDate, teacher.id, tx);
        const initialSchedule = await SchedulingRepository.getDailySchedule(testDate, teacher.id, tx);

        await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: testDate,
          scheduledEndAt: new Date(testDate.getTime() + 3600000),
          classType: "REGULAR",
          outcome: "PENDING",
          executionState: "NOT_ACTIVATED",
        });
        await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: testDate,
          scheduledEndAt: new Date(testDate.getTime() + 3600000),
          classType: "TRIAL",
          outcome: "TAKEN",
          executionState: "COMPLETED",
          actualStartAt: testDate,
          actualEndAt: new Date(testDate.getTime() + 3600000),
        });

        const newMetrics = await SchedulingRepository.getDailyMetrics(testDate, teacher.id, tx);
        const newSchedule = await SchedulingRepository.getDailySchedule(testDate, teacher.id, tx);

        expect(newMetrics.total).toBe(initialMetrics.total + 2);
        expect(newMetrics.regular).toBe(initialMetrics.regular + 1);
        expect(newMetrics.trial).toBe(initialMetrics.trial + 1);
        expect(newMetrics.taken).toBe(initialMetrics.taken + 1);
        expect(newMetrics.pending).toBe(initialMetrics.pending + 1);
        expect(newSchedule.length).toBe(initialSchedule.length + 2);

        const scheduledClass = newSchedule.find(s => s.classType === "REGULAR");
        expect(scheduledClass?.student).toBeDefined();
        expect(scheduledClass?.teacher).toBeDefined();
      });
    });

    test("handles no transaction context natively", async () => {
      const date = new Date("2029-01-01T00:00:00Z");
      const metrics = await SchedulingRepository.getDailyMetrics(date);
      expect(metrics.total).toBeGreaterThanOrEqual(0);
      const schedule = await SchedulingRepository.getDailySchedule(date);
      expect(Array.isArray(schedule)).toBe(true);
    });
  });
});
