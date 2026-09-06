import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { createHash } from "node:crypto";
import { CalculationStatus, RateSource, SchedulingMode, TeacherDueStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import type { ClassInstanceSelectType, ClassStatusEventSeedInsertInput, TeacherDueSelectType } from "@/backend/types";
import { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTOR_ID = "11111111-1111-1111-1111-111111111111";
const TEACHER_ID = "22222222-2222-2222-2222-222222222222";
const OTHER_TEACHER_ID = "33333333-3333-3333-3333-333333333333";
const STUDENT_ID = "44444444-4444-4444-4444-444444444444";
const PAYMENT_ID = "55555555-5555-5555-5555-555555555555";
const DUE_ID = "66666666-6666-6666-6666-666666666666";
const OTHER_DUE_ID = "77777777-7777-7777-7777-777777777777";

const INSTANCE_ID = "88888888-8888-8888-8888-888888888888";
const OTHER_INSTANCE_ID = "99999999-9999-9999-9999-999999999999";

const BASE_INSTANCE = {
  id: INSTANCE_ID,
  studentId: STUDENT_ID,
  teacherId: TEACHER_ID,
  subjectId: "aaaaaaaa-0000-0000-0000-000000000001",
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
  calculatedDuration: 60,
  teacherPaidAmount: "150.00",
  teacherPaidCurrency: CurrencyCode.SAR,
  calculationStatus: CalculationStatus.WAITING_PAID,
  isPartialPercentage: null,
  payrollNote: null,
  payrollCalculatedAt: new Date(0),
  payrollCalculatedBy: null,
  carryoverBalanceId: null,
  remarks: null,
  adminNotes: null,
  idempotencyKey: "settlement-fixture-key",
  createdAt: new Date(0),
  updatedAt: new Date(0),
  deletedAt: null,
} satisfies ClassInstanceSelectType;

function buildClassInstance(overrides: Partial<ClassInstanceSelectType> = {}): ClassInstanceSelectType {
  return { ...BASE_INSTANCE, ...overrides };
}

function buildDueRow(overrides: Partial<TeacherDueSelectType> = {}): TeacherDueSelectType {
  const base = {
    id: DUE_ID,
    teacherId: TEACHER_ID,
    classInstanceId: INSTANCE_ID,
    studentId: STUDENT_ID,
    hours: "1",
    amount: "150.00",
    currency: CurrencyCode.SAR,
    rateSource: RateSource.TEACHER,
    status: TeacherDueStatus.PENDING,
    approvedByUserId: ACTOR_ID,
    approvedAt: new Date(0),
    teacherPaymentId: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  } satisfies TeacherDueSelectType;
  return { ...base, ...overrides };
}

function expectedSettlementKey(instanceId: string, teacherPaymentId: string): string {
  return createHash("sha256").update(`payroll-settlement:${instanceId}:${teacherPaymentId}`).digest("hex");
}

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported.
// ---------------------------------------------------------------------------

let settledDues: TeacherDueSelectType[] = [];
let linkedInstances: ClassInstanceSelectType[] = [];
let dueUpdates: { dueIds: string[]; teacherPaymentId: string; tx: unknown }[] = [];
let payrollUpdates: { tx: unknown; id: string; patch: Record<string, unknown>; options: unknown }[] = [];
let eventInserts: { rows: ClassStatusEventSeedInsertInput[]; tx: unknown }[] = [];
let cacheInvalidations: string[] = [];
let selectCalls = 0;

const fakeTx = {
  select: () => {
    selectCalls += 1;
    return {
      from: () => ({
        where: () => linkedInstances,
      }),
    };
  },
};

const dbTransactionMock = mock(async (callback: (tx: typeof fakeTx) => Promise<unknown>) => callback(fakeTx));

const dueMarkAsPaidMock = mock(
  async (dueIds: string[], teacherPaymentId: string, tx?: unknown): Promise<TeacherDueSelectType[]> => {
    dueUpdates.push({ dueIds: [...dueIds], teacherPaymentId, tx });
    return settledDues;
  }
);

const updatePayrollCalculationMock = mock(
  async (
    tx: unknown,
    id: string,
    patch: Record<string, unknown>,
    options?: unknown
  ): Promise<ClassInstanceSelectType | null> => {
    payrollUpdates.push({ tx, id, patch, options });
    return linkedInstances.find(instance => instance.id === id) ?? null;
  }
);

const createManyEventsMock = mock(async (rows: ClassStatusEventSeedInsertInput[], tx?: unknown) => {
  eventInserts.push({ rows: [...rows], tx });
  return rows.map((row, index) => ({ ...row, id: `event-${eventInserts.length}-${index}` }));
});

const hasPermissionMock = mock(async () => true);
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
    updatePayrollCalculation: updatePayrollCalculationMock,
  },
  RecurringScheduleRepository: {
    findById: mock(async () => null),
  },
  ClassStatusEventsRepository: {
    createMany: createManyEventsMock,
  },
}));

