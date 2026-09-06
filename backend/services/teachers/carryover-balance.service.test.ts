import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { AppPermission, CalculationStatus } from "@/backend/enum";
import { DomainError, ForbiddenError, logger, NotFoundError, ValidationError } from "@/backend/lib";
import { deriveBulkCreateIdempotencyKey } from "@/backend/services/teachers/carryover-idempotency";
import type {
  AuditLogReturnType,
  BulkCreateCarryoverInput,
  BulkCreateCarryoverResult,
  CarryoverBalanceInsertType,
  CarryoverBalanceItemInsertType,
  CarryoverBalanceSelectType,
  ClassInstanceSelectType,
  ClassStatusEventSeedInsertInput,
  CreateAuditLogInput,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTOR_ID = "bbbb1111-1111-4cc1-9111-111111111111";
const TEACHER_ONE_ID = "bbbb2222-2222-4cc2-9222-222222222222";
const TEACHER_TWO_ID = "bbbb3333-3333-4cc3-9333-333333333333";
const TEACHER_THREE_ID = "bbbb4444-4444-4cc4-9444-444444444444";

const SESSION_ONE_ID = "bbbb5555-5555-4cc5-9555-555555555555";
const SESSION_TWO_ID = "bbbb6666-6666-4cc6-9666-666666666666";
const SESSION_THREE_ID = "bbbb7777-7777-4cc7-9777-777777777777";
const SESSION_FOUR_ID = "bbbb8888-8888-4cc8-9888-888888888888";
const SESSION_FIVE_ID = "bbbb9999-9999-4cc9-9999-999999999999";
const UNKNOWN_SESSION_ID = "bbbb1010-1010-4cc1-9101-101010101010";

const STUDENT_ONE_ID = "bbbb0101-0101-4cc0-9010-010101010101";
const STUDENT_TWO_ID = "bbbb0202-0202-4cc0-9020-020202020202";
const STUDENT_THREE_ID = "bbbb0303-0303-4cc0-9030-030303030303";
const STUDENT_FOUR_ID = "bbbb0404-0404-4cc0-9040-040404040404";
const STUDENT_FIVE_ID = "bbbb0505-0505-4cc0-9050-050505050505";

const HAPPY_SESSION_IDS = [SESSION_ONE_ID, SESSION_TWO_ID, SESSION_THREE_ID, SESSION_FOUR_ID, SESSION_FIVE_ID];

/** Fields the bulk-create flow actually reads off a locked session row. */
type AuditedSessionStub = Pick<
  ClassInstanceSelectType,
  | "id"
  | "teacherId"
  | "studentId"
  | "calculationStatus"
  | "teacherPaidAmount"
  | "teacherPaidCurrency"
  | "calculatedDuration"
  | "scheduledStartAt"
  | "carryoverBalanceId"
  | "isPartialPercentage"
>;

interface SessionFixture {
  id: string;
  teacherId: string;
  studentId: string;
  status: CalculationStatus;
  amount: string;
  currency: CurrencyCode;
  minutes: number;
  scheduledStartIso: string;
  linkedCarryoverId?: string | null;
  partialPercentage?: number | null;
}

function buildAuditedSession(fixture: SessionFixture): AuditedSessionStub {
  return {
    id: fixture.id,
    teacherId: fixture.teacherId,
    studentId: fixture.studentId,
    calculationStatus: fixture.status,
    teacherPaidAmount: fixture.amount,
    teacherPaidCurrency: fixture.currency,
    calculatedDuration: fixture.minutes,
    scheduledStartAt: new Date(`${fixture.scheduledStartIso}T10:00:00.000Z`),
    carryoverBalanceId: fixture.linkedCarryoverId ?? null,
    isPartialPercentage: fixture.partialPercentage ?? null,
  };
}

function isMetadataRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildCarryoverRowFromInsert(id: string, input: CarryoverBalanceInsertType): CarryoverBalanceSelectType {
  return {
    id,
    teacherId: input.teacherId,
    studentsCount: input.studentsCount ?? null,
    studentsText: input.studentsText ?? null,
    totalDuration: input.totalDuration ?? null,
    payable: input.payable,
    teacherCurrency: input.teacherCurrency,
    paid: input.paid ?? "0",
    fromDate: input.fromDate ?? null,
    toDate: input.toDate ?? null,
    paymentDate: input.paymentDate ?? null,
    isDisabledTeacher: input.isDisabledTeacher ?? false,
    isPaid: input.isPaid ?? false,
    expenseId: input.expenseId ?? null,
    note: input.note ?? null,
    createdByUserId: input.createdByUserId,
    paidByUserId: input.paidByUserId ?? null,
    paidAt: input.paidAt ?? null,
    createdAt: new Date("2026-09-01T08:00:00.000Z"),
    updatedAt: new Date("2026-09-01T08:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported.
// ---------------------------------------------------------------------------

const mockSessions: AuditedSessionStub[] = [];
const mockTeachers = new Map<string, { id: string; rateCurrency: CurrencyCode | null }>();
const mockDisabledTeacherIds = new Set<string>();
const mockStudentRows: { id: string; name: string }[] = [];
const mockFxRates = new Map<string, { rate: string | null; stale: boolean }>();

const carryoverInserts: CarryoverBalanceInsertType[] = [];
const itemBatches: CarryoverBalanceItemInsertType[][] = [];
const linkCalls: { instanceIds: string[]; carryoverId: string }[] = [];
const sessionPatches: {
  tx: unknown;
  id: string;
  patch: { calculationStatus: CalculationStatus; isPartialPercentage: number | null };
}[] = [];
const eventsCreated: ClassStatusEventSeedInsertInput[] = [];
const auditStore: AuditLogReturnType[] = [];
const acquiredLockKeys: { tx: unknown; lockKey: string }[] = [];
const permissionChecks: { actorUserId: string; permission: AppPermission }[] = [];
const lockedInstanceReads: { ids: readonly string[]; tx: unknown }[] = [];
const replayQueries: { actorUserId?: string | null; action?: AuditLogReturnType["action"] }[] = [];

let carryoverCounter = 0;
let auditCounter = 0;
let permissionError: Error | null = null;
/** Serializes transactions the way the advisory-locked database does, so a concurrent burst replays. */
let transactionChain: Promise<unknown> = Promise.resolve();

/**
 * Sentinel executor handed to the service callback — the students select the
 * service runs in-tx is served from the mock student rows, and every repo
 * mock captures this object to prove the write shares the caller's tx.
 */
const TX_SENTINEL = {
  executor: "carryover-bulk-create-test-transaction",
  select: () => ({
    from: () => ({
      where: async () => [...mockStudentRows],
    }),
  }),
};

const lockInstancesMock = mock(async (ids: readonly string[], tx: unknown) => {
  lockedInstanceReads.push({ ids, tx });
  const found: AuditedSessionStub[] = [];
  for (const id of ids) {
    const row = mockSessions.find(session => session.id === id);
    if (row) found.push(row);
  }
  return found;
});

const linkToCarryoverMock = mock(async (ids: readonly string[], carryoverId: string, tx: unknown) => {
  expect(tx).toBe(TX_SENTINEL);
  linkCalls.push({ instanceIds: [...ids], carryoverId });
  for (const id of ids) {
    const row = mockSessions.find(session => session.id === id);
    if (row) row.carryoverBalanceId = carryoverId;
  }
});

const updatePayrollCalculationMock = mock(
  async (
    tx: unknown,
    id: string,
    patch: { calculationStatus: CalculationStatus; isPartialPercentage: number | null }
  ) => {
    sessionPatches.push({ tx, id, patch });
  }
);

const createManyEventsMock = mock(async (inputs: readonly ClassStatusEventSeedInsertInput[], _tx: unknown) => {
  let eventCounter = eventsCreated.length;
  return inputs.map(input => {
    eventCounter += 1;
    eventsCreated.push(input);
    return {
      id: `carryover-create-event-${eventCounter}`,
      classInstanceId: input.classInstanceId,
      eventType: input.eventType,
      fromState: input.fromState ?? null,
      toState: input.toState ?? null,
      description: input.description ?? null,
      actorUserId: input.actorUserId ?? null,
      createdAt: input.createdAt ?? new Date(),
    };
  });
});

const createCarryoverMock = mock(
  async (input: CarryoverBalanceInsertType, tx: unknown): Promise<CarryoverBalanceSelectType> => {
    expect(tx).toBe(TX_SENTINEL);
    carryoverCounter += 1;
    carryoverInserts.push(input);
    return buildCarryoverRowFromInsert(`carryover-${carryoverCounter}`, input);
  }
);

const insertItemsMock = mock(async (items: CarryoverBalanceItemInsertType[], _tx: unknown) => {
  itemBatches.push([...items]);
  return items;
});

const teacherFindByIdMock = mock(async (teacherId: string, _tx?: unknown) => {
  return mockTeachers.get(teacherId) ?? null;
});

const teacherIsDisabledMock = mock(async (teacherId: string, _tx?: unknown) => {
  return mockDisabledTeacherIds.has(teacherId);
});

const fxRateMock = mock(async (fromCurrency: CurrencyCode, toCurrency: CurrencyCode, _tx?: unknown) => {
  return mockFxRates.get(`${fromCurrency}->${toCurrency}`) ?? { rate: null, stale: true };
});

const acquireAdvisoryLockMock = mock(async (tx: unknown, lockKey: string) => {
  acquiredLockKeys.push({ tx, lockKey });
});

const requirePermissionMock = mock(async (actorUserId: string, permission: AppPermission) => {
  permissionChecks.push({ actorUserId, permission });
  if (permissionError !== null) {
    throw permissionError;
  }
});

const queryAuditLogsMock = mock(
  async (
    filters: {
      actorUserId?: string | null;
      action?: AuditLogReturnType["action"];
      startDate?: Date;
      limit?: number;
      offset?: number;
    },
    _tx: unknown
  ) => {
    replayQueries.push({ actorUserId: filters.actorUserId, action: filters.action });
    const windowStart = filters.startDate?.getTime() ?? Number.NEGATIVE_INFINITY;
    const filtered = auditStore
      .filter(
        row =>
          row.actorUserId === filters.actorUserId &&
          row.action === filters.action &&
          row.createdAt.getTime() >= windowStart
      )
      .toReversed();
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? filtered.length;
    const logs = filtered.slice(offset, offset + limit);
    return { logs, total: filtered.length, hasMore: offset + logs.length < filtered.length };
  }
);

const createManyAuditLogsMock = mock(async (inputs: readonly CreateAuditLogInput[], _tx: unknown) => {
  return inputs.map(input => {
    auditCounter += 1;
    const row: AuditLogReturnType = {
      id: `carryover-create-audit-${auditCounter}`,
      actorUserId: input.actorUserId ?? null,
      actorType: input.actorType,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      description: input.description ?? null,
      previousState: input.previousState ?? null,
      newState: input.newState ?? null,
      changes: input.changes ?? null,
      ipAddress: null,
      userAgent: null,
      metadata: input.metadata ?? null,
      createdAt: new Date(),
    };
    auditStore.push(row);
    return row;
  });
});

/** Runs the service transaction body against the sentinel executor, serialized per key like the advisory lock. */
const dbTransactionMock = mock(async (fn: (tx: unknown) => Promise<unknown>) => {
  const run = transactionChain.then(() => fn(TX_SENTINEL));
  transactionChain = run.catch(() => undefined);
  return run;
});

await mock.module("@/backend/db/drizzleDb", () => ({
  db: { transaction: dbTransactionMock },
  queryDb: () => TX_SENTINEL,
}));

await mock.module("@/backend/db/repo", () => ({
  AuditRepository: { queryAuditLogs: queryAuditLogsMock },
  BillingRepository: { getLatestExchangeRateForDisplay: fxRateMock },
  CarryoverBalanceRepository: {
    create: createCarryoverMock,
    insertItems: insertItemsMock,
  },
  TeacherRepository: { findById: teacherFindByIdMock, isDisabled: teacherIsDisabledMock },
  UserRepository: { findByIds: mock(async () => new Map()) },
}));

await mock.module("@/backend/db/repo/scheduling", () => ({
  SchedulingRepository: {
    getByIdsForUpdate: lockInstancesMock,
    linkToCarryover: linkToCarryoverMock,
    updatePayrollCalculation: updatePayrollCalculationMock,
  },
  ClassStatusEventsRepository: {
    createMany: createManyEventsMock,
  },
}));

await mock.module("@/backend/db/repo/shared", () => ({
  acquireAdvisoryLock: acquireAdvisoryLockMock,
}));

await mock.module("@/backend/services/billing/permission-utils", () => ({
  requirePermission: requirePermissionMock,
}));

await mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: { createManyAuditLogs: createManyAuditLogsMock },
}));

// The bulk-create flow never settles, but the service module imports the real
// expense-ledger surface — keep the barrel mocked so no real service loads.
await mock.module("@/backend/services", () => ({
  ExpenseService: {
    createInternal: mock(async () => ({ id: "unused-expense-id" })),
    softDelete: mock(async () => ({})),
  },
}));

// ---------------------------------------------------------------------------
// Errors stub (only the fields the bulk-create flow actually reads).
// ---------------------------------------------------------------------------

function assertIsErrorsLabels(value: unknown): asserts value is ErrorsLabels {
  if (value === null || typeof value !== "object") {
    throw new Error("tErrorsStub must be an object");
  }
}

function buildErrorsStub(): ErrorsLabels {
  const stub = {
    insufficientPermissions: "Insufficient permissions.",
    invalidInput: "Invalid input.",
    internalServerError: "Internal server error.",
    unknownName: "Unknown",
    carryover: {
      notFound: (id: string) => `Carryover balance not found: ${id}`,
      noInstances: "Select at least one audited session.",
      sessionNotAudited: "Every selected session must be audited first.",
      sessionAlreadyLinked: "A selected session is already linked to a carryover.",
      fxRateMissing: "No current exchange rate is available for the conversion.",
    },
    scheduling: {
      classInstanceNotFound: ({ id }: { id: string }) => `Class instance not found: ${id}`,
    },
    teacher: {
      teacherNotFound: (id: string) => `Teacher not found: ${id}`,
    },
  };
  assertIsErrorsLabels(stub);
  return stub;
}

const tErrors = buildErrorsStub();

const loggerInfoSpy = spyOn(logger, "info").mockImplementation(() => {});
const loggerWarnSpy = spyOn(logger, "warn").mockImplementation(() => {});

function resetMocks(): void {
  mockSessions.length = 0;
  mockTeachers.clear();
  mockDisabledTeacherIds.clear();
  mockStudentRows.length = 0;
  mockFxRates.clear();

  carryoverInserts.length = 0;
  itemBatches.length = 0;
  linkCalls.length = 0;
  sessionPatches.length = 0;
  eventsCreated.length = 0;
  auditStore.length = 0;
  acquiredLockKeys.length = 0;
  permissionChecks.length = 0;
  lockedInstanceReads.length = 0;
  replayQueries.length = 0;

  carryoverCounter = 0;
  auditCounter = 0;
  permissionError = null;
  transactionChain = Promise.resolve();

  lockInstancesMock.mockClear();
  linkToCarryoverMock.mockClear();
  updatePayrollCalculationMock.mockClear();
  createManyEventsMock.mockClear();
  createCarryoverMock.mockClear();
  insertItemsMock.mockClear();
  teacherFindByIdMock.mockClear();
  teacherIsDisabledMock.mockClear();
  fxRateMock.mockClear();
  acquireAdvisoryLockMock.mockClear();
  requirePermissionMock.mockClear();
  queryAuditLogsMock.mockClear();
  createManyAuditLogsMock.mockClear();
  dbTransactionMock.mockClear();
  loggerInfoSpy.mockClear();
  loggerWarnSpy.mockClear();
}

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks are registered first) + shared helpers.
// ---------------------------------------------------------------------------

