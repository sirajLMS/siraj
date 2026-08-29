import { beforeEach, describe, expect, it, mock } from "bun:test";

import { OnDemandStatus } from "@/backend/enum";
import type { PayrollCalculationInput } from "@/backend/types";
import { ClassExecutionState } from "@/shared/constants/class-instance-detail.enum";

/**
 * Verifies the class-session state machine invokes the payroll calculator
 * when an instance reaches a terminal execution state (COMPLETED or a
 * terminal on-demand state), inside the same transaction as the transition —
 * and never for non-terminal transitions.
 */

const loggerWarn = mock((_msg: string, _ctx?: unknown) => {});
const loggerError = mock((_msg: string, _ctx?: unknown) => {});

await mock.module("@/backend/lib/logger", () => ({
  logger: {
    info: mock((_msg: string, _ctx?: unknown) => {}),
    warn: loggerWarn,
    error: loggerError,
    debug: mock((_msg: string, _ctx?: unknown) => {}),
    logDomainError: mock((_msg: string, _ctx?: unknown) => {}),
    logDomainIssue: mock((_msg: string, _ctx?: unknown) => {}),
  },
}));

/**
 * The payroll calculator is the collaborator under observation: the trigger
 * wiring must invoke it inside the state-change transaction, never beside it.
 */
const calculateForInstance = mock((_input: PayrollCalculationInput, _tErrors?: unknown, _tx?: unknown) =>
  Promise.resolve({
    instanceId: "inst-1",
    calculatedDuration: 60,
    teacherPaidAmount: "100.00",
    teacherPaidCurrency: "SAR",
    calculationStatus: "CALCULATED",
    isStudentAbsence: false,
    isTeacherAbsence: false,
    isWithinGrace: true,
    isProRated: false,
  })
);

await mock.module("@/backend/services/teacher/payroll-calculation.service", () => ({
  PayrollCalculationService: {
    calculateForInstance,
    applyOverride: mock(() => Promise.resolve({})),
    getReport: mock(() => Promise.resolve({})),
  },
}));

/** Stable sentinel handed to every transaction callback, so tests can assert the trigger used the caller's transaction. */
const fakeTx = { transactionClient: "sentinel" };

await mock.module("@/backend/db/drizzleDb", () => ({
  db: { transaction: mock(async (cb: (tx: unknown) => Promise<unknown>) => cb(fakeTx)) },
  queryDb: mock(
    (tx?: unknown) => tx ?? { transaction: mock(async (cb: (tx: unknown) => Promise<unknown>) => cb(fakeTx)) }
  ),
  drizzleLogs: [] as string[],
  getDrizzleDbPool: mock(() => null),
  clearDbConnectionSingleton: mock(() => {}),
}));

await mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    assert: mock((_uid: string, _perm: unknown, _t: unknown) => Promise.resolve()),
    hasPermission: mock((_uid: string, _perm: unknown) => Promise.resolve(true)),
    hasAnyPermission: mock((_uid: string, _perms: unknown) => Promise.resolve(true)),
  },
}));

const activatedInstance = {
  id: "inst-1",
  teacherId: "teacher-1",
  studentId: "stu-1",
  executionState: ClassExecutionState.ACTIVATED,
  ondemandStatus: null,
  quotaDeducted: false,
  recurringScheduleId: null,
  deletedAt: null,
};
const completedInstance = { id: "inst-1", executionState: ClassExecutionState.COMPLETED };
const runningInstance = { id: "inst-1", executionState: ClassExecutionState.RUNNING };
const resetInstance = { id: "inst-1", executionState: ClassExecutionState.NOT_ACTIVATED };

