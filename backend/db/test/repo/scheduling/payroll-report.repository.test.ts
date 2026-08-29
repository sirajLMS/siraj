import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { ClassStatusEventsRepository, SchedulingRepository } from "@/backend/db/repo/scheduling";
import { classCategories, type classInstances, classSubjects } from "@/backend/db/schema";
import { createMockClassInstance, setupTestEntities } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CalculationStatus } from "@/backend/enum";
import type { ClassInstanceSelectType, DBTransaction } from "@/backend/types";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";

/** Fixed scheduled dates keep date-range and ordering assertions deterministic. */
const DAY_ONE = "2026-08-10";
const DAY_TWO = "2026-08-12";
const DAY_THREE = "2026-08-14";
const DAY_FOUR = "2026-08-16";

/** class_status_events.event_type for operator payroll overrides (free-form varchar column). */
const PAYROLL_OVERRIDE_EVENT_TYPE = "PAYROLL_OVERRIDE";

function atTime(isoDate: string, hourUtc: number, minuteUtc = 0): Date {
  const hh = String(hourUtc).padStart(2, "0");
  const mm = String(minuteUtc).padStart(2, "0");
  return new Date(`${isoDate}T${hh}:${mm}:00.000Z`);
}

/** Creates a dedicated subject (plus its category) so subject-name assertions are deterministic. */
async function createReportSubject(tx: DBTransaction): Promise<{ id: string; name: string }> {
  const [category] = await tx
    .insert(classCategories)
    .values({
      name: "Payroll Report Category",
      slug: `payroll-report-cat-${randomUUID().slice(0, 8)}`,
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: classCategories.id });
  if (!category) throw new Error("Failed to create payroll report test category");

  const [subject] = await tx
    .insert(classSubjects)
    .values({
      categoryId: category.id,
      name: "Payroll Report Subject",
      slug: `payroll-report-subj-${randomUUID().slice(0, 8)}`,
      isActive: true,
      sortOrder: 0,
    })
    .returning({ id: classSubjects.id, name: classSubjects.name });
  if (!subject) throw new Error("Failed to create payroll report test subject");
  return subject;
}

type InstanceOverrides = Partial<typeof classInstances.$inferInsert>;

async function createCompletedInstance(
  tx: DBTransaction,
  studentId: string,
  teacherId: string,
  subjectId: string,
  start: Date,
  overrides: InstanceOverrides = {}
): Promise<ClassInstanceSelectType> {
  return createMockClassInstance(tx, studentId, teacherId, {
    subjectId,
    scheduledStartAt: start,
    scheduledEndAt: new Date(start.getTime() + 60 * 60_000),
    durationMinutes: 60,
    executionState: ClassExecutionState.COMPLETED,
    ...overrides,
  });
}

interface ReportScenario {
  firstTeacherId: string;
  secondStudentId: string;
  subjectName: string;
  studentAbsent: ClassInstanceSelectType;
  teacherAbsent: ClassInstanceSelectType;
  refunded: ClassInstanceSelectType;
  notCalculated: ClassInstanceSelectType;
  otherTeacher: ClassInstanceSelectType;
}

/**
 * Seeds the first teacher/student pair with four reportable instances
 * covering every absence-rule branch and calculation status.
 */