async function importService(): Promise<typeof import("@/backend/services/teachers/carryover-balance.service")> {
  return import("@/backend/services/teachers/carryover-balance.service");
}

async function create(input: Partial<BulkCreateCarryoverInput> = {}): Promise<BulkCreateCarryoverResult> {
  const { CarryoverBalanceService } = await importService();
  return CarryoverBalanceService.bulkCreateCarryoverBalances(
    { instanceIds: HAPPY_SESSION_IDS, actorUserId: ACTOR_ID, clientRequestId: "req-bulk-1", ...input },
    tErrors
  );
}

async function expectCreateError(input: Partial<BulkCreateCarryoverInput>, code: string): Promise<DomainError> {
  let caught: unknown = null;
  try {
    await create(input);
  } catch (error) {
    caught = error;
  }
  expect(caught).not.toBeNull();
  if (!(caught instanceof DomainError)) {
    throw new Error(`expected a DomainError but got ${String(caught)}`);
  }
  expect(caught.code).toBe(code);
  return caught;
}

function expectNoWrites(): void {
  expect(carryoverInserts).toHaveLength(0);
  expect(itemBatches).toHaveLength(0);
  expect(linkCalls).toHaveLength(0);
  expect(sessionPatches).toHaveLength(0);
  expect(eventsCreated).toHaveLength(0);
  expect(auditStore).toHaveLength(0);
}

