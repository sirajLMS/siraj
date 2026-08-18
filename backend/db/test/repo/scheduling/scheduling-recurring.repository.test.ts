import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import type { RateSnapshot } from "@/backend/db/repo/scheduling/recurring";
import { classInstances, recurringSchedules, students, teacherAssignments } from "@/backend/db/schema";
import {
  createMockClassInstance,
  ensureTestSubjectId,
  setupStudent,
  setupTeacher,
  setupTestEntities,
} from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { RateSource } from "@/backend/enum";
import { DayOfWeek } from "@/backend/enum/teachers/teacher-availability.enum";
import type { DBTransaction } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

const TEST_RATE_SNAPSHOT: RateSnapshot = {
  rateAmount: "100",
  rateCurrency: CurrencyCode.SAR,
  rateSource: RateSource.TEACHER,
};

async function expectRepositoryError(fn: () => Promise<unknown>) {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
}

function testRepoError(name: string, logic: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(async tx => {
      await expectRepositoryError(() => logic(tx));
    });
  });
}

async function setupEmptyTeacherWeeklyContext(tx: DBTransaction, prefix: string) {
  const { teacher } = await setupTestEntities(tx, prefix, { skipInstance: true });
  const weekStart = new Date("2026-06-22T00:00:00Z");
  const weekEnd = new Date("2026-06-29T00:00:00Z");
  const queries = await import("@/backend/db/repo/scheduling/scheduling-queries.repository");
  return { teacher, weekStart, weekEnd, queries };
}

async function getRecurringPayload(
  tx: DBTransaction,
  studentId: string,
  teacherId: string,
  days: {
    dayOfWeek: "FRIDAY" | "MONDAY" | "SATURDAY" | "SUNDAY" | "THURSDAY" | "TUESDAY" | "WEDNESDAY";
    startTime: string;
    isActive: boolean;
  }[],
  quotaDeducted = true
) {
  return {
    studentId,
    teacherId,
    subjectId: await ensureTestSubjectId(tx),
    durationMinutes: 60,
    defaultStartTime: "10:00:00",
    timezone: IanaTimezone.UTC,
    effectiveFrom: new Date("2026-06-22T00:00:00Z"),
    effectiveUntil: new Date("2026-07-22T00:00:00Z"),
    days,
    classType: "REGULAR" as const,
    generateInstancesForWeeks: 1,
    quotaDeducted,
  };
}

