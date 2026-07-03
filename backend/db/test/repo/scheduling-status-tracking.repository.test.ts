import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { SchedulingRepository } from "@/backend/db/repo";
import { classInstances, students, teacherAssignments, users } from "@/backend/db/schema";
import { ClassExecutionState, ClassOutcome, StudentStatus } from "@/shared/lib/enum";
import { createMockClassInstance, setupTestEntities } from "../entity-setup";
import { runInRollback } from "../test-utils";

const NON_EXISTENT_ID = "00000000-0000-0000-0000-000000000000";

/** Wrapper that creates a class instance with the common NOT_ACTIVATED/PENDING defaults. */
async function createPendingClass(
  tx: DBTransaction,
  studentId: string,
  teacherId: string,
  overrides: Partial<typeof classInstances.$inferInsert> = {}
) {
  return createMockClassInstance(tx, studentId, teacherId, {
    executionState: ClassExecutionState.NOT_ACTIVATED,
    outcome: ClassOutcome.PENDING,
    ...overrides,
  });
}

/** Extract a single isFrozen flag for a given class instance id. */
async function getIsFrozen(tx: DBTransaction, classId: string): Promise<boolean | undefined> {
  const [row] = await tx
    .select({ isFrozen: classInstances.isFrozen })
    .from(classInstances)
    .where(eq(classInstances.id, classId));
  return row?.isFrozen;
}