/** Three teachers with five audited sessions (2/1/2 sessions) plus their student names. */
function populateHappyPathFixtures(): void {
  mockTeachers.set(TEACHER_ONE_ID, { id: TEACHER_ONE_ID, rateCurrency: CurrencyCode.SAR });
  mockTeachers.set(TEACHER_TWO_ID, { id: TEACHER_TWO_ID, rateCurrency: CurrencyCode.SAR });
  mockTeachers.set(TEACHER_THREE_ID, { id: TEACHER_THREE_ID, rateCurrency: CurrencyCode.SAR });
  mockDisabledTeacherIds.add(TEACHER_THREE_ID);

  mockSessions.push(
    buildAuditedSession({
      id: SESSION_ONE_ID,
      teacherId: TEACHER_ONE_ID,
      studentId: STUDENT_ONE_ID,
      status: CalculationStatus.CALCULATED,
      amount: "100.00",
      currency: CurrencyCode.SAR,
      minutes: 60,
      scheduledStartIso: "2026-08-20",
    }),
    buildAuditedSession({
      id: SESSION_TWO_ID,
      teacherId: TEACHER_ONE_ID,
      studentId: STUDENT_TWO_ID,
      status: CalculationStatus.PARTIALLY,
      amount: "80.00",
      currency: CurrencyCode.SAR,
      minutes: 45,
      scheduledStartIso: "2026-08-21",
      partialPercentage: 50,
    }),
    buildAuditedSession({
      id: SESSION_THREE_ID,
      teacherId: TEACHER_TWO_ID,
      studentId: STUDENT_THREE_ID,
      status: CalculationStatus.REFUND,
      amount: "90.00",
      currency: CurrencyCode.SAR,
      minutes: 60,
      scheduledStartIso: "2026-08-22",
    }),
    buildAuditedSession({
      id: SESSION_FOUR_ID,
      teacherId: TEACHER_THREE_ID,
      studentId: STUDENT_FOUR_ID,
      status: CalculationStatus.CALCULATED,
      amount: "120.00",
      currency: CurrencyCode.SAR,
      minutes: 60,
      scheduledStartIso: "2026-08-19",
    }),
    buildAuditedSession({
      id: SESSION_FIVE_ID,
      teacherId: TEACHER_THREE_ID,
      studentId: STUDENT_FIVE_ID,
      status: CalculationStatus.CALCULATED,
      amount: "60.00",
      currency: CurrencyCode.SAR,
      minutes: 30,
      scheduledStartIso: "2026-08-23",
    })
  );

  mockStudentRows.push(
    { id: STUDENT_ONE_ID, name: "Ahmed Ali" },
    { id: STUDENT_TWO_ID, name: "Layla Hassan" },
    { id: STUDENT_THREE_ID, name: "Omar Khaled" },
    { id: STUDENT_FOUR_ID, name: "Sara Nabil" },
    { id: STUDENT_FIVE_ID, name: "Nora Adel" }
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CarryoverBalanceService.bulkCreateCarryoverBalances", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("happy path", () => {
    test("aggregates audited sessions into one carryover per teacher and moves sessions to WAITING_PAID", async () => {
      populateHappyPathFixtures();

      const result = await create({ note: "September carryover" });

      expect(result.totalInstanceIds).toEqual(HAPPY_SESSION_IDS);
      expect(result.groups).toHaveLength(3);
      expect(result.auditLogIds).toHaveLength(3);

      const [groupOne, groupTwo, groupThree] = result.groups;
      expect(groupOne).toMatchObject({
        teacherId: TEACHER_ONE_ID,
        payable: "180.00",
        totalDuration: "1.75",
        studentsCount: 2,
        currency: CurrencyCode.SAR,
        instanceIds: [SESSION_ONE_ID, SESSION_TWO_ID],
      });
      expect(groupTwo).toMatchObject({
        teacherId: TEACHER_TWO_ID,
        payable: "90.00",
        totalDuration: "1.00",
        studentsCount: 1,
        currency: CurrencyCode.SAR,
        instanceIds: [SESSION_THREE_ID],
      });
      expect(groupThree).toMatchObject({
        teacherId: TEACHER_THREE_ID,
        payable: "180.00",
        totalDuration: "1.50",
        studentsCount: 2,
        currency: CurrencyCode.SAR,
        instanceIds: [SESSION_FOUR_ID, SESSION_FIVE_ID],
      });

      // One carryover row per teacher, with the snapshots the insert carries.
      expect(carryoverInserts).toHaveLength(3);
      const insertOne = carryoverInserts[0];
      if (insertOne == null) throw new Error("expected a carryover insert for teacher one");
      expect(insertOne.studentsText).toBe("Ahmed Ali, Layla Hassan");
      expect(insertOne.fromDate).toBe("2026-08-20");
      expect(insertOne.toDate).toBe("2026-08-21");
      expect(insertOne.isDisabledTeacher).toBe(false);
      expect(insertOne.isPaid).toBe(false);
      expect(insertOne.paid).toBe("0");
      expect(insertOne.createdByUserId).toBe(ACTOR_ID);
      expect(insertOne.note).toBe("September carryover");
      expect(carryoverInserts[2]?.isDisabledTeacher).toBe(true);
      expect(carryoverInserts[1]?.studentsText).toBe("Omar Khaled");

      // One items batch per group, each item carrying the session snapshot.
      expect(itemBatches).toHaveLength(3);
      const firstBatch = itemBatches[0];
      if (firstBatch == null) throw new Error("expected an items batch for teacher one");
      expect(firstBatch).toHaveLength(2);
      expect(firstBatch[0]).toMatchObject({
        carryoverId: groupOne?.carryoverId,
        classInstanceId: SESSION_ONE_ID,
        originalAmount: "100.00",
        originalCurrency: CurrencyCode.SAR,
        originalStatus: CalculationStatus.CALCULATED,
        convertedAmount: null,
        convertedCurrency: null,
      });
      // The PARTIALLY session's percentage is pinned on the item snapshot so
      // the delete revert can restore it after the link cleared the live column.
      expect(firstBatch[1]).toMatchObject({
        classInstanceId: SESSION_TWO_ID,
        originalStatus: CalculationStatus.PARTIALLY,
        originalPartialPercentage: 50,
      });

      // Each session is linked and transitioned to WAITING_PAID with an event.
      expect(linkCalls).toHaveLength(3);
      expect(linkCalls[0]).toEqual({
        instanceIds: [SESSION_ONE_ID, SESSION_TWO_ID],
        carryoverId: groupOne?.carryoverId,
      });
      expect(sessionPatches).toHaveLength(5);
      for (const patch of sessionPatches) {
        expect(patch.tx).toBe(TX_SENTINEL);
        // Linking clears the partial-pay percentage: the live column may only
        // be set on PARTIALLY rows, and WAITING_PAID is not one.
        expect(patch.patch).toEqual({ calculationStatus: CalculationStatus.WAITING_PAID, isPartialPercentage: null });
      }
      expect(eventsCreated).toHaveLength(5);
      const firstEvent = eventsCreated[0];
      expect(firstEvent?.eventType).toBe("PAYROLL_STATUS_TRANSITION");
      expect(firstEvent?.classInstanceId).toBe(SESSION_ONE_ID);
      expect(firstEvent?.fromState).toEqual({
        calculationStatus: CalculationStatus.CALCULATED,
        teacherPaidAmount: "100.00",
      });
      expect(firstEvent?.toState).toEqual({ calculationStatus: CalculationStatus.WAITING_PAID });
      expect(firstEvent?.description).toContain(`Linked to carryover ${groupOne?.carryoverId}`);

      // One CARRYOVER_CREATE audit row per group, replay-keyed.
      const expectedKey = deriveBulkCreateIdempotencyKey({
        instanceIds: HAPPY_SESSION_IDS,
        actorUserId: ACTOR_ID,
      });
      expect(auditStore).toHaveLength(3);
      for (const row of auditStore) {
        expect(row.action).toBe("CARRYOVER_CREATE");
        expect(row.entityType).toBe("CARRYOVER_BALANCE");
        expect(row.actorUserId).toBe(ACTOR_ID);
      }
      const metadata = auditStore[0]?.metadata;
      if (!isMetadataRecord(metadata)) {
        throw new Error("expected object metadata on the create audit row");
      }
      expect(metadata.idempotencyKey).toBe(expectedKey);
      expect(metadata.teacherId).toBe(TEACHER_ONE_ID);
      expect(result.auditLogIds).toEqual(auditStore.map(row => row.id));

      // Permission gate, idempotent advisory lock, and replay pre-check ran once.
      expect(permissionChecks).toEqual([
        { actorUserId: ACTOR_ID, permission: AppPermission.ACCOUNTING_CARRYOVER_MANAGE },
      ]);
      expect(acquiredLockKeys).toHaveLength(1);
      expect(acquiredLockKeys[0]?.lockKey).toBe(`carryover-bulk-create:${expectedKey}`);
      expect(replayQueries).toEqual([{ actorUserId: ACTOR_ID, action: "CARRYOVER_CREATE" }]);
      expect(lockedInstanceReads).toEqual([{ ids: HAPPY_SESSION_IDS, tx: TX_SENTINEL }]);

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        "Carryover balances created",
        expect.objectContaining({ actorUserId: ACTOR_ID, groupCount: 3, instanceCount: 5 })
      );
    });
  });
});