await mock.module("@/backend/db/repo/teachers/teacher-due.repository", () => ({
  TeacherDueRepository: {
    markAsPaid: dueMarkAsPaidMock,
  },
}));

await mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: { hasPermission: hasPermissionMock },
}));

await mock.module("@/backend/services/cache", () => ({
  invalidateClassLifecycle: invalidateCacheMock,
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
    },
  }),
}));

const { TeacherDueService } = await import("@/backend/services/teacher/teacher-due.service");

/** Stages one pending due linked to an instance awaiting settlement. */
function stageAwaitingSettlement(): void {
  settledDues = [buildDueRow()];
  linkedInstances = [buildClassInstance()];
}

/** Runs one settlement and returns the thrown error (fails loudly on success). */
async function settleAndCaptureError(): Promise<Error> {
  let caught: unknown = null;
  try {
    await TeacherDueService.markAsPaid(ACTOR_ID, [DUE_ID], PAYMENT_ID);
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
  settledDues = [];
  linkedInstances = [];
  dueUpdates = [];
  payrollUpdates = [];
  eventInserts = [];
  cacheInvalidations = [];
  selectCalls = 0;
  dbTransactionMock.mockClear();
  dueMarkAsPaidMock.mockClear();
  updatePayrollCalculationMock.mockClear();
  createManyEventsMock.mockClear();
  hasPermissionMock.mockClear();
  hasPermissionMock.mockImplementation(async () => true);
  updatePayrollCalculationMock.mockImplementation(
    async (tx: unknown, id: string, patch: Record<string, unknown>, options?: unknown) => {
      payrollUpdates.push({ tx, id, patch, options });
      return linkedInstances.find(instance => instance.id === id) ?? null;
    }
  );
  createManyEventsMock.mockImplementation(async (rows: ClassStatusEventSeedInsertInput[], tx?: unknown) => {
    eventInserts.push({ rows: [...rows], tx });
    return rows.map((row, index) => ({ ...row, id: `event-${eventInserts.length}-${index}` }));
  });
});