describe("Scheduling Repository – Recurring & Weekly", () => {
  describe("getWeeklyScheduleGrid and getWeeklyWorkloadMetrics", () => {
    test("returns correct grid and metrics for a week", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "WeeklyMetrics", { skipInstance: true });

        const weekStart = new Date("2026-06-22T00:00:00Z");
        const weekEnd = new Date("2026-06-29T00:00:00Z");

        const c1 = await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: new Date("2026-06-22T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-22T11:00:00Z"),
          durationMinutes: 60,
          executionState: "ACTIVATED",
        });
        const c2 = await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: new Date("2026-06-24T14:30:00Z"),
          scheduledEndAt: new Date("2026-06-24T15:30:00Z"),
          durationMinutes: 60,
          executionState: "NOT_ACTIVATED",
        });

        const { getWeeklyScheduleGrid, getWeeklyWorkloadMetrics } = await import(
          "@/backend/db/repo/scheduling/scheduling-queries.repository"
        );
        const grid = await getWeeklyScheduleGrid(teacher.id, weekStart, weekEnd, tx);
        expect(grid).toHaveLength(2);

        const monClass = grid.find(c => c.id === c1.id);
        expect(monClass?.dayOfWeek).toBe(DayOfWeek.MONDAY);

        const wedClass = grid.find(c => c.id === c2.id);
        expect(wedClass?.dayOfWeek).toBe(DayOfWeek.WEDNESDAY);

        const workload = await getWeeklyWorkloadMetrics(teacher.id, weekStart, weekEnd, tx);
        expect(workload.classCount).toBe(1);
        expect(workload.totalMinutes).toBe(60);
        expect(workload.totalHoursFormatted).toBe("1:00");
      });
    });

    test("getWeeklyScheduleGrid returns empty array for teacher with no classes", async () => {
      await runInRollback(async tx => {
        const { teacher, weekStart, weekEnd, queries } = await setupEmptyTeacherWeeklyContext(tx, "WeeklyEmpty");
        const grid = await queries.getWeeklyScheduleGrid(teacher.id, weekStart, weekEnd, tx);
        expect(grid).toHaveLength(0);
      });
    });

    test("getWeeklyScheduleGrid excludes soft-deleted instances", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "WeeklyDeleted", { skipInstance: true });

        const c1 = await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: new Date("2026-06-22T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-22T11:00:00Z"),
          durationMinutes: 60,
          executionState: "ACTIVATED",
        });

        await tx.update(classInstances).set({ deletedAt: new Date() }).where(eq(classInstances.id, c1.id));

        const { getWeeklyScheduleGrid } = await import("@/backend/db/repo/scheduling/scheduling-queries.repository");
        const grid = await getWeeklyScheduleGrid(
          teacher.id,
          new Date("2026-06-22T00:00:00Z"),
          new Date("2026-06-29T00:00:00Z"),
          tx
        );
        expect(grid).toHaveLength(0);
      });
    });

    test("getWeeklyWorkloadMetrics returns zeros for teacher with no classes", async () => {
      await runInRollback(async tx => {
        const { teacher, weekStart, weekEnd, queries } = await setupEmptyTeacherWeeklyContext(tx, "WorkloadEmpty");
        const workload = await queries.getWeeklyWorkloadMetrics(teacher.id, weekStart, weekEnd, tx);
        expect(workload.classCount).toBe(0);
        expect(workload.totalMinutes).toBe(0);
        expect(workload.totalHoursFormatted).toBe("0:00");
      });
    });
  });

  describe("createRecurringScheduleWithInstances", () => {
    test("success with quota deduction", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "RecClass", { skipInstance: true });
        await tx.update(students).set({ classesRemaining: 5 }).where(eq(students.id, student.id));

        const result = await SchedulingRepository.createRecurringScheduleWithInstances(
          {
            studentId: student.id,
            teacherId: teacher.id,
            subjectId: await ensureTestSubjectId(tx),
            durationMinutes: 60,
            defaultStartTime: "10:00:00",
            timezone: IanaTimezone.UTC,
            effectiveFrom: new Date("2026-06-22T00:00:00Z"),
            effectiveUntil: new Date("2026-07-22T00:00:00Z"),
            days: [
              { dayOfWeek: "MONDAY", startTime: "10:00:00", isActive: true },
              { dayOfWeek: "WEDNESDAY", startTime: "14:00:00", isActive: true },
            ],
            classType: "REGULAR",
            generateInstancesForWeeks: 2,
            quotaDeducted: true,
          },
          null,
          TEST_RATE_SNAPSHOT,
          tx
        );

        expect(result.recurringScheduleId).toBeDefined();
        expect(result.classInstanceIds).toHaveLength(4);

        const [studentAfter] = await tx
          .select({ classesRemaining: students.classesRemaining })
          .from(students)
          .where(eq(students.id, student.id));
        expect(studentAfter.classesRemaining).toBe(5);

        const [schedule] = await tx
          .select()
          .from(recurringSchedules)
          .where(eq(recurringSchedules.id, result.recurringScheduleId));
        expect(schedule.utcOffsetSnapshot).toBe(0);

        const [instance] = await tx
          .select()
          .from(classInstances)
          .where(eq(classInstances.id, result.classInstanceIds[0]));
        expect(instance.bookingTimezone).toBe(IanaTimezone.UTC);
        expect(instance.bookingUtcOffset).toBe(0);
      });
    });

    test("conflict checks", async () => {
      await runInRollback(async tx => {
        const { student, teacher, now } = await setupTestEntities(tx, "RecClass", { skipInstance: true });
        await tx.update(students).set({ classesRemaining: 5 }).where(eq(students.id, student.id));

        const effectiveFrom = new Date("2026-06-22T00:00:00Z");
        const effectiveUntil = new Date("2026-07-22T00:00:00Z");

        await SchedulingRepository.createRecurringScheduleWithInstances(
          {
            studentId: student.id,
            teacherId: teacher.id,
            subjectId: await ensureTestSubjectId(tx),
            durationMinutes: 60,
            defaultStartTime: "10:00:00",
            timezone: IanaTimezone.UTC,
            effectiveFrom,
            effectiveUntil,
            days: [{ dayOfWeek: "MONDAY", startTime: "10:00:00", isActive: true }],
            classType: "REGULAR",
            generateInstancesForWeeks: 1,
            quotaDeducted: false,
          },
          null,
          TEST_RATE_SNAPSHOT,
          tx
        );

        const { student: student2 } = await setupTestEntities(tx, "RecClass2", { skipInstance: true });
        await tx.insert(teacherAssignments).values({ studentId: student2.id, teacherId: teacher.id, assignedAt: now });

        let errorCaught = false;
        try {
          await SchedulingRepository.createRecurringScheduleWithInstances(
            {
              studentId: student2.id,
              teacherId: teacher.id,
              subjectId: await ensureTestSubjectId(tx),
              durationMinutes: 60,
              defaultStartTime: "10:00:00",
              timezone: IanaTimezone.UTC,
              effectiveFrom,
              effectiveUntil,
              days: [{ dayOfWeek: "MONDAY", startTime: "10:00:00", isActive: true }],
              classType: "REGULAR",
              generateInstancesForWeeks: 1,
              quotaDeducted: false,
            },
            null,
            TEST_RATE_SNAPSHOT,
            tx
          );
        } catch (error) {
          errorCaught = true;
          expect(error).toBeDefined();
        }
        expect(errorCaught).toBe(true);
      });
    });

    test("skips inactive days", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "RecSkipInactive", { skipInstance: true });
        await tx.update(students).set({ classesRemaining: 5 }).where(eq(students.id, student.id));

        const result = await SchedulingRepository.createRecurringScheduleWithInstances(
          await getRecurringPayload(tx, student.id, teacher.id, [
            { dayOfWeek: "MONDAY", startTime: "10:00:00", isActive: true },
            { dayOfWeek: "TUESDAY", startTime: "11:00:00", isActive: false },
            { dayOfWeek: "WEDNESDAY", startTime: "12:00:00", isActive: true },
          ]),
          null,
          TEST_RATE_SNAPSHOT,
          tx
        );

        expect(result.classInstanceIds).toHaveLength(2);
      });
    });

    test("creates correct recurring schedule day rows", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "RecDayRows", { skipInstance: true });
        await tx.update(students).set({ classesRemaining: 5 }).where(eq(students.id, student.id));

        const result = await SchedulingRepository.createRecurringScheduleWithInstances(
          await getRecurringPayload(tx, student.id, teacher.id, [
            { dayOfWeek: "MONDAY", startTime: "10:00:00", isActive: true },
            { dayOfWeek: "WEDNESDAY", startTime: "14:00:00", isActive: true },
            { dayOfWeek: "FRIDAY", startTime: "09:00:00", isActive: false },
          ]),
          null,
          TEST_RATE_SNAPSHOT,
          tx
        );

        const { recurringScheduleDays } = await import("@/backend/db/schema");
        const days = await tx
          .select()
          .from(recurringScheduleDays)
          .where(eq(recurringScheduleDays.recurringScheduleId, result.recurringScheduleId));

        expect(days).toHaveLength(3);
        expect(days.some(d => d.dayOfWeek === "MONDAY")).toBe(true);
        expect(days.some(d => d.dayOfWeek === "WEDNESDAY")).toBe(true);
        expect(days.some(d => d.dayOfWeek === "FRIDAY")).toBe(true);
      });
    });

    test("applies time overrides per day", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "RecTimeOverride", { skipInstance: true });
        await tx.update(students).set({ classesRemaining: 5 }).where(eq(students.id, student.id));

        const result = await SchedulingRepository.createRecurringScheduleWithInstances(
          await getRecurringPayload(tx, student.id, teacher.id, [
            { dayOfWeek: "MONDAY", startTime: "08:00:00", isActive: true },
            { dayOfWeek: "WEDNESDAY", startTime: "16:00:00", isActive: true },
          ]),
          null,
          TEST_RATE_SNAPSHOT,
          tx
        );

        const instances = await tx
          .select()
          .from(classInstances)
          .where(eq(classInstances.recurringScheduleId, result.recurringScheduleId));

        expect(instances).toHaveLength(2);

        const monInstance = instances.find(i => i.scheduledStartAt.getUTCDay() === 1);
        const wedInstance = instances.find(i => i.scheduledStartAt.getUTCDay() === 3);

        expect(monInstance?.scheduledStartAt.getUTCHours()).toBe(8);
        expect(wedInstance?.scheduledStartAt.getUTCHours()).toBe(16);
      });
    });

    testRepoError("throws on missing teacher assignment", async tx => {
      const { teacher } = await setupTestEntities(tx, "RecNoAssign1", { skipInstance: true });
      const { student: unassignedStudent } = await setupStudent(
        tx,
        { name: "RecNoAssign Parent", email: `recnoassign-parent-${randomUUID()}@example.com` },
        {},
        { name: "RecNoAssign Student" }
      );

      await tx.update(students).set({ classesRemaining: 5 }).where(eq(students.id, unassignedStudent.id));

      await SchedulingRepository.createRecurringScheduleWithInstances(
        {
          studentId: unassignedStudent.id,
          teacherId: teacher.id,
          subjectId: await ensureTestSubjectId(tx),
          durationMinutes: 60,
          defaultStartTime: "10:00:00",
          timezone: IanaTimezone.UTC,
          effectiveFrom: new Date("2026-06-22T00:00:00Z"),
          effectiveUntil: new Date("2026-07-22T00:00:00Z"),
          days: [{ dayOfWeek: "MONDAY", startTime: "10:00:00", isActive: true }],
          classType: "REGULAR",
          generateInstancesForWeeks: 1,
          quotaDeducted: false,
        },
        null,
        TEST_RATE_SNAPSHOT,
        tx
      );
    });
  });

  describe("deleteRecurringClass", () => {
    test("should soft delete a class instance", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "DeleteRecurring", { skipInstance: true });
        const instance = await createMockClassInstance(tx, student.id, teacher.id);

        const result = await SchedulingRepository.deleteRecurringClass(instance.id, tx);

        expect(result).not.toBeNull();
        expect(result?.id).toBe(instance.id);
        const [deleted] = await tx.select().from(classInstances).where(eq(classInstances.id, instance.id));
        expect(deleted.deletedAt).not.toBeNull();
      });
    });

    test("should return false for non-existent class instance", async () => {
      await runInRollback(async tx => {
        const result = await SchedulingRepository.deleteRecurringClass(randomUUID(), tx);
        expect(result).toBeNull();
      });
    });
  });

  describe("clearWeeklySchedule", () => {
    test("should soft delete all recurring schedules for a teacher", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "ClearWeekly1", { skipInstance: true });
        const { student: student2 } = await setupTestEntities(tx, "ClearWeekly2", { skipInstance: true });

        await tx.insert(teacherAssignments).values({
          studentId: student2.id,
          teacherId: teacher.id,
          assignedAt: new Date(),
        });

        await tx.update(students).set({ classesRemaining: 10 }).where(eq(students.id, student.id));
        await tx.update(students).set({ classesRemaining: 10 }).where(eq(students.id, student2.id));

        await SchedulingRepository.createRecurringScheduleWithInstances(
          {
            studentId: student.id,
            teacherId: teacher.id,
            subjectId: await ensureTestSubjectId(tx),
            durationMinutes: 60,
            defaultStartTime: "10:00:00",
            timezone: IanaTimezone.UTC,
            effectiveFrom: new Date("2026-06-22T00:00:00Z"),
            effectiveUntil: new Date("2026-07-22T00:00:00Z"),
            days: [{ dayOfWeek: "MONDAY", startTime: "10:00:00", isActive: true }],
            classType: "REGULAR",
            generateInstancesForWeeks: 1,
            quotaDeducted: false,
          },
          null,
          TEST_RATE_SNAPSHOT,
          tx
        );

        await SchedulingRepository.createRecurringScheduleWithInstances(
          {
            studentId: student2.id,
            teacherId: teacher.id,
            subjectId: await ensureTestSubjectId(tx),
            durationMinutes: 60,
            defaultStartTime: "14:00:00",
            timezone: IanaTimezone.UTC,
            effectiveFrom: new Date("2026-06-22T00:00:00Z"),
            effectiveUntil: new Date("2026-07-22T00:00:00Z"),
            days: [{ dayOfWeek: "WEDNESDAY", startTime: "14:00:00", isActive: true }],
            classType: "REGULAR",
            generateInstancesForWeeks: 1,
            quotaDeducted: false,
          },
          null,
          TEST_RATE_SNAPSHOT,
          tx
        );

        const clearResult = await SchedulingRepository.clearWeeklySchedule(teacher.id, tx);

        expect(clearResult).not.toBeNull();

        const remaining = await tx
          .select()
          .from(recurringSchedules)
          .where(and(eq(recurringSchedules.teacherId, teacher.id), isNull(recurringSchedules.deletedAt)));
        expect(remaining).toHaveLength(0);
      });
    });

    test("should return false for teacher with no schedules", async () => {
      await runInRollback(async tx => {
        const { teacher } = await setupTestEntities(tx, "ClearWeeklyEmpty", { skipInstance: true });

        const result = await SchedulingRepository.clearWeeklySchedule(teacher.id, tx);
        expect(result).toBeNull();
      });
    });
  });

  describe("getTeacherFutureClasses", () => {
    test("returns empty array when teacher has no classes in the date range", async () => {
      await runInRollback(async tx => {
        const { teacher } = await setupTestEntities(tx, "FutureClassesEmpty", { skipInstance: true });

        const fromDate = new Date("2099-01-01T00:00:00Z");
        const toDate = new Date("2099-01-31T23:59:59Z");

        const rows = await SchedulingRepository.getTeacherFutureClasses(teacher.id, fromDate, toDate, tx);
        expect(rows).toEqual([]);
      });
    });

    test("returns only NOT_ACTIVATED and ACTIVATED classes within the date range", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "FutureClassesRange", { skipInstance: true });
        const { teacher: otherTeacher } = await setupTeacher(tx, { name: "FutureOtherTeacher" });

        const fromDate = new Date("2099-06-01T00:00:00Z");
        const toDate = new Date("2099-06-30T23:59:59Z");

        const inRangeActivated = await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: new Date("2099-06-10T10:00:00Z"),
          scheduledEndAt: new Date("2099-06-10T11:00:00Z"),
          executionState: "ACTIVATED",
          isRescheduled: true,
        });

        const inRangeNotActivated = await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: new Date("2099-06-15T10:00:00Z"),
          scheduledEndAt: new Date("2099-06-15T11:00:00Z"),
          executionState: "NOT_ACTIVATED",
        });

        await createMockClassInstance(tx, student.id, otherTeacher.id, {
          scheduledStartAt: new Date("2099-06-20T10:00:00Z"),
          scheduledEndAt: new Date("2099-06-20T11:00:00Z"),
          executionState: "NOT_ACTIVATED",
        });

        await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: new Date("2099-07-05T10:00:00Z"),
          scheduledEndAt: new Date("2099-07-05T11:00:00Z"),
          executionState: "NOT_ACTIVATED",
        });

        const rows = await SchedulingRepository.getTeacherFutureClasses(teacher.id, fromDate, toDate, tx);

        expect(rows).toHaveLength(2);
        const ids = rows.map(r => r.id);
        expect(ids).toContain(inRangeActivated.id);
        expect(ids).toContain(inRangeNotActivated.id);

        const rescheduledRow = rows.find(r => r.id === inRangeActivated.id);
        expect(rescheduledRow?.isRescheduled).toBe(true);
        expect(rescheduledRow?.studentId).toBe(student.id);
        expect(rescheduledRow?.studentName).toBeTruthy();
        expect(rescheduledRow?.durationMinutes).toBe(60);
      });
    });

    test("excludes soft-deleted classes", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "FutureClassesSoftDel", { skipInstance: true });

        const fromDate = new Date("2099-08-01T00:00:00Z");
        const toDate = new Date("2099-08-31T23:59:59Z");

        await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: new Date("2099-08-10T10:00:00Z"),
          scheduledEndAt: new Date("2099-08-10T11:00:00Z"),
          executionState: "NOT_ACTIVATED",
          deletedAt: new Date(),
        });

        const kept = await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: new Date("2099-08-12T10:00:00Z"),
          scheduledEndAt: new Date("2099-08-12T11:00:00Z"),
          executionState: "NOT_ACTIVATED",
        });

        const rows = await SchedulingRepository.getTeacherFutureClasses(teacher.id, fromDate, toDate, tx);

        expect(rows).toHaveLength(1);
        expect(rows[0]?.id).toBe(kept.id);
      });
    });
  });

  describe("RecurringScheduleRepository.findById", () => {
    test("returns schedule with student and teacher names", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "FindById", { skipInstance: true });

        const result = await SchedulingRepository.createRecurringScheduleWithInstances(
          {
            studentId: student.id,
            teacherId: teacher.id,
            subjectId: await ensureTestSubjectId(tx),
            durationMinutes: 45,
            defaultStartTime: "09:00:00",
            timezone: IanaTimezone.UTC,
            effectiveFrom: new Date("2026-06-22T00:00:00Z"),
            effectiveUntil: new Date("2026-07-22T00:00:00Z"),
            days: [{ dayOfWeek: "TUESDAY", startTime: "09:00:00", isActive: true }],
            classType: "REGULAR",
            generateInstancesForWeeks: 1,
            quotaDeducted: false,
          },
          null,
          TEST_RATE_SNAPSHOT,
          tx
        );

        const { RecurringScheduleRepository } = await import(
          "@/backend/db/repo/scheduling/recurring-schedule.repository"
        );
        const row = await RecurringScheduleRepository.findById(result.recurringScheduleId, tx);

        expect(row).not.toBeNull();
        expect(row?.schedule.id).toBe(result.recurringScheduleId);
        expect(row?.schedule.durationMinutes).toBe(45);
        expect(row?.studentName).toBeTruthy();
        expect(row?.teacherUserName).toBeTruthy();
      });
    });

    test("returns null for unknown id", async () => {
      await runInRollback(async tx => {
        const { RecurringScheduleRepository } = await import(
          "@/backend/db/repo/scheduling/recurring-schedule.repository"
        );
        const row = await RecurringScheduleRepository.findById(randomUUID(), tx);
        expect(row).toBeNull();
      });
    });
  });
});