describe("CarryoverBalanceService.bulkCreateCarryoverBalances — guards", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("audited-state guard", () => {
    test("rejects when every selected session is unaudited", async () => {
      mockTeachers.set(TEACHER_ONE_ID, { id: TEACHER_ONE_ID, rateCurrency: CurrencyCode.SAR });
      mockSessions.push(
        buildAuditedSession({
          id: SESSION_ONE_ID,
          teacherId: TEACHER_ONE_ID,
          studentId: STUDENT_ONE_ID,
          status: CalculationStatus.NOT_CALCULATED,
          amount: "100.00",
          currency: CurrencyCode.SAR,
          minutes: 60,
          scheduledStartIso: "2026-08-20",
        }),
        buildAuditedSession({
          id: SESSION_TWO_ID,
          teacherId: TEACHER_ONE_ID,
          studentId: STUDENT_TWO_ID,
          status: CalculationStatus.WAITING_PAID,
          amount: "80.00",
          currency: CurrencyCode.SAR,
          minutes: 45,
          scheduledStartIso: "2026-08-21",
        })
      );

      const error = await expectCreateError(
        { instanceIds: [SESSION_ONE_ID, SESSION_TWO_ID] },
        "CARRYOVER_SESSION_NOT_AUDITED"
      );
      expect(error.message).toContain("audited");
      expectNoWrites();
    });
  });

  describe("already-linked guard", () => {
    test("rejects when a selected session is already attached to a carryover", async () => {
      mockTeachers.set(TEACHER_ONE_ID, { id: TEACHER_ONE_ID, rateCurrency: CurrencyCode.SAR });
      mockSessions.push(
        buildAuditedSession({
          id: SESSION_ONE_ID,
          teacherId: TEACHER_ONE_ID,
          studentId: STUDENT_ONE_ID,
          status: CalculationStatus.CALCULATED,
          amount: "100.00",
          currency: CurrencyCode.SAR,
          minutes: 60,
          scheduledStartIso: "2026-08-20",
          linkedCarryoverId: "existing-carryover-id",
        })
      );

      const error = await expectCreateError({ instanceIds: [SESSION_ONE_ID] }, "CARRYOVER_SESSION_ALREADY_LINKED");
      expect(error.message).toContain("already linked");
      expectNoWrites();
    });
  });

  describe("unknown session guard", () => {
    test("rejects an instance id that cannot be locked", async () => {
      mockTeachers.set(TEACHER_ONE_ID, { id: TEACHER_ONE_ID, rateCurrency: CurrencyCode.SAR });
      mockSessions.push(
        buildAuditedSession({
          id: SESSION_ONE_ID,
          teacherId: TEACHER_ONE_ID,
          studentId: STUDENT_ONE_ID,
          status: CalculationStatus.CALCULATED,
          amount: "100.00",
          currency: CurrencyCode.SAR,
          minutes: 60,
          scheduledStartIso: "2026-08-20",
        })
      );

      const error = await expectCreateError(
        { instanceIds: [SESSION_ONE_ID, UNKNOWN_SESSION_ID] },
        "CLASS_INSTANCE_NOT_FOUND"
      );
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain(UNKNOWN_SESSION_ID);
      expectNoWrites();
    });
  });

  describe("empty selection", () => {
    test("rejects an empty instance list before opening the transaction", async () => {
      const error = await expectCreateError({ instanceIds: [] }, "VALIDATION");
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain("at least one audited session");

      expect(permissionChecks).toHaveLength(1);
      expect(dbTransactionMock).not.toHaveBeenCalled();
      expectNoWrites();
    });
  });

  describe("permission gate", () => {
    test("propagates the insufficient-permissions error without opening a transaction", async () => {
      permissionError = new ForbiddenError("Insufficient permissions.");

      const error = await expectCreateError({}, "FORBIDDEN");
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toContain("Insufficient permissions");

      expect(dbTransactionMock).not.toHaveBeenCalled();
      expect(acquiredLockKeys).toHaveLength(0);
      expectNoWrites();
    });
  });
});