async function createFirstPairInstances(
  tx: DBTransaction,
  studentId: string,
  teacherId: string,
  subjectId: string
): Promise<Pick<ReportScenario, "studentAbsent" | "teacherAbsent" | "refunded" | "notCalculated">> {
  const studentAbsent = await createCompletedInstance(tx, studentId, teacherId, subjectId, atTime(DAY_ONE, 10), {
    outcome: ClassOutcome.ABSENT,
    actualStartAt: atTime(DAY_ONE, 10, 5),
    actualEndAt: atTime(DAY_ONE, 11, 5),
    calculationStatus: CalculationStatus.CALCULATED,
    calculatedDuration: 60,
    teacherPaidAmount: "50.00",
    teacherPaidCurrency: CurrencyCode.USD,
  });

  const teacherAbsent = await createCompletedInstance(tx, studentId, teacherId, subjectId, atTime(DAY_TWO, 10), {
    outcome: ClassOutcome.LEAVE,
    calculationStatus: CalculationStatus.CALCULATED,
    calculatedDuration: 0,
    teacherPaidAmount: "0",
    teacherPaidCurrency: CurrencyCode.USD,
  });

  const refunded = await createCompletedInstance(tx, studentId, teacherId, subjectId, atTime(DAY_THREE, 10), {
    outcome: ClassOutcome.TAKEN,
    actualStartAt: atTime(DAY_THREE, 10),
    actualEndAt: atTime(DAY_THREE, 11),
    calculationStatus: CalculationStatus.REFUND,
    calculatedDuration: 60,
    teacherPaidAmount: "0",
    teacherPaidCurrency: CurrencyCode.USD,
    payrollNote: "parent refund",
  });

  const notCalculated = await createCompletedInstance(tx, studentId, teacherId, subjectId, atTime(DAY_FOUR, 10), {
    outcome: ClassOutcome.TAKEN,
    actualStartAt: atTime(DAY_FOUR, 10),
    actualEndAt: atTime(DAY_FOUR, 11),
  });

  return { studentAbsent, teacherAbsent, refunded, notCalculated };
}

/**
 * Seeds two teacher/student pairs and five reportable instances plus one
 * soft-deleted instance. Teacher-scoped filters keep every assertion
 * isolated from pre-existing rows in the shared test database.
 */
async function setupReportScenario(tx: DBTransaction): Promise<ReportScenario> {
  const first = await setupTestEntities(tx, "PayRpt1", { skipInstance: true });
  const second = await setupTestEntities(tx, "PayRpt2", { skipInstance: true });
  const subject = await createReportSubject(tx);

  const firstPair = await createFirstPairInstances(tx, first.student.id, first.teacher.id, subject.id);

  await createCompletedInstance(tx, first.student.id, first.teacher.id, subject.id, atTime(DAY_ONE, 14), {
    outcome: ClassOutcome.TAKEN,
    actualStartAt: atTime(DAY_ONE, 14),
    actualEndAt: atTime(DAY_ONE, 15),
    deletedAt: new Date(),
  });

  const otherTeacher = await createCompletedInstance(
    tx,
    second.student.id,
    second.teacher.id,
    subject.id,
    atTime(DAY_TWO, 12),
    {
      outcome: ClassOutcome.TAKEN,
      actualStartAt: atTime(DAY_TWO, 12),
      actualEndAt: atTime(DAY_TWO, 12, 45),
      durationMinutes: 45,
      scheduledEndAt: atTime(DAY_TWO, 12, 45),
      calculationStatus: CalculationStatus.CALCULATED,
      calculatedDuration: 45,
      teacherPaidAmount: "37.50",
      teacherPaidCurrency: CurrencyCode.USD,
    }
  );

  return {
    firstTeacherId: first.teacher.id,
    secondStudentId: second.student.id,
    subjectName: subject.name,
    ...firstPair,
    otherTeacher,
  };
}

async function insertOverrideEvent(tx: DBTransaction, instanceId: string, hash: string, createdAt: Date) {
  const [event] = await ClassStatusEventsRepository.createMany(
    [
      {
        classInstanceId: instanceId,
        eventType: PAYROLL_OVERRIDE_EVENT_TYPE,
        fromState: { calculationStatus: CalculationStatus.CALCULATED },
        toState: { idempotencyKey: hash },
        description: null,
        actorUserId: null,
        createdAt,
      },
    ],
    tx
  );
  if (!event) throw new Error("Failed to insert payroll override event");
  return event;
}

/** Asserts the page contains exactly the expected instances, order-independent. */
function expectInstanceIds(rows: { instanceId: string }[], expectedIds: string[]): void {
  expect(rows).toHaveLength(expectedIds.length);
  expect(rows.map(row => row.instanceId)).toEqual(expect.arrayContaining(expectedIds));
}

