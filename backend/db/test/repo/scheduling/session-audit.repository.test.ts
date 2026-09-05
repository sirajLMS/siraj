import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { SessionAuditRepository } from "@/backend/db/repo/scheduling";
import { type classInstances, classSubjects, users } from "@/backend/db/schema";
import {
  createMockClassInstance,
  createTestTeacherDue,
  createTestTeacherPayment,
  setupTestEntities,
} from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CalculationStatus, TeacherDueStatus } from "@/backend/enum";
import type {
  ClassInstanceSelectType,
  DBTransaction,
  SessionAuditReportFilters,
  SessionAuditReportSort,
  SessionAuditReportSortField,
} from "@/backend/types";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";

/** Fixed dates keep ordering and date-range assertions deterministic. */
const DAY_ONE = "2026-08-10";
const DAY_TWO = "2026-08-12";
const DAY_THREE = "2026-08-14";

const DEFAULT_SORT: SessionAuditReportSort = { field: "scheduledStartAt", direction: "asc" };
const DEFAULT_PAGE = { limit: 50, offset: 0 };

type InstanceOverrides = Partial<typeof classInstances.$inferInsert>;

function atTime(isoDate: string, hourUtc: number, minuteUtc = 0): Date {
  const hh = String(hourUtc).padStart(2, "0");
  const mm = String(minuteUtc).padStart(2, "0");
  return new Date(`${isoDate}T${hh}:${mm}:00.000Z`);
}

interface AuditPair {
  teacherId: string;
  teacherUserId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
}

/**
 * Creates one teacher/student pair with names derived from the prefix so
 * search assertions stay deterministic. `skipInstance` keeps the fixture
 * minimal — every test creates exactly the instances it needs, and all
 * queries are scoped by teacherId or a unique search token to stay isolated
 * from any pre-existing rows in the shared test database.
 */
async function setupPair(tx: DBTransaction, prefix: string): Promise<AuditPair> {
  const { teacherUser, teacher, student } = await setupTestEntities(tx, prefix, { skipInstance: true });
  return {
    teacherId: teacher.id,
    teacherUserId: teacherUser.id,
    teacherName: `${prefix} TeacherUser`,
    studentId: student.id,
    studentName: `${prefix} Student`,
  };
}

async function addInstance(
  tx: DBTransaction,
  pair: AuditPair,
  start: Date,
  overrides: InstanceOverrides = {}
): Promise<ClassInstanceSelectType> {
  return createMockClassInstance(tx, pair.studentId, pair.teacherId, {
    scheduledStartAt: start,
    scheduledEndAt: new Date(start.getTime() + 60 * 60_000),
    durationMinutes: 60,
    ...overrides,
  });
}

/** Completed + taken instance (session-audit status "end"). */
function taken(start: Date): InstanceOverrides {
  return {
    executionState: ClassExecutionState.COMPLETED,
    outcome: ClassOutcome.TAKEN,
    actualStartAt: start,
    actualEndAt: new Date(start.getTime() + 60 * 60_000),
  };
}

/**
 * Four instances covering every session-audit status: end, Absent (teacher
 * never joined), absent_student (leave), and open (never activated).
 */
async function seedStatusInstances(tx: DBTransaction, pair: AuditPair) {
  const endRow = await addInstance(tx, pair, atTime(DAY_ONE, 10), taken(atTime(DAY_ONE, 10)));
  const absentRow = await addInstance(tx, pair, atTime(DAY_ONE, 12), {
    executionState: ClassExecutionState.COMPLETED,
    outcome: ClassOutcome.ABSENT,
  });
  const absentStudentRow = await addInstance(tx, pair, atTime(DAY_TWO, 10), {
    executionState: ClassExecutionState.COMPLETED,
    outcome: ClassOutcome.LEAVE,
  });
  const openRow = await addInstance(tx, pair, atTime(DAY_THREE, 10));
  return { endRow, absentRow, absentStudentRow, openRow };
}

