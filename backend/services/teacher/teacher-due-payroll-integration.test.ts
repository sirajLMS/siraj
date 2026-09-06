import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { createHash } from "node:crypto";
import { CalculationStatus, RateSource, SchedulingMode, TeacherDueStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import type {
  ClassInstanceSelectType,
  ClassStatusEventSeedInsertInput,
  TeacherDueInsertType,
  TeacherDueSelectType,
} from "@/backend/types";
import { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INSTANCE_ID = "11111111-1111-1111-1111-111111111111";
const TEACHER_ID = "22222222-2222-2222-2222-222222222222";
const STUDENT_ID = "33333333-3333-3333-3333-333333333333";
const SUBJECT_ID = "44444444-4444-4444-4444-444444444444";
const APPROVER_ID = "55555555-5555-5555-5555-555555555555";

const BASE_INSTANCE = {
  id: INSTANCE_ID,
  studentId: STUDENT_ID,
  teacherId: TEACHER_ID,
  subjectId: SUBJECT_ID,
  recurringScheduleId: null,
  originalClassId: null,
  scheduledStartAt: new Date("2026-08-20T10:00:00.000Z"),
  scheduledEndAt: new Date("2026-08-20T11:00:00.000Z"),
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
  actualStartAt: new Date("2026-08-20T10:00:30.000Z"),
  actualEndAt: new Date("2026-08-20T11:00:00.000Z"),
  quotaDeducted: true,
  schedulingMode: SchedulingMode.NUMBER_OF_CLASSES,
  ondemandStatus: null,
  payrollCredited: false,
  rateAmount: null,
  rateCurrency: null,
  isRateOverridden: false,
  rateSource: null,
  calculatedDuration: null,
  teacherPaidAmount: null,
  teacherPaidCurrency: null,
  calculationStatus: CalculationStatus.NOT_CALCULATED,
  isPartialPercentage: null,
  payrollNote: null,
  payrollCalculatedAt: null,
  payrollCalculatedBy: null,
  carryoverBalanceId: null,
  remarks: null,
  adminNotes: null,
  idempotencyKey: "due-accrual-fixture-key",
  createdAt: new Date(0),
  updatedAt: new Date(0),
  deletedAt: null,
} satisfies ClassInstanceSelectType;

function buildClassInstance(overrides: Partial<ClassInstanceSelectType> = {}): ClassInstanceSelectType {
  return { ...BASE_INSTANCE, ...overrides };
}

const BASE_DUE_ROW = {
  id: "66666666-6666-6666-6666-666666666666",
  teacherId: TEACHER_ID,
  classInstanceId: INSTANCE_ID,
  studentId: STUDENT_ID,
  hours: "1",
  amount: "150",
  currency: CurrencyCode.SAR,
  rateSource: RateSource.TEACHER,
  status: TeacherDueStatus.PENDING,
  approvedByUserId: APPROVER_ID,
  approvedAt: new Date(0),
  teacherPaymentId: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
} satisfies TeacherDueSelectType;

function buildDueRow(overrides: Partial<TeacherDueSelectType> = {}): TeacherDueSelectType {
  return { ...BASE_DUE_ROW, ...overrides };
}

function expectedAccrualKey(instanceId: string): string {
  return createHash("sha256").update(`payroll-accrual:${instanceId}`).digest("hex");
}

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported.
// ---------------------------------------------------------------------------

let currentInstance: ClassInstanceSelectType = buildClassInstance();
let dueInserts: { payload: TeacherDueInsertType; tx: unknown }[] = [];
let payrollUpdates: { tx: unknown; id: string; patch: Record<string, unknown> }[] = [];
let eventInserts: { rows: ClassStatusEventSeedInsertInput[]; tx: unknown }[] = [];
let rateResolutions = 0;
let cacheInvalidations: string[] = [];
let transactionTxs: unknown[] = [];

const dbTransactionMock = mock(async (callback: (tx: unknown) => Promise<unknown>) => {
  const tx = { txId: transactionTxs.length + 1 };
  transactionTxs.push(tx);
  return callback(tx);
});

const getByIdMock = mock(
  async (_id: string, _tx?: unknown, _opts?: unknown): Promise<ClassInstanceSelectType | null> => currentInstance
);

const updatePayrollCalculationMock = mock(
  async (tx: unknown, id: string, patch: Record<string, unknown>): Promise<ClassInstanceSelectType | null> => {
    payrollUpdates.push({ tx, id, patch });
    return currentInstance;
  }
);

const createManyEventsMock = mock(async (rows: ClassStatusEventSeedInsertInput[], tx?: unknown) => {
  eventInserts.push({ rows: [...rows], tx });
  return rows.map((row, index) => ({ ...row, id: `event-${eventInserts.length}-${index}` }));
});

const recurringFindByIdMock = mock(async () => null);
const getSubjectByIdMock = mock(async () => null);
const teacherFindByIdMock = mock(
  async (): Promise<{ id: string; rateCurrency: CurrencyCode } | null> => ({
    id: TEACHER_ID,
    rateCurrency: CurrencyCode.SAR,
  })
);
const resolveClassRateMock = mock(() => {
  rateResolutions += 1;
  return { hourlyRate: "150", currency: CurrencyCode.SAR, source: RateSource.TEACHER };
});
const invalidateCacheMock = mock(async (teacherId: string) => {
  cacheInvalidations.push(teacherId);
});

await mock.module("@/backend/db/drizzleDb", () => ({
  db: { transaction: dbTransactionMock },
  queryDb: mock((tx?: unknown) => tx ?? {}),
  drizzleLogs: [] as string[],
  getDrizzleDbPool: mock(() => null),
  clearDbConnectionSingleton: mock(() => {}),
}));

await mock.module("@/backend/db/repo/scheduling", () => ({
  SchedulingRepository: {
    getById: getByIdMock,
    updatePayrollCalculation: updatePayrollCalculationMock,
  },
  RecurringScheduleRepository: {
    findById: recurringFindByIdMock,
  },
  ClassStatusEventsRepository: {
    createMany: createManyEventsMock,
  },
}));

await mock.module("@/backend/db/repo/classes/class-subject.repository", () => ({
  ClassSubjectRepository: { getSubjectById: getSubjectByIdMock },
}));

await mock.module("@/backend/db/repo/teachers/teacher.repository", () => ({
  TeacherRepository: { findById: teacherFindByIdMock },
}));

await mock.module("@/backend/db/repo/teachers/teacher-due.repository", () => ({
  TeacherDueRepository: {
    create: mock(async (payload: TeacherDueInsertType, tx?: unknown) => {
      dueInserts.push({ payload, tx });
      return buildDueRow({
        hours: payload.hours,
        amount: payload.amount,
        currency: payload.currency,
        rateSource: payload.rateSource ?? null,
      });
    }),
  },
}));

await mock.module("@/backend/services/pricing/rate-resolver.service", () => ({
  resolveClassRate: resolveClassRateMock,
}));

await mock.module("@/backend/services/cache", () => ({
  invalidateClassLifecycle: invalidateCacheMock,
}));

await mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: { hasPermission: mock(async () => true) },
}));