describe("Scheduling Repository — Status Tracking & Student Lifecycle (Story 10)", () => {
  describe("getStatusTrackingRows", () => {
    const FUTURE_DATE = new Date("2031-06-15T10:00:00.000Z");
    const FUTURE_END = new Date("2031-06-15T11:00:00.000Z");
    const LATER_START = new Date("2031-06-15T14:00:00.000Z");
    const LATER_END = new Date("2031-06-15T15:00:00.000Z");

    async function setupStatusTrackingTest(
      tx: DBTransaction,
      prefix: string,
      overrides: Partial<typeof classInstances.$inferInsert> = {}
    ) {
      const entities = await setupTestEntities(tx, prefix, { skipInstance: true });
      const instance = await createPendingClass(tx, entities.student.id, entities.teacher.id, {
        scheduledStartAt: FUTURE_DATE,
        scheduledEndAt: FUTURE_END,
        isFrozen: false,
        ...overrides,
      });
      return { ...entities, instance };
    }

    test("returns rows with student status, teacher name, and isFrozen", async () => {
      await runInRollback(async tx => {
        const { instance, student, teacherUser } = await setupStatusTrackingTest(tx, "STR1");

        const rows = await SchedulingRepository.getStatusTrackingRows(FUTURE_DATE, { viewerTimezone: "UTC" }, tx);
        const found = rows.find(r => r.id === instance.id);

        expect(found).toBeDefined();
        expect(found?.studentName).toBe(student.name);
        expect(found?.studentStatus).toBe(StudentStatus.REGULAR);
        expect(found?.teacherName).toBe(teacherUser.name);
        expect(found?.executionState).toBe(ClassExecutionState.NOT_ACTIVATED);
        expect(found?.isFrozen).toBe(false);
        expect(found?.outcome).toBe(ClassOutcome.PENDING);
      });
    });

    test("computes studentInitials from first 2 words", async () => {
      await runInRollback(async tx => {
        const { instance, student } = await setupStatusTrackingTest(tx, "STR2");
        await tx.update(students).set({ name: "Alice Johnson Smith" }).where(eq(students.id, student.id));

        const rows = await SchedulingRepository.getStatusTrackingRows(FUTURE_DATE, { viewerTimezone: "UTC" }, tx);
        const found = rows.find(r => r.id === instance.id);
        expect(found?.studentInitials).toBe("AJ");
      });
    });

    test("filters by search on student name (case-insensitive)", async () => {
      await runInRollback(async tx => {
        const { instance: i1 } = await setupStatusTrackingTest(tx, "STRSA");
        await setupStatusTrackingTest(tx, "STRSB");

        const rows = await SchedulingRepository.getStatusTrackingRows(
          FUTURE_DATE,
          { search: "STRSA", viewerTimezone: "UTC" },
          tx
        );
        expect(rows.some(r => r.id === i1.id)).toBe(true);
        expect(rows.every(r => r.studentName.toLowerCase().includes("strsa"))).toBe(true);
      });
    });

    test("filters by search on teacher name (case-insensitive)", async () => {
      await runInRollback(async tx => {
        const { instance, teacherUser } = await setupStatusTrackingTest(tx, "STRSN");
        const uniqueTag = `UniqueTag${randomUUID().slice(0, 6)}`;
        await tx.update(users).set({ name: uniqueTag }).where(eq(users.id, teacherUser.id));

        const rows = await SchedulingRepository.getStatusTrackingRows(
          FUTURE_DATE,
          { search: uniqueTag, viewerTimezone: "UTC" },
          tx
        );
        expect(rows.some(r => r.id === instance.id)).toBe(true);
        expect(rows.every(r => r.teacherName.includes(uniqueTag))).toBe(true);
      });
    });

    test("returns isFrozen: true for frozen classes", async () => {
      await runInRollback(async tx => {
        const { instance } = await setupStatusTrackingTest(tx, "STRFZ", { isFrozen: true });

        const rows = await SchedulingRepository.getStatusTrackingRows(FUTURE_DATE, { viewerTimezone: "UTC" }, tx);
        const found = rows.find(r => r.id === instance.id);
        expect(found?.isFrozen).toBe(true);
      });
    });

    test("returns empty array for date with no classes", async () => {
      await runInRollback(async tx => {
        const rows = await SchedulingRepository.getStatusTrackingRows(
          new Date("2019-01-01T00:00:00.000Z"),
          { viewerTimezone: "UTC" },
          tx
        );
        expect(rows).toEqual([]);
      });
    });

    test("orders results by scheduledStartAt ascending", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "STROrd", { skipInstance: true });
        const early = await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: FUTURE_DATE,
          scheduledEndAt: FUTURE_END,
          executionState: ClassExecutionState.NOT_ACTIVATED,
          outcome: ClassOutcome.PENDING,
        });
        const late = await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: LATER_START,
          scheduledEndAt: LATER_END,
          executionState: ClassExecutionState.NOT_ACTIVATED,
          outcome: ClassOutcome.PENDING,
        });

        const rows = await SchedulingRepository.getStatusTrackingRows(FUTURE_DATE, { viewerTimezone: "UTC" }, tx);
        const earlyIdx = rows.findIndex(r => r.id === early.id);
        const lateIdx = rows.findIndex(r => r.id === late.id);
        expect(earlyIdx).toBeGreaterThanOrEqual(0);
        expect(lateIdx).toBeGreaterThanOrEqual(0);
        expect(earlyIdx).toBeLessThan(lateIdx);
      });
    });

    test("works without tx context", async () => {
      const rows = await SchedulingRepository.getStatusTrackingRows(new Date("2019-01-01"), { viewerTimezone: "UTC" });
      expect(Array.isArray(rows)).toBe(true);
    });
  });

  describe("bulkFreezeStudentClasses", () => {
    const FROM_DATE = new Date("2030-01-01T00:00:00.000Z");
    const FUTURE_1 = new Date("2030-06-01T10:00:00.000Z");
    const FUTURE_2 = new Date("2030-07-01T10:00:00.000Z");
    const CLASS_END_OFFSET = 3600000;

    test("freezes all future classes for the student regardless of executionState", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "Frz1", { skipInstance: true });

        const naId = (
          await createMockClassInstance(tx, student.id, teacher.id, {
            scheduledStartAt: FUTURE_1,
            scheduledEndAt: new Date(FUTURE_1.getTime() + CLASS_END_OFFSET),
            executionState: ClassExecutionState.NOT_ACTIVATED,
            outcome: ClassOutcome.PENDING,
          })
        ).id;

        const actId = (
          await createMockClassInstance(tx, student.id, teacher.id, {
            scheduledStartAt: FUTURE_2,
            scheduledEndAt: new Date(FUTURE_2.getTime() + CLASS_END_OFFSET),
            executionState: ClassExecutionState.ACTIVATED,
            outcome: ClassOutcome.PENDING,
          })
        ).id;

        const compId = (
          await createMockClassInstance(tx, student.id, teacher.id, {
            scheduledStartAt: FUTURE_1,
            scheduledEndAt: new Date(FUTURE_1.getTime() + CLASS_END_OFFSET),
            executionState: ClassExecutionState.COMPLETED,
            outcome: ClassOutcome.TAKEN,
            actualStartAt: FUTURE_1,
            actualEndAt: new Date(FUTURE_1.getTime() + CLASS_END_OFFSET),
          })
        ).id;

        const count = await SchedulingRepository.bulkFreezeStudentClasses(student.id, FROM_DATE, tx);
        expect(count).toBe(3);

        const [na] = await tx
          .select({ isFrozen: classInstances.isFrozen })
          .from(classInstances)
          .where(eq(classInstances.id, naId));
        const [act] = await tx
          .select({ isFrozen: classInstances.isFrozen })
          .from(classInstances)
          .where(eq(classInstances.id, actId));
        const [comp] = await tx
          .select({ isFrozen: classInstances.isFrozen })
          .from(classInstances)
          .where(eq(classInstances.id, compId));
        expect(na?.isFrozen).toBe(true);
        expect(act?.isFrozen).toBe(true);
        expect(comp?.isFrozen).toBe(true);
      });
    });

    test("does not freeze other students' classes", async () => {
      await runInRollback(async tx => {
        const { student: sA, teacher } = await setupTestEntities(tx, "Frz2A", { skipInstance: true });
        const { student: sB } = await setupTestEntities(tx, "Frz2B", { skipInstance: true });
        await tx.insert(teacherAssignments).values({ studentId: sB.id, teacherId: teacher.id, assignedAt: new Date() });

        await createMockClassInstance(tx, sA.id, teacher.id, {
          scheduledStartAt: FUTURE_1,
          scheduledEndAt: new Date(FUTURE_1.getTime() + CLASS_END_OFFSET),
          executionState: ClassExecutionState.NOT_ACTIVATED,
          outcome: ClassOutcome.PENDING,
        });

        const otherId = (
          await createMockClassInstance(tx, sB.id, teacher.id, {
            scheduledStartAt: FUTURE_1,
            scheduledEndAt: new Date(FUTURE_1.getTime() + CLASS_END_OFFSET),
            executionState: ClassExecutionState.NOT_ACTIVATED,
            outcome: ClassOutcome.PENDING,
          })
        ).id;

        await SchedulingRepository.bulkFreezeStudentClasses(sA.id, FROM_DATE, tx);

        const [other] = await tx
          .select({ isFrozen: classInstances.isFrozen })
          .from(classInstances)
          .where(eq(classInstances.id, otherId));
        expect(other?.isFrozen).toBe(false);
      });
    });

    test("returns 0 for non-existent studentId", async () => {
      await runInRollback(async tx => {
        const result = await SchedulingRepository.bulkFreezeStudentClasses(
          "00000000-0000-0000-0000-000000000000",
          FROM_DATE,
          tx
        );
        expect(result).toBe(0);
      });
    });

    test("re-freezing already frozen classes is safe", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "Frz3", { skipInstance: true });
        const classId = (
          await createMockClassInstance(tx, student.id, teacher.id, {
            scheduledStartAt: FUTURE_1,
            scheduledEndAt: new Date(FUTURE_1.getTime() + CLASS_END_OFFSET),
            executionState: ClassExecutionState.NOT_ACTIVATED,
            outcome: ClassOutcome.PENDING,
          })
        ).id;

        await SchedulingRepository.bulkFreezeStudentClasses(student.id, FROM_DATE, tx);
        await SchedulingRepository.bulkFreezeStudentClasses(student.id, FROM_DATE, tx);

        const [cls] = await tx
          .select({ isFrozen: classInstances.isFrozen })
          .from(classInstances)
          .where(eq(classInstances.id, classId));
        expect(cls?.isFrozen).toBe(true);
      });
    });

    test("works without tx context", async () => {
      const result = await SchedulingRepository.bulkFreezeStudentClasses(
        "00000000-0000-0000-0000-000000000000",
        FROM_DATE
      );
      expect(result).toBe(0);
    });
  });

  describe("bulkUnfreezeStudentClasses", () => {
    const FROM_DATE = new Date("2030-01-01T00:00:00.000Z");
    const FUTURE_1 = new Date("2030-06-01T10:00:00.000Z");
    const FUTURE_2 = new Date("2030-07-01T10:00:00.000Z");
    const CLASS_END_OFFSET = 3600000;

    async function createFrozenClass(
      tx: DBTransaction,
      studentId: string,
      teacherId: string,
      scheduledAt: Date
    ): Promise<string> {
      return (
        await createMockClassInstance(tx, studentId, teacherId, {
          scheduledStartAt: scheduledAt,
          scheduledEndAt: new Date(scheduledAt.getTime() + CLASS_END_OFFSET),
          executionState: ClassExecutionState.NOT_ACTIVATED,
          outcome: ClassOutcome.PENDING,
          isFrozen: true,
        })
      ).id;
    }

    test("unfreezes all frozen future classes", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "Unf1", { skipInstance: true });

        const id1 = await createFrozenClass(tx, student.id, teacher.id, FUTURE_1);
        const id2 = await createFrozenClass(tx, student.id, teacher.id, FUTURE_2);

        const count = await SchedulingRepository.bulkUnfreezeStudentClasses(student.id, FROM_DATE, tx);
        expect(count).toBe(2);

        const [c1] = await tx
          .select({ isFrozen: classInstances.isFrozen })
          .from(classInstances)
          .where(eq(classInstances.id, id1));
        const [c2] = await tx
          .select({ isFrozen: classInstances.isFrozen })
          .from(classInstances)
          .where(eq(classInstances.id, id2));
        expect(c1?.isFrozen).toBe(false);
        expect(c2?.isFrozen).toBe(false);
      });
    });

    test("returns 0 when no classes are frozen", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "Unf2", { skipInstance: true });
        await createPendingClass(tx, student.id, teacher.id, {
          scheduledStartAt: FUTURE_1,
          scheduledEndAt: new Date(FUTURE_1.getTime() + CLASS_END_OFFSET),
          isFrozen: false,
        });

        const count = await SchedulingRepository.bulkUnfreezeStudentClasses(student.id, FROM_DATE, tx);
        expect(count).toBe(0);
      });
    });

    test("does not unfreeze other students' classes", async () => {
      await runInRollback(async tx => {
        const { student: sA, teacher } = await setupTestEntities(tx, "Unf3A", { skipInstance: true });
        const { student: sB } = await setupTestEntities(tx, "Unf3B", { skipInstance: true });
        await tx.insert(teacherAssignments).values({ studentId: sB.id, teacherId: teacher.id, assignedAt: new Date() });

        await createFrozenClass(tx, sA.id, teacher.id, FUTURE_1);
        const otherId = await createFrozenClass(tx, sB.id, teacher.id, FUTURE_1);

        await SchedulingRepository.bulkUnfreezeStudentClasses(sA.id, FROM_DATE, tx);

        expect(await getIsFrozen(tx, otherId)).toBe(true);
      });
    });

    test("returns 0 for non-existent studentId", async () => {
      await runInRollback(async tx => {
        const result = await SchedulingRepository.bulkUnfreezeStudentClasses(NON_EXISTENT_ID, FROM_DATE, tx);
        expect(result).toBe(0);
      });
    });

    test("full freeze-then-unfreeze cycle restores isFrozen = false", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "Unf4", { skipInstance: true });
        const classId = (
          await createPendingClass(tx, student.id, teacher.id, {
            scheduledStartAt: FUTURE_1,
            scheduledEndAt: new Date(FUTURE_1.getTime() + CLASS_END_OFFSET),
            isFrozen: false,
          })
        ).id;

        await SchedulingRepository.bulkFreezeStudentClasses(student.id, FROM_DATE, tx);
        expect(await getIsFrozen(tx, classId)).toBe(true);

        await SchedulingRepository.bulkUnfreezeStudentClasses(student.id, FROM_DATE, tx);
        expect(await getIsFrozen(tx, classId)).toBe(false);
      });
    });

    test("works without tx context", async () => {
      const result = await SchedulingRepository.bulkUnfreezeStudentClasses(NON_EXISTENT_ID, FROM_DATE);
      expect(result).toBe(0);
    });
  });

  describe("getStudentFutureClasses", () => {
    const FROM_DATE = new Date("2030-01-01T00:00:00.000Z");
    const FUTURE_1 = new Date("2030-06-01T10:00:00.000Z");
    const FUTURE_2 = new Date("2030-07-01T10:00:00.000Z");
    const PAST_DATE = new Date("2029-01-01T10:00:00.000Z");
    const CLASS_END_OFFSET = 3600000;

    test("returns only NOT_ACTIVATED and ACTIVATED future classes", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "Fut1", { skipInstance: true });

        const naId = (
          await createPendingClass(tx, student.id, teacher.id, {
            scheduledStartAt: FUTURE_1,
            scheduledEndAt: new Date(FUTURE_1.getTime() + CLASS_END_OFFSET),
          })
        ).id;

        const actId = (
          await createPendingClass(tx, student.id, teacher.id, {
            scheduledStartAt: FUTURE_2,
            scheduledEndAt: new Date(FUTURE_2.getTime() + CLASS_END_OFFSET),
            executionState: ClassExecutionState.ACTIVATED,
          })
        ).id;

        const compId = (
          await createPendingClass(tx, student.id, teacher.id, {
            scheduledStartAt: PAST_DATE,
            scheduledEndAt: new Date(PAST_DATE.getTime() + CLASS_END_OFFSET),
            executionState: ClassExecutionState.COMPLETED,
            outcome: ClassOutcome.TAKEN,
            actualStartAt: PAST_DATE,
            actualEndAt: new Date(PAST_DATE.getTime() + CLASS_END_OFFSET),
          })
        ).id;

        const result = await SchedulingRepository.getStudentFutureClasses(student.id, FROM_DATE, tx);
        const ids = result.map(c => c.id);
        expect(ids).toContain(naId);
        expect(ids).toContain(actId);
        expect(ids).not.toContain(compId);
      });
    });

    test("returns empty array for student with no future classes", async () => {
      await runInRollback(async tx => {
        const { student } = await setupTestEntities(tx, "Fut2", { skipInstance: true });
        const result = await SchedulingRepository.getStudentFutureClasses(student.id, FROM_DATE, tx);
        expect(result).toEqual([]);
      });
    });

    test("returns minimal shape { id, executionState, scheduledStartAt }", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "Fut3", { skipInstance: true });
        await createPendingClass(tx, student.id, teacher.id, {
          scheduledStartAt: FUTURE_1,
          scheduledEndAt: new Date(FUTURE_1.getTime() + CLASS_END_OFFSET),
        });

        const result = await SchedulingRepository.getStudentFutureClasses(student.id, FROM_DATE, tx);
        expect(result.length).toBe(1);
        expect(typeof result[0].id).toBe("string");
        expect(typeof result[0].executionState).toBe("string");
        expect(result[0].scheduledStartAt).toBeInstanceOf(Date);
        expect(Object.keys(result[0])).toEqual(["id", "executionState", "scheduledStartAt"]);
      });
    });

    test("orders by scheduledStartAt ascending", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "Fut4", { skipInstance: true });
        const laterId = (
          await createPendingClass(tx, student.id, teacher.id, {
            scheduledStartAt: FUTURE_2,
            scheduledEndAt: new Date(FUTURE_2.getTime() + CLASS_END_OFFSET),
          })
        ).id;
        const earlierId = (
          await createPendingClass(tx, student.id, teacher.id, {
            scheduledStartAt: FUTURE_1,
            scheduledEndAt: new Date(FUTURE_1.getTime() + CLASS_END_OFFSET),
          })
        ).id;

        const result = await SchedulingRepository.getStudentFutureClasses(student.id, FROM_DATE, tx);
        const earlierIdx = result.findIndex(c => c.id === earlierId);
        const laterIdx = result.findIndex(c => c.id === laterId);
        expect(earlierIdx).toBeLessThan(laterIdx);
      });
    });

    test("works without tx context", async () => {
      const result = await SchedulingRepository.getStudentFutureClasses(NON_EXISTENT_ID, FROM_DATE);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