describe("TeacherDueService.markAsPaid — Tier 1: settlement branches", () => {
  test("flips an awaiting instance to PAID and emits the transition event in the same transaction", async () => {
    stageAwaitingSettlement();

    const result = await TeacherDueService.markAsPaid(ACTOR_ID, [DUE_ID], PAYMENT_ID);

    expect(result).toEqual(settledDues);
    expect(dbTransactionMock).toHaveBeenCalledTimes(1);

    expect(dueUpdates).toHaveLength(1);
    expect(dueUpdates[0]?.dueIds).toEqual([DUE_ID]);
    expect(dueUpdates[0]?.teacherPaymentId).toBe(PAYMENT_ID);
    expect(dueUpdates[0]?.tx).toBe(fakeTx);

    expect(payrollUpdates).toHaveLength(1);
    expect(payrollUpdates[0]?.tx).toBe(fakeTx);
    expect(payrollUpdates[0]?.id).toBe(INSTANCE_ID);
    expect(payrollUpdates[0]?.patch).toEqual({ calculationStatus: CalculationStatus.PAID });
    expect(payrollUpdates[0]?.options).toEqual({ expectedStatus: CalculationStatus.WAITING_PAID });

    expect(eventInserts).toHaveLength(1);
    expect(eventInserts[0]?.tx).toBe(fakeTx);
    const event = eventInserts[0]?.rows[0];
    if (!event) throw new Error("expected a settlement event");
    expect(event.classInstanceId).toBe(INSTANCE_ID);
    expect(event.eventType).toBe("PAYROLL_STATUS_TRANSITION");
    expect(event.fromState).toEqual({
      calculationStatus: CalculationStatus.WAITING_PAID,
      teacherPaidAmount: "150.00",
    });
    expect(event.toState).toEqual({
      calculationStatus: CalculationStatus.PAID,
      teacherPaidAmount: "150.00",
      partialPercentage: null,
      idempotencyKey: expectedSettlementKey(INSTANCE_ID, PAYMENT_ID),
    });
    expect(event.actorUserId).toBe(ACTOR_ID);
    expect(event.createdAt).toBeInstanceOf(Date);

    expect(cacheInvalidations).toEqual([TEACHER_ID]);
  });

  test("keeps instances outside the settlement lifecycle untouched", async () => {
    settledDues = [
      buildDueRow({ id: DUE_ID, classInstanceId: INSTANCE_ID }),
      buildDueRow({ id: OTHER_DUE_ID, classInstanceId: OTHER_INSTANCE_ID, teacherId: OTHER_TEACHER_ID }),
    ];
    linkedInstances = [
      buildClassInstance({ id: INSTANCE_ID, calculationStatus: CalculationStatus.PAID }),
      buildClassInstance({ id: OTHER_INSTANCE_ID, calculationStatus: CalculationStatus.NOT_CALCULATED }),
    ];

    const result = await TeacherDueService.markAsPaid(ACTOR_ID, [DUE_ID, OTHER_DUE_ID], PAYMENT_ID);

    expect(result).toHaveLength(2);
    expect(payrollUpdates).toHaveLength(0);
    expect(eventInserts).toHaveLength(0);
    expect(cacheInvalidations).toEqual([TEACHER_ID, OTHER_TEACHER_ID]);
  });

  test("settles each awaiting instance of a mixed batch exactly once", async () => {
    settledDues = [
      buildDueRow({ id: DUE_ID, classInstanceId: INSTANCE_ID }),
      buildDueRow({ id: OTHER_DUE_ID, classInstanceId: OTHER_INSTANCE_ID, teacherId: OTHER_TEACHER_ID }),
    ];
    linkedInstances = [
      buildClassInstance({ id: INSTANCE_ID }),
      buildClassInstance({ id: OTHER_INSTANCE_ID, calculationStatus: CalculationStatus.CALCULATED }),
    ];

    await TeacherDueService.markAsPaid(ACTOR_ID, [DUE_ID, OTHER_DUE_ID], PAYMENT_ID);

    expect(payrollUpdates).toHaveLength(1);
    expect(payrollUpdates[0]?.id).toBe(INSTANCE_ID);
    expect(eventInserts[0]?.rows).toHaveLength(1);
    expect(eventInserts[0]?.rows[0]?.classInstanceId).toBe(INSTANCE_ID);
  });
});

describe("TeacherDueService.markAsPaid — Tier 2: boundaries", () => {
  test("handles an empty due batch without touching instances", async () => {
    const result = await TeacherDueService.markAsPaid(ACTOR_ID, [], PAYMENT_ID);

    expect(result).toEqual([]);
    expect(dueUpdates[0]?.dueIds).toEqual([]);
    expect(selectCalls).toBe(0);
    expect(payrollUpdates).toHaveLength(0);
    expect(eventInserts).toHaveLength(0);
    expect(cacheInvalidations).toEqual([]);
  });

  test("settles a zero-amount refund due and flips its instance", async () => {
    settledDues = [buildDueRow({ amount: "0" })];
    linkedInstances = [buildClassInstance({ teacherPaidAmount: "0" })];

    await TeacherDueService.markAsPaid(ACTOR_ID, [DUE_ID], PAYMENT_ID);

    expect(payrollUpdates).toHaveLength(1);
    expect(eventInserts[0]?.rows[0]?.toState).toEqual({
      calculationStatus: CalculationStatus.PAID,
      teacherPaidAmount: "0",
      partialPercentage: null,
      idempotencyKey: expectedSettlementKey(INSTANCE_ID, PAYMENT_ID),
    });
  });
});