await mock.module("@/shared/locale", () => ({
  getServerTranslations: () => ({
    errorsTranslations: {
      unauthorizedAction: "unauthorized action",
      insufficientPermissions: "insufficient permissions",
      internalServerError: "internal server error",
      scheduling: {
        classInstanceNotFound: ({ id }: { id: string }) => `class instance ${id} not found`,
      },
      teacher: {
        teacherNotFound: (id: string) => `teacher ${id} not found`,
      },
      teacherDue: {
        hoursMustBePositive: "hours must be positive",
        amountMustBeNonNegative: "amount must be non-negative",
        insertFailed: "failed to insert teacher due",
      },
    },
  }),
}));

const { TeacherDueService } = await import("@/backend/services/teacher/teacher-due.service");
const { db } = await import("@/backend/db/drizzleDb");

/** A calculated one-hour snapshot the accrual path treats as authoritative. */
const CALCULATED_SNAPSHOT: Partial<ClassInstanceSelectType> = {
  calculationStatus: CalculationStatus.CALCULATED,
  calculatedDuration: 60,
  teacherPaidAmount: "150.00",
  teacherPaidCurrency: CurrencyCode.USD,
};

/** Runs one accrual and returns the thrown error (fails loudly on success). */
async function accrueAndCaptureError(): Promise<Error> {
  let caught: unknown = null;
  try {
    await TeacherDueService.createDueEntry(INSTANCE_ID, TEACHER_ID, STUDENT_ID, APPROVER_ID);
  } catch (error) {
    caught = error;
  }
  if (!(caught instanceof Error)) {
    throw new Error(`expected an Error but got ${String(caught)}`);
  }
  return caught;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  currentInstance = buildClassInstance();
  dueInserts = [];
  payrollUpdates = [];
  eventInserts = [];
  rateResolutions = 0;
  cacheInvalidations = [];
  transactionTxs = [];
  dbTransactionMock.mockClear();
  getByIdMock.mockClear();
  updatePayrollCalculationMock.mockClear();
  createManyEventsMock.mockClear();
  getByIdMock.mockImplementation(async () => currentInstance);
  updatePayrollCalculationMock.mockImplementation(async (tx: unknown, id: string, patch: Record<string, unknown>) => {
    payrollUpdates.push({ tx, id, patch });
    return currentInstance;
  });
  createManyEventsMock.mockImplementation(async (rows: ClassStatusEventSeedInsertInput[], tx?: unknown) => {
    eventInserts.push({ rows: [...rows], tx });
    return rows.map((row, index) => ({ ...row, id: `event-${eventInserts.length}-${index}` }));
  });
});