describe("CarryoverBalanceService.bulkCreateCarryoverBalances — currency conversion", () => {
  beforeEach(() => {
    resetMocks();
  });

  /** One teacher whose two sessions pay in different currencies; SAR wins the dominant-currency tie as the rate fallback. */
  function populateCrossCurrencyFixtures(): void {
    mockTeachers.set(TEACHER_ONE_ID, { id: TEACHER_ONE_ID, rateCurrency: CurrencyCode.SAR });
    mockSessions.push(
      buildAuditedSession({
        id: SESSION_ONE_ID,
        teacherId: TEACHER_ONE_ID,
        studentId: STUDENT_ONE_ID,
        status: CalculationStatus.CALCULATED,
        amount: "100.00",
        currency: CurrencyCode.SAR,
        minutes: 60,
        scheduledStartIso: "2026-08-20",
      }),
      buildAuditedSession({
        id: SESSION_TWO_ID,
        teacherId: TEACHER_ONE_ID,
        studentId: STUDENT_TWO_ID,
        status: CalculationStatus.CALCULATED,
        amount: "40.00",
        currency: CurrencyCode.USD,
        minutes: 60,
        scheduledStartIso: "2026-08-21",
      })
    );
    mockStudentRows.push({ id: STUDENT_ONE_ID, name: "Ahmed Ali" }, { id: STUDENT_TWO_ID, name: "Layla Hassan" });
  }

  describe("cross-currency conversion", () => {
    test("converts the foreign session's amount and keeps its original snapshot", async () => {
      populateCrossCurrencyFixtures();
      mockFxRates.set(`${CurrencyCode.USD}->${CurrencyCode.SAR}`, { rate: "3.75", stale: false });

      const result = await create({ instanceIds: [SESSION_ONE_ID, SESSION_TWO_ID] });

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]).toMatchObject({
        teacherId: TEACHER_ONE_ID,
        payable: "250.00",
        currency: CurrencyCode.SAR,
      });
      expect(carryoverInserts[0]?.payable).toBe("250.00");
      expect(carryoverInserts[0]?.teacherCurrency).toBe(CurrencyCode.SAR);

      // The foreign item preserves the original amount/currency and stores the conversion.
      expect(itemBatches).toHaveLength(1);
      const items = itemBatches[0];
      if (items == null) throw new Error("expected the converted group's items");
      expect(items[0]).toMatchObject({
        classInstanceId: SESSION_ONE_ID,
        originalAmount: "100.00",
        originalCurrency: CurrencyCode.SAR,
        convertedAmount: null,
        convertedCurrency: null,
      });
      expect(items[1]).toMatchObject({
        classInstanceId: SESSION_TWO_ID,
        originalAmount: "40.00",
        originalCurrency: CurrencyCode.USD,
        convertedAmount: "150.00",
        convertedCurrency: CurrencyCode.SAR,
      });

      expect(fxRateMock).toHaveBeenCalledTimes(1);
      expect(fxRateMock).toHaveBeenCalledWith(CurrencyCode.USD, CurrencyCode.SAR, TX_SENTINEL);
    });
  });

  describe("missing FX rate", () => {
    const missingRateShapes: [string, { rate: string | null; stale: boolean }][] = [
      ["no rate row at all", { rate: null, stale: true }],
      ["a stale rate", { rate: "3.74", stale: true }],
    ];

    for (const [label, rateShape] of missingRateShapes) {
      test(`rejects the whole aggregation when the FX rate is missing (${label})`, async () => {
        populateCrossCurrencyFixtures();
        mockFxRates.set(`${CurrencyCode.USD}->${CurrencyCode.SAR}`, rateShape);

        const error = await expectCreateError(
          { instanceIds: [SESSION_ONE_ID, SESSION_TWO_ID] },
          "CARRYOVER_FX_RATE_MISSING"
        );
        expect(error.message).toContain("exchange rate");
        // The conversion is attempted before the carryover insert — nothing was written.
        expectNoWrites();
      });
    }
  });
});

