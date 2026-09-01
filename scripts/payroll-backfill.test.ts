import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import * as drizzleOrm from "drizzle-orm";
import { classInstances } from "@/backend/db/schema";
import { AppPermission, CalculationStatus } from "@/backend/enum";
import { logger } from "@/backend/lib";
import type { PayrollCalculationInput, PayrollCalculationResult } from "@/backend/types";
import { ClassExecutionState } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTOR_ID = "11111111-1111-1111-1111-111111111111";

/** Sentinel transaction executor the dry-run preview receives. */
const TX_SENTINEL = { executor: "payroll-backfill-test-transaction" };

/** The candidate query's row shape. */
interface CandidateRow {
  id: string;
  teacherId: string;
  executionState: string;
}

/** Simulated persisted class_instances row — only the payroll-relevant columns. */
interface StoredInstance {
  id: string;
  teacherId: string;
  executionState: string;
  calculationStatus: CalculationStatus;
  payrollCalculatedAt: Date | null;
}

const instanceStore: StoredInstance[] = [];
const calculateCalls: { input: PayrollCalculationInput; tx: unknown }[] = [];
const permissionChecks: { actorUserId: string; permission: AppPermission }[] = [];

function seedInstance(overrides: Partial<StoredInstance> = {}): StoredInstance {
  const row: StoredInstance = {
    id: "inst-1",
    teacherId: "teacher-1",
    executionState: ClassExecutionState.COMPLETED,
    calculationStatus: CalculationStatus.NOT_CALCULATED,
    payrollCalculatedAt: null,
    ...overrides,
  };
  instanceStore.push(row);
  return row;
}

// ---------------------------------------------------------------------------
// Mocks — registered before the script module is imported.
// ---------------------------------------------------------------------------

/**
 * Simulates the persisted rows the candidate query returns: only untouched
 * rows (default status, no snapshot timestamp) match.
 */
function currentCandidates(): CandidateRow[] {
  return instanceStore
    .filter(row => row.calculationStatus === CalculationStatus.NOT_CALCULATED && row.payrollCalculatedAt === null)
    .map(row => ({ id: row.id, teacherId: row.teacherId, executionState: row.executionState }));
}

/**
 * Fake drizzle select builder: `limit()` resolves the candidate rows the
 * persisted store would return — only untouched rows (default status, no
 * snapshot timestamp) match the query.
 */
interface FakeSelectBuilder {
  from(table: unknown): FakeSelectBuilder;
  where(condition: unknown): FakeSelectBuilder;
  limit(count: number): Promise<CandidateRow[]>;
}

let capturedFromTable: unknown = null;
let capturedLimit: number | null = null;

const selectChain: FakeSelectBuilder = {
  from(table: unknown): FakeSelectBuilder {
    capturedFromTable = table;
    return selectChain;
  },
  where(_condition: unknown): FakeSelectBuilder {
    return selectChain;
  },
  limit(count: number): Promise<CandidateRow[]> {
    capturedLimit = count;
    return Promise.resolve(currentCandidates());
  },
};

const dbSelectMock = mock(() => selectChain);

/** Faithful transaction stand-in: the callback's rejection propagates (a rollback). */
const dbTransactionMock = mock(async (fn: (tx: unknown) => Promise<unknown>) => fn(TX_SENTINEL));

await mock.module("@/backend/db/drizzleDb", () => ({
  db: { select: dbSelectMock, transaction: dbTransactionMock },
  queryDb: () => ({}),
}));

// The drizzle-orm operators are recorded (and their real module re-exported)
// so the candidate WHERE clause is assertable column-by-column.
const eqCalls: { column: unknown; value: unknown }[] = [];
const inArrayCalls: { column: unknown; values: unknown }[] = [];
const isNullCalls: { column: unknown }[] = [];
const andCalls: { conditions: unknown[] }[] = [];

const eqMock = mock((column: unknown, value: unknown) => {
  eqCalls.push({ column, value });
  return { operator: "eq" };
});