/** Wraps findReportRows with the pair-scoped teacher filter and shared defaults. */
function queryReport(
  tx: DBTransaction,
  pair: AuditPair,
  filters: SessionAuditReportFilters = {},
  sort: SessionAuditReportSort = DEFAULT_SORT,
  pagination: { limit: number; offset: number } = DEFAULT_PAGE
) {
  return SessionAuditRepository.findReportRows({ teacherId: pair.teacherId, ...filters }, sort, pagination, tx);
}

/** Wraps the transaction so the number of SELECT statements issued can be asserted. */
function countSelects(tx: DBTransaction): { proxyTx: DBTransaction; getCalls: () => number } {
  let calls = 0;
  const proxyTx = new Proxy(tx, {
    get(target, property) {
      if (property === "select") calls += 1;
      return Reflect.get(target, property, target);
    },
  });
  return { proxyTx, getCalls: () => calls };
}

describe("SessionAuditRepository.findReportRows", () => {
  test("returns a full page of 50 joined rows with names, ISO timestamps, and derived status", async () => {
    await runInRollback(async tx => {
      const pair = await setupPair(tx, "AuditFifty");
      await Promise.all(
        Array.from({ length: 50 }, (_, index) => {
          const start = new Date(Date.UTC(2026, 7, 10) + index * 3_600_000);
          return addInstance(tx, pair, start, taken(start));
        })
      );

      const { rows, totalCount } = await queryReport(tx, pair);

      expect(rows).toHaveLength(50);
      expect(totalCount).toBe(50);

      const first = rows[0];
      if (!first) throw new Error("expected at least one row");
      expect(first.teacherId).toBe(pair.teacherId);
      expect(first.teacherName).toBe(pair.teacherName);
      expect(first.studentId).toBe(pair.studentId);
      expect(first.studentName).toBe(pair.studentName);
      expect(first.currentStatus).toBe("end");
      expect(first.scheduledStartAt).toBe("2026-08-10T00:00:00.000Z");
      expect(first.scheduledEndAt).toBe("2026-08-10T01:00:00.000Z");
      expect(first.actualStartAt).toBe("2026-08-10T00:00:00.000Z");
      expect(first.actualEndAt).toBe("2026-08-10T01:00:00.000Z");
      expect(first.durationMinutes).toBe(60);
      expect(first.calculationStatus).toBe(CalculationStatus.NOT_CALCULATED);
      expect(first.teacherPaidAmount).toBeNull();
      expect(first.teacherDuePaymentDate).toBeNull();

      const [subject] = await tx
        .select({ name: classSubjects.name })
        .from(classSubjects)
        .where(eq(classSubjects.id, first.subjectId));
      expect(first.subjectName).toBe(subject?.name);
    });
  });

  test("totalCount reflects the full filtered set regardless of the page size", async () => {
    await runInRollback(async tx => {
      const pair = await setupPair(tx, "AuditCount");
      await Promise.all(Array.from({ length: 5 }, (_, index) => addInstance(tx, pair, atTime(DAY_ONE, 8 + index))));

      const page = await queryReport(tx, pair, {}, DEFAULT_SORT, { limit: 2, offset: 0 });
      expect(page.rows).toHaveLength(2);
      expect(page.totalCount).toBe(5);

      const clamped = await queryReport(tx, pair, {}, DEFAULT_SORT, { limit: 0, offset: -3 });
      expect(clamped.rows).toHaveLength(1);
      expect(clamped.totalCount).toBe(5);
    });
  });

  test("filters by studentId and matches nothing for an unknown teacher", async () => {
    await runInRollback(async tx => {
      const pairA = await setupPair(tx, "FltStA");
      const pairB = await setupPair(tx, "FltStB");
      const instanceA = await addInstance(tx, pairA, atTime(DAY_ONE, 9));
      await addInstance(tx, pairA, atTime(DAY_TWO, 9));

      const { rows, totalCount } = await SessionAuditRepository.findReportRows(
        { studentId: pairA.studentId },
        DEFAULT_SORT,
        DEFAULT_PAGE,
        tx
      );
      expect(totalCount).toBe(2);
      expect(rows.every(row => row.studentId === pairA.studentId)).toBe(true);
      expect(rows.some(row => row.instanceId === instanceA.id)).toBe(true);

      const impossible = await SessionAuditRepository.findReportRows(
        { teacherId: pairA.teacherId, studentId: pairB.studentId },
        DEFAULT_SORT,
        DEFAULT_PAGE,
        tx
      );
      expect(impossible.rows).toHaveLength(0);
      expect(impossible.totalCount).toBe(0);

      const unknownTeacher = await SessionAuditRepository.findReportRows(
        { teacherId: randomUUID() },
        DEFAULT_SORT,
        DEFAULT_PAGE,
        tx
      );
      expect(unknownTeacher.rows).toHaveLength(0);
      expect(unknownTeacher.totalCount).toBe(0);
    });
  });

  test("filters by inclusive date range on the scheduled start", async () => {
    await runInRollback(async tx => {
      const pair = await setupPair(tx, "FltDate");
      const first = await addInstance(tx, pair, atTime(DAY_ONE, 10));
      const middle = await addInstance(tx, pair, atTime(DAY_TWO, 10));
      const last = await addInstance(tx, pair, atTime(DAY_THREE, 10));

      const toOnly = await queryReport(tx, pair, { dateTo: DAY_TWO });
      expect(toOnly.rows.map(row => row.instanceId)).toEqual([first.id, middle.id]);

      const fromOnly = await queryReport(tx, pair, { dateFrom: DAY_TWO });
      expect(fromOnly.rows.map(row => row.instanceId)).toEqual([middle.id, last.id]);

      const singleDay = await queryReport(tx, pair, { dateFrom: DAY_TWO, dateTo: DAY_TWO });
      expect(singleDay.rows.map(row => row.instanceId)).toEqual([middle.id]);
      expect(singleDay.totalCount).toBe(1);
    });
  });

  test("expands status multi-select into the matching execution-state predicates", async () => {
    await runInRollback(async tx => {
      const pair = await setupPair(tx, "FltStatus");
      const { endRow, absentRow, absentStudentRow, openRow } = await seedStatusInstances(tx, pair);

      const endOnly = await queryReport(tx, pair, { currentStatuses: ["end"] });
      expect(endOnly.rows.map(row => row.instanceId)).toEqual([endRow.id]);
      expect(endOnly.rows[0]?.currentStatus).toBe("end");

      const absentOnly = await queryReport(tx, pair, { currentStatuses: ["Absent"] });
      expect(absentOnly.rows.map(row => row.instanceId)).toEqual([absentRow.id]);

      const absentStudentOnly = await queryReport(tx, pair, { currentStatuses: ["absent_student"] });
      expect(absentStudentOnly.rows.map(row => row.instanceId)).toEqual([absentStudentRow.id]);

      const openOnly = await queryReport(tx, pair, { currentStatuses: ["open"] });
      expect(openOnly.rows.map(row => row.instanceId)).toEqual([openRow.id]);
      expect(openOnly.rows[0]?.currentStatus).toBe("open");

      const multi = await queryReport(tx, pair, { currentStatuses: ["end", "Absent"] });
      expect(multi.totalCount).toBe(2);
      expect(multi.rows.map(row => row.instanceId)).toEqual([endRow.id, absentRow.id]);

      const empty = await queryReport(tx, pair, { currentStatuses: [] });
      expect(empty.totalCount).toBe(4);
    });
  });

  test("combines teacher, student, date range, status, and search filters", async () => {
    await runInRollback(async tx => {
      const pair = await setupPair(tx, "FltCombo");
      const { endRow } = await seedStatusInstances(tx, pair);

      const combined = await queryReport(tx, pair, {
        studentId: pair.studentId,
        dateFrom: DAY_ONE,
        dateTo: DAY_ONE,
        currentStatuses: ["end"],
        search: "fltcombo teacheruser",
      });
      expect(combined.rows.map(row => row.instanceId)).toEqual([endRow.id]);
      expect(combined.totalCount).toBe(1);

      const clashing = await queryReport(tx, pair, {
        currentStatuses: ["end"],
        search: "teacheruser nonexistenttoken",
      });
      expect(clashing.rows).toHaveLength(0);
    });
  });

  test("matches teacher and student names case-insensitively, tokenized across words", async () => {
    await runInRollback(async tx => {
      const pairA = await setupPair(tx, "SrchAlpha");
      const pairB = await setupPair(tx, "SrchBeta");
      const instanceA = await addInstance(tx, pairA, atTime(DAY_ONE, 9));
      const instanceB = await addInstance(tx, pairB, atTime(DAY_ONE, 9));

      const byTeacherName = await SessionAuditRepository.findReportRows(
        { search: "srchalpha teacheruser" },
        DEFAULT_SORT,
        DEFAULT_PAGE,
        tx
      );
      expect(byTeacherName.rows.map(row => row.instanceId)).toEqual([instanceA.id]);

      const byStudentName = await SessionAuditRepository.findReportRows(
        { search: "SRCHBETA STUDENT" },
        DEFAULT_SORT,
        DEFAULT_PAGE,
        tx
      );
      expect(byStudentName.rows.map(row => row.instanceId)).toEqual([instanceB.id]);

      const wildcard = await SessionAuditRepository.findReportRows({ search: "100%" }, DEFAULT_SORT, DEFAULT_PAGE, tx);
      expect(wildcard.rows).toHaveLength(0);
    });
  });

  test("matches % and _ search tokens as literals instead of LIKE wildcards", async () => {
    await runInRollback(async tx => {
      const percentPair = await setupPair(tx, "LikePctProbe");
      const percentDecoy = await setupPair(tx, "LikePctDecoy");
      const underscorePair = await setupPair(tx, "LikeUndProbe");
      const underscoreDecoy = await setupPair(tx, "LikeUndDecoy");
      await tx
        .update(users)
        .set({ name: "PctProbe 100%Wildcard TeacherUser" })
        .where(eq(users.id, percentPair.teacherUserId));
      await tx
        .update(users)
        .set({ name: "PctDecoy 1000XWildcard TeacherUser" })
        .where(eq(users.id, percentDecoy.teacherUserId));
      await tx
        .update(users)
        .set({ name: "UndProbe 200_Marker TeacherUser" })
        .where(eq(users.id, underscorePair.teacherUserId));
      await tx
        .update(users)
        .set({ name: "UndDecoy 2000Marker TeacherUser" })
        .where(eq(users.id, underscoreDecoy.teacherUserId));

      const percentInstance = await addInstance(tx, percentPair, atTime(DAY_ONE, 9));
      await addInstance(tx, percentDecoy, atTime(DAY_ONE, 9));
      const underscoreInstance = await addInstance(tx, underscorePair, atTime(DAY_ONE, 11));
      await addInstance(tx, underscoreDecoy, atTime(DAY_ONE, 11));

      const byPercent = await SessionAuditRepository.findReportRows(
        { search: "100%Wildcard" },
        DEFAULT_SORT,
        DEFAULT_PAGE,
        tx
      );
      expect(byPercent.rows.map(row => row.instanceId)).toEqual([percentInstance.id]);

      const byUnderscore = await SessionAuditRepository.findReportRows(
        { search: "200_Marker" },
        DEFAULT_SORT,
        DEFAULT_PAGE,
        tx
      );
      expect(byUnderscore.rows.map(row => row.instanceId)).toEqual([underscoreInstance.id]);
    });
  });

  test("orders by every sortable field in both directions", async () => {
    await runInRollback(async tx => {
      const pair = await setupPair(tx, "SortVals");
      const rowX = await addInstance(tx, pair, atTime(DAY_ONE, 10), {
        ...taken(atTime(DAY_ONE, 10)),
        durationMinutes: 30,
        scheduledEndAt: atTime(DAY_ONE, 10, 30),
        actualEndAt: atTime(DAY_ONE, 10, 30),
        calculationStatus: CalculationStatus.CALCULATED,
        calculatedDuration: 30,
        teacherPaidAmount: "9.00",
        teacherPaidCurrency: CurrencyCode.USD,
      });
      const rowY = await addInstance(tx, pair, atTime(DAY_TWO, 10), {
        ...taken(atTime(DAY_TWO, 10)),
        calculationStatus: CalculationStatus.WAITING_PAID,
        calculatedDuration: 60,
        teacherPaidAmount: "10.00",
        teacherPaidCurrency: CurrencyCode.USD,
      });
      const rowZ = await addInstance(tx, pair, atTime(DAY_THREE, 10), { durationMinutes: 90 });

      const cases: { field: SessionAuditReportSortField; ascIds: string[]; descIds: string[] }[] = [
        { field: "scheduledStartAt", ascIds: [rowX.id, rowY.id, rowZ.id], descIds: [rowZ.id, rowY.id, rowX.id] },
        { field: "scheduledEndAt", ascIds: [rowX.id, rowY.id, rowZ.id], descIds: [rowZ.id, rowY.id, rowX.id] },
        { field: "durationMinutes", ascIds: [rowX.id, rowY.id, rowZ.id], descIds: [rowZ.id, rowY.id, rowX.id] },
        { field: "actualStartAt", ascIds: [rowX.id, rowY.id, rowZ.id], descIds: [rowZ.id, rowY.id, rowX.id] },
        { field: "actualEndAt", ascIds: [rowX.id, rowY.id, rowZ.id], descIds: [rowZ.id, rowY.id, rowX.id] },
        {
          field: "calculatedDuration",
          ascIds: [rowX.id, rowY.id, rowZ.id],
          descIds: [rowZ.id, rowY.id, rowX.id],
        },
        // Decimal-as-text column: numeric ordering (9 < 10) and NULL placement are explicit.
        { field: "teacherPaidAmount", ascIds: [rowZ.id, rowX.id, rowY.id], descIds: [rowY.id, rowX.id, rowZ.id] },
      ];

      const outcomesDir = await Promise.all(
        cases.flatMap(({ field, ascIds, descIds }) => [
          queryReport(tx, pair, {}, { field, direction: "asc" }).then(result => ({
            ids: result.rows.map(row => row.instanceId),
            expected: ascIds,
          })),
          queryReport(tx, pair, {}, { field, direction: "desc" }).then(result => ({
            ids: result.rows.map(row => row.instanceId),
            expected: descIds,
          })),
        ])
      );
      for (const { ids, expected } of outcomesDir) {
        expect(ids).toEqual(expected);
      }
    });
  });

  test("orders by teacher and student names without ambiguity", async () => {
    await runInRollback(async tx => {
      const scope = `Sn${randomUUID().slice(0, 8)}`;
      const pairLow = await setupPair(tx, `${scope}Aaa`);
      const pairHigh = await setupPair(tx, `${scope}Zzz`);
      const lowRow = await addInstance(tx, pairLow, atTime(DAY_ONE, 9));
      const highRow = await addInstance(tx, pairHigh, atTime(DAY_ONE, 9));
      const nameFilters: SessionAuditReportFilters = { search: scope.toLowerCase() };

      const nameFields: SessionAuditReportSortField[] = ["teacherName", "studentName"];
      const nameOutcomes = await Promise.all(
        nameFields.flatMap(field => [
          SessionAuditRepository.findReportRows(nameFilters, { field, direction: "asc" }, DEFAULT_PAGE, tx).then(
            result => ({ ids: result.rows.map(row => row.instanceId), expected: [lowRow.id, highRow.id] })
          ),
          SessionAuditRepository.findReportRows(nameFilters, { field, direction: "desc" }, DEFAULT_PAGE, tx).then(
            result => ({ ids: result.rows.map(row => row.instanceId), expected: [highRow.id, lowRow.id] })
          ),
        ])
      );
      for (const { ids, expected } of nameOutcomes) {
        expect(ids).toEqual(expected);
      }
    });
  });

  test("orders by calculation status in enum declaration order", async () => {
    await runInRollback(async tx => {
      const pair = await setupPair(tx, "SortStatus");
      const paidRow = await addInstance(tx, pair, atTime(DAY_ONE, 9), {
        ...taken(atTime(DAY_ONE, 9)),
        calculationStatus: CalculationStatus.PAID,
        calculatedDuration: 60,
        teacherPaidAmount: "10.00",
      });
      const plainRow = await addInstance(tx, pair, atTime(DAY_ONE, 11));

      const ascResult = await queryReport(tx, pair, {}, { field: "calculationStatus", direction: "asc" });
      expect(ascResult.rows.map(row => row.instanceId)).toEqual([plainRow.id, paidRow.id]);

      const descResult = await queryReport(tx, pair, {}, { field: "calculationStatus", direction: "desc" });
      expect(descResult.rows.map(row => row.instanceId)).toEqual([paidRow.id, plainRow.id]);
    });
  });

  test("excludes soft-deleted rows by default and includes them when requested", async () => {
    await runInRollback(async tx => {
      const pair = await setupPair(tx, "SoftDel");
      const liveRow = await addInstance(tx, pair, atTime(DAY_ONE, 9));
      const deletedRow = await addInstance(tx, pair, atTime(DAY_ONE, 11), { deletedAt: new Date() });

      const defaultPage = await queryReport(tx, pair);
      expect(defaultPage.rows.map(row => row.instanceId)).toEqual([liveRow.id]);
      expect(defaultPage.totalCount).toBe(1);

      const withDeleted = await queryReport(tx, pair, { includeDeleted: true });
      expect(withDeleted.totalCount).toBe(2);
      expect(withDeleted.rows.map(row => row.instanceId)).toEqual([liveRow.id, deletedRow.id]);
    });
  });

  test("populates teacherDuePaymentDate only for paid calculations", async () => {
    await runInRollback(async tx => {
      const pair = await setupPair(tx, "DuesPay");
      const paymentDate = atTime(DAY_TWO, 9);

      const paidInstance = await addInstance(tx, pair, atTime(DAY_ONE, 9), {
        ...taken(atTime(DAY_ONE, 9)),
        calculationStatus: CalculationStatus.PAID,
        calculatedDuration: 60,
        teacherPaidAmount: "50.00",
        teacherPaidCurrency: CurrencyCode.SAR,
      });
      const payment = await createTestTeacherPayment(tx, pair.teacherId, { paymentDate });
      await createTestTeacherDue(tx, pair.teacherId, paidInstance.id, pair.studentId, pair.teacherUserId, {
        teacherPaymentId: payment.id,
        status: TeacherDueStatus.PAID,
      });

      const unpaidInstance = await addInstance(tx, pair, atTime(DAY_ONE, 11), {
        ...taken(atTime(DAY_ONE, 11)),
        calculationStatus: CalculationStatus.CALCULATED,
        calculatedDuration: 60,
        teacherPaidAmount: "50.00",
        teacherPaidCurrency: CurrencyCode.SAR,
      });
      const pendingPayment = await createTestTeacherPayment(tx, pair.teacherId, {
        paymentDate: atTime(DAY_TWO, 10),
      });
      await createTestTeacherDue(tx, pair.teacherId, unpaidInstance.id, pair.studentId, pair.teacherUserId, {
        teacherPaymentId: pendingPayment.id,
        status: TeacherDueStatus.PENDING,
      });

      const paidWithoutDue = await addInstance(tx, pair, atTime(DAY_ONE, 13), {
        ...taken(atTime(DAY_ONE, 13)),
        calculationStatus: CalculationStatus.PAID,
        calculatedDuration: 60,
        teacherPaidAmount: "25.00",
        teacherPaidCurrency: CurrencyCode.SAR,
      });

      const { rows, totalCount } = await queryReport(tx, pair);
      expect(totalCount).toBe(3);

      const paid = rows.find(row => row.instanceId === paidInstance.id);
      expect(paid?.teacherDuePaymentDate).toBe(paymentDate.toISOString());

      const unpaid = rows.find(row => row.instanceId === unpaidInstance.id);
      expect(unpaid?.teacherDuePaymentDate).toBeNull();

      const noDue = rows.find(row => row.instanceId === paidWithoutDue.id);
      expect(noDue?.teacherDuePaymentDate).toBeNull();
    });
  });

  test("returns an empty page with the full count when the offset runs past the result set", async () => {
    await runInRollback(async tx => {
      const pair = await setupPair(tx, "OffPastEnd");
      await Promise.all(Array.from({ length: 4 }, (_, index) => addInstance(tx, pair, atTime(DAY_ONE, 8 + index))));

      const page = await queryReport(tx, pair, {}, DEFAULT_SORT, { limit: 10, offset: 999 });

      expect(page.rows).toHaveLength(0);
      expect(page.totalCount).toBe(4);
    });
  });

  test("ignores blank and whitespace-only search terms instead of filtering everything out", async () => {
    await runInRollback(async tx => {
      const pair = await setupPair(tx, "BlankSrch");
      await addInstance(tx, pair, atTime(DAY_ONE, 9));

      const whitespace = await queryReport(tx, pair, { search: "   " });
      expect(whitespace.totalCount).toBe(1);

      const blank = await queryReport(tx, pair, { search: "" });
      expect(blank.totalCount).toBe(1);
    });
  });

  test("includes session starts at the exact inclusive day bounds", async () => {
    await runInRollback(async tx => {
      const pair = await setupPair(tx, "DayBounds");
      const atStart = await addInstance(tx, pair, new Date(`${DAY_TWO}T00:00:00.000Z`));
      const atEnd = await addInstance(tx, pair, new Date(`${DAY_TWO}T23:59:59.999Z`));
      await addInstance(tx, pair, new Date(`${DAY_ONE}T23:59:59.999Z`));
      await addInstance(tx, pair, new Date(`${DAY_THREE}T00:00:00.000Z`));

      const page = await queryReport(tx, pair, { dateFrom: DAY_TWO, dateTo: DAY_TWO });

      expect(page.rows.map(row => row.instanceId)).toEqual([atStart.id, atEnd.id]);
      expect(page.totalCount).toBe(2);
    });
  });

  test("issues exactly one SELECT and one COUNT regardless of the row count", async () => {
    await runInRollback(async tx => {
      const pair = await setupPair(tx, "QueryCnt");
      await Promise.all(Array.from({ length: 5 }, (_, index) => addInstance(tx, pair, atTime(DAY_ONE, 8 + index))));

      const { proxyTx, getCalls } = countSelects(tx);
      const { rows, totalCount } = await SessionAuditRepository.findReportRows(
        { teacherId: pair.teacherId },
        DEFAULT_SORT,
        DEFAULT_PAGE,
        proxyTx
      );

      expect(rows).toHaveLength(5);
      expect(totalCount).toBe(5);
      expect(getCalls()).toBe(2);
    });
  });
});