describe("CarryoverBalanceService.bulkCreateCarryoverBalances — idempotency and abuse", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("idempotent re-submit", () => {
    test("replays the first result for an identical re-submit inside the window", async () => {
      populateHappyPathFixtures();

      const first = await create();
      const second = await create({ clientRequestId: "req-bulk-1-retry", note: "note changed on retry" });

      expect(second).toEqual(first);

      // No second write round: instances were never re-locked and no rows were re-created.
      expect(lockedInstanceReads).toHaveLength(1);
      expect(carryoverInserts).toHaveLength(3);
      expect(itemBatches).toHaveLength(3);
      expect(sessionPatches).toHaveLength(5);
      expect(eventsCreated).toHaveLength(5);
      expect(auditStore).toHaveLength(3);

      // The replay path still holds the key-scoped advisory lock and re-queries the audit rows.
      expect(acquiredLockKeys).toHaveLength(2);
      expect(acquiredLockKeys[0]?.lockKey).toBe(acquiredLockKeys[1]?.lockKey);
      expect(replayQueries).toHaveLength(2);
    });

    test("serializes a concurrent duplicate burst onto the first write", async () => {
      populateHappyPathFixtures();

      const [first, second] = await Promise.all([
        create({ clientRequestId: "req-burst-a" }),
        create({ clientRequestId: "req-burst-b" }),
      ]);

      expect(second).toEqual(first);
      expect(carryoverInserts).toHaveLength(3);
      expect(auditStore).toHaveLength(3);
      expect(acquiredLockKeys).toHaveLength(2);
    });

    test("rejects a tampered re-submit whose instance payload diverges from a settled request", async () => {
      populateHappyPathFixtures();

      await create({ instanceIds: [SESSION_ONE_ID] });

      // Re-submitting under the same client request but with an extra session is
      // a distinct payload, so the natural guards run — the original session is
      // already linked and the tampered submit is rejected.
      const error = await expectCreateError(
        { clientRequestId: "req-bulk-1", instanceIds: [SESSION_ONE_ID, SESSION_TWO_ID] },
        "CARRYOVER_SESSION_ALREADY_LINKED"
      );
      expect(error.message).toContain("already linked");

      expect(carryoverInserts).toHaveLength(1);
      expect(auditStore).toHaveLength(1);
      expect(lockedInstanceReads).toHaveLength(2);
    });

    test("a re-submit outside the 60-second replay window hits the natural guards instead of a stale replay", async () => {
      populateHappyPathFixtures();

      await create({ instanceIds: [SESSION_ONE_ID] });

      // Age the audit rows past the replay window: the windowed audit query
      // then excludes them, so the tampered re-submit can no longer capture a
      // stale result.
      for (const row of auditStore) {
        row.createdAt = new Date(Date.now() - 120_000);
      }

      const error = await expectCreateError(
        { clientRequestId: "req-bulk-expired", instanceIds: [SESSION_ONE_ID] },
        "CARRYOVER_SESSION_ALREADY_LINKED"
      );
      expect(error.message).toContain("already linked");

      expect(carryoverInserts).toHaveLength(1);
      expect(auditStore).toHaveLength(1);
    });

    test("a malformed instance id is rejected before the advisory lock is taken", async () => {
      populateHappyPathFixtures();

      const error = await expectCreateError(
        { instanceIds: [SESSION_ONE_ID, "not-a-uuid"] },
        "CLASS_INSTANCE_NOT_FOUND"
      );
      expect(error.message).toContain("Class instance not found");

      expect(lockedInstanceReads).toHaveLength(0);
      expect(acquiredLockKeys).toHaveLength(0);
      expectNoWrites();
    });
  });
});