const inArrayMock = mock((column: unknown, values: readonly unknown[]) => {
  inArrayCalls.push({ column, values });
  return { operator: "inArray" };
});

const isNullMock = mock((column: unknown) => {
  isNullCalls.push({ column });
  return { operator: "isNull" };
});

const andMock = mock((...conditions: unknown[]) => {
  andCalls.push({ conditions });
  return { operator: "and" };
});

await mock.module("drizzle-orm", () => ({
  ...drizzleOrm,
  and: andMock,
  eq: eqMock,
  inArray: inArrayMock,
  isNull: isNullMock,
}));

let permissionError: Error | null = null;

const requirePermissionMock = mock(async (actorUserId: string, permission: AppPermission) => {
  permissionChecks.push({ actorUserId, permission });
  if (permissionError !== null) {
    throw permissionError;
  }
});

await mock.module("@/backend/services/billing/permission-utils", () => ({
  requirePermission: requirePermissionMock,
}));

function buildCalculationResult(stored: StoredInstance): PayrollCalculationResult {
  return {
    instanceId: stored.id,
    calculatedDuration: 60,
    teacherPaidAmount: "120.00",
    teacherPaidCurrency: CurrencyCode.SAR,
    calculationStatus: CalculationStatus.CALCULATED,
    isStudentAbsence: false,
    isTeacherAbsence: false,
    isWithinGrace: true,
    isProRated: false,
  };
}

const calculateForInstanceMock = mock(async (input: PayrollCalculationInput, _tErrors: ErrorsLabels, tx?: unknown) => {
  calculateCalls.push({ input, tx: tx ?? null });
  const stored = instanceStore.find(row => row.id === input.instanceId);
  if (!stored) {
    throw new Error(`no stored instance ${input.instanceId}`);
  }
  if (tx == null) {
    // A standalone call commits; an embedded call runs inside the dry-run
    // transaction, which always rolls back, so it must not persist.
    stored.calculationStatus = CalculationStatus.CALCULATED;
    stored.payrollCalculatedAt = new Date();
  }
  return buildCalculationResult(stored);
});

await mock.module("@/backend/services/teacher/payroll-calculation.service", () => ({
  PayrollCalculationService: {
    calculateForInstance: calculateForInstanceMock,
  },
}));

function assertIsErrorsLabels(value: unknown): asserts value is ErrorsLabels {
  if (value === null || typeof value !== "object") {
    throw new Error("tErrorsStub must be an object");
  }
}

function buildErrorsStub(): ErrorsLabels {
  const stub = {
    insufficientPermissions: "insufficient permissions",
    internalServerError: "internal server error",
  };
  assertIsErrorsLabels(stub);
  return stub;
}

const getServerTranslationsMock = mock(() => ({
  errorsTranslations: buildErrorsStub(),
}));

await mock.module("@/shared/locale/server-graphql", () => ({
  getServerTranslations: getServerTranslationsMock,
}));

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks are registered first) + shared helpers.
// ---------------------------------------------------------------------------

async function importBackfillScript(): Promise<typeof import("@/scripts/payroll-backfill")> {
  return import("@/scripts/payroll-backfill");
}

const loggerInfoSpy = spyOn(logger, "info").mockImplementation(() => {});
const loggerErrorSpy = spyOn(logger, "error").mockImplementation(() => {});