describe("TeacherDueService.markAsPaid — Tier 3: repeat settlements", () => {
  test("settling the same batch twice emits exactly one transition event", async () => {
    const instance = buildClassInstance();
    settledDues = [buildDueRow()];
    linkedInstances = [instance];

    await TeacherDueService.markAsPaid(ACTOR_ID, [DUE_ID], PAYMENT_ID);

    // The committed state after the first settlement: the instance is PAID.
    instance.calculationStatus = CalculationStatus.PAID;

    await TeacherDueService.markAsPaid(ACTOR_ID, [DUE_ID], PAYMENT_ID);

    expect(dueUpdates).toHaveLength(2);
    expect(payrollUpdates).toHaveLength(1);
    expect(eventInserts).toHaveLength(1);
  });

  test("deduplicates instances shared by multiple due rows", async () => {
    settledDues = [buildDueRow({ id: DUE_ID }), buildDueRow({ id: OTHER_DUE_ID })];
    linkedInstances = [buildClassInstance()];

    await TeacherDueService.markAsPaid(ACTOR_ID, [DUE_ID, OTHER_DUE_ID], PAYMENT_ID);

    expect(payrollUpdates).toHaveLength(1);
    expect(eventInserts[0]?.rows).toHaveLength(1);
  });

  test("skips cleanly when a forced override raced the settlement (precondition matched no row)", async () => {
    stageAwaitingSettlement();
    // The unlocked batch read saw WAITING_PAID; a concurrent forced override
    // then committed REFUND. The preconditioned flip matches no row, so the
    // settlement completes without stomping the refund and without emitting
    // a transition event for the instance.
    updatePayrollCalculationMock.mockImplementationOnce(async () => null);
    const infoSpy = spyOn(logger, "info");

    await TeacherDueService.markAsPaid(ACTOR_ID, [DUE_ID], PAYMENT_ID);

    expect(eventInserts).toHaveLength(0);
    expect(cacheInvalidations).toEqual([TEACHER_ID]);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0]?.[0]).toBe(
      "Skipped the payroll settlement flip: the instance status changed after the batch read"
    );

    infoSpy.mockRestore();
  });

  test("returns no settled dues on a double submit, so no second event can be emitted", async () => {
    settledDues = [buildDueRow()];
    linkedInstances = [buildClassInstance()];

    await TeacherDueService.markAsPaid(ACTOR_ID, [DUE_ID], PAYMENT_ID);

    // After the first settlement the due row is no longer PENDING, so the
    // repo returns no rows for the re-submitted ids and the instance pass
    // never runs — the first payment keeps its exclusive link.
    settledDues = [];
    await TeacherDueService.markAsPaid(ACTOR_ID, [DUE_ID], PAYMENT_ID);

    expect(dueUpdates).toHaveLength(2);
    expect(dueUpdates[1]?.dueIds).toEqual([DUE_ID]);
    expect(payrollUpdates).toHaveLength(1);
    expect(eventInserts).toHaveLength(1);
    expect(cacheInvalidations).toEqual([TEACHER_ID]);
  });

  test("surfaces an invariant failure when the event insert misses", async () => {
    stageAwaitingSettlement();
    createManyEventsMock.mockImplementationOnce(async () => []);

    const error = await settleAndCaptureError();
    expect(error.message).toContain("internal server error");
  });
});

describe("TeacherDueService.markAsPaid — Tier 4: actor integrity", () => {
  test("rejects actors without the mark-paid permission before any write", async () => {
    hasPermissionMock.mockImplementationOnce(async () => false);

    const error = await settleAndCaptureError();
    expect(error.message).toContain("insufficient permissions");
    expect(dueUpdates).toHaveLength(0);
    expect(dbTransactionMock).toHaveBeenCalledTimes(0);
  });

  test("persists the acting operator on the settlement event", async () => {
    stageAwaitingSettlement();

    await TeacherDueService.markAsPaid(ACTOR_ID, [DUE_ID], PAYMENT_ID);

    expect(eventInserts[0]?.rows[0]?.actorUserId).toBe(ACTOR_ID);
  });
});