describe("CarryoverBalanceService.bulkCreateCarryoverBalances — students summary", () => {
  beforeEach(() => {
    resetMocks();
  });
  describe("studentsText truncation", () => {
    test("truncates a long student-name summary to the column limit and keeps the count", async () => {
      const sessionIds: string[] = [];
      mockTeachers.set(TEACHER_ONE_ID, { id: TEACHER_ONE_ID, rateCurrency: CurrencyCode.SAR });
      for (let index = 0; index < 40; index += 1) {
        const sessionId = `70000000-0000-4000-8000-${(0x100000000000 + index).toString(16)}`;
        const studentId = `70000000-0000-4000-8000-${(0x200000000000 + index).toString(16)}`;
        sessionIds.push(sessionId);
        mockSessions.push(
          buildAuditedSession({
            id: sessionId,
            teacherId: TEACHER_ONE_ID,
            studentId,
            status: CalculationStatus.CALCULATED,
            amount: "10.00",
            currency: CurrencyCode.SAR,
            minutes: 60,
            scheduledStartIso: "2026-08-20",
          })
        );
        mockStudentRows.push({ id: studentId, name: `Long Student Name ${index}` });
      }

      const result = await create({ instanceIds: sessionIds });

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]?.studentsCount).toBe(40);

      const insert = carryoverInserts[0];
      if (insert == null) throw new Error("expected the carryover insert");
      const summary = insert.studentsText;
      if (summary == null) throw new Error("expected a students summary");
      // 497 content chars + the single-character ellipsis stay under the 500-char column.
      expect(summary).toHaveLength(498);
      expect(summary.endsWith("…")).toBe(true);
      expect(summary.startsWith("Long Student Name 0")).toBe(true);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        "Carryover students text truncated",
        expect.objectContaining({ studentsCount: 40 })
      );
    });
  });
});

// ---------------------------------------------------------------------------
// TB.5 gap-fill: residual Tier-1 branch + Tier-4 replay-tamper branches
// ---------------------------------------------------------------------------