const getClassInstanceById = mock((_id: string) => Promise.resolve(activatedInstance));
const getById = mock((_id: string, _tx?: unknown) => Promise.resolve(completedInstance));
const stopClassInstance = mock((_id: string, _userId: string, _tx?: unknown, _tErrors?: unknown, _hooks?: unknown) =>
  Promise.resolve(completedInstance)
);
const markClassAbsent = mock((_id: string, _userId: string, _tx?: unknown, _tErrors?: unknown, _hooks?: unknown) =>
  Promise.resolve(completedInstance)
);
const startClassInstance = mock((_id: string, _userId: string, _tx?: unknown, _tErrors?: unknown, _hooks?: unknown) =>
  Promise.resolve(runningInstance)
);
const activateClassInstance = mock(
  (_id: string, _userId: string, _options: { force: boolean }, _tx?: unknown, _tErrors?: unknown, _hooks?: unknown) =>
    Promise.resolve(activatedInstance)
);
const resetClassInstance = mock((_id: string, _userId: string, _tx?: unknown, _tErrors?: unknown, _hooks?: unknown) =>
  Promise.resolve(resetInstance)
);
const processClassLeave = mock(
  (
    _id: string,
    _reason: string | null,
    _userId: string,
    _tx?: unknown,
    _tErrors?: unknown,
    _hooks?: unknown,
    _meetingJoinUrl?: string | null
  ) => Promise.resolve({ originalId: "inst-1", successorId: "inst-2" })
);
const updateOndemandStatusBatch = mock((_ids: string[], _updates: unknown, _guard: unknown, _tx?: unknown) =>
  Promise.resolve(1)
);
const getClassInstanceAffectedUsers = mock((_id: string) => Promise.resolve([]));
const softDeleteClassInstance = mock((_id: string, _userId: string, _tx?: unknown) => Promise.resolve(true));

await mock.module("@/backend/db/repo/scheduling", () => ({
  SchedulingRepository: {
    getClassInstanceById,
    getById,
    stopClassInstance,
    markClassAbsent,
    startClassInstance,
    activateClassInstance,
    resetClassInstance,
    processClassLeave,
    updateOndemandStatusBatch,
    getClassInstanceAffectedUsers,
    softDeleteClassInstance,
  },
  RecurringScheduleRepository: {
    findById: mock((_id: string, _tx?: unknown) => Promise.resolve(null)),
  },
  classLifecycleAffectedUserIds: mock(() => []),
  getClassInstanceAffectedUsersForTeacher: mock(() => []),
  resolveStudentTimezone: mock(() => "UTC"),
  findUpcomingInstances: mock(() => []),
}));

await mock.module("@/backend/services/billing/quota.service", () => ({
  QuotaService: {
    tryReleaseForInstance: mock(() => Promise.resolve({ ok: false })),
    selectQuotaForBooking: mock(() => Promise.resolve(null)),
    redeemForInstance: mock(() => Promise.resolve({ ok: false })),
  },
}));

await mock.module("@/backend/services/billing/credit.service", () => ({
  CreditService: {
    refundCredit: mock(() => Promise.resolve({ ok: false })),
    refundOnCancel: mock(() => Promise.resolve({ ok: false })),
    deductForBooking: mock(() => Promise.resolve({ ok: false })),
  },
}));

await mock.module("@/backend/services/notification", () => ({
  buildClassLifecyclePayloads: mock(() => []),
  dispatchWithPreferences: mock(() => Promise.resolve()),
  notifyClassLifecycle: mock(() => Promise.resolve()),
}));

await mock.module("@/backend/services/meeting/meeting-config-snapshot", () => ({
  MeetingConfigSnapshotService: { cancelMeetingForClassInstance: mock(() => Promise.resolve()) },
}));

await mock.module("@/backend/services/meeting/class-meeting-config.service", () => ({
  EffectiveMeetingService: {
    resolveForClassInstance: mock(() => Promise.resolve(null)),
    resolveForNewBooking: mock(() => Promise.resolve({ joinUrl: null })),
  },
}));

await mock.module("@/backend/services/cache", () => ({
  invalidateClassLifecycle: mock(() => Promise.resolve()),
}));

await mock.module("@/backend/services/performance/class-performance.service", () => ({
  ClassPerformanceService: { resetForInstance: mock(() => Promise.resolve()) },
}));

await mock.module("@/backend/services/system/system-rules.service", () => ({
  SystemRulesService: {
    getSystemRules: mock(() => Promise.resolve({})),
    assertActivationTimeWindow: mock((_instance: unknown) => Promise.resolve()),
    assertAbsentWaitingPeriod: mock((_instance: unknown) => Promise.resolve()),
    assertLeaveQuotaAvailable: mock((_teacherId: string) => Promise.resolve()),
  },
}));

await mock.module("@/backend/db/repo/parents/parent.repository", () => ({
  ParentRepository: {
    findById: mock(() => Promise.resolve(null)),
    findByUserId: mock((_uid: string, _tx?: unknown) => Promise.resolve(null)),
  },
}));

await mock.module("@/backend/db/repo/students/student.repository", () => ({
  StudentRepository: {
    findById: mock(() => Promise.resolve(null)),
    getStudentIdByUserId: mock((_uid: string) => Promise.resolve(null)),
  },
}));

