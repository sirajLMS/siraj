import { beforeEach, describe, expect, mock, test } from "bun:test";
import { FxProvider, FxSyncStatus, FxSyncTrigger } from "@/backend/enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

type SyncRunRow = {
  id: string;
  provider: FxProvider;
  status: FxSyncStatus;
  pairsWritten: string;
  pairsFailed: string;
  errorMessage: string | null;
  providerResponse: unknown;
  triggerType: string;
  triggeredByUserId: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const createdSyncRun: SyncRunRow = {
  id: "sync-run-1",
  provider: FxProvider.OpenExchangeRates,
  status: FxSyncStatus.Running,
  pairsWritten: "0",
  pairsFailed: "0",
  errorMessage: null,
  providerResponse: null,
  triggerType: FxSyncTrigger.Manual,
  triggeredByUserId: "user-1",
  startedAt: new Date("2026-07-10T00:00:00.000Z"),
  finishedAt: null,
  createdAt: new Date("2026-07-10T00:00:00.000Z"),
  updatedAt: new Date("2026-07-10T00:00:00.000Z"),
};

const completedSuccessRun: SyncRunRow = {
  ...createdSyncRun,
  status: FxSyncStatus.Success,
  pairsWritten: "4",
  pairsFailed: "0",
  finishedAt: new Date("2026-07-10T00:00:01.000Z"),
};

const createSyncRunMock = mock(async (): Promise<SyncRunRow> => createdSyncRun);
const completeSyncRunMock = mock(async (): Promise<SyncRunRow> => completedSuccessRun);
const isRecentSuccessMock = mock(async (): Promise<boolean> => false);
const getRunningSyncRunMock = mock(async (): Promise<SyncRunRow | null> => null);
const updateExchangeRateInTxMock = mock(async () => ({}));

await mock.module("@/backend/db/repo", () => ({
  BillingRepository: {
    updateExchangeRateInTx: updateExchangeRateInTxMock,
  },
  FxSyncRepository: {
    createSyncRun: createSyncRunMock,
    completeSyncRun: completeSyncRunMock,
    isRecentSuccess: isRecentSuccessMock,
    getRunningSyncRun: getRunningSyncRunMock,
    getLatestSyncRun: mock(async () => null),
  },
}));

const transactionMock = mock(async (cb: (tx: unknown) => Promise<unknown>) => cb({}));

await mock.module("@/backend/db/drizzleDb", () => ({
  db: {
    transaction: transactionMock,
  },
}));

const hasPermissionMock = mock(async (): Promise<boolean> => true);

await mock.module("@/backend/services", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
  },
  getRedisService: async () => ({}),
}));

