import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { classCategories, type classInstances, classSubjects } from "@/backend/db/schema";
import { createMockClassInstance, setupStudent, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CalculationStatus } from "@/backend/enum";
import type { ClassInstanceSelectType, DBTransaction } from "@/backend/types";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * P&L payments reads are month-scoped (no teacher/student filter), so every
 * test seeds its own dedicated month. These months are far in the future and
 * unique per test, which keeps exact count/order assertions isolated from
 * pre-existing rows in the shared test database and from parallel test files.
 */
const MONTH_FILTER = "2099-01";
const MONTH_FILTER_OTHER = "2099-02";
const MONTH_STATUS = "2099-03";
const MONTH_PAGINATION = "2099-04";
const MONTH_SOFT_DELETE = "2099-05";
const MONTH_ROW_MAPPING = "2099-06";

function atTime(month: string, day: number, hourUtc: number): Date {
  const dd = String(day).padStart(2, "0");
  const hh = String(hourUtc).padStart(2, "0");
  return new Date(`${month}-${dd}T${hh}:00:00.000Z`);
}

type InstanceOverrides = Partial<typeof classInstances.$inferInsert>;

/**
 * Creates a completed, calculated session whose payroll snapshot is fully
 * populated (payable minutes, amount, currency) — the shape a reportable
 * P&L payment row carries.
 */
async function createProfitLossInstance(
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
    outcome: ClassOutcome.TAKEN,
    actualStartAt: start,
    actualEndAt: new Date(start.getTime() + 60 * 60_000),
    calculationStatus: CalculationStatus.CALCULATED,
    calculatedDuration: 60,
    teacherPaidAmount: "50.00",
    teacherPaidCurrency: CurrencyCode.SAR,
    ...overrides,
  });
}

/** Creates a dedicated subject (plus category) with a deterministic name. */
async function createProfitLossSubject(tx: DBTransaction): Promise<{ id: string; name: string }> {
  const [category] = await tx
    .insert(classCategories)
    .values({
      name: "PnL Payments Category",
      slug: `pnl-payments-cat-${randomUUID().slice(0, 8)}`,
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: classCategories.id });
  if (!category) throw new Error("Failed to create P&L payments test category");

  const [subject] = await tx
    .insert(classSubjects)
    .values({
      categoryId: category.id,
      name: "PnL Payments Subject",
      slug: `pnl-payments-subj-${randomUUID().slice(0, 8)}`,
      isActive: true,
      sortOrder: 0,
    })
    .returning({ id: classSubjects.id, name: classSubjects.name });
  if (!subject) throw new Error("Failed to create P&L payments test subject");
  return subject;
}

interface PaymentsScenario {
  studentId: string;
  teacherId: string;
  subjectId: string;
  subjectName: string;
}

/** Seeds a fresh teacher/student pair plus a dedicated subject. */
async function setupPaymentsScenario(tx: DBTransaction, prefix: string): Promise<PaymentsScenario> {
  const student = await setupStudent(
    tx,
    { email: `${prefix}-stu-${randomUUID().slice(0, 8)}@example.com` },
    {},
    { name: `${prefix} Student` }
  );
  const teacher = await setupTeacher(tx, {
    name: `${prefix} Teacher`,
    email: `${prefix}-tea-${randomUUID().slice(0, 8)}@example.com`,
  });
  const subject = await createProfitLossSubject(tx);
  return {
    studentId: student.student.id,
    teacherId: teacher.teacher.id,
    subjectId: subject.id,
    subjectName: subject.name,
  };
}