await mock.module("@/backend/db/repo/shared/system-settings.repository", () => ({
  SystemSettingsRepository: { get: mock(() => Promise.resolve(null)), getIntValue: mock(() => Promise.resolve(0)) },
}));

await mock.module("@/backend/db/repo/scheduling/class-status-events.repository", () => ({
  ClassStatusEventsRepository: { create: mock(() => Promise.resolve({})) },
}));

await mock.module("@/backend/graphql/utils/class-session.utils", () => ({
  buildClassInstanceDetail: mock(() => ({})),
}));

const { ClassSessionService } = await import("@/backend/services/session/class-session.service");
const { db } = await import("@/backend/db/drizzleDb");
const { errorsEn } = await import("@/shared/locale/en/errors");

/** Runs a no-credits batch resolution inside a transaction and returns the flipped-row count. */
async function runNoCreditsBatch(
  instanceIds: string[],
  newStatus: OnDemandStatus,
  executionState: ClassExecutionState,
  options?: { actorUserId?: string | null }
): Promise<number> {
  return db.transaction(tx =>
    ClassSessionService.markNoCreditsBatch(tx, instanceIds, newStatus, executionState, options)
  );
}

/**
 * Asserts the calculator ran exactly once with the expected input, inside the
 * caller-supplied transaction (and the expected error labels when given).
 */
function expectSingleCalculation(
  expected: { instanceId: string; actorUserId: string; isOnDemand: boolean },
  expectedErrors?: unknown
): void {
  expect(calculateForInstance).toHaveBeenCalledTimes(1);
  const [input, passedErrors, passedTx] = calculateForInstance.mock.calls[0];
  expect(input).toEqual(expected);
  if (expectedErrors === undefined) {
    expect(passedErrors).toBeDefined();
  } else {
    expect(passedErrors).toBe(expectedErrors);
  }
  expect(passedTx).toBe(fakeTx);
}