function buildAuditRowForReplay(metadata: unknown, overrides: Partial<AuditLogReturnType> = {}): AuditLogReturnType {
  return {
    id: `seeded-replay-audit-${auditStore.length + 1}`,
    actorUserId: ACTOR_ID,
    actorType: "USER",
    entityType: "CARRYOVER_BALANCE",
    entityId: "seeded-carryover-id",
    action: "CARRYOVER_CREATE",
    description: null,
    previousState: null,
    newState: null,
    changes: null,
    ipAddress: null,
    userAgent: null,
    metadata,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("CarryoverBalanceService.bulkCreateCarryoverBalances — residual branches", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("missing teacher", () => {
    test("rejects when a session's teacher row cannot be resolved", async () => {
      // Session exists but carries a teacher id with no teacher row — the
      // module-under-test resolve path must fail before writing anything.
      mockSessions.push(
        buildAuditedSession({
          id: SESSION_ONE_ID,
          teacherId: TEACHER_ONE_ID,
          studentId: STUDENT_ONE_ID,
          status: CalculationStatus.CALCULATED,
          amount: "100.00",
          currency: CurrencyCode.SAR,
          minutes: 60,
          scheduledStartIso: "2026-08-20",
        })
      );

      const error = await expectCreateError({ instanceIds: [SESSION_ONE_ID] }, "TEACHER_NOT_FOUND");
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain("not found");
      expect(insertItemsMock).not.toHaveBeenCalled();
      expect(carryoverInserts).toHaveLength(0);
    });
  });

  describe("null session payload fallbacks", () => {
    test("sessions without a paid amount or currency aggregate as zero in the dominant currency", async () => {
      mockTeachers.set(TEACHER_ONE_ID, { id: TEACHER_ONE_ID, rateCurrency: CurrencyCode.SAR });
      const session = buildAuditedSession({
        id: SESSION_ONE_ID,
        teacherId: TEACHER_ONE_ID,
        studentId: STUDENT_ONE_ID,
        status: CalculationStatus.CALCULATED,
        amount: "100.00",
        currency: CurrencyCode.SAR,
        minutes: 60,
        scheduledStartIso: "2026-08-20",
      });
      const nullAmount = { ...session, teacherPaidAmount: null, teacherPaidCurrency: null };
      mockSessions.push(nullAmount);

      const result = await create({ instanceIds: [SESSION_ONE_ID] });

      expect(result.groups[0]?.payable).toBe("0.00");
      expect(result.groups[0]?.currency).toBe(CurrencyCode.SAR);
      const batch = itemBatches[0];
      expect(batch?.[0]).toMatchObject({
        originalAmount: "0",
        originalCurrency: CurrencyCode.SAR,
        convertedAmount: null,
        convertedCurrency: null,
      });
    });
  });

  describe("malformed FX rate", () => {
    test("rejects the aggregation when the stored rate cannot be parsed", async () => {
      mockTeachers.set(TEACHER_ONE_ID, { id: TEACHER_ONE_ID, rateCurrency: CurrencyCode.SAR });
      // The SAR/USD tie resolves to the teacher's rate currency (SAR), forcing
      // the USD session through the FX conversion path.
      mockSessions.push(
        buildAuditedSession({
          id: SESSION_ONE_ID,
          teacherId: TEACHER_ONE_ID,
          studentId: STUDENT_ONE_ID,
          status: CalculationStatus.CALCULATED,
          amount: "100.00",
          currency: CurrencyCode.SAR,
          minutes: 60,
          scheduledStartIso: "2026-08-20",
        }),
        buildAuditedSession({
          id: SESSION_TWO_ID,
          teacherId: TEACHER_ONE_ID,
          studentId: STUDENT_TWO_ID,
          status: CalculationStatus.CALCULATED,
          amount: "40.00",
          currency: CurrencyCode.USD,
          minutes: 60,
          scheduledStartIso: "2026-08-21",
        })
      );
      mockFxRates.set(`${CurrencyCode.USD}->${CurrencyCode.SAR}`, { rate: "not-a-rate", stale: false });

      const error = await expectCreateError(
        { instanceIds: [SESSION_ONE_ID, SESSION_TWO_ID] },
        "CARRYOVER_AMOUNT_INVALID"
      );
      expect(error.message).toContain("Internal server error");
      expect(insertItemsMock).not.toHaveBeenCalled();
      expect(carryoverInserts).toHaveLength(0);
    });
  });

  describe("replay with corrupt audit metadata", () => {
    test("ignores audit rows whose metadata cannot be reconstructed and re-runs the creation", async () => {
      populateHappyPathFixtures();
      const expectedKey = deriveBulkCreateIdempotencyKey({
        instanceIds: HAPPY_SESSION_IDS,
        actorUserId: ACTOR_ID,
      });
      // Key matches but the payload fields are absent — the replay must refuse
      // to fabricate group results and fall through to a real write.
      auditStore.push(buildAuditRowForReplay({ idempotencyKey: expectedKey, teacherId: TEACHER_ONE_ID }));
      auditStore.push(buildAuditRowForReplay("not-an-object"));

      const result = await create();

      expect(result.groups).toHaveLength(3);
      expect(carryoverInserts).toHaveLength(3);
      // The two corrupt rows plus the three fresh CARRYOVER_CREATE rows.
      expect(auditStore).toHaveLength(5);
    });
  });

  describe("duplicate id selection", () => {
    test("dedupes repeated instance ids before locking", async () => {
      populateHappyPathFixtures();

      await create({ instanceIds: [SESSION_ONE_ID, SESSION_ONE_ID] });

      expect(lockedInstanceReads).toEqual([{ ids: [SESSION_ONE_ID], tx: TX_SENTINEL }]);
      expect(carryoverInserts).toHaveLength(1);
    });
  });

  describe("replay of a batch larger than one audit page", () => {
    test("pages through the window and replays every group instead of truncating", async () => {
      // 550 keyed audit rows (one per teacher group) plus unrelated-key noise —
      // several times the historical single-page lookup cap.
      const groupCount = 550;
      const instanceIds: string[] = [];
      const carryoverIds: string[] = [];
      for (let index = 0; index < groupCount; index += 1) {
        instanceIds.push(`00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`);
        carryoverIds.push(`00000000-0000-4000-a000-${String(index + 1).padStart(12, "0")}`);
      }
      const expectedKey = deriveBulkCreateIdempotencyKey({ instanceIds, actorUserId: ACTOR_ID });
      for (let index = 0; index < groupCount; index += 1) {
        auditStore.push(
          buildAuditRowForReplay(
            {
              idempotencyKey: expectedKey,
              teacherId: `00000000-0000-4000-9000-${String(index + 1).padStart(12, "0")}`,
              instanceIds: [instanceIds[index]],
              studentsCount: 1,
              totalDuration: "1.00",
              payable: "10.00",
              currency: CurrencyCode.SAR,
            },
            { id: `big-batch-audit-${index}`, entityId: carryoverIds[index] }
          )
        );
      }
      for (let index = 0; index < 5; index += 1) {
        auditStore.push(buildAuditRowForReplay({ idempotencyKey: "other-batch-key" }, { id: `noise-audit-${index}` }));
      }

      const result = await create({ instanceIds });

      expect(result.groups).toHaveLength(groupCount);
      const replayedCarryoverIds = new Set(result.groups.map(group => group.carryoverId));
      expect(replayedCarryoverIds.size).toBe(groupCount);
      for (const carryoverId of carryoverIds) {
        expect(replayedCarryoverIds.has(carryoverId)).toBe(true);
      }
      expect(result.totalInstanceIds).toEqual(instanceIds);
      // A pure replay: no session lock, no writes of any kind.
      expect(lockedInstanceReads).toHaveLength(0);
      expect(carryoverInserts).toHaveLength(0);
      expect(itemBatches).toHaveLength(0);
      // The lookup paged past a single window read.
      expect(queryAuditLogsMock.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
