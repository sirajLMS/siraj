import { beforeEach, describe, expect, mock, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { PayrollCalculationPatch } from "@/backend/db/repo/scheduling/class-instances";
import { AccountStatus, AppPermission, CalculationStatus, SchedulingMode } from "@/backend/enum";
import { DomainError, ForbiddenError } from "@/backend/lib";
import { deriveCrudIdempotencyKey } from "@/backend/services/teachers/carryover-idempotency";
import type {
  AuditLogFilterInput,
  AuditLogReturnType,
  CarryoverBalanceInsertType,
  CarryoverBalanceItemSelectType,
  CarryoverBalanceSelectType,
  CarryoverBalanceUpdatePatch,
  CarryoverFilters,
  CarryoverLinkedSessionRow,
  CarryoverRow,
  ClassInstanceSelectType,
  ClassStatusEventSeedInsertInput,
  CreateAuditLogInput,
  CreateCarryoverInput,
  DBTransaction,
  FindLinkedSessionsOptions,
  TeacherSelectType,
  UpdateCarryoverInput,
  UserSelectType,
} from "@/backend/types";
import { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import type { ErrorsLabels } from "@/shared/locale";
import { errorsEn } from "@/shared/locale/en/errors";

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

const ACTOR_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01";
const TEACHER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01";
const TEACHER_USER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccc01";
const OTHER_TEACHER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb02";
const CARRYOVER_ID_A = "dddddddd-dddd-4ddd-8ddd-dddddddddd01";
const CARRYOVER_ID_B = "dddddddd-dddd-4ddd-8ddd-dddddddddd02";
const SESSION_ID_A = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01";
const SESSION_ID_B = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02";
const EXPENSE_ID = "ffffffff-ffff-4fff-8fff-ffffffffff01";
const REMOVED_EXPENSE_ID = "ffffffff-ffff-4fff-8fff-ffffffffff02";
const ITEM_ID_A = "99999999-aaaa-4999-8999-9999999999aa";
const ITEM_ID_B = "99999999-bbbb-4999-8999-9999999999bb";

const NOW = new Date("2026-09-01T08:00:00.000Z");
const SCHEDULED_START = new Date("2026-08-20T10:00:00.000Z");

/** Real English error labels — exercises the same shape the service consumes. */
const tErrors: ErrorsLabels = errorsEn;

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

function buildTeacherRow(overrides: Partial<TeacherSelectType> = {}): TeacherSelectType {
  return {
    id: TEACHER_ID,
    userId: TEACHER_USER_ID,
    nationality: null,
    nationalId: null,
    phone: null,
    dateOfBirth: null,
    gender: null,
    address: null,
    qualifications: null,
    countryCode: null,
    hourlyRate: "120",
    rateCurrency: CurrencyCode.SAR,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildTeacherUserRow(overrides: Partial<UserSelectType> = {}): UserSelectType {
  return {
    id: TEACHER_USER_ID,
    name: "Carry Teacher",
    email: "carry-teacher@test.dev",
    emailVerifiedAt: null,
    password: "hashed-pw",
    rememberTokenHash: null,
    avatarFilePath: null,
    avatarUrl: null,
    phone: null,
    status: AccountStatus.ACTIVATED,
    isSuperAdmin: false,
    timezone: IanaTimezone.UTC,
    displayCurrency: null,
    lastLoginAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

function buildCarryoverRow(overrides: Partial<CarryoverBalanceSelectType> = {}): CarryoverBalanceSelectType {
  return {
    id: CARRYOVER_ID_A,
    teacherId: TEACHER_ID,
    studentsCount: 2,
    studentsText: "Student One, Student Two",
    totalDuration: "2.00",
    payable: "100.50",
    teacherCurrency: CurrencyCode.SAR,
    paid: "0",
    fromDate: "2026-08-01",
    toDate: "2026-08-31",
    paymentDate: null,
    isDisabledTeacher: false,
    isPaid: false,
    expenseId: null,
    note: "initial note",
    createdByUserId: ACTOR_ID,
    paidByUserId: null,
    paidAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildPaidRow(overrides: Partial<CarryoverBalanceSelectType> = {}): CarryoverBalanceSelectType {
  return buildCarryoverRow({
    isPaid: true,
    paid: "100.50",
    paymentDate: "2026-09-01",
    expenseId: EXPENSE_ID,
    paidByUserId: ACTOR_ID,
    paidAt: NOW,
    ...overrides,
  });
}

function buildItemRow(overrides: Partial<CarryoverBalanceItemSelectType> = {}): CarryoverBalanceItemSelectType {
  return {
    id: ITEM_ID_A,
    carryoverId: CARRYOVER_ID_A,
    classInstanceId: SESSION_ID_A,
    originalAmount: "60.25",
    originalCurrency: CurrencyCode.SAR,
    originalStatus: CalculationStatus.CALCULATED,
    originalPartialPercentage: null,
    convertedAmount: null,
    convertedCurrency: null,
    createdAt: NOW,
    ...overrides,
  };
}

/** Ledger item for a session whose pre-carryover status was a partial payout. */
function buildPartialItemRow(overrides: Partial<CarryoverBalanceItemSelectType> = {}): CarryoverBalanceItemSelectType {
  return buildItemRow({
    id: ITEM_ID_B,
    classInstanceId: SESSION_ID_B,
    originalAmount: "40.25",
    originalStatus: CalculationStatus.PARTIALLY,
    originalPartialPercentage: 40,
    ...overrides,
  });
}

function buildSessionRow(overrides: Partial<ClassInstanceSelectType> = {}): ClassInstanceSelectType {
  const end = new Date(SCHEDULED_START.getTime() + 60 * 60_000);
  return {
    id: SESSION_ID_A,
    studentId: "70707070-7070-4707-8707-707070707001",
    teacherId: TEACHER_ID,
    subjectId: "80808080-8080-4808-8808-808080808001",
    recurringScheduleId: null,
    originalClassId: null,
    scheduledStartAt: SCHEDULED_START,
    scheduledEndAt: end,
    bookingTimezoneId: null,
    bookingTimezone: "UTC",
    bookingUtcOffset: 0,
    durationMinutes: 60,
    classType: ClassType.REGULAR,
    outcome: ClassOutcome.TAKEN,
    executionState: ClassExecutionState.COMPLETED,
    billedUnit: null,
    isRescheduled: false,
    isFrozen: false,
    meetingJoinUrl: null,
    userMeetingConfigId: null,
    meetingProviderId: null,
    meetingConfigSnapshot: null,
    activatedAt: null,
    activatedByUserId: null,
    forceActivated: false,
    forceActivatedByUserId: null,
    actualStartAt: SCHEDULED_START,
    actualEndAt: end,
    quotaDeducted: true,
    schedulingMode: SchedulingMode.NUMBER_OF_CLASSES,
    ondemandStatus: null,
    payrollCredited: false,
    rateAmount: null,
    rateCurrency: null,
    isRateOverridden: false,
    rateSource: null,
    calculatedDuration: 60,
    teacherPaidAmount: "60.25",
    teacherPaidCurrency: CurrencyCode.SAR,
    calculationStatus: CalculationStatus.WAITING_PAID,
    isPartialPercentage: null,
    payrollNote: null,
    payrollCalculatedAt: null,
    payrollCalculatedBy: null,
    carryoverBalanceId: CARRYOVER_ID_A,
    remarks: null,
    adminNotes: null,
    idempotencyKey: `booking-${randomUUID()}`,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

function buildAuditRow(input: CreateAuditLogInput, sequence: number): AuditLogReturnType {
  return {
    id: `audit-${sequence}-${input.entityId}`,
    actorUserId: input.actorUserId ?? null,
    actorType: input.actorType,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    description: input.description ?? null,
    previousState: input.previousState ?? null,
    newState: input.newState ?? null,
    changes: input.changes ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: input.metadata ?? null,
    createdAt: NOW,
  };
}

// ---------------------------------------------------------------------------
// Mutable scenario state + call capture
// ---------------------------------------------------------------------------

let carryoverRows: CarryoverBalanceSelectType[] = [];
let teacherRow: TeacherSelectType | null = null;
let teacherDisabled = false;
let linkedSessionRows: ClassInstanceSelectType[] = [];
let itemsSnapshot: CarryoverBalanceItemSelectType[] = [];
let permissionError: Error | null = null;
/** Audit rows the replay pre-check sees; seeded per-test to simulate prior writes. */
let replayRows: AuditLogReturnType[] = [];
/** Rows served by the report read; `teacherName`/`teacherAvatarUrl` come from the repo join. */
let filteredResult: {
  rows: (CarryoverBalanceSelectType & { teacherName: string; teacherAvatarUrl: string | null })[];
  totalCount: number;
} = { rows: [], totalCount: 0 };
/** Rows served by the linked-session display read. */
let linkedSessionRowStubs: CarryoverLinkedSessionRow[] = [];

const lockKeys: string[] = [];
const lockReads: string[][] = [];
const createCalls: CarryoverBalanceInsertType[] = [];
const updateCalls: { id: string; patch: CarryoverBalanceUpdatePatch }[] = [];
const deleteCalls: string[] = [];
const linkedSessionReads: string[] = [];
const linkedSessionOptions: (FindLinkedSessionsOptions | null)[] = [];
const sessionPatches: { id: string; patch: PayrollCalculationPatch }[] = [];
const unlinkCalls: string[][] = [];
const eventInputs: ClassStatusEventSeedInsertInput[] = [];
const auditInputs: CreateAuditLogInput[] = [];
const auditQueries: AuditLogFilterInput[] = [];
const permissionChecks: AppPermission[] = [];
const findFilteredCalls: { filters: CarryoverFilters; pagination: { limit: number; offset: number } }[] = [];

/** Every patch key the service writes — the fake update applies only these. */
const PATCH_KEYS = [
  "fromDate",
  "toDate",
  "payable",
  "teacherCurrency",
  "studentsCount",
  "studentsText",
  "totalDuration",
  "note",
  "paid",
  "isPaid",
  "paymentDate",
  "expenseId",
  "paidAt",
  "paidByUserId",
] as const satisfies readonly (keyof CarryoverBalanceUpdatePatch)[];

function applyPatch(row: CarryoverBalanceSelectType, patch: CarryoverBalanceUpdatePatch): CarryoverBalanceSelectType {
  const next = { ...row, updatedAt: NOW };
  for (const key of PATCH_KEYS) {
    if (!(key in patch)) continue;
    const value = patch[key];
    if (value === undefined) continue;
    Object.assign(next, { [key]: value });
  }
  return next;
}

function isDbTransaction(value: unknown): value is DBTransaction {
  return typeof value === "object" && value !== null;
}

/** Fake rollback transaction — the only direct tx usage is the item-snapshot read. */
function asDbTransaction(value: object): DBTransaction {
  if (!isDbTransaction(value)) {
    throw new Error("fake transaction must be an object");
  }
  return value;
}

const FAKE_TX = asDbTransaction({
  select: () => ({ from: () => ({ where: async () => itemsSnapshot }) }),
});

// ---------------------------------------------------------------------------
// Repository / service dependency mocks (registered before the SUT import)
// ---------------------------------------------------------------------------

const requirePermissionMock = mock(async (_actorUserId: string, permission: AppPermission) => {
  permissionChecks.push(permission);
  if (permissionError !== null) {
    throw permissionError;
  }
});

const queryAuditLogsMock = mock(async (filters: AuditLogFilterInput) => {
  auditQueries.push(filters);
  return { logs: replayRows, total: replayRows.length, hasMore: false };
});

const createManyAuditLogsMock = mock(async (inputs: readonly CreateAuditLogInput[]) => {
  auditInputs.push(...inputs);
  return inputs.map((input, index) => buildAuditRow(input, auditInputs.length - inputs.length + index));
});

const carryoverGetByIdsForUpdateMock = mock(async (ids: readonly string[]) => {
  lockReads.push([...ids]);
  return ids
    .map(id => carryoverRows.find(row => row.id === id))
    .filter((row): row is CarryoverBalanceSelectType => row != null);
});

const carryoverGetByIdMock = mock(async (id: string) => {
  return carryoverRows.find(row => row.id === id) ?? null;
});

const carryoverCreateMock = mock(async (input: CarryoverBalanceInsertType) => {
  createCalls.push(input);
  const row: CarryoverBalanceSelectType = {
    id: randomUUID(),
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
    paidByUserId: null,
    paidAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
  carryoverRows.push(row);
  return row;
});

const carryoverUpdateMock = mock(async (id: string, patch: CarryoverBalanceUpdatePatch) => {
  updateCalls.push({ id, patch });
  const index = carryoverRows.findIndex(row => row.id === id);
  const current = carryoverRows[index];
  if (index < 0 || current == null) return null;
  const updated = applyPatch(current, patch);
  carryoverRows[index] = updated;
  return updated;
});

const carryoverDeleteByIdMock = mock(async (id: string) => {
  deleteCalls.push(id);
  const index = carryoverRows.findIndex(row => row.id === id);
  const current = carryoverRows[index];
  if (index < 0 || current == null) return null;
  carryoverRows = carryoverRows.filter(row => row.id !== id);
  return current;
});

const findLinkedSessionsMock = mock(async (carryoverId: string, _tx?: unknown, opts?: FindLinkedSessionsOptions) => {
  linkedSessionReads.push(carryoverId);
  linkedSessionOptions.push(opts ?? null);
  return linkedSessionRows;
});

const findFilteredMock = mock(async (filters: CarryoverFilters, pagination: { limit: number; offset: number }) => {
  findFilteredCalls.push({ filters, pagination });
  return filteredResult;
});

const findLinkedSessionRowsMock = mock(async () => linkedSessionRowStubs);

const updatePayrollCalculationMock = mock(async (_tx: unknown, id: string, patch: PayrollCalculationPatch) => {
  sessionPatches.push({ id, patch });
  const row = linkedSessionRows.find(session => session.id === id);
  return row ? { ...row, ...patch } : null;
});

const unlinkFromCarryoverMock = mock(async (ids: readonly string[]) => {
  unlinkCalls.push([...ids]);
  return ids
    .map(id => linkedSessionRows.find(session => session.id === id))
    .filter((row): row is ClassInstanceSelectType => row != null);
});

const createManyEventsMock = mock(async (inputs: readonly ClassStatusEventSeedInsertInput[]) => {
  eventInputs.push(...inputs);
  return inputs.map((input, index) => ({ ...input, id: `event-${eventInputs.length - inputs.length + index}` }));
});

const acquireAdvisoryLockMock = mock(async (_tx: unknown, lockKey: string) => {
  lockKeys.push(lockKey);
});

const dbTransactionMock = mock(async (fn: (tx: DBTransaction) => Promise<unknown>) => {
  return fn(FAKE_TX);
});

await mock.module("@/backend/db/drizzleDb", () => ({
  db: { transaction: dbTransactionMock },
  queryDb: () => ({}),
  getDrizzleDbPool: () => null,
  clearDbConnectionSingleton: () => undefined,
}));

await mock.module("@/backend/db/repo", () => ({
  AuditRepository: { queryAuditLogs: queryAuditLogsMock },
  BillingRepository: {
    getLatestExchangeRateForDisplay: mock(async () => ({ rate: null, stale: true })),
  },
  CarryoverBalanceRepository: {
    getByIdsForUpdate: carryoverGetByIdsForUpdateMock,
    getById: carryoverGetByIdMock,
    findLinkedSessions: findLinkedSessionsMock,
    findLinkedSessionRows: findLinkedSessionRowsMock,
    findFiltered: findFilteredMock,
    create: carryoverCreateMock,
    update: carryoverUpdateMock,
    deleteById: carryoverDeleteByIdMock,
    bulkDelete: mock(async () => []),
  },
  TeacherRepository: {
    findById: mock(async () => teacherRow),
    isDisabled: mock(async () => teacherDisabled),
  },
  UserRepository: {
    findByIds: mock(async (ids: string[]) => {
      const map = new Map<string, UserSelectType | null>();
      for (const id of ids) {
        map.set(id, id === TEACHER_USER_ID ? buildTeacherUserRow() : null);
      }
      return map;
    }),
  },
}));

await mock.module("@/backend/db/repo/scheduling", () => ({
  SchedulingRepository: {
    updatePayrollCalculation: updatePayrollCalculationMock,
    unlinkFromCarryover: unlinkFromCarryoverMock,
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

/** Every soft-delete the unpay flow issued against the expense ledger, in call order. */
const expenseSoftDeleteCalls: { id: string; actorUserId: string; reason: string | null; tx: unknown }[] = [];
let expenseSoftDeleteError: Error | null = null;

const expenseSoftDeleteMock = mock(
  async (input: { id: string; actorUserId: string; reason?: string | null; tx?: unknown }) => {
    expenseSoftDeleteCalls.push({
      id: input.id,
      actorUserId: input.actorUserId,
      reason: input.reason ?? null,
      tx: input.tx ?? null,
    });
    if (expenseSoftDeleteError !== null) {
      throw expenseSoftDeleteError;
    }
    return { id: input.id };
  }
);

await mock.module("@/backend/services", () => ({
  ExpenseService: {
    createInternal: mock(async () => ({ id: "unused-expense-id" })),
    softDelete: expenseSoftDeleteMock,
  },
}));

// ---------------------------------------------------------------------------
// SUT import + invocation helpers
// ---------------------------------------------------------------------------

async function importService(): Promise<typeof import("@/backend/services/teachers/carryover-balance.service")> {
  return import("@/backend/services/teachers/carryover-balance.service");
}

function createCarryover(input: Partial<CreateCarryoverInput> = {}): Promise<CarryoverRow> {
  return importService().then(({ CarryoverBalanceService }) =>
    CarryoverBalanceService.createCarryoverBalance(
      {
        teacherId: TEACHER_ID,
        payable: "250.50",
        teacherCurrency: CurrencyCode.SAR,
        studentsCount: 2,
        fromDate: "2026-08-01",
        toDate: "2026-08-31",
        note: "August rollover",
        actorUserId: ACTOR_ID,
        ...input,
      },
      tErrors
    )
  );
}

function updateCarryover(input: Partial<UpdateCarryoverInput> = {}): Promise<CarryoverRow> {
  return importService().then(({ CarryoverBalanceService }) =>
    CarryoverBalanceService.updateCarryoverBalance({ id: CARRYOVER_ID_A, actorUserId: ACTOR_ID, ...input }, tErrors)
  );
}

function deleteCarryover(id: string): Promise<{ id: string; deleted: boolean }> {
  return importService().then(({ CarryoverBalanceService }) =>
    CarryoverBalanceService.deleteCarryoverBalance({ id, actorUserId: ACTOR_ID }, tErrors)
  );
}

function bulkDeleteCarryovers(ids: readonly string[]): Promise<{ deletedIds: string[]; auditLogIds: string[] }> {
  return importService().then(({ CarryoverBalanceService }) =>
    CarryoverBalanceService.bulkDeleteCarryoverBalances({ ids, actorUserId: ACTOR_ID }, tErrors)
  );
}

function unpayCarryover(id: string, note: string | null = null): Promise<CarryoverRow> {
  return importService().then(({ CarryoverBalanceService }) =>
    CarryoverBalanceService.unpayCarryoverBalance({ id, note, actorUserId: ACTOR_ID }, tErrors)
  );
}

async function expectDomainError(code: string, run: () => Promise<unknown>): Promise<void> {
  let caught: unknown = null;
  try {
    await run();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(DomainError);
  if (!(caught instanceof DomainError)) {
    throw new Error(`expected a DomainError with code ${code} but got ${String(caught)}`);
  }
  expect(caught.code).toBe(code);
}

// ---------------------------------------------------------------------------
// Capture assertions
// ---------------------------------------------------------------------------

function expectNoWriteSideEffects(): void {
  expect(createCalls).toHaveLength(0);
  expect(updateCalls).toHaveLength(0);
  expect(deleteCalls).toHaveLength(0);
  expect(sessionPatches).toHaveLength(0);
  expect(unlinkCalls).toHaveLength(0);
  expect(auditInputs).toHaveLength(0);
}

function lastAuditInput(): CreateAuditLogInput {
  const input = auditInputs.at(-1);
  if (!input) {
    throw new Error("expected at least one audit log input");
  }
  return input;
}

function eventStatus(event: ClassStatusEventSeedInsertInput, key: "fromState" | "toState"): unknown {
  const state = event[key];
  if (state != null && typeof state === "object" && "calculationStatus" in state) {
    return (state as { calculationStatus?: unknown }).calculationStatus;
  }
  return undefined;
}

function arrangeCarryover(overrides: Partial<CarryoverBalanceSelectType> = {}): CarryoverBalanceSelectType {
  const row = buildCarryoverRow(overrides);
  carryoverRows = [row];
  return row;
}

// ---------------------------------------------------------------------------
// Per-test reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  carryoverRows = [];
  teacherRow = buildTeacherRow();
  teacherDisabled = false;
  linkedSessionRows = [];
  itemsSnapshot = [];
  permissionError = null;
  replayRows = [];
  filteredResult = { rows: [], totalCount: 0 };
  linkedSessionRowStubs = [];

  lockKeys.length = 0;
  lockReads.length = 0;
  createCalls.length = 0;
  updateCalls.length = 0;
  deleteCalls.length = 0;
  linkedSessionReads.length = 0;
  linkedSessionOptions.length = 0;
  sessionPatches.length = 0;
  unlinkCalls.length = 0;
  eventInputs.length = 0;
  auditInputs.length = 0;
  auditQueries.length = 0;
  permissionChecks.length = 0;
  findFilteredCalls.length = 0;
  expenseSoftDeleteCalls.length = 0;
  expenseSoftDeleteError = null;
  expenseSoftDeleteMock.mockClear();
});

// ---------------------------------------------------------------------------
// createCarryoverBalance
// ---------------------------------------------------------------------------

describe("CarryoverBalanceService.createCarryoverBalance", () => {
  test("persists the teacher-disabled snapshot and audits the creation", async () => {
    teacherDisabled = true;

    const row = await createCarryover({ studentsText: "Student One, Student Two" });

    expect(permissionChecks).toEqual([AppPermission.ACCOUNTING_CARRYOVER_MANAGE]);
    expect(lockKeys).toHaveLength(1);
    expect(lockKeys[0]).toStartWith("carryover-create:");
    expect(auditQueries.map(query => query.action)).toEqual(["CARRYOVER_CREATE"]);

    expect(createCalls).toHaveLength(1);
    const persisted = createCalls[0];
    if (!persisted) throw new Error("expected one carryover insert");
    expect(persisted.teacherId).toBe(TEACHER_ID);
    expect(persisted.isDisabledTeacher).toBe(true);
    expect(persisted.payable).toBe("250.50");
    expect(persisted.paid).toBe("0");
    expect(persisted.isPaid).toBe(false);
    expect(persisted.expenseId).toBeNull();
    expect(persisted.createdByUserId).toBe(ACTOR_ID);
    expect(persisted.studentsText).toBe("Student One, Student Two");

    expect(row.isDisabledTeacher).toBe(true);
    expect(row.teacherName).toBe("Carry Teacher");
    expect(row.teacherCurrency).toBe(CurrencyCode.SAR);

    expect(auditInputs).toHaveLength(1);
    const audit = lastAuditInput();
    expect(audit.action).toBe("CARRYOVER_CREATE");
    expect(audit.entityType).toBe("CARRYOVER_BALANCE");
    expect(audit.entityId).toBe(row.id);
    expect(audit.metadata).toMatchObject({
      teacherId: TEACHER_ID,
      payable: "250.50",
      currency: CurrencyCode.SAR,
      instanceIds: [],
    });
  });
});

// ---------------------------------------------------------------------------
// updateCarryoverBalance
// ---------------------------------------------------------------------------

describe("CarryoverBalanceService.updateCarryoverBalance", () => {
  test("applies editable fields and records the previous/new state audit", async () => {
    arrangeCarryover();

    const row = await updateCarryover({
      payable: "500",
      studentsCount: 3,
      fromDate: "2026-09-01",
      toDate: "2026-09-30",
      note: "rebalanced",
    });

    expect(lockReads).toEqual([[CARRYOVER_ID_A]]);
    expect(updateCalls).toHaveLength(1);
    const patch = updateCalls[0]?.patch;
    expect(patch).toMatchObject({
      fromDate: "2026-09-01",
      toDate: "2026-09-30",
      payable: "500.00",
      studentsCount: 3,
      note: "rebalanced",
    });

    expect(row.payable).toBe("500.00");
    expect(row.studentsCount).toBe(3);
    expect(row.note).toBe("rebalanced");

    expect(auditInputs).toHaveLength(1);
    const audit = lastAuditInput();
    expect(audit.action).toBe("UPDATE");
    expect(audit.previousState).toMatchObject({ payable: "100.50", studentsCount: 2, note: "initial note" });
    expect(audit.newState).toMatchObject({ payable: "500.00", studentsCount: 3, note: "rebalanced" });
  });

  test("rejects teacherId patches with CARRYOVER_TEACHER_IMMUTABLE before any DB access", async () => {
    arrangeCarryover();
    const input = { id: CARRYOVER_ID_A, actorUserId: ACTOR_ID, teacherId: OTHER_TEACHER_ID };

    await expectDomainError("CARRYOVER_TEACHER_IMMUTABLE", async () => {
      const { CarryoverBalanceService } = await importService();
      await CarryoverBalanceService.updateCarryoverBalance(input, tErrors);
    });

    expect(lockReads).toHaveLength(0);
    expect(sessionPatches).toHaveLength(0);
    expectNoWriteSideEffects();
  });
});

describe("CarryoverBalanceService.updateCarryoverBalance — paid-row immutability", () => {
  test("rejects any patch on a paid carryover with CARRYOVER_PAID_CANNOT_EDIT", async () => {
    arrangeCarryover(buildPaidRow());

    await expectDomainError("CARRYOVER_PAID_CANNOT_EDIT", () => updateCarryover({ note: "metadata only" }));

    expect(lockReads).toEqual([[CARRYOVER_ID_A]]);
    expect(updateCalls).toHaveLength(0);
    expect(auditInputs).toHaveLength(0);
  });

  test("rejects a money-field patch on a paid carryover so the settled amount stays consistent", async () => {
    arrangeCarryover(buildPaidRow());

    await expectDomainError("CARRYOVER_PAID_CANNOT_EDIT", () =>
      updateCarryover({ payable: "999.99", teacherCurrency: CurrencyCode.USD })
    );

    expect(updateCalls).toHaveLength(0);
    expect(carryoverRows[0]?.payable).toBe("100.50");
    expect(carryoverRows[0]?.paid).toBe("100.50");
    expectNoWriteSideEffects();
  });
});

// ---------------------------------------------------------------------------
// deleteCarryoverBalance
// ---------------------------------------------------------------------------

describe("CarryoverBalanceService.deleteCarryoverBalance", () => {
  test("reverts session statuses from snapshots, unlinks, and hard-deletes", async () => {
    arrangeCarryover();
    itemsSnapshot = [buildItemRow(), buildPartialItemRow()];
    linkedSessionRows = [buildSessionRow(), buildSessionRow({ id: SESSION_ID_B, teacherPaidAmount: "40.25" })];

    const result = await deleteCarryover(CARRYOVER_ID_A);

    expect(result).toEqual({ id: CARRYOVER_ID_A, deleted: true });
    expect(linkedSessionReads).toEqual([CARRYOVER_ID_A]);
    // The session revert runs on rows locked FOR UPDATE inside the same
    // transaction, so a concurrent payroll recalculation cannot interleave.
    expect(linkedSessionOptions).toEqual([{ forUpdate: true }]);

    expect(sessionPatches).toHaveLength(2);
    // Leaving any status clears the partial-percentage column; reverting to
    // PARTIALLY restores the percentage captured in the item snapshot.
    expect(sessionPatches[0]).toEqual({
      id: SESSION_ID_A,
      patch: { calculationStatus: CalculationStatus.CALCULATED, isPartialPercentage: null },
    });
    expect(sessionPatches[1]).toEqual({
      id: SESSION_ID_B,
      patch: { calculationStatus: CalculationStatus.PARTIALLY, isPartialPercentage: 40 },
    });

    expect(unlinkCalls).toEqual([[SESSION_ID_A, SESSION_ID_B]]);
    expect(deleteCalls).toEqual([CARRYOVER_ID_A]);
    expect(carryoverRows).toHaveLength(0);

    expect(eventInputs).toHaveLength(2);
    const firstEvent = eventInputs[0];
    if (!firstEvent) throw new Error("expected two payroll transition events");
    expect(firstEvent.eventType).toBe("PAYROLL_STATUS_TRANSITION");
    expect(eventStatus(firstEvent, "fromState")).toBe(CalculationStatus.WAITING_PAID);
    expect(eventStatus(firstEvent, "toState")).toBe(CalculationStatus.CALCULATED);

    expect(auditInputs).toHaveLength(1);
    const audit = lastAuditInput();
    expect(audit.action).toBe("CARRYOVER_DELETE");
    expect(audit.metadata).toMatchObject({ teacherId: TEACHER_ID, payable: "100.50", currency: CurrencyCode.SAR });
  });

  test("rejects a paid carryover with CARRYOVER_PAID_CANNOT_DELETE", async () => {
    arrangeCarryover(buildPaidRow());
    linkedSessionRows = [buildSessionRow()];
    itemsSnapshot = [buildItemRow()];

    await expectDomainError("CARRYOVER_PAID_CANNOT_DELETE", () => deleteCarryover(CARRYOVER_ID_A));

    expect(lockReads).toEqual([[CARRYOVER_ID_A]]);
    expect(carryoverRows).toHaveLength(1);
    expectNoWriteSideEffects();
  });
});

// ---------------------------------------------------------------------------
// bulkDeleteCarryoverBalances
// ---------------------------------------------------------------------------

describe("CarryoverBalanceService.bulkDeleteCarryoverBalances", () => {
  test("rolls back the whole batch when any selected carryover is paid", async () => {
    carryoverRows = [buildCarryoverRow({ id: CARRYOVER_ID_A }), buildPaidRow({ id: CARRYOVER_ID_B })];
    itemsSnapshot = [buildItemRow()];
    linkedSessionRows = [buildSessionRow()];

    await expectDomainError("CARRYOVER_PAID_CANNOT_DELETE", () =>
      bulkDeleteCarryovers([CARRYOVER_ID_A, CARRYOVER_ID_B])
    );

    expect(lockReads).toEqual([[CARRYOVER_ID_A, CARRYOVER_ID_B]]);
    expect(carryoverRows).toHaveLength(2);
    expect(lockKeys).toHaveLength(0);
    expectNoWriteSideEffects();
  });
});

// ---------------------------------------------------------------------------
// unpayCarryoverBalance
// ---------------------------------------------------------------------------

describe("CarryoverBalanceService.unpayCarryoverBalance", () => {
  test("reverts the carryover, soft-deletes the linked expense in-transaction, and restores the paid sessions", async () => {
    arrangeCarryover(buildPaidRow());
    linkedSessionRows = [buildSessionRow({ calculationStatus: CalculationStatus.PAID })];

    const row = await unpayCarryover(CARRYOVER_ID_A, "duplicate payout");

    // The linked expense row is soft-deleted through the real ledger service,
    // inside the same transaction (already-unpaid at that point, so the
    // settlement-protection guard passes) and carrying the operator's note.
    expect(expenseSoftDeleteCalls).toEqual([
      { id: EXPENSE_ID, actorUserId: ACTOR_ID, reason: "duplicate payout", tx: FAKE_TX },
    ]);

    expect(updateCalls).toHaveLength(1);
    const update = updateCalls[0];
    if (!update) throw new Error("expected one carryover patch");
    expect(update.id).toBe(CARRYOVER_ID_A);
    expect(update.patch).toEqual({
      isPaid: false,
      paid: "0",
      paymentDate: null,
      expenseId: null,
      paidAt: null,
      paidByUserId: null,
    });

    expect(sessionPatches).toEqual([
      { id: SESSION_ID_A, patch: { calculationStatus: CalculationStatus.WAITING_PAID, isPartialPercentage: null } },
    ]);
    // The revert transitions run against rows locked FOR UPDATE in the same transaction.
    expect(linkedSessionOptions).toEqual([{ forUpdate: true }]);

    expect(eventInputs).toHaveLength(1);
    const event = eventInputs[0];
    if (!event) throw new Error("expected one payroll transition event");
    expect(eventStatus(event, "fromState")).toBe(CalculationStatus.PAID);
    expect(eventStatus(event, "toState")).toBe(CalculationStatus.WAITING_PAID);

    expect(auditInputs).toHaveLength(1);
    const audit = lastAuditInput();
    expect(audit.action).toBe("CARRYOVER_UNPAID");
    expect(audit.metadata).toMatchObject({ expenseId: EXPENSE_ID, reason: "duplicate payout" });

    expect(row.isPaid).toBe(false);
    expect(row.paid).toBe("0");
    expect(row.expenseId).toBeNull();
    expect(row.paymentDate).toBeNull();
    expect(row.paidAt).toBeNull();
  });

  test("tolerates an expense reference whose ledger row never materialized", async () => {
    arrangeCarryover(buildPaidRow({ expenseId: REMOVED_EXPENSE_ID }));
    linkedSessionRows = [buildSessionRow({ calculationStatus: CalculationStatus.PAID })];
    expenseSoftDeleteError = new DomainError("EXPENSE_NOT_FOUND", errorsEn.expenses.notFound);

    const row = await unpayCarryover(CARRYOVER_ID_A);

    // The missing-row reject is the documented tolerance case: the revert
    // completes and the audit row still records the removed reference.
    expect(expenseSoftDeleteCalls).toHaveLength(1);
    expect(expenseSoftDeleteCalls[0]?.id).toBe(REMOVED_EXPENSE_ID);
    expect(updateCalls).toHaveLength(1);
    expect(carryoverRows[0]?.isPaid).toBe(false);
    expect(row.isPaid).toBe(false);

    const audit = lastAuditInput();
    expect(audit.action).toBe("CARRYOVER_UNPAID");
    expect(audit.metadata).toMatchObject({ expenseId: REMOVED_EXPENSE_ID, reason: null });
  });

  test("propagates a ledger failure that is not the missing-row tolerance", async () => {
    arrangeCarryover(buildPaidRow());
    linkedSessionRows = [buildSessionRow({ calculationStatus: CalculationStatus.PAID })];
    expenseSoftDeleteError = new DomainError("EXPENSE_DELETE_VIA_UNPAY", "Delete the carryover via unpay instead");

    await expectDomainError("EXPENSE_DELETE_VIA_UNPAY", () => unpayCarryover(CARRYOVER_ID_A));

    // The failure reached the caller unwrapped; no sessions were transitioned
    // and no unpay audit row was emitted.
    expect(expenseSoftDeleteCalls).toHaveLength(1);
    expect(sessionPatches).toHaveLength(0);
    expect(auditInputs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TB.5 gap-fill: error paths, idempotent replay, and read/report branches
// ---------------------------------------------------------------------------

describe("CarryoverBalanceService.createCarryoverBalance — residual branches", () => {
  test("rejects when the teacher id resolves to no row", async () => {
    teacherRow = null;

    await expectDomainError("TEACHER_NOT_FOUND", () => createCarryover());

    expect(createCalls).toHaveLength(0);
    expectNoWriteSideEffects();
  });

  test.each(["not-a-number", "-5.00", "1.234"])(
    "rejects an unparseable or negative payable (%s) with VALIDATION before any DB write",
    async payable => {
      await expectDomainError("VALIDATION", () => createCarryover({ payable }));

      expect(createCalls).toHaveLength(0);
      expect(lockKeys).toHaveLength(0);
    }
  );

  test("rejects a period whose fromDate is after its toDate", async () => {
    await expectDomainError("VALIDATION", () => createCarryover({ fromDate: "2026-09-30", toDate: "2026-09-01" }));

    expect(createCalls).toHaveLength(0);
    expect(lockKeys).toHaveLength(0);
  });

  test("propagates the permission denial without opening a transaction", async () => {
    permissionError = new ForbiddenError(errorsEn.insufficientPermissions);

    await expectDomainError("FORBIDDEN", () => createCarryover());

    expect(createCalls).toHaveLength(0);
    expect(lockKeys).toHaveLength(0);
    expectNoWriteSideEffects();
  });

  test("strips markup out of the note and students text before persisting them", async () => {
    const row = await createCarryover({
      note: "<script>alert(1)</script>Bonus for August",
      studentsText: "<b>Bold</b> note",
    });

    const persisted = createCalls[0];
    if (!persisted) throw new Error("expected one carryover insert");
    expect(persisted.note).toBe("Bonus for August");
    expect(persisted.studentsText).toBe("Bold note");
    expect(row.note).toBe("Bonus for August");
  });

  test("replays the originally created row for a same-content re-submit inside the window", async () => {
    arrangeCarryover();
    const idempotencyKey = deriveCrudIdempotencyKey({
      teacherId: TEACHER_ID,
      fromDate: "2026-08-01",
      toDate: "2026-08-31",
      payable: "250.50",
      teacherCurrency: CurrencyCode.SAR,
      studentsCount: 2,
      note: "August rollover",
      actorUserId: ACTOR_ID,
    });
    replayRows = [
      buildAuditRow(
        {
          actorUserId: ACTOR_ID,
          actorType: "USER",
          entityType: "CARRYOVER_BALANCE",
          entityId: CARRYOVER_ID_A,
          action: "CARRYOVER_CREATE",
          metadata: { idempotencyKey },
        },
        0
      ),
    ];

    const row = await createCarryover();

    expect(row.id).toBe(CARRYOVER_ID_A);
    expect(createCalls).toHaveLength(0);
    expect(auditInputs).toHaveLength(0);
    expect(auditQueries.map(query => query.action)).toEqual(["CARRYOVER_CREATE"]);
  });

  test("creates anew when the replayed audit row points at a deleted carryover", async () => {
    const idempotencyKey = deriveCrudIdempotencyKey({
      teacherId: TEACHER_ID,
      fromDate: "2026-08-01",
      toDate: "2026-08-31",
      payable: "250.50",
      teacherCurrency: CurrencyCode.SAR,
      studentsCount: 2,
      note: "August rollover",
      actorUserId: ACTOR_ID,
    });
    replayRows = [
      buildAuditRow(
        {
          actorUserId: ACTOR_ID,
          actorType: "USER",
          entityType: "CARRYOVER_BALANCE",
          entityId: "gone-carryover-id",
          action: "CARRYOVER_CREATE",
          metadata: { idempotencyKey },
        },
        0
      ),
    ];

    const row = await createCarryover();

    expect(row.id).not.toBe("gone-carryover-id");
    expect(createCalls).toHaveLength(1);
    expect(auditInputs).toHaveLength(1);
  });
});

describe("CarryoverBalanceService.updateCarryoverBalance — residual branches", () => {
  test("rejects an unknown carryover with CARRYOVER_NOT_FOUND", async () => {
    await expectDomainError("CARRYOVER_NOT_FOUND", () => updateCarryover({ note: "x" }));

    expect(updateCalls).toHaveLength(0);
  });

  test("rejects an invalid payable patch with VALIDATION before the lock read", async () => {
    arrangeCarryover();

    await expectDomainError("VALIDATION", () => updateCarryover({ payable: "abc" }));

    expect(lockReads).toHaveLength(0);
    expect(updateCalls).toHaveLength(0);
  });

  test("rejects a period patch whose fromDate is after its toDate", async () => {
    arrangeCarryover();

    await expectDomainError("VALIDATION", () => updateCarryover({ fromDate: "2026-09-30", toDate: "2026-09-01" }));

    expect(lockReads).toHaveLength(0);
    expect(updateCalls).toHaveLength(0);
  });

  test("clears nullable fields when the patch passes explicit nulls", async () => {
    arrangeCarryover();

    const row = await updateCarryover({ note: null, fromDate: null, toDate: null, studentsText: null });

    const patch = updateCalls[0]?.patch;
    expect(patch?.note).toBeNull();
    expect(patch?.fromDate).toBeNull();
    expect(patch?.toDate).toBeNull();
    expect(patch?.studentsText).toBeNull();
    expect(row.note).toBeNull();
    expect(row.fromDate).toBeNull();
  });

  test("rejects with CARRYOVER_NOT_FOUND when the update statement loses its row", async () => {
    arrangeCarryover();
    carryoverUpdateMock.mockResolvedValueOnce(null);

    await expectDomainError("CARRYOVER_NOT_FOUND", () => updateCarryover({ note: "x" }));
  });
});

describe("CarryoverBalanceService.deleteCarryoverBalance — residual branches", () => {
  test("rejects an unknown carryover with CARRYOVER_NOT_FOUND", async () => {
    await expectDomainError("CARRYOVER_NOT_FOUND", () => deleteCarryover(randomUUID()));

    expect(deleteCalls).toHaveLength(0);
  });

  test("rejects a snapshot whose original status is no longer a known calculation status", async () => {
    arrangeCarryover();
    itemsSnapshot = [buildItemRow({ originalStatus: "LEGACY_REMOVED_STATUS" })];
    linkedSessionRows = [buildSessionRow()];

    await expectDomainError("CARRYOVER_SNAPSHOT_INVALID", () => deleteCarryover(CARRYOVER_ID_A));

    expect(deleteCalls).toHaveLength(0);
    expect(sessionPatches).toHaveLength(0);
    expect(carryoverRows).toHaveLength(1);
  });

  test("rejects a PARTIALLY snapshot whose percentage was never captured", async () => {
    arrangeCarryover();
    itemsSnapshot = [buildPartialItemRow({ originalPartialPercentage: null })];
    linkedSessionRows = [buildSessionRow({ id: SESSION_ID_B })];

    await expectDomainError("CARRYOVER_SNAPSHOT_INVALID", () => deleteCarryover(CARRYOVER_ID_A));

    expect(deleteCalls).toHaveLength(0);
    expect(sessionPatches).toHaveLength(0);
  });

  test("deletes a manual carryover that has no linked sessions or item snapshots", async () => {
    arrangeCarryover();
    itemsSnapshot = [];
    linkedSessionRows = [];

    const result = await deleteCarryover(CARRYOVER_ID_A);

    expect(result).toEqual({ id: CARRYOVER_ID_A, deleted: true });
    expect(sessionPatches).toHaveLength(0);
    expect(unlinkCalls).toHaveLength(0);
    expect(deleteCalls).toEqual([CARRYOVER_ID_A]);
    expect(lastAuditInput().action).toBe("CARRYOVER_DELETE");
  });

  test("rejects when the caller lacks the manage permission", async () => {
    arrangeCarryover();
    permissionError = new ForbiddenError(errorsEn.insufficientPermissions);

    await expectDomainError("FORBIDDEN", () => deleteCarryover(CARRYOVER_ID_A));

    expect(deleteCalls).toHaveLength(0);
    expect(lockReads).toHaveLength(0);
  });
});

describe("CarryoverBalanceService.bulkDeleteCarryoverBalances — residual branches", () => {
  test("deletes every unpaid selection and audits each removal", async () => {
    carryoverRows = [buildCarryoverRow({ id: CARRYOVER_ID_A }), buildCarryoverRow({ id: CARRYOVER_ID_B })];
    itemsSnapshot = [];
    linkedSessionRows = [];

    const result = await bulkDeleteCarryovers([CARRYOVER_ID_A, CARRYOVER_ID_B]);

    expect(result.deletedIds).toEqual([CARRYOVER_ID_A, CARRYOVER_ID_B]);
    expect(result.auditLogIds).toHaveLength(2);
    expect(deleteCalls).toEqual([CARRYOVER_ID_A, CARRYOVER_ID_B]);
    expect(carryoverRows).toHaveLength(0);
    expect(auditInputs.map(input => input.action)).toEqual(["CARRYOVER_DELETE", "CARRYOVER_DELETE"]);
  });

  test("rejects an empty selection with VALIDATION before any lock read", async () => {
    await expectDomainError("VALIDATION", () => bulkDeleteCarryovers([]));

    expect(lockReads).toHaveLength(0);
    expectNoWriteSideEffects();
  });

  test("rejects the whole batch when one selected carryover is missing", async () => {
    arrangeCarryover();
    itemsSnapshot = [];
    linkedSessionRows = [];

    const unknownId = randomUUID();
    await expectDomainError("CARRYOVER_NOT_FOUND", () => bulkDeleteCarryovers([CARRYOVER_ID_A, unknownId]));

    expect(deleteCalls).toHaveLength(0);
    expect(carryoverRows).toHaveLength(1);
  });
});

describe("CarryoverBalanceService.unpayCarryoverBalance — residual branches", () => {
  test("rejects an unpaid carryover with CARRYOVER_NOT_PAID and leaves it untouched", async () => {
    arrangeCarryover();

    await expectDomainError("CARRYOVER_NOT_PAID", () => unpayCarryover(CARRYOVER_ID_A));

    expect(updateCalls).toHaveLength(0);
    expect(sessionPatches).toHaveLength(0);
    expect(auditInputs).toHaveLength(0);
  });

  test("rejects an unknown carryover with CARRYOVER_NOT_FOUND", async () => {
    await expectDomainError("CARRYOVER_NOT_FOUND", () => unpayCarryover(randomUUID()));

    expect(updateCalls).toHaveLength(0);
  });

  test("skips the expense soft-delete when the paid row carries no expense reference", async () => {
    arrangeCarryover(buildPaidRow({ expenseId: null }));
    linkedSessionRows = [buildSessionRow({ calculationStatus: CalculationStatus.PAID })];

    const row = await unpayCarryover(CARRYOVER_ID_A);

    expect(expenseSoftDeleteCalls).toHaveLength(0);
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]?.patch.expenseId).toBeNull();
    expect(row.isPaid).toBe(false);
    expect(lastAuditInput().action).toBe("CARRYOVER_UNPAID");
  });

  test("rejects with CARRYOVER_NOT_FOUND when the revert update loses its row", async () => {
    arrangeCarryover(buildPaidRow());
    carryoverUpdateMock.mockResolvedValueOnce(null);

    await expectDomainError("CARRYOVER_NOT_FOUND", () => unpayCarryover(CARRYOVER_ID_A));
  });
});

// ---------------------------------------------------------------------------
// Read/report surface: getReport aggregates, getById, getLinkedSessions
// ---------------------------------------------------------------------------

function buildFilteredRow(
  overrides: Partial<CarryoverBalanceSelectType> & { teacherName?: string } = {}
): CarryoverBalanceSelectType & { teacherName: string; teacherAvatarUrl: string | null } {
  const { teacherName, ...rest } = overrides;
  return {
    ...buildCarryoverRow(rest),
    teacherName: teacherName ?? "Carry Teacher",
    teacherAvatarUrl: null,
  };
}

function listCarryoverReport(
  pagination: { limit: number; offset: number } = { limit: 50, offset: 0 }
): Promise<import("@/backend/types").CarryoverPage> {
  const filters: CarryoverFilters = {
    teacherId: null,
    paidStatus: null,
    dateFrom: null,
    dateTo: null,
    includeDisabledTeachers: null,
    search: null,
  };
  return importService().then(({ CarryoverBalanceService }) =>
    CarryoverBalanceService.getReport(ACTOR_ID, filters, pagination, tErrors)
  );
}

describe("CarryoverBalanceService.getReport", () => {
  test("derives aggregates from the page when it already covers the filtered set", async () => {
    filteredResult = {
      rows: [
        buildFilteredRow({ id: CARRYOVER_ID_A, payable: "100.00" }),
        buildFilteredRow({
          id: CARRYOVER_ID_B,
          payable: "50.25",
          teacherCurrency: CurrencyCode.USD,
          isPaid: true,
          paid: "50.25",
        }),
      ],
      totalCount: 2,
    };

    const page = await listCarryoverReport();

    expect(permissionChecks).toEqual([AppPermission.ACCOUNTING_CARRYOVER_VIEW]);
    expect(findFilteredCalls).toHaveLength(1);
    expect(page.totalCount).toBe(2);
    expect(page.aggregates.totalPayable).toBe("150.25");
    expect(page.aggregates.totalPaid).toBe("50.25");
    expect(page.aggregates.dominantCurrency).toBe(CurrencyCode.SAR);
    expect(page.aggregates.rowCountByPaid).toEqual({ paid: 1, unpaid: 1 });
    expect(page.rows[0]?.teacherName).toBe("Carry Teacher");
  });

  test("scans the full filtered set when the requested page does not cover it", async () => {
    filteredResult = {
      rows: [buildFilteredRow({ id: CARRYOVER_ID_A, payable: "100.00" })],
      totalCount: 5,
    };

    const page = await listCarryoverReport({ limit: 1, offset: 1 });

    expect(findFilteredCalls).toHaveLength(2);
    expect(findFilteredCalls[1]?.pagination).toEqual({ limit: 10_000, offset: 0 });
    expect(page.aggregates.totalPayable).toBe("100.00");
  });

  test("propagates the view-permission denial without reading the report", async () => {
    permissionError = new ForbiddenError(errorsEn.insufficientPermissions);

    await expectDomainError("FORBIDDEN", () => listCarryoverReport());

    expect(findFilteredCalls).toHaveLength(0);
  });
});

describe("CarryoverBalanceService.getById", () => {
  test("returns the row with the teacher display fields resolved", async () => {
    arrangeCarryover();

    const row = await importService().then(({ CarryoverBalanceService }) =>
      CarryoverBalanceService.getById(ACTOR_ID, CARRYOVER_ID_A, tErrors)
    );

    expect(permissionChecks).toEqual([AppPermission.ACCOUNTING_CARRYOVER_VIEW]);
    expect(row.id).toBe(CARRYOVER_ID_A);
    expect(row.teacherName).toBe("Carry Teacher");
    expect(row.createdAt).toBe(NOW.toISOString());
  });

  test("rejects an unknown carryover with CARRYOVER_NOT_FOUND", async () => {
    await expectDomainError("CARRYOVER_NOT_FOUND", () =>
      importService().then(({ CarryoverBalanceService }) =>
        CarryoverBalanceService.getById(ACTOR_ID, randomUUID(), tErrors)
      )
    );
  });
});

describe("CarryoverBalanceService.getLinkedSessions", () => {
  test("serializes linked-session rows with ISO timestamps", async () => {
    arrangeCarryover();
    linkedSessionRowStubs = [
      {
        id: SESSION_ID_A,
        studentId: "student-1",
        studentName: "Omar Khaled",
        subjectName: "Physics",
        scheduledStartAt: SCHEDULED_START,
        durationMinutes: 60,
        originalAmount: "60.25",
        originalCurrency: CurrencyCode.SAR,
        originalStatus: CalculationStatus.CALCULATED,
        currentStatus: CalculationStatus.WAITING_PAID,
      },
    ];

    const sessions = await importService().then(({ CarryoverBalanceService }) =>
      CarryoverBalanceService.getLinkedSessions(ACTOR_ID, CARRYOVER_ID_A, tErrors)
    );

    expect(permissionChecks).toEqual([AppPermission.ACCOUNTING_CARRYOVER_VIEW]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.scheduledStartAt).toBe(SCHEDULED_START.toISOString());
    expect(sessions[0]?.originalStatus).toBe(CalculationStatus.CALCULATED);
  });

  test("rejects an unknown carryover with CARRYOVER_NOT_FOUND", async () => {
    await expectDomainError("CARRYOVER_NOT_FOUND", () =>
      importService().then(({ CarryoverBalanceService }) =>
        CarryoverBalanceService.getLinkedSessions(ACTOR_ID, randomUUID(), tErrors)
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Pentest (TB.6): identifier hardening, replay forgery, window expiry
// ---------------------------------------------------------------------------

describe("CarryoverBalanceService — malformed identifier hardening", () => {
  test("createCarryoverBalance rejects a non-uuid teacherId before touching the store", async () => {
    await expectDomainError("TEACHER_NOT_FOUND", () => createCarryover({ teacherId: "not-a-uuid" }));

    expect(createCalls).toHaveLength(0);
    expect(lockKeys).toHaveLength(0);
    expectNoWriteSideEffects();
  });

  test.each(["update", "delete", "unpay"] as const)(
    "%s rejects a malformed carryover id with CARRYOVER_NOT_FOUND before locking any row",
    async operation => {
      const run = () => {
        if (operation === "update") return updateCarryover({ id: "not-a-uuid" });
        if (operation === "delete") return deleteCarryover("not-a-uuid");
        return unpayCarryover("not-a-uuid");
      };

      await expectDomainError("CARRYOVER_NOT_FOUND", run);

      expect(lockReads).toHaveLength(0);
      expect(auditInputs).toHaveLength(0);
      expectNoWriteSideEffects();
    }
  );

  test("bulkDeleteCarryoverBalances rejects a batch containing a malformed id before locking", async () => {
    await expectDomainError("CARRYOVER_NOT_FOUND", () => bulkDeleteCarryovers([randomUUID(), "not-a-uuid"]));

    expect(lockReads).toHaveLength(0);
    expect(deleteCalls).toHaveLength(0);
    expectNoWriteSideEffects();
  });

  test("getById rejects a malformed carryover id instead of surfacing a database error", async () => {
    await expectDomainError("CARRYOVER_NOT_FOUND", () =>
      importService().then(({ CarryoverBalanceService }) =>
        CarryoverBalanceService.getById(ACTOR_ID, "not-a-uuid", tErrors)
      )
    );
  });

  test("getLinkedSessions rejects a malformed carryover id instead of surfacing a database error", async () => {
    await expectDomainError("CARRYOVER_NOT_FOUND", () =>
      importService().then(({ CarryoverBalanceService }) =>
        CarryoverBalanceService.getLinkedSessions(ACTOR_ID, "not-a-uuid", tErrors)
      )
    );
  });
});

describe("CarryoverBalanceService.createCarryoverBalance — replay forgery probes", () => {
  function seedReplayRow(input: Partial<CreateCarryoverInput> = {}): void {
    arrangeCarryover();
    const idempotencyKey = deriveCrudIdempotencyKey({
      teacherId: TEACHER_ID,
      fromDate: "2026-08-01",
      toDate: "2026-08-31",
      payable: "250.50",
      teacherCurrency: CurrencyCode.SAR,
      studentsCount: 2,
      note: "August rollover",
      actorUserId: ACTOR_ID,
      ...input,
    });
    replayRows = [
      buildAuditRow(
        {
          actorUserId: ACTOR_ID,
          actorType: "USER",
          entityType: "CARRYOVER_BALANCE",
          entityId: CARRYOVER_ID_A,
          action: "CARRYOVER_CREATE",
          metadata: { idempotencyKey },
        },
        0
      ),
    ];
  }

  test("a tampered payload under the original client request id cannot replay the earlier result", async () => {
    seedReplayRow();

    const row = await createCarryover({ studentsText: "tampered after the fact" });

    expect(row.id).not.toBe(CARRYOVER_ID_A);
    expect(createCalls).toHaveLength(1);
    expect(auditInputs).toHaveLength(1);
  });

  test("a forged client request id derives a fresh key instead of capturing the original result", async () => {
    seedReplayRow({ clientRequestId: "original-token" });

    const row = await createCarryover({ clientRequestId: "forged-token" });

    expect(row.id).not.toBe(CARRYOVER_ID_A);
    expect(createCalls).toHaveLength(1);
  });

  test("the same-token same-payload re-submit still replays the original row", async () => {
    seedReplayRow({ clientRequestId: "original-token" });

    const row = await createCarryover({ clientRequestId: "original-token" });

    expect(row.id).toBe(CARRYOVER_ID_A);
    expect(createCalls).toHaveLength(0);
    expect(auditInputs).toHaveLength(0);
  });

  test("a re-submit outside the 60-second replay window processes as a normal write", async () => {
    const first = await createCarryover();

    // Outside the replay window the audit row of the first write is excluded
    // by the windowed query before any key matching can occur.
    replayRows = [];

    const second = await createCarryover();

    expect(second.id).not.toBe(first.id);
    expect(createCalls).toHaveLength(2);

    const windowFilter = auditQueries[0];
    if (!windowFilter?.startDate) throw new Error("expected the replay lookup to pass a window start");
    const windowMs = Date.now() - windowFilter.startDate.getTime();
    expect(windowMs).toBeGreaterThanOrEqual(59_000);
    expect(windowMs).toBeLessThan(75_000);
  });
});
