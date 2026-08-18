import { describe, expect, test } from "bun:test";
import { ReportRepository } from "@/backend/db/repo/books";
import { createMockClassInstance, setupTestEntities } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { ReportGroupingMode } from "@/backend/enum";
import type { AttendanceReportPaidAmountReturnType, AttendanceReportRow, DBTransaction } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

function paidAmountForCurrency(row: AttendanceReportRow, currency: CurrencyCode): number {
  const entry = row.paidAmounts.find((amount: AttendanceReportPaidAmountReturnType) => amount.currency === currency);
  return entry ? Number(entry.amount) : 0;
}

function reportRepoTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      await fn(tx);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

/** Date range covering all mock class instances created in setupTestData (May 2026). */
const MAYFromDate = new Date("2026-05-01T00:00:00Z");
const MAYToDate = new Date("2026-05-31T23:59:59Z");

/** Builds standard attendance-report filters for the May 2026 date range with the given grouping. */
function buildMayFilters(teacherId: string, groupBy: ReportGroupingMode) {
  return { fromDate: MAYFromDate, toDate: MAYToDate, teacherId, groupBy };
}

/** Asserts the common aggregate totals expected when all four mock class instances are present. */
function expectAllInstancesAggregated(row: AttendanceReportRow) {
  expect(row.takenClasses).toBe(1);
  expect(row.absentClasses).toBe(1);
  expect(row.leaveClasses).toBe(1);
  expect(row.pendingClasses).toBe(1);
  expect(row.totalHours).toBe(5.5); // 1.0 + 1.5 + 2.0 + 1.0
  expect(paidAmountForCurrency(row, CurrencyCode.EGP)).toBe(250); // 100 + 150
  expect(paidAmountForCurrency(row, CurrencyCode.USD)).toBe(50);
}

/**
 * Runs the attendance report grouped by `groupBy`, asserts a single-row result,
 * and validates the group key/label plus aggregate totals for all four mock instances.
 * Used by TEACHER and STUDENT grouping tests that share the same single-row structure.
 */
async function expectSingleRowAggregatedReport(
  tx: DBTransaction,
  teacherId: string,
  groupBy: ReportGroupingMode,
  expectedGroupKey: string,
  expectedGroupLabel: string
) {
  const filters = buildMayFilters(teacherId, groupBy);

  const results = await ReportRepository.generateAttendanceReport(filters, tx);

  expect(results).toHaveLength(1);

  const row = results[0];
  expect(row.groupKey).toBe(expectedGroupKey);
  expect(row.groupLabel).toBe(expectedGroupLabel);
  expectAllInstancesAggregated(row);

  return { row };
}

async function setupTestData(tx: DBTransaction) {
  // Setup teacher and student entities using setupTestEntities helper
  const { student, teacher, teacherUser } = await setupTestEntities(tx, "rep");

  // Define distinct dates in UTC to avoid timezone alignment variance
  const date1 = new Date("2026-05-10T10:00:00.000Z");
  const date2 = new Date("2026-05-11T12:00:00.000Z");
  const date3 = new Date("2026-05-12T14:00:00.000Z");
  const date4 = new Date("2026-05-13T16:00:00.000Z");

  // Create class instances with various outcomes and rates
  // Instance 1: TAKEN, 60 minutes, rate 100.00 EGP
  await createMockClassInstance(tx, student.id, teacher.id, {
    scheduledStartAt: date1,
    scheduledEndAt: new Date(date1.getTime() + 60 * 60 * 1000),
    durationMinutes: 60,
    outcome: "TAKEN",
    executionState: "COMPLETED",
    actualStartAt: date1,
    actualEndAt: new Date(date1.getTime() + 60 * 60 * 1000),
    rateAmount: "100.00",
    rateCurrency: CurrencyCode.EGP,
  });

  // Instance 2: ABSENT, 90 minutes, rate 150.00 EGP
  await createMockClassInstance(tx, student.id, teacher.id, {
    scheduledStartAt: date2,
    scheduledEndAt: new Date(date2.getTime() + 90 * 60 * 1000),
    durationMinutes: 90,
    outcome: "ABSENT",
    executionState: "COMPLETED",
    rateAmount: "150.00",
    rateCurrency: CurrencyCode.EGP,
  });

  // Instance 3: LEAVE, 120 minutes, rate 50.00 USD
  await createMockClassInstance(tx, student.id, teacher.id, {
    scheduledStartAt: date3,
    scheduledEndAt: new Date(date3.getTime() + 120 * 60 * 1000),
    durationMinutes: 120,
    outcome: "LEAVE",
    executionState: "COMPLETED",
    rateAmount: "50.00",
    rateCurrency: CurrencyCode.USD,
  });

  // Instance 4: PENDING, 60 minutes, rate 0.00 EGP
  await createMockClassInstance(tx, student.id, teacher.id, {
    scheduledStartAt: date4,
    scheduledEndAt: new Date(date4.getTime() + 60 * 60 * 1000),
    durationMinutes: 60,
    outcome: "PENDING",
    executionState: "NOT_ACTIVATED",
    rateAmount: "0.00",
    rateCurrency: CurrencyCode.EGP,
  });

  return { student, teacher, teacherUser, date1, date2, date3, date4 };
}