describe("TeacherDueService.createDueEntry — Tier 1: payroll snapshot accrual branches", () => {
  test("accrues the snapshot amount verbatim for a calculated instance", async () => {
    currentInstance = buildClassInstance({
      calculationStatus: CalculationStatus.CALCULATED,
      calculatedDuration: 90,
      teacherPaidAmount: "150.00",
      teacherPaidCurrency: CurrencyCode.USD,
      rateSource: RateSource.OVERRIDE,
    });

    const row = await TeacherDueService.createDueEntry(INSTANCE_ID, TEACHER_ID, STUDENT_ID, APPROVER_ID);

    expect(dueInserts).toHaveLength(1);
    expect(dueInserts[0]?.payload).toEqual({
      teacherId: TEACHER_ID,
      classInstanceId: INSTANCE_ID,
      studentId: STUDENT_ID,
      hours: "1.5",
      amount: "150.00",
      currency: CurrencyCode.USD,
      rateSource: RateSource.OVERRIDE,
      status: TeacherDueStatus.PENDING,
      approvedByUserId: APPROVER_ID,
      teacherPaymentId: null,
    });
    expect(row.amount).toBe("150.00");
    expect(rateResolutions).toBe(0);
    expect(cacheInvalidations).toEqual([TEACHER_ID]);
  });

  test("accrues a partial snapshot at its prorated amount and clears the share on flip", async () => {
    currentInstance = buildClassInstance({
      calculationStatus: CalculationStatus.PARTIALLY,
      calculatedDuration: 60,
      teacherPaidAmount: "75.00",
      teacherPaidCurrency: CurrencyCode.SAR,
      isPartialPercentage: 50,
    });

    await TeacherDueService.createDueEntry(INSTANCE_ID, TEACHER_ID, STUDENT_ID, APPROVER_ID);

    expect(dueInserts[0]?.payload.amount).toBe("75.00");
    expect(dueInserts[0]?.payload.hours).toBe("1");
    expect(rateResolutions).toBe(0);

    // The partial-share column must be NULL outside PARTIALLY rows, so the
    // lifecycle flip clears it while the event still records the share.
    expect(payrollUpdates[0]?.patch).toEqual({
      calculationStatus: CalculationStatus.WAITING_PAID,
      isPartialPercentage: null,
    });
    expect(eventInserts[0]?.rows[0]?.toState).toEqual({
      calculationStatus: CalculationStatus.WAITING_PAID,
      teacherPaidAmount: "75.00",
      partialPercentage: 50,
      idempotencyKey: expectedAccrualKey(INSTANCE_ID),
    });
  });

  test("reads the instance row with a row lock inside the accrual transaction", async () => {
    await TeacherDueService.createDueEntry(INSTANCE_ID, TEACHER_ID, STUDENT_ID, APPROVER_ID);

    expect(getByIdMock.mock.calls[0]?.[0]).toBe(INSTANCE_ID);
    expect(getByIdMock.mock.calls[0]?.[2]).toEqual({ forUpdate: true });
  });

  test("emits the WAITING_PAID transition event for a calculated instance", async () => {
    currentInstance = buildClassInstance(CALCULATED_SNAPSHOT);

    await TeacherDueService.createDueEntry(INSTANCE_ID, TEACHER_ID, STUDENT_ID, APPROVER_ID);

    expect(eventInserts).toHaveLength(1);
    const event = eventInserts[0]?.rows[0];
    if (!event) throw new Error("expected a transition event");
    expect(event.classInstanceId).toBe(INSTANCE_ID);
    expect(event.eventType).toBe("PAYROLL_STATUS_TRANSITION");
    expect(event.fromState).toEqual({
      calculationStatus: CalculationStatus.CALCULATED,
      teacherPaidAmount: "150.00",
    });
    expect(event.toState).toEqual({
      calculationStatus: CalculationStatus.WAITING_PAID,
      teacherPaidAmount: "150.00",
      partialPercentage: null,
      idempotencyKey: expectedAccrualKey(INSTANCE_ID),
    });
    expect(event.actorUserId).toBe(APPROVER_ID);
    expect(event.description).toBeNull();
    expect(event.createdAt).toBeInstanceOf(Date);
  });

  test("falls back to rate resolution with a warning for an uncalculated instance", async () => {
    const warnSpy = spyOn(logger, "warn");

    await TeacherDueService.createDueEntry(INSTANCE_ID, TEACHER_ID, STUDENT_ID, APPROVER_ID);

    expect(rateResolutions).toBe(1);
    expect(dueInserts[0]?.payload).toEqual({
      teacherId: TEACHER_ID,
      classInstanceId: INSTANCE_ID,
      studentId: STUDENT_ID,
      hours: "1",
      amount: "150",
      currency: CurrencyCode.SAR,
      rateSource: RateSource.TEACHER,
      status: TeacherDueStatus.PENDING,
      approvedByUserId: APPROVER_ID,
      teacherPaymentId: null,
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toBe("Teacher due accrual fell back to legacy rate resolution");

    // The uncalculated row still enters the settlement lifecycle.
    expect(payrollUpdates[0]?.patch.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
    expect(eventInserts[0]?.rows[0]?.fromState).toEqual({
      calculationStatus: CalculationStatus.NOT_CALCULATED,
      teacherPaidAmount: null,
    });

    warnSpy.mockRestore();
  });

  test("falls back to rate resolution for a settled instance without rewriting its state", async () => {
    currentInstance = buildClassInstance({ ...CALCULATED_SNAPSHOT, calculationStatus: CalculationStatus.PAID });

    await TeacherDueService.createDueEntry(INSTANCE_ID, TEACHER_ID, STUDENT_ID, APPROVER_ID);

    expect(rateResolutions).toBe(1);
    expect(payrollUpdates).toHaveLength(0);
    expect(eventInserts).toHaveLength(0);
  });

  test("keeps the state of an instance that already awaits settlement", async () => {
    currentInstance = buildClassInstance({ ...CALCULATED_SNAPSHOT, calculationStatus: CalculationStatus.WAITING_PAID });

    await TeacherDueService.createDueEntry(INSTANCE_ID, TEACHER_ID, STUDENT_ID, APPROVER_ID);

    expect(rateResolutions).toBe(1);
    expect(payrollUpdates).toHaveLength(0);
    expect(eventInserts).toHaveLength(0);
  });

  test("throws the localized not-found error for an unknown instance", async () => {
    getByIdMock.mockImplementation(async () => null);

    const error = await accrueAndCaptureError();
    expect(error.message).toContain("not found");
    expect(dueInserts).toHaveLength(0);
  });

  test("throws the localized teacher-not-found error", async () => {
    teacherFindByIdMock.mockImplementationOnce(async () => null);

    const error = await accrueAndCaptureError();
    expect(error.message).toContain("teacher");
    expect(dueInserts).toHaveLength(0);
    expect(payrollUpdates).toHaveLength(0);
  });
});

describe("TeacherDueService.createDueEntry — Tier 2: snapshot boundaries", () => {
  test("accrues a refund snapshot as a zero due in the teacher's currency", async () => {
    currentInstance = buildClassInstance({
      calculationStatus: CalculationStatus.REFUND,
      calculatedDuration: null,
      teacherPaidAmount: "0",
      teacherPaidCurrency: null,
      rateSource: null,
    });

    await TeacherDueService.createDueEntry(INSTANCE_ID, TEACHER_ID, STUDENT_ID, APPROVER_ID);

    expect(dueInserts[0]?.payload.amount).toBe("0");
    expect(dueInserts[0]?.payload.hours).toBe("0");
    expect(dueInserts[0]?.payload.currency).toBe(CurrencyCode.SAR);
    expect(dueInserts[0]?.payload.rateSource).toBeNull();
    expect(rateResolutions).toBe(0);

    expect(payrollUpdates[0]?.patch.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
    expect(eventInserts[0]?.rows[0]?.fromState).toEqual({
      calculationStatus: CalculationStatus.REFUND,
      teacherPaidAmount: "0",
    });
  });

  test("falls back to rate resolution when the snapshot has no stored amount", async () => {
    currentInstance = buildClassInstance({
      calculationStatus: CalculationStatus.CALCULATED,
      calculatedDuration: 60,
      teacherPaidAmount: null,
      teacherPaidCurrency: null,
    });

    await TeacherDueService.createDueEntry(INSTANCE_ID, TEACHER_ID, STUDENT_ID, APPROVER_ID);

    expect(rateResolutions).toBe(1);
    expect(dueInserts[0]?.payload.amount).toBe("150");
  });
});

describe("TeacherDueService.createDueEntry — Tier 3: transactional integrity", () => {
  test("commits the due insert and the lifecycle flip through one transaction", async () => {
    currentInstance = buildClassInstance(CALCULATED_SNAPSHOT);

    await TeacherDueService.createDueEntry(INSTANCE_ID, TEACHER_ID, STUDENT_ID, APPROVER_ID);

    expect(transactionTxs).toHaveLength(1);
    const tx = transactionTxs[0];
    expect(dueInserts[0]?.tx).toBe(tx);
    expect(payrollUpdates[0]?.tx).toBe(tx);
    expect(eventInserts[0]?.tx).toBe(tx);
  });

  test("joins the caller's transaction instead of opening one", async () => {
    currentInstance = buildClassInstance(CALCULATED_SNAPSHOT);
    const transactionCallsBefore = dbTransactionMock.mock.calls.length;
    const callerTx = await db.transaction(async innerTx => innerTx);
    expect(dbTransactionMock.mock.calls).toHaveLength(transactionCallsBefore + 1);
    const callerTxId = transactionTxs.length;

    await TeacherDueService.createDueEntry(INSTANCE_ID, TEACHER_ID, STUDENT_ID, APPROVER_ID, callerTx);

    // The only transaction execution is the one that produced the caller tx.
    expect(dbTransactionMock.mock.calls).toHaveLength(transactionCallsBefore + 1);
    expect(transactionTxs).toHaveLength(callerTxId);
    expect(dueInserts[0]?.tx).toBe(callerTx);
    expect(payrollUpdates[0]?.tx).toBe(callerTx);
    expect(eventInserts[0]?.tx).toBe(callerTx);
  });

  test("surfaces an invariant failure when the status flip write misses", async () => {
    currentInstance = buildClassInstance(CALCULATED_SNAPSHOT);
    updatePayrollCalculationMock.mockImplementationOnce(async () => null);

    const error = await accrueAndCaptureError();
    expect(error.message).toContain("internal server error");
    expect(eventInserts).toHaveLength(0);
  });

  test("surfaces an invariant failure when the transition event insert misses", async () => {
    currentInstance = buildClassInstance(CALCULATED_SNAPSHOT);
    createManyEventsMock.mockImplementationOnce(async () => []);

    const error = await accrueAndCaptureError();
    expect(error.message).toContain("internal server error");
  });
});