function resetMocks(): void {
  instanceStore.length = 0;
  calculateCalls.length = 0;
  permissionChecks.length = 0;
  eqCalls.length = 0;
  inArrayCalls.length = 0;
  isNullCalls.length = 0;
  andCalls.length = 0;
  capturedFromTable = null;
  capturedLimit = null;
  permissionError = null;

  dbSelectMock.mockClear();
  dbTransactionMock.mockClear();
  requirePermissionMock.mockClear();
  calculateForInstanceMock.mockClear();
  getServerTranslationsMock.mockClear();
  loggerInfoSpy.mockClear();
  loggerErrorSpy.mockClear();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("runPayrollBackfill", () => {
  beforeEach(() => {
    resetMocks();
  });

  test("recalculates every untouched terminal candidate through the calculator", async () => {
    seedInstance({ id: "inst-1", teacherId: "teacher-1" });
    seedInstance({ id: "inst-2", teacherId: "teacher-2" });
    seedInstance({
      id: "already-done",
      calculationStatus: CalculationStatus.CALCULATED,
      payrollCalculatedAt: new Date(),
    });
    // A row the calculator already degraded keeps its timestamp and must not
    // be reprocessed on later runs.
    seedInstance({ id: "degraded", payrollCalculatedAt: new Date() });

    const { runPayrollBackfill } = await importBackfillScript();
    const summary = await runPayrollBackfill({ actorUserId: ACTOR_ID, dryRun: false });

    expect(summary).toEqual({ mode: "apply", candidates: 2, processed: 2, failed: 0 });
    expect(calculateCalls.map(call => call.input.instanceId)).toEqual(["inst-1", "inst-2"]);
    for (const call of calculateCalls) {
      expect(call.input.actorUserId).toBe(ACTOR_ID);
      expect(call.input.forceRecalc).toBe(true);
      expect(call.tx).toBeNull();
    }
    expect(permissionChecks).toEqual([{ actorUserId: ACTOR_ID, permission: AppPermission.ACCOUNTING_PAYROLL_MANAGE }]);
  });

  test("selects only untouched terminal sessions from class_instances", async () => {
    seedInstance();
    const { runPayrollBackfill } = await importBackfillScript();
    await runPayrollBackfill({ actorUserId: ACTOR_ID, dryRun: false });

    expect(capturedFromTable).toBe(classInstances);
    expect(capturedLimit).toBe(500);
    expect(andCalls).toHaveLength(1);

    expect(inArrayCalls).toHaveLength(1);
    expect(inArrayCalls[0]?.column).toBe(classInstances.executionState);
    expect(inArrayCalls[0]?.values).toEqual([
      ClassExecutionState.COMPLETED,
      ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED,
      ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT,
      ClassExecutionState.ON_DEMAND_CONFLICT_HELD,
      ClassExecutionState.ON_DEMAND_PENDING_CREDITS,
    ]);

    expect(eqCalls).toHaveLength(1);
    expect(eqCalls[0]?.column).toBe(classInstances.calculationStatus);
    expect(eqCalls[0]?.value).toBe(CalculationStatus.NOT_CALCULATED);

    expect(isNullCalls.map(call => call.column)).toEqual([
      classInstances.payrollCalculatedAt,
      classInstances.deletedAt,
    ]);
  });

  test("a second run finds zero candidates and recalculates nothing", async () => {
    seedInstance({ id: "inst-1", teacherId: "teacher-1" });
    seedInstance({ id: "inst-2", teacherId: "teacher-2" });
    const { runPayrollBackfill } = await importBackfillScript();

    const first = await runPayrollBackfill({ actorUserId: ACTOR_ID, dryRun: false });
    expect(first).toEqual({ mode: "apply", candidates: 2, processed: 2, failed: 0 });

    const second = await runPayrollBackfill({ actorUserId: ACTOR_ID, dryRun: false });
    expect(second).toEqual({ mode: "apply", candidates: 0, processed: 0, failed: 0 });
    expect(calculateForInstanceMock).toHaveBeenCalledTimes(2);
  });

  test("dry run previews patches inside a rolled-back transaction and persists nothing", async () => {
    seedInstance({ id: "inst-1", teacherId: "teacher-1" });
    seedInstance({ id: "inst-2", teacherId: "teacher-2" });
    const { runPayrollBackfill } = await importBackfillScript();

    const summary = await runPayrollBackfill({ actorUserId: ACTOR_ID, dryRun: true });

    expect(summary).toEqual({ mode: "dry-run", candidates: 2, processed: 2, failed: 0 });
    for (const call of calculateCalls) {
      // Every preview ran through a transaction executor, so its writes roll
      // back with it; nothing was persisted standalone.
      expect(call.tx).toBe(TX_SENTINEL);
    }

    // Nothing persisted: both rows are still untouched for a later apply run.
    const applySummary = await runPayrollBackfill({ actorUserId: ACTOR_ID, dryRun: false });
    expect(applySummary).toEqual({ mode: "apply", candidates: 2, processed: 2, failed: 0 });

    // The preview prints the calculator's proposed patch per instance.
    for (const call of calculateCalls.slice(0, 2)) {
      const previewLog = loggerInfoSpy.mock.calls.find(candidate =>
        String(candidate[0]).includes(`dry-run instance=${call.input.instanceId}`)
      );
      expect(String(previewLog?.[0])).toContain("status=CALCULATED");
      expect(String(previewLog?.[0])).toContain("amount=120.00");
    }
  });

  test("a failing instance is reported and does not abort the run", async () => {
    seedInstance({ id: "inst-1", teacherId: "teacher-1" });
    seedInstance({ id: "inst-2", teacherId: "teacher-2" });
    calculateForInstanceMock.mockImplementationOnce(async (input: PayrollCalculationInput) => {
      throw new Error(`calculation rejected for ${input.instanceId}`);
    });
    const { runPayrollBackfill } = await importBackfillScript();

    const summary = await runPayrollBackfill({ actorUserId: ACTOR_ID, dryRun: false });

    expect(summary).toEqual({ mode: "apply", candidates: 2, processed: 1, failed: 1 });
    expect(loggerErrorSpy).toHaveBeenCalled();
  });

  test("aborts before any candidate work when the operator lacks the permission", async () => {
    seedInstance({ id: "inst-1", teacherId: "teacher-1" });
    permissionError = new Error("insufficient permissions");
    const { runPayrollBackfill } = await importBackfillScript();

    let caught: unknown = null;
    try {
      await runPayrollBackfill({ actorUserId: ACTOR_ID, dryRun: false });
    } catch (error) {
      caught = error;
    }
    expect(caught).not.toBeNull();
    expect(dbSelectMock).not.toHaveBeenCalled();
    expect(calculateForInstanceMock).not.toHaveBeenCalled();
  });
});

describe("parseBackfillArgs", () => {
  test("parses the actor id and defaults to an applying run", async () => {
    const { parseBackfillArgs } = await importBackfillScript();

    expect(parseBackfillArgs(["--actor-user-id=abc-123"])).toEqual({
      ok: true,
      help: false,
      options: { actorUserId: "abc-123", dryRun: false },
    });
  });

  test("parses the dry-run flag", async () => {
    const { parseBackfillArgs } = await importBackfillScript();

    expect(parseBackfillArgs(["--dryRun", "--actor-user-id=abc-123"])).toEqual({
      ok: true,
      help: false,
      options: { actorUserId: "abc-123", dryRun: true },
    });
  });

  test("rejects a missing or empty actor id", async () => {
    const { parseBackfillArgs } = await importBackfillScript();

    expect(parseBackfillArgs([]).ok).toBe(false);
    expect(parseBackfillArgs(["--dryRun"]).ok).toBe(false);
    expect(parseBackfillArgs(["--actor-user-id="]).ok).toBe(false);
  });

  test("rejects unknown arguments", async () => {
    const { parseBackfillArgs } = await importBackfillScript();

    const parsed = parseBackfillArgs(["--actor-user-id=abc-123", "--limit=10"]);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error).toContain("--limit=10");
    }
  });

  test("recognizes the help flag", async () => {
    const { parseBackfillArgs } = await importBackfillScript();

    expect(parseBackfillArgs(["--help"])).toEqual({ ok: true, help: true });
  });
});