describe("ReportRepository — generateAttendanceReport", () => {
  reportRepoTest("aggregates and groups correctly by DATE", async tx => {
    // Arrange
    const { teacher } = await setupTestData(tx);

    const filters = buildMayFilters(teacher.id, ReportGroupingMode.DATE);

    // Act
    const results = await ReportRepository.generateAttendanceReport(filters, tx);

    // Assert
    expect(results).toHaveLength(4);

    // Sort results by groupKey to make tests deterministic
    const sorted = [...results].toSorted((a, b) => a.groupKey.localeCompare(b.groupKey));

    // date1: TAKEN, 1.0 hour, 100 EGP
    expect(sorted[0].takenClasses).toBe(1);
    expect(sorted[0].absentClasses).toBe(0);
    expect(sorted[0].totalHours).toBe(1);
    expect(paidAmountForCurrency(sorted[0], CurrencyCode.EGP)).toBe(100);
    expect(paidAmountForCurrency(sorted[0], CurrencyCode.USD)).toBe(0);

    // date2: ABSENT, 1.5 hours, 150 EGP
    expect(sorted[1].takenClasses).toBe(0);
    expect(sorted[1].absentClasses).toBe(1);
    expect(sorted[1].totalHours).toBe(1.5);
    expect(paidAmountForCurrency(sorted[1], CurrencyCode.EGP)).toBe(150);
    expect(paidAmountForCurrency(sorted[1], CurrencyCode.USD)).toBe(0);

    // date3: LEAVE, 2.0 hours, 50 USD
    expect(sorted[2].takenClasses).toBe(0);
    expect(sorted[2].leaveClasses).toBe(1);
    expect(sorted[2].totalHours).toBe(2);
    expect(paidAmountForCurrency(sorted[2], CurrencyCode.EGP)).toBe(0);
    expect(paidAmountForCurrency(sorted[2], CurrencyCode.USD)).toBe(50);

    // date4: PENDING, 1.0 hour, 0 EGP
    expect(sorted[3].takenClasses).toBe(0);
    expect(sorted[3].pendingClasses).toBe(1);
    expect(sorted[3].totalHours).toBe(1);
    expect(paidAmountForCurrency(sorted[3], CurrencyCode.EGP)).toBe(0);
    expect(paidAmountForCurrency(sorted[3], CurrencyCode.USD)).toBe(0);
  });

  reportRepoTest("aggregates and groups correctly by TEACHER", async tx => {
    const { teacher, teacherUser } = await setupTestData(tx);
    const { row } = await expectSingleRowAggregatedReport(
      tx,
      teacher.id,
      ReportGroupingMode.TEACHER,
      teacher.id,
      teacherUser.name
    );
    expect(row).toBeDefined();
  });

  reportRepoTest("filters by teacherId correctly", async tx => {
    // Arrange
    const { teacher } = await setupTestData(tx);

    // Seed another teacher and student to test teacher filtering isolation
    const otherSetup = await setupTestEntities(tx, "other");
    const otherTeacher = otherSetup.teacher;
    const otherStudent = otherSetup.student;

    await createMockClassInstance(tx, otherStudent.id, otherTeacher.id, {
      scheduledStartAt: new Date("2026-05-15T10:00:00Z"),
      scheduledEndAt: new Date("2026-05-15T11:00:00Z"),
      durationMinutes: 60,
      outcome: "TAKEN",
      executionState: "COMPLETED",
      actualStartAt: new Date("2026-05-15T10:00:00Z"),
      actualEndAt: new Date("2026-05-15T11:00:00Z"),
      rateAmount: "300.00",
      rateCurrency: CurrencyCode.EGP,
    });

    const filters = buildMayFilters(teacher.id, ReportGroupingMode.TEACHER);

    // Act
    const results = await ReportRepository.generateAttendanceReport(filters, tx);

    // Assert
    expect(results).toHaveLength(1);
    expect(results[0].groupKey).toBe(teacher.id);
    expect(paidAmountForCurrency(results[0], CurrencyCode.EGP)).toBe(250); // only aggregates filtered teacher's records
  });

  reportRepoTest("returns empty array if no class instances in date range", async tx => {
    // Arrange
    const { teacher } = await setupTestData(tx);

    const filters = {
      fromDate: new Date("2025-01-01T00:00:00Z"),
      toDate: new Date("2025-12-31T23:59:59Z"),
      teacherId: teacher.id,
      groupBy: ReportGroupingMode.DATE,
    };

    // Act
    const results = await ReportRepository.generateAttendanceReport(filters, tx);

    // Assert
    expect(results).toHaveLength(0);
  });

  reportRepoTest("aggregates and groups correctly by STUDENT", async tx => {
    const { student, teacher } = await setupTestData(tx);

    const filters = buildMayFilters(teacher.id, ReportGroupingMode.STUDENT);

    const results = await ReportRepository.generateAttendanceReport(filters, tx);

    expect(results).toHaveLength(1);

    const row = results[0];
    expect(row.groupKey).toBe(student.id);
    expect(row.groupLabel).toBe(student.name);
    expectAllInstancesAggregated(row);
    expect(row.engagementGrowth).toBeNull();
  });

  reportRepoTest("returns null engagementGrowth when no prior period data", async tx => {
    const { teacher } = await setupTestData(tx);

    const filters = buildMayFilters(teacher.id, ReportGroupingMode.DATE);

    const growth = await ReportRepository.calculateEngagementGrowth(filters, tx);

    expect(growth).toBeNull();
  });

  reportRepoTest("fails and catches error properly when query crashes", async tx => {
    // Act & Assert
    // Passing an invalid UUID string for teacherId triggers a PostgreSQL type conversion error.
    const badFilters = {
      fromDate: new Date(),
      toDate: new Date(),
      teacherId: "not-a-valid-uuid-string",
      groupBy: ReportGroupingMode.DATE,
    };

    let errorCaught: unknown = null;
    try {
      await ReportRepository.generateAttendanceReport(badFilters, tx);
    } catch (e) {
      errorCaught = e;
    }
    expect(errorCaught).not.toBeNull();
  });
});