describe("ClassSessionService automatic payroll trigger", () => {
  const tErrors = errorsEn;

  beforeEach(() => {
    calculateForInstance.mockClear();
    loggerWarn.mockClear();
    loggerError.mockClear();
    stopClassInstance.mockClear();
    getById.mockClear();
    getById.mockImplementation(() => Promise.resolve(completedInstance));
  });

  it("runs the calculator inside the transition transaction when a session is stopped", async () => {
    const result = await ClassSessionService.stop("user-1", "inst-1", tErrors);

    expect(result?.id).toBe("inst-1");
    expect(result?.executionState).toBe(ClassExecutionState.COMPLETED);
    expect(stopClassInstance.mock.calls[0][2]).toBe(fakeTx);
    expectSingleCalculation({ instanceId: "inst-1", actorUserId: "user-1", isOnDemand: false }, tErrors);
  });

  it("runs the calculator when a student is marked absent", async () => {
    await ClassSessionService.updateStatusAbsent("user-1", "inst-1", tErrors);

    expectSingleCalculation({ instanceId: "inst-1", actorUserId: "user-1", isOnDemand: false });
  });

  it("runs the calculator for the completed original when a leave is processed", async () => {
    await ClassSessionService.updateStatusLeave("user-1", "inst-1", tErrors, "sick leave");

    expect(getById).toHaveBeenCalledWith("inst-1", fakeTx);
    expectSingleCalculation({ instanceId: "inst-1", actorUserId: "user-1", isOnDemand: false });
  });

  it("runs the calculator with the on-demand flag for a terminal on-demand batch resolution", async () => {
    getById.mockImplementationOnce(() =>
      Promise.resolve({ id: "inst-1", executionState: ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED })
    );

    const updatedCount = await runNoCreditsBatch(
      ["inst-1"],
      OnDemandStatus.NO_CREDITS_CANCELLED,
      ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED,
      { actorUserId: "user-1" }
    );

    expect(updatedCount).toBe(1);
    expectSingleCalculation({ instanceId: "inst-1", actorUserId: "user-1", isOnDemand: true });
  });

  it("runs the calculator with the on-demand flag for a no-credits absent resolution", async () => {
    getById.mockImplementationOnce(() =>
      Promise.resolve({ id: "inst-1", executionState: ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT })
    );

    const updatedCount = await runNoCreditsBatch(
      ["inst-1"],
      OnDemandStatus.NO_CREDITS_ABSENT,
      ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT,
      { actorUserId: "user-1" }
    );

    expect(updatedCount).toBe(1);
    expectSingleCalculation({ instanceId: "inst-1", actorUserId: "user-1", isOnDemand: true });
  });

  it("runs the calculator once per flipped instance in a terminal batch", async () => {
    updateOndemandStatusBatch.mockImplementationOnce(() => Promise.resolve(2));
    getById.mockImplementation((id: string) =>
      Promise.resolve({ id, executionState: ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT })
    );

    const updatedCount = await runNoCreditsBatch(
      ["inst-1", "inst-2"],
      OnDemandStatus.NO_CREDITS_ABSENT,
      ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT,
      { actorUserId: "user-1" }
    );

    expect(updatedCount).toBe(2);
    expect(calculateForInstance).toHaveBeenCalledTimes(2);
    const instanceIds = new Set(calculateForInstance.mock.calls.map(call => call[0].instanceId));
    expect(instanceIds).toEqual(new Set(["inst-1", "inst-2"]));
    for (const call of calculateForInstance.mock.calls) {
      expect(call[0]).toMatchObject({ actorUserId: "user-1", isOnDemand: true });
      expect(call[2]).toBe(fakeTx);
    }
  });

  it("does not run the calculator when a session starts (non-terminal)", async () => {
    await ClassSessionService.updateStatusStart("user-1", "inst-1", tErrors);

    expect(calculateForInstance).not.toHaveBeenCalled();
  });

  it("does not run the calculator when a session is activated (non-terminal)", async () => {
    await ClassSessionService.activate("user-1", "inst-1", tErrors);

    expect(calculateForInstance).not.toHaveBeenCalled();
  });

  it("does not run the calculator when a session is reset (non-terminal)", async () => {
    await ClassSessionService.reset("user-1", "inst-1", tErrors);

    expect(calculateForInstance).not.toHaveBeenCalled();
  });

  it("does not run the calculator when a session is cancelled by soft-delete", async () => {
    const result = await ClassSessionService.deleteInstance("user-1", "inst-1", tErrors);

    expect(result).toEqual({ success: true, warnings: [] });
    expect(calculateForInstance).not.toHaveBeenCalled();
  });

  it("does not run the calculator for a non-terminal batch execution state", async () => {
    const updatedCount = await runNoCreditsBatch(
      ["inst-1"],
      OnDemandStatus.AVAILABLE,
      ClassExecutionState.NOT_ACTIVATED,
      { actorUserId: "user-1" }
    );

    expect(updatedCount).toBe(1);
    expect(getById).not.toHaveBeenCalled();
    expect(calculateForInstance).not.toHaveBeenCalled();
  });

  it("does not read or calculate when the batch update flipped no rows", async () => {
    updateOndemandStatusBatch.mockImplementationOnce(() => Promise.resolve(0));

    const updatedCount = await runNoCreditsBatch(
      ["inst-1"],
      OnDemandStatus.NO_CREDITS_CANCELLED,
      ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED,
      { actorUserId: "user-1" }
    );

    expect(updatedCount).toBe(0);
    expect(getById).not.toHaveBeenCalled();
    expect(calculateForInstance).not.toHaveBeenCalled();
  });

  it("skips the calculator when a system batch resolution has no actor", async () => {
    await runNoCreditsBatch(
      ["inst-1"],
      OnDemandStatus.NO_CREDITS_CANCELLED,
      ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED
    );

    expect(getById).not.toHaveBeenCalled();
    expect(calculateForInstance).not.toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledTimes(1);
    expect(loggerWarn.mock.calls[0][0]).toBe(
      "On-demand terminal resolution without an actor; payroll calculation deferred"
    );
  });

  it("skips instances the batch update did not actually flip to the terminal state", async () => {
    getById.mockImplementationOnce(() =>
      Promise.resolve({ id: "inst-1", executionState: ClassExecutionState.ON_DEMAND_PENDING_CREDITS })
    );

    await runNoCreditsBatch(
      ["inst-1"],
      OnDemandStatus.NO_CREDITS_CANCELLED,
      ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED,
      { actorUserId: "user-1" }
    );

    expect(calculateForInstance).not.toHaveBeenCalled();
    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it("preserves the state change when the calculator throws", async () => {
    calculateForInstance.mockImplementationOnce(() => Promise.reject(new Error("insufficient permissions")));

    const result = await ClassSessionService.stop("user-1", "inst-1", tErrors);

    expect(result?.id).toBe("inst-1");
    expect(result?.executionState).toBe(ClassExecutionState.COMPLETED);
    expect(loggerError).toHaveBeenCalledTimes(1);
    expect(loggerError.mock.calls[0][0]).toBe("Automatic payroll calculation failed; session state change preserved");
  });
});