describe("Profit & Loss payments repository", () => {
  describe("findProfitLossPayments", () => {
    test("returns only sessions inside the requested month", async () => {
      await runInRollback(async tx => {
        const scenario = await setupPaymentsScenario(tx, "PnLMonth");
        const inMonth = await createProfitLossInstance(
          tx,
          scenario.studentId,
          scenario.teacherId,
          scenario.subjectId,
          atTime(MONTH_FILTER, 10, 10)
        );
        const inOtherMonth = await createProfitLossInstance(
          tx,
          scenario.studentId,
          scenario.teacherId,
          scenario.subjectId,
          atTime(MONTH_FILTER_OTHER, 10, 10)
        );

        const monthPage = await SchedulingRepository.findProfitLossPayments(
          { month: MONTH_FILTER, limit: 50, offset: 0 },
          tx
        );
        expect(monthPage.totalCount).toBe(1);
        expect(monthPage.rows.map(row => row.instanceId)).toEqual([inMonth.id]);
        expect(monthPage.rows.map(row => row.instanceId)).not.toContain(inOtherMonth.id);

        const otherMonthPage = await SchedulingRepository.findProfitLossPayments(
          { month: MONTH_FILTER_OTHER, limit: 50, offset: 0 },
          tx
        );
        expect(otherMonthPage.totalCount).toBe(1);
        expect(otherMonthPage.rows.map(row => row.instanceId)).toEqual([inOtherMonth.id]);
      });
    });

    test("excludes NOT_CALCULATED sessions from the payments tab", async () => {
      await runInRollback(async tx => {
        const scenario = await setupPaymentsScenario(tx, "PnLStatus");
        const calculated = await createProfitLossInstance(
          tx,
          scenario.studentId,
          scenario.teacherId,
          scenario.subjectId,
          atTime(MONTH_STATUS, 11, 10),
          { calculationStatus: CalculationStatus.CALCULATED }
        );
        const paid = await createProfitLossInstance(
          tx,
          scenario.studentId,
          scenario.teacherId,
          scenario.subjectId,
          atTime(MONTH_STATUS, 11, 12),
          { calculationStatus: CalculationStatus.PAID }
        );
        const notCalculated = await createProfitLossInstance(
          tx,
          scenario.studentId,
          scenario.teacherId,
          scenario.subjectId,
          atTime(MONTH_STATUS, 11, 14),
          { calculationStatus: CalculationStatus.NOT_CALCULATED }
        );

        const page = await SchedulingRepository.findProfitLossPayments(
          { month: MONTH_STATUS, limit: 50, offset: 0 },
          tx
        );

        const rowIds = page.rows.map(row => row.instanceId);
        expect(page.totalCount).toBe(2);
        expect(rowIds).toEqual(expect.arrayContaining([calculated.id, paid.id]));
        expect(rowIds).not.toContain(notCalculated.id);
        expect(page.rows.every(row => row.calculationStatus !== CalculationStatus.NOT_CALCULATED)).toBe(true);
      });
    });

    test("pages rows with limit/offset while totalCount stays full", async () => {
      await runInRollback(async tx => {
        const scenario = await setupPaymentsScenario(tx, "PnLPage");
        await createProfitLossInstance(
          tx,
          scenario.studentId,
          scenario.teacherId,
          scenario.subjectId,
          atTime(MONTH_PAGINATION, 12, 10)
        );
        await createProfitLossInstance(
          tx,
          scenario.studentId,
          scenario.teacherId,
          scenario.subjectId,
          atTime(MONTH_PAGINATION, 12, 12)
        );
        await createProfitLossInstance(
          tx,
          scenario.studentId,
          scenario.teacherId,
          scenario.subjectId,
          atTime(MONTH_PAGINATION, 12, 14)
        );

        const firstPage = await SchedulingRepository.findProfitLossPayments(
          { month: MONTH_PAGINATION, limit: 2, offset: 0 },
          tx
        );
        expect(firstPage.totalCount).toBe(3);
        expect(firstPage.rows).toHaveLength(2);
        // Rows are ordered by scheduled start time, newest first.
        expect(firstPage.rows[0].scheduledStartAt).toBe(atTime(MONTH_PAGINATION, 12, 14).toISOString());
        expect(firstPage.rows[1].scheduledStartAt).toBe(atTime(MONTH_PAGINATION, 12, 12).toISOString());

        const secondPage = await SchedulingRepository.findProfitLossPayments(
          { month: MONTH_PAGINATION, limit: 2, offset: 2 },
          tx
        );
        expect(secondPage.totalCount).toBe(3);
        expect(secondPage.rows).toHaveLength(1);
        expect(secondPage.rows[0].scheduledStartAt).toBe(atTime(MONTH_PAGINATION, 12, 10).toISOString());
      });
    });

    test("excludes soft-deleted sessions", async () => {
      await runInRollback(async tx => {
        const scenario = await setupPaymentsScenario(tx, "PnLDeleted");
        const live = await createProfitLossInstance(
          tx,
          scenario.studentId,
          scenario.teacherId,
          scenario.subjectId,
          atTime(MONTH_SOFT_DELETE, 13, 10)
        );
        await createProfitLossInstance(
          tx,
          scenario.studentId,
          scenario.teacherId,
          scenario.subjectId,
          atTime(MONTH_SOFT_DELETE, 13, 12),
          {
            deletedAt: new Date(),
          }
        );

        const page = await SchedulingRepository.findProfitLossPayments(
          { month: MONTH_SOFT_DELETE, limit: 50, offset: 0 },
          tx
        );

        expect(page.totalCount).toBe(1);
        expect(page.rows.map(row => row.instanceId)).toEqual([live.id]);
      });
    });

    test("maps joined payroll snapshot columns for the aggregate inputs", async () => {
      await runInRollback(async tx => {
        const scenario = await setupPaymentsScenario(tx, "PnLMap");
        const fullyCalculated = await createProfitLossInstance(
          tx,
          scenario.studentId,
          scenario.teacherId,
          scenario.subjectId,
          atTime(MONTH_ROW_MAPPING, 14, 10),
          {
            durationMinutes: 60,
            calculatedDuration: 45,
            teacherPaidAmount: "37.50",
            teacherPaidCurrency: CurrencyCode.USD,
          }
        );
        const partiallyCalculated = await createProfitLossInstance(
          tx,
          scenario.studentId,
          scenario.teacherId,
          scenario.subjectId,
          atTime(MONTH_ROW_MAPPING, 14, 12),
          {
            calculationStatus: CalculationStatus.PARTIALLY,
            isPartialPercentage: 50,
            calculatedDuration: null,
            teacherPaidAmount: "25.00",
            teacherPaidCurrency: CurrencyCode.SAR,
          }
        );
        const snapshotWithoutCurrency = await createProfitLossInstance(
          tx,
          scenario.studentId,
          scenario.teacherId,
          scenario.subjectId,
          atTime(MONTH_ROW_MAPPING, 14, 14),
          { teacherPaidAmount: null, teacherPaidCurrency: null }
        );

        const page = await SchedulingRepository.findProfitLossPayments(
          { month: MONTH_ROW_MAPPING, limit: 50, offset: 0 },
          tx
        );

        expect(page.totalCount).toBe(3);
        const rowById = new Map(page.rows.map(row => [row.instanceId, row]));

        const calculatedRow = rowById.get(fullyCalculated.id);
        if (!calculatedRow) throw new Error("fully-calculated row missing from page");
        expect(calculatedRow.teacherName).toBe("PnLMap Teacher");
        expect(calculatedRow.studentName).toBe("PnLMap Student");
        expect(calculatedRow.subjectName).toBe(scenario.subjectName);
        // Payable minutes win over the scheduled duration.
        expect(calculatedRow.durationMinutes).toBe(45);
        expect(calculatedRow.teacherPaidAmount).toBe("37.50");
        expect(calculatedRow.teacherPaidCurrency).toBe(CurrencyCode.USD);
        expect(calculatedRow.calculationStatus).toBe(CalculationStatus.CALCULATED);

        const partialRow = rowById.get(partiallyCalculated.id);
        if (!partialRow) throw new Error("partially-calculated row missing from page");
        // No payable-minutes snapshot: falls back to the scheduled duration.
        expect(partialRow.durationMinutes).toBe(60);
        expect(partialRow.calculationStatus).toBe(CalculationStatus.PARTIALLY);

        const fallbackRow = rowById.get(snapshotWithoutCurrency.id);
        if (!fallbackRow) throw new Error("fallback row missing from page");
        // Missing payroll amount/currency snapshot passes through raw; the
        // service layer applies the zero / house-default fallbacks.
        expect(fallbackRow.teacherPaidAmount).toBeNull();
        expect(fallbackRow.teacherPaidCurrency).toBeNull();
      });
    });

    test.each(["%", "%%", ".*", "2099-%", "2099-1", ""])(
      "a wildcard or malformed month %j matches no rows instead of widening the filter",
      async rawMonth => {
        await runInRollback(async tx => {
          const scenario = await setupPaymentsScenario(tx, "PnLWildcard");
          await createProfitLossInstance(
            tx,
            scenario.studentId,
            scenario.teacherId,
            scenario.subjectId,
            atTime(MONTH_FILTER, 3, 9)
          );

          const page = await SchedulingRepository.findProfitLossPayments({ month: rawMonth, limit: 50, offset: 0 }, tx);

          expect(page.rows).toHaveLength(0);
          expect(page.totalCount).toBe(0);
        });
      }
    );
  });
});