describe("Payroll report repository", () => {
  describe("findPayrollReportRows", () => {
    test("joins teacher, student, and subject names with SQL-computed absence flags", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const { rows } = await SchedulingRepository.findPayrollReportRows(
          { teacherId: scenario.firstTeacherId },
          { limit: 50, offset: 0 },
          tx
        );

        const studentAbsentRow = rows.find(row => row.instanceId === scenario.studentAbsent.id);
        if (!studentAbsentRow) throw new Error("student-absence row missing from report");
        expect(studentAbsentRow.teacherId).toBe(scenario.firstTeacherId);
        expect(studentAbsentRow.teacherName).toBe("PayRpt1 TeacherUser");
        expect(studentAbsentRow.studentName).toBe("PayRpt1 Student");
        expect(studentAbsentRow.subjectName).toBe(scenario.subjectName);
        expect(studentAbsentRow.subjectId).toBe(scenario.studentAbsent.subjectId);
        expect(studentAbsentRow.scheduledStartAt).toBe(`${DAY_ONE}T10:00:00.000Z`);
        expect(studentAbsentRow.scheduledEndAt).toBe(`${DAY_ONE}T11:00:00.000Z`);
        expect(studentAbsentRow.scheduledDurationMinutes).toBe(60);
        expect(studentAbsentRow.actualStartAt).toBe(`${DAY_ONE}T10:05:00.000Z`);
        expect(studentAbsentRow.actualEndAt).toBe(`${DAY_ONE}T11:05:00.000Z`);
        expect(studentAbsentRow.calculatedDuration).toBe(60);
        expect(studentAbsentRow.teacherPaidAmount).toBe("50.00");
        expect(studentAbsentRow.teacherPaidCurrency).toBe(CurrencyCode.USD);
        expect(studentAbsentRow.calculationStatus).toBe(CalculationStatus.CALCULATED);
        expect(studentAbsentRow.isPartialPercentage).toBeNull();
        expect(studentAbsentRow.payrollNote).toBeNull();
        expect(studentAbsentRow.isStudentAbsence).toBe(true);
        expect(studentAbsentRow.isTeacherAbsence).toBe(false);

        const teacherAbsentRow = rows.find(row => row.instanceId === scenario.teacherAbsent.id);
        if (!teacherAbsentRow) throw new Error("teacher-absence row missing from report");
        expect(teacherAbsentRow.actualStartAt).toBeNull();
        expect(teacherAbsentRow.actualEndAt).toBeNull();
        expect(teacherAbsentRow.teacherPaidAmount).toBe("0");
        expect(teacherAbsentRow.isStudentAbsence).toBe(false);
        expect(teacherAbsentRow.isTeacherAbsence).toBe(true);

        const refundedRow = rows.find(row => row.instanceId === scenario.refunded.id);
        if (!refundedRow) throw new Error("refund row missing from report");
        expect(refundedRow.calculationStatus).toBe(CalculationStatus.REFUND);
        expect(refundedRow.payrollNote).toBe("parent refund");
        expect(refundedRow.isStudentAbsence).toBe(false);
        expect(refundedRow.isTeacherAbsence).toBe(false);
      });
    });

    test("flags a session both the student and teacher missed as teacher-absent", async () => {
      await runInRollback(async tx => {
        // An absent outcome with no join telemetry is a teacher absence,
        // mirroring the calculator branch: the session was never taught.
        const { student, teacher } = await setupTestEntities(tx, "PayBoth", { skipInstance: true });
        const subject = await createReportSubject(tx);
        const bothMissed = await createCompletedInstance(tx, student.id, teacher.id, subject.id, atTime(DAY_ONE, 9), {
          outcome: ClassOutcome.ABSENT,
          actualStartAt: null,
          actualEndAt: null,
          calculationStatus: CalculationStatus.CALCULATED,
          calculatedDuration: 0,
          teacherPaidAmount: "0",
          teacherPaidCurrency: CurrencyCode.USD,
        });

        const { rows } = await SchedulingRepository.findPayrollReportRows(
          { teacherId: teacher.id },
          { limit: 10, offset: 0 },
          tx
        );

        const row = rows.find(r => r.instanceId === bothMissed.id);
        if (!row) throw new Error("both-missed row missing from report");
        expect(row.isStudentAbsence).toBe(false);
        expect(row.isTeacherAbsence).toBe(true);
      });
    });

    test("filters by teacher id and excludes soft-deleted instances", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const { rows, totalCount } = await SchedulingRepository.findPayrollReportRows(
          { teacherId: scenario.firstTeacherId },
          { limit: 50, offset: 0 },
          tx
        );

        expect(rows).toHaveLength(4);
        expect(totalCount).toBe(4);
        const ids = rows.map(row => row.instanceId);
        expect(ids).toContain(scenario.studentAbsent.id);
        expect(ids).toContain(scenario.teacherAbsent.id);
        expect(ids).toContain(scenario.refunded.id);
        expect(ids).toContain(scenario.notCalculated.id);
        expect(ids).not.toContain(scenario.otherTeacher.id);
      });
    });

    test("filters by student id", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const { rows, totalCount } = await SchedulingRepository.findPayrollReportRows(
          { studentId: scenario.secondStudentId },
          { limit: 50, offset: 0 },
          tx
        );

        expect(rows).toHaveLength(1);
        expect(totalCount).toBe(1);
        expect(rows[0]?.instanceId).toBe(scenario.otherTeacher.id);
      });
    });

    test("filters by an inclusive scheduled-date range", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const withinRange = await SchedulingRepository.findPayrollReportRows(
          { teacherId: scenario.firstTeacherId, dateFrom: DAY_TWO, dateTo: DAY_THREE },
          { limit: 50, offset: 0 },
          tx
        );
        expectInstanceIds(withinRange.rows, [scenario.teacherAbsent.id, scenario.refunded.id]);
        expect(withinRange.totalCount).toBe(2);

        const fullRange = await SchedulingRepository.findPayrollReportRows(
          { teacherId: scenario.firstTeacherId, dateFrom: DAY_ONE, dateTo: DAY_FOUR },
          { limit: 50, offset: 0 },
          tx
        );
        expect(fullRange.totalCount).toBe(4);
      });
    });

    test("filters by multiple calculation statuses", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const { rows, totalCount } = await SchedulingRepository.findPayrollReportRows(
          {
            teacherId: scenario.firstTeacherId,
            calculationStatuses: [CalculationStatus.REFUND, CalculationStatus.NOT_CALCULATED],
          },
          { limit: 50, offset: 0 },
          tx
        );

        expectInstanceIds(rows, [scenario.refunded.id, scenario.notCalculated.id]);
        expect(totalCount).toBe(2);
      });
    });

    test("treats an empty status list as no filter", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const { totalCount } = await SchedulingRepository.findPayrollReportRows(
          { teacherId: scenario.firstTeacherId, calculationStatuses: [] },
          { limit: 50, offset: 0 },
          tx
        );
        expect(totalCount).toBe(4);
      });
    });

    test("matches teacher and student names case-insensitively", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);

        const byTeacherName = await SchedulingRepository.findPayrollReportRows(
          { search: "payrpt2 teacheruser" },
          { limit: 50, offset: 0 },
          tx
        );
        expect(byTeacherName.rows.map(row => row.instanceId)).toEqual([scenario.otherTeacher.id]);

        const byStudentName = await SchedulingRepository.findPayrollReportRows(
          { search: "PAYRPT1 STUDENT" },
          { limit: 50, offset: 0 },
          tx
        );
        expect(byStudentName.totalCount).toBe(4);
      });
    });

    test("escapes LIKE wildcards in the search term", async () => {
      await runInRollback(async tx => {
        const { rows, totalCount } = await SchedulingRepository.findPayrollReportRows(
          { search: "%PayRpt1%" },
          { limit: 50, offset: 0 },
          tx
        );
        expect(rows).toHaveLength(0);
        expect(totalCount).toBe(0);
      });
    });

    test("ignores a blank search term", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const { totalCount } = await SchedulingRepository.findPayrollReportRows(
          { teacherId: scenario.firstTeacherId, search: "   " },
          { limit: 50, offset: 0 },
          tx
        );
        expect(totalCount).toBe(4);
      });
    });

    test("paginates with limit and offset while totalCount reflects the full filtered set", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);

        const firstPage = await SchedulingRepository.findPayrollReportRows(
          { teacherId: scenario.firstTeacherId },
          { limit: 2, offset: 0 },
          tx
        );
        expect(firstPage.rows.map(row => row.instanceId)).toEqual([scenario.notCalculated.id, scenario.refunded.id]);
        expect(firstPage.totalCount).toBe(4);

        const secondPage = await SchedulingRepository.findPayrollReportRows(
          { teacherId: scenario.firstTeacherId },
          { limit: 2, offset: 2 },
          tx
        );
        expect(secondPage.rows.map(row => row.instanceId)).toEqual([
          scenario.teacherAbsent.id,
          scenario.studentAbsent.id,
        ]);
        expect(secondPage.totalCount).toBe(4);

        const beyondEnd = await SchedulingRepository.findPayrollReportRows(
          { teacherId: scenario.firstTeacherId },
          { limit: 2, offset: 4 },
          tx
        );
        expect(beyondEnd.rows).toHaveLength(0);
        expect(beyondEnd.totalCount).toBe(4);
      });
    });
  });

  describe("getById", () => {
    test("returns the bare class instance row", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const row = await SchedulingRepository.getById(scenario.refunded.id, tx);
        if (!row) throw new Error("getById should return the instance row");
        expect(row.id).toBe(scenario.refunded.id);
        expect(row.calculationStatus).toBe(CalculationStatus.REFUND);
        expect(row.teacherPaidAmount).toBe("0");
        expect(row.outcome).toBe(ClassOutcome.TAKEN);
      });
    });

    test("returns null for an unknown id", async () => {
      await runInRollback(async tx => {
        const row = await SchedulingRepository.getById(randomUUID(), tx);
        expect(row).toBeNull();
      });
    });

    test("locks the row for update inside the caller's transaction", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const row = await SchedulingRepository.getById(scenario.notCalculated.id, tx, { forUpdate: true });
        if (!row) throw new Error("getById forUpdate should return the instance row");
        expect(row.id).toBe(scenario.notCalculated.id);
        expect(row.teacherId).toBe(scenario.firstTeacherId);
        expect(row.calculationStatus).toBe(CalculationStatus.NOT_CALCULATED);
      });
    });

    test("rejects a forUpdate read without a transaction", () => {
      // Fail fast over a silent no-op: outside a transaction the FOR UPDATE
      // lock evaporates the moment the statement finishes. The guard throws
      // before any statement executes, so no rollback wrapper is needed.
      return expect(SchedulingRepository.getById(randomUUID(), undefined, { forUpdate: true })).rejects.toThrow(
        /forUpdate requires a transaction/
      );
    });
  });

  describe("updatePayrollCalculation", () => {
    test("applies a full payroll patch and returns the updated row", async () => {
      await runInRollback(async tx => {
        const { student, teacher, teacherUser } = await setupTestEntities(tx, "PayUpd1", { skipInstance: true });
        const instance = await createMockClassInstance(tx, student.id, teacher.id);
        const calculatedAt = new Date();

        const updated = await SchedulingRepository.updatePayrollCalculation(tx, instance.id, {
          calculationStatus: CalculationStatus.PARTIALLY,
          calculatedDuration: 60,
          teacherPaidAmount: "25.00",
          teacherPaidCurrency: CurrencyCode.USD,
          isPartialPercentage: 50,
          payrollNote: "half session",
          payrollCalculatedAt: calculatedAt,
          payrollCalculatedBy: teacherUser.id,
        });
        if (!updated) throw new Error("updatePayrollCalculation should return the updated row");
        expect(updated.calculationStatus).toBe(CalculationStatus.PARTIALLY);
        expect(updated.calculatedDuration).toBe(60);
        expect(updated.teacherPaidAmount).toBe("25.00");
        expect(updated.teacherPaidCurrency).toBe(CurrencyCode.USD);
        expect(updated.isPartialPercentage).toBe(50);
        expect(updated.payrollNote).toBe("half session");
        expect(updated.payrollCalculatedAt?.toISOString()).toBe(calculatedAt.toISOString());
        expect(updated.payrollCalculatedBy).toBe(teacherUser.id);
        expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(instance.updatedAt.getTime());

        const reread = await SchedulingRepository.getById(instance.id, tx);
        expect(reread?.calculationStatus).toBe(CalculationStatus.PARTIALLY);
        expect(reread?.isPartialPercentage).toBe(50);
      });
    });

    test("applies a partial patch without clearing untouched payroll columns", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const updated = await SchedulingRepository.updatePayrollCalculation(tx, scenario.refunded.id, {
          calculationStatus: CalculationStatus.CALCULATED,
        });
        if (!updated) throw new Error("updatePayrollCalculation should return the updated row");
        expect(updated.calculationStatus).toBe(CalculationStatus.CALCULATED);
        expect(updated.calculatedDuration).toBe(60);
        expect(updated.teacherPaidAmount).toBe("0");
        expect(updated.payrollNote).toBe("parent refund");
      });
    });

    test("returns null when the instance does not exist", async () => {
      await runInRollback(async tx => {
        const updated = await SchedulingRepository.updatePayrollCalculation(tx, randomUUID(), {
          calculationStatus: CalculationStatus.CALCULATED,
        });
        expect(updated).toBeNull();
      });
    });

    test("flips the row when the expected status still matches", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        await SchedulingRepository.updatePayrollCalculation(tx, scenario.refunded.id, {
          calculationStatus: CalculationStatus.WAITING_PAID,
        });

        const updated = await SchedulingRepository.updatePayrollCalculation(
          tx,
          scenario.refunded.id,
          { calculationStatus: CalculationStatus.PAID },
          { expectedStatus: CalculationStatus.WAITING_PAID }
        );

        if (!updated) throw new Error("the preconditioned update should return the updated row");
        expect(updated.calculationStatus).toBe(CalculationStatus.PAID);
        expect(updated.teacherPaidAmount).toBe("0");

        const reread = await SchedulingRepository.getById(scenario.refunded.id, tx);
        expect(reread?.calculationStatus).toBe(CalculationStatus.PAID);
      });
    });

    test("returns null and leaves the row untouched when the status no longer matches", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);

        // A forced override committed REFUND after a settlement transaction
        // read the row as WAITING_PAID: the preconditioned PAID flip matches
        // zero rows and the refund must stand.
        const updated = await SchedulingRepository.updatePayrollCalculation(
          tx,
          scenario.refunded.id,
          { calculationStatus: CalculationStatus.PAID },
          { expectedStatus: CalculationStatus.WAITING_PAID }
        );

        expect(updated).toBeNull();
        const reread = await SchedulingRepository.getById(scenario.refunded.id, tx);
        expect(reread?.calculationStatus).toBe(CalculationStatus.REFUND);
        expect(reread?.teacherPaidAmount).toBe("0");
        expect(reread?.payrollNote).toBe("parent refund");
      });
    });
  });

  describe("findRecentByInstanceAndHash", () => {
    test("returns the most recent matching event inside the window", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const hash = randomUUID();
        const older = await insertOverrideEvent(tx, scenario.refunded.id, hash, new Date(Date.now() - 1000));
        const newer = await insertOverrideEvent(tx, scenario.refunded.id, hash, new Date());

        const found = await ClassStatusEventsRepository.findRecentByInstanceAndHash(scenario.refunded.id, hash, 30, tx);
        expect(found?.id).toBe(newer.id);
        expect(found?.id).not.toBe(older.id);
      });
    });

    test("returns null when the hash does not match", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        await insertOverrideEvent(tx, scenario.refunded.id, randomUUID(), new Date());

        const found = await ClassStatusEventsRepository.findRecentByInstanceAndHash(
          scenario.refunded.id,
          randomUUID(),
          30,
          tx
        );
        expect(found).toBeNull();
      });
    });

    test("returns null when the matching event is older than the window", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const hash = randomUUID();
        await insertOverrideEvent(tx, scenario.refunded.id, hash, new Date(Date.now() - 40_000));

        const found = await ClassStatusEventsRepository.findRecentByInstanceAndHash(scenario.refunded.id, hash, 30, tx);
        expect(found).toBeNull();
      });
    });

    test("matches an event near the window edge", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const hash = randomUUID();
        const event = await insertOverrideEvent(tx, scenario.refunded.id, hash, new Date(Date.now() - 20_000));

        const found = await ClassStatusEventsRepository.findRecentByInstanceAndHash(scenario.refunded.id, hash, 30, tx);
        expect(found?.id).toBe(event.id);
      });
    });

    test("returns null when the matching event belongs to another instance", async () => {
      await runInRollback(async tx => {
        const scenario = await setupReportScenario(tx);
        const hash = randomUUID();
        await insertOverrideEvent(tx, scenario.otherTeacher.id, hash, new Date());

        const found = await ClassStatusEventsRepository.findRecentByInstanceAndHash(scenario.refunded.id, hash, 30, tx);
        expect(found).toBeNull();
      });
    });
  });
});
