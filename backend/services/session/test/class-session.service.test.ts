import { beforeEach, describe, expect, it, mock } from "bun:test";

const loggerWarn = mock((_msg: string, _ctx?: unknown) => {});

await mock.module("@/backend/lib/logger", () => ({
  logger: {
    info: mock((_msg: string, _ctx?: unknown) => {}),
    warn: loggerWarn,
    error: mock((_msg: string, _ctx?: unknown) => {}),
    debug: mock((_msg: string, _ctx?: unknown) => {}),
  },
}));

const softDeleteClassInstance = mock((_id: string, _userId: string, _tx: unknown) => Promise.resolve(true));
const getClassInstanceAffectedUsers = mock((_id: string) => Promise.resolve([]));

const mockInstance = {
  id: "inst-1",
  studentId: "stu-1",
  quotaDeducted: true,
  recurringScheduleId: null,
  deletedAt: null,
  executionState: "PLANNED",
};

const getClassInstanceById = mock((_id: string) => Promise.resolve(mockInstance));

await mock.module("@/backend/db/drizzleDb", () => ({
  db: { transaction: mock(async (cb: (tx: unknown) => Promise<unknown>) => cb({})) },
  queryDb: mock((tx?: unknown) => tx ?? { transaction: mock(async (cb: (tx: unknown) => Promise<unknown>) => cb({})) }),
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

await mock.module("@/backend/db/repo/scheduling", () => ({
  SchedulingRepository: {
    getClassInstanceAffectedUsers,
    softDeleteClassInstance,
    getClassInstanceById,
  },
  RecurringScheduleRepository: {
    findById: mock((_id: string, _tx: unknown) => Promise.resolve(null)),
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

await mock.module("@/backend/services/cache", () => ({
  invalidateClassLifecycle: mock(() => Promise.resolve()),
}));

await mock.module("@/backend/services/performance/class-performance.service", () => ({
  ClassPerformanceService: { resetForInstance: mock(() => Promise.resolve()) },
}));

await mock.module("@/backend/services/system/system-rules.service", () => ({
  SystemRulesService: { getSystemRules: mock(() => Promise.resolve({})) },
}));

await mock.module("@/backend/services/meeting/class-meeting-config.service", () => ({
  EffectiveMeetingService: {
    resolveForClassInstance: mock(() => Promise.resolve(null)),
    resolveForNewBooking: mock(() => Promise.resolve(null)),
  },
}));

await mock.module("@/backend/db/repo/parents/parent.repository", () => ({
  ParentRepository: { findById: mock(() => Promise.resolve(null)) },
}));

await mock.module("@/backend/db/repo/students/student.repository", () => ({
  StudentRepository: { findById: mock(() => Promise.resolve(null)) },
}));

await mock.module("@/backend/db/repo/shared/system-settings.repository", () => ({
  SystemSettingsRepository: { get: mock(() => Promise.resolve(null)) },
}));

await mock.module("@/backend/db/repo/scheduling/class-status-events.repository", () => ({
  ClassStatusEventsRepository: { create: mock(() => Promise.resolve({})) },
}));

await mock.module("@/backend/graphql/utils/class-session.utils", () => ({
  buildClassInstanceDetail: mock(() => ({})),
}));

const { ClassSessionService } = await import("@/backend/services/session/class-session.service");
const { errorsEn } = await import("@/shared/locale/en/errors");

describe("ClassSessionService releaseQuotaIfDeducted (via deleteInstance)", () => {
  const tErrors = errorsEn;

  beforeEach(() => {
    loggerWarn.mockClear();
    softDeleteClassInstance.mockImplementation((_id, _uid, _tx) => Promise.resolve(true));
    getClassInstanceById.mockImplementation(_id => Promise.resolve(mockInstance));
  });

  it("logs localized WARN when quotaDeducted but recurringScheduleId is null", async () => {
    const result = await ClassSessionService.deleteInstance("user-1", "inst-1", tErrors);
    expect(loggerWarn).toHaveBeenCalled();
    const warnCall = loggerWarn.mock.calls[0];
    const msg = warnCall[0];
    const ctx = warnCall[1];
    expect(typeof msg).toBe("string");
    if (typeof ctx === "object" && ctx !== null) {
      expect(ctx).toHaveProperty("classInstanceId");
      expect(ctx).toHaveProperty("studentId");
    } else {
      throw new Error("Expected warn call to have a context object");
    }
    expect(result).toEqual({ success: true, warnings: ["quota_release_skipped_no_schedule"] });
  });
});