await mock.module("@/backend/lib", () => ({
  logger: {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

// Service now calls getServerTranslations(locale).errorsTranslations (real import).
// Mock returns the required literal strings so the assertion expectations match.
// fxSyncAlreadyRunning is preserved as a raw literal — no schema counterpart.
await mock.module("@/shared/locale/server-graphql", () => ({
  getServerTranslations: () => ({
    errorsTranslations: {
      insufficientPermissions: "insufficientPermissions",
    },
  }),
}));

// Provider mock — population-driven via beforeEach overrides.
type FetchLatestRatesResult = {
  provider: FxProvider;
  base: CurrencyCode;
  timestamp: Date;
  rates: ReadonlyMap<CurrencyCode, string>;
  rawResponse: unknown;
};

const fetchLatestRatesMock = mock(async (): Promise<FetchLatestRatesResult> => {
  const rates = new Map<CurrencyCode, string>([[CurrencyCode.EUR, "0.920000"]]);
  return {
    provider: FxProvider.OpenExchangeRates,
    base: CurrencyCode.USD,
    timestamp: new Date("2026-07-10T00:00:00.000Z"),
    rates,
    rawResponse: { disclaimer: "test" },
  };
});

const providerInstance = {
  name: FxProvider.OpenExchangeRates,
  fetchLatestRates: fetchLatestRatesMock,
  validateConfig: () => true,
};

await mock.module("@/backend/services/fx/providers/FxRateProviderFactory", () => ({
  getFxRateProvider: mock(async () => providerInstance),
  resetFxRateProvider: () => {},
  fxRateProvider: {
    fetchLatestRates: fetchLatestRatesMock,
    validateConfig: async () => true,
  },
}));

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks are registered first)
// ---------------------------------------------------------------------------

async function importService(): Promise<typeof import("@/backend/services/fx/fx-ingestion.service")> {
  return import("@/backend/services/fx/fx-ingestion.service");
}

function resetMocks(): void {
  createSyncRunMock.mockReset();
  createSyncRunMock.mockResolvedValue(createdSyncRun);
  completeSyncRunMock.mockReset();
  completeSyncRunMock.mockResolvedValue(completedSuccessRun);
  isRecentSuccessMock.mockReset();
  isRecentSuccessMock.mockResolvedValue(false);
  getRunningSyncRunMock.mockReset();
  getRunningSyncRunMock.mockResolvedValue(null);
  updateExchangeRateInTxMock.mockReset();
  updateExchangeRateInTxMock.mockResolvedValue({});
  transactionMock.mockReset();
  transactionMock.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb({}));
  fetchLatestRatesMock.mockReset();
  fetchLatestRatesMock.mockResolvedValue({
    provider: FxProvider.OpenExchangeRates,
    base: CurrencyCode.USD,
    timestamp: new Date("2026-07-10T00:00:00.000Z"),
    rates: new Map<CurrencyCode, string>([[CurrencyCode.EUR, "0.920000"]]),
    rawResponse: { disclaimer: "test" },
  });
  hasPermissionMock.mockReset();
  hasPermissionMock.mockResolvedValue(true);
}

// Type guards for mock call argument inspection (avoids unsafe type assertions)

function isCreateInput(value: unknown): value is { provider: FxProvider; triggerType: FxSyncTrigger } {
  return typeof value === "object" && value !== null && "provider" in value && "triggerType" in value;
}

function isCompleteSuccessPatch(value: unknown): value is { status: FxSyncStatus; pairsWritten: number } {
  return typeof value === "object" && value !== null && "status" in value && "pairsWritten" in value;
}

function isCompleteFailurePatch(value: unknown): value is { status: FxSyncStatus; errorMessage: string } {
  return typeof value === "object" && value !== null && "status" in value && "errorMessage" in value;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetMocks();
});

async function expectRejection(
  input: Parameters<typeof import("@/backend/services/fx/fx-ingestion.service").FxIngestionService.refreshRates>[0],
  expectedMessage: string
): Promise<{ createSyncRunCalls: number; completeSyncRunCalls: number }> {
  const { FxIngestionService } = await importService();
  let thrown: unknown = null;
  try {
    await FxIngestionService.refreshRates(input);
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(Error);
  if (!(thrown instanceof Error)) throw new Error("Expected thrown to be an Error");
  expect(thrown.message).toBe(expectedMessage);
  return {
    createSyncRunCalls: createSyncRunMock.mock.calls.length,
    completeSyncRunCalls: completeSyncRunMock.mock.calls.length,
  };
}

describe("FxIngestionService.refreshRates", () => {
  test("success path: provider rates -> USD-hub expansion -> tx writes -> sync run completed success", async () => {
    const { FxIngestionService } = await importService();

    const result = await FxIngestionService.refreshRates({
      triggeredByUserId: "user-1",
      trigger: FxSyncTrigger.Manual,
      force: true,
      locale: "en",
    });

    expect(result.success).toBe(true);
    expect(result.pairsWritten).toBe(2);
    expect(result.pairsFailed).toBe(0);
    expect(typeof result.syncRunId).toBe("string");

    expect(createSyncRunMock).toHaveBeenCalledTimes(1);
    const createCalls: ReadonlyArray<readonly unknown[]> = createSyncRunMock.mock.calls;
    const createArg = createCalls[0]?.[0];
    if (!isCreateInput(createArg)) throw new Error("Expected createSyncRun call arg");
    expect(createArg.provider).toBe(FxProvider.OpenExchangeRates);
    expect(createArg.triggerType).toBe(FxSyncTrigger.Manual);

    expect(completeSyncRunMock).toHaveBeenCalledTimes(1);
    const completeCalls: ReadonlyArray<readonly unknown[]> = completeSyncRunMock.mock.calls;
    const completeId = typeof completeCalls[0]?.[0] === "string" ? completeCalls[0][0] : "";
    const rawPatch = completeCalls[0]?.[1];
    if (!isCompleteSuccessPatch(rawPatch)) throw new Error("Expected completeSyncRun success patch");
    const completePatch = rawPatch;
    expect(completeId).toBe("sync-run-1");
    expect(completePatch.status).toBe(FxSyncStatus.Success);
    expect(completePatch.pairsWritten).toBe(2);
  });

  test("provider failure -> sync run completed failed -> returns success:false (does NOT throw)", async () => {
    fetchLatestRatesMock.mockReset();
    fetchLatestRatesMock.mockRejectedValue(new Error("provider boom"));

    const { FxIngestionService } = await importService();

    const result = await FxIngestionService.refreshRates({
      triggeredByUserId: "user-1",
      trigger: FxSyncTrigger.Manual,
      force: true,
      locale: "en",
    });

    expect(result.success).toBe(false);
    expect(result.pairsWritten).toBe(0);
    expect(result.errorMessage).toBe("provider boom");

    expect(completeSyncRunMock).toHaveBeenCalledTimes(1);
    const completeCalls: ReadonlyArray<readonly unknown[]> = completeSyncRunMock.mock.calls;
    const completeId = typeof completeCalls[0]?.[0] === "string" ? completeCalls[0][0] : "";
    const rawPatch = completeCalls[0]?.[1];
    if (!isCompleteFailurePatch(rawPatch)) throw new Error("Expected completeSyncRun failure patch");
    const completePatch = rawPatch;
    expect(completeId).toBe("sync-run-1");
    expect(completePatch.status).toBe(FxSyncStatus.Failed);
    expect(completePatch.errorMessage).toBe("provider boom");
  });

  test("concurrent reject: getRunningSyncRun returns a run -> throws fxSyncAlreadyRunning", async () => {
    getRunningSyncRunMock.mockResolvedValue(createdSyncRun);

    const calls = await expectRejection(
      { triggeredByUserId: "user-1", trigger: FxSyncTrigger.Manual, force: true, locale: "en" },
      "fxSyncAlreadyRunning"
    );

    expect(calls.createSyncRunCalls).toBe(0);
    expect(calls.completeSyncRunCalls).toBe(0);
  });

  test("idempotency: isRecentSuccess true and force:false -> skipped result {success:true, pairsWritten:0}", async () => {
    isRecentSuccessMock.mockResolvedValue(true);

    const { FxIngestionService } = await importService();

    const result = await FxIngestionService.refreshRates({
      triggeredByUserId: "user-1",
      trigger: FxSyncTrigger.Manual,
      force: false,
      locale: "en",
    });

    expect(result.success).toBe(true);
    expect(result.pairsWritten).toBe(0);
    expect(result.syncRunId).toBe("");

    expect(createSyncRunMock).toHaveBeenCalledTimes(0);
    expect(completeSyncRunMock).toHaveBeenCalledTimes(0);
  });

  test("manual trigger without permission -> throws insufficientPermissions", async () => {
    hasPermissionMock.mockResolvedValue(false);

    const calls = await expectRejection(
      { triggeredByUserId: "user-1", trigger: FxSyncTrigger.Manual, force: true, locale: "en" },
      "insufficientPermissions"
    );

    expect(calls.createSyncRunCalls).toBe(0);
    expect(calls.completeSyncRunCalls).toBe(0);
  });

  test("cron trigger (triggeredByUserId null) skips permission check", async () => {
    hasPermissionMock.mockResolvedValue(false);

    const { FxIngestionService } = await importService();

    const result = await FxIngestionService.refreshRates({
      triggeredByUserId: null,
      trigger: FxSyncTrigger.Cron,
      force: true,
      locale: "en",
    });

    expect(result.success).toBe(true);
    expect(result.pairsWritten).toBe(2);

    expect(hasPermissionMock).toHaveBeenCalledTimes(0);
  });
});
