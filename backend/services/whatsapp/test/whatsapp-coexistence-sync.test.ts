import { beforeEach, describe, expect, mock, test } from "bun:test";
import { WhatsappSyncRequestStatus, WhatsappSyncStatus, WhatsappSyncType } from "@/backend/enum/whatsapp";
import type { WhatsappAccountSelectType, WhatsappSyncRequestReturnType } from "@/backend/types";

// ---------------------------------------------------------------------------
// Mock state (reset per test)
// ---------------------------------------------------------------------------

type FetchCall = { url: string; body: Record<string, unknown> };

const fetchCalls: FetchCall[] = [];
let fetchRespond: () => Response = () =>
  new Response(JSON.stringify({ messaging_product: "whatsapp", request_id: "req_p1_1" }), { status: 200 });
let nextRequestId = 0;

function requestUrlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function parseJsonRecord(raw: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return { ...parsed };
  return {};
}

async function executeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const rawBody = typeof init?.body === "string" ? init.body : "{}";
  fetchCalls.push({ url: requestUrlOf(input), body: parseJsonRecord(rawBody) });
  nextRequestId += 1;
  return fetchRespond();
}

const fetchMock = mock(executeFetch);

// Bun's `fetch` carries a `preconnect` static; stub it so the mock satisfies
// `typeof fetch` without an unsafe cast.
globalThis.fetch = Object.assign(fetchMock, {
  preconnect() {
    // no-op for tests
  },
});

// ---------------------------------------------------------------------------
// Repo mocks (state is rebuilt per test via makeRepoFakes)
// ---------------------------------------------------------------------------

type AccountFakes = {
  findRawById: ReturnType<typeof mock>;
  findById: ReturnType<typeof mock>;
  update: ReturnType<typeof mock>;
  markSyncRequested: ReturnType<typeof mock>;
  markSyncProgress: ReturnType<typeof mock>;
  markSyncComplete: ReturnType<typeof mock>;
  markSyncFailed: ReturnType<typeof mock>;
};

type RequestFakes = {
  ensure: ReturnType<typeof mock>;
  recordRequestId: ReturnType<typeof mock>;
  findByAccountAndType: ReturnType<typeof mock>;
  listByAccount: ReturnType<typeof mock>;
  listPendingAccountIds: ReturnType<typeof mock>;
  updateStatus: ReturnType<typeof mock>;
};

let accountFakes: AccountFakes;
let requestFakes: RequestFakes;

function repoProxy(getFakes: () => Record<string, unknown>): Record<string, unknown> {
  return new Proxy({}, { get: (_t, prop) => (typeof prop === "string" ? getFakes()[prop] : undefined) });
}

void mock.module("@/backend/db/repo/whatsapp/whatsapp-account.repository", () => ({
  WhatsappAccountRepository: repoProxy(() => accountFakes),
}));

void mock.module("@/backend/db/repo/whatsapp/whatsapp-sync-request.repository", () => ({
  WhatsappSyncRequestRepository: repoProxy(() => requestFakes),
}));

void mock.module("@/backend/lib/logger", () => ({
  logger: {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    logDomainError: () => {},
  },
}));

// The real whatsapp-constants module is imported BEFORE its mock is
// registered, so this await resolves to the actual implementation — the mock
// factory below then closes over the already-evaluated namespace instead of
// re-declaring WHATSAPP_CONFIG_ENV_SOURCES by hand. There is no recursion:
// the factory never imports the mocked specifier itself, and the repo/logger
// mocks registered above keep this evaluation off the database.
const actualWhatsappConstants = await import("@/backend/lib/whatsapp-constants");

void mock.module("@/backend/lib/whatsapp-constants", () => ({
  MAX_CONCURRENT_CALLS: 10,
  FETCH_TIMEOUT_MS: 10_000,
  DEFAULT_GRAPH_API_VERSION: "v25.0",
  // The mock replaces the whole module, and the whatsapp services barrel
  // evaluates whatsapp-config.service (which reads this export) — the field↔
  // env-key table is the real shared constant (single source of truth), not
  // a hand-maintained copy.
  WHATSAPP_CONFIG_ENV_SOURCES: actualWhatsappConstants.WHATSAPP_CONFIG_ENV_SOURCES,
  readErrorBody: async (response: Response) => response.json().catch(() => ""),
  resolveGraphApiVersion: async () => "v25.0",
  resolveGraphApiContextFromEnv: async () => ({ accessToken: "tok_test_a", apiVersion: "v25.0" }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACCOUNT_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const PHONE_NUMBER_ID = "pn-test-1";
let NOW = new Date();

function makeAccount(overrides: Partial<WhatsappAccountSelectType> = {}): WhatsappAccountSelectType {
  return {
    id: ACCOUNT_ID,
    wabaId: "waba-test-1",
    phoneNumberId: PHONE_NUMBER_ID,
    displayName: null,
    displayPhoneNumber: null,
    qualityRating: null,
    portfolioMessagingLimitTier: null,
    throughputLevel: null,
    maxPhoneNumbersPerBusiness: null,
    purpose: "GENERAL",
    onboardingMode: "COEXISTENCE",
    syncStatus: WhatsappSyncStatus.NOT_STARTED,
    syncPhase: null,
    syncProgress: 0,
    syncDeadlineAt: null,
    syncFailureReason: null,
    offboardedAt: null,
    encryptedAccessToken: "tok_test_a",
    encryptedTwoStepPin: "sec_test_a",
    isActive: true,
    isTestNumber: false,
    metaStatus: null,
    lastWebhookAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeRow(
  syncType: WhatsappSyncType,
  overrides: Partial<WhatsappSyncRequestReturnType> = {}
): WhatsappSyncRequestReturnType {
  return {
    id: `row-${syncType.toLowerCase()}`,
    accountId: ACCOUNT_ID,
    syncType,
    requestId: null,
    status: WhatsappSyncRequestStatus.PENDING,
    requestedAt: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

/* State store driving the repo fakes; rebuilt by beforeEach. */
let accountRow: WhatsappAccountSelectType | null = null;
let requestRows: Map<WhatsappSyncType, WhatsappSyncRequestReturnType> = new Map();

function buildFakes(): void {
  accountFakes = {
    findRawById: mock(async () => accountRow),
    findById: mock(async () => accountRow),
    update: mock(async (_id: string, input: Partial<WhatsappAccountSelectType>) => {
      if (accountRow) accountRow = { ...accountRow, ...input };
      return accountRow;
    }),
    markSyncRequested: mock(async (_id: string, deadlineAt: Date) => {
      if (accountRow) {
        accountRow = { ...accountRow, syncStatus: WhatsappSyncStatus.REQUESTED, syncDeadlineAt: deadlineAt };
      }
      return accountRow;
    }),
    markSyncProgress: mock(async (_id: string, p: { phase?: number; progress: number }) => {
      if (accountRow) accountRow = { ...accountRow, syncPhase: p.phase ?? null, syncProgress: p.progress };
      return accountRow;
    }),
    markSyncComplete: mock(async () => {
      if (accountRow) accountRow = { ...accountRow, syncStatus: WhatsappSyncStatus.COMPLETE, syncProgress: 100 };
      return accountRow;
    }),
    markSyncFailed: mock(async (_id: string, reason: string) => {
      if (accountRow) accountRow = { ...accountRow, syncStatus: WhatsappSyncStatus.FAILED, syncFailureReason: reason };
      return accountRow;
    }),
  };
}

function buildRequestFakes(recordRequestIdFails = false): void {
  requestFakes = {
    ensure: mock(async (input: { accountId: string; syncType: WhatsappSyncType }) => {
      const existing = requestRows.get(input.syncType);
      if (existing) return { request: existing, created: false };
      const row = makeRow(input.syncType);
      requestRows.set(input.syncType, row);
      return { request: row, created: true };
    }),
    recordRequestId: mock(async (id: string, requestId: string) => {
      if (recordRequestIdFails) return null;
      const row = [...requestRows.values()].find(r => r.id === id) ?? null;
      if (row?.requestId !== null) return null;
      const updated = { ...row, requestId, status: WhatsappSyncRequestStatus.REQUESTED, requestedAt: new Date() };
      requestRows.set(row.syncType, updated);
      return updated;
    }),
    findByAccountAndType: mock(
      async (_accountId: string, syncType: WhatsappSyncType) => requestRows.get(syncType) ?? null
    ),
    listByAccount: mock(async () => [...requestRows.values()]),
    listPendingAccountIds: mock(async () => {
      const hasPending = [...requestRows.values()].some(r => r.status === WhatsappSyncRequestStatus.PENDING);
      return hasPending && accountRow ? [accountRow.id] : [];
    }),
    updateStatus: mock(async (id: string, status: WhatsappSyncRequestStatus) => {
      const row = [...requestRows.values()].find(r => r.id === id) ?? null;
      if (!row) return null;
      const terminal = status === WhatsappSyncRequestStatus.COMPLETE || status === WhatsappSyncRequestStatus.FAILED;
      const updated = { ...row, status, completedAt: terminal ? new Date() : null };
      requestRows.set(row.syncType, updated);
      return updated;
    }),
  };
}

async function importService() {
  return import("@/backend/services/whatsapp/whatsapp-coexistence-sync.service");
}

beforeEach(() => {
  NOW = new Date();
  fetchCalls.length = 0;
  nextRequestId = 0;
  fetchMock.mockClear();
  fetchRespond = () =>
    new Response(JSON.stringify({ messaging_product: "whatsapp", request_id: `req_t${nextRequestId}` }), {
      status: 200,
    });
  accountRow = makeAccount();
  requestRows = new Map();
  buildFakes();
  buildRequestFakes();
});

describe("enqueuePostOnboardingSync", () => {
  test("posts both sync types, records requestIds, stamps deadline, flips account to REQUESTED", async () => {
    const { WhatsappCoexistenceSyncService } = await importService();
    const result = await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(ACCOUNT_ID);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchCalls[0].body.sync_type).toBe("smb_app_state_sync");
    expect(fetchCalls[1].body.sync_type).toBe("history");
    expect(fetchCalls[0].url).toContain(`/${PHONE_NUMBER_ID}/smb_app_data`);
    expect(result.requested).toEqual([WhatsappSyncType.SMB_APP_STATE_SYNC, WhatsappSyncType.HISTORY]);
    expect(result.pending).toEqual([]);

    const stateRow = requestRows.get(WhatsappSyncType.SMB_APP_STATE_SYNC);
    expect(stateRow?.status).toBe(WhatsappSyncRequestStatus.REQUESTED);
    expect(stateRow?.requestId).toMatch(/^req_t/);
    expect(accountRow?.syncStatus).toBe(WhatsappSyncStatus.REQUESTED);
    expect(accountRow?.syncDeadlineAt).not.toBeNull();
    expect(accountFakes.markSyncRequested).toHaveBeenCalledTimes(1);
  });

  test("is one-shot: a second enqueue performs no further Meta POSTs", async () => {
    const { WhatsappCoexistenceSyncService } = await importService();
    await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(ACCOUNT_ID);
    const result = await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(ACCOUNT_ID);

    expect(fetchMock).toHaveBeenCalledTimes(2); // only from the first enqueue
    expect(result.requested).toEqual([]);
    expect(result.alreadyRequested).toEqual([WhatsappSyncType.SMB_APP_STATE_SYNC, WhatsappSyncType.HISTORY]);
  });

  test("concurrent recordRequestId loss (guard returns null) is not counted as newly requested", async () => {
    buildRequestFakes(true);
    const { WhatsappCoexistenceSyncService } = await importService();
    const result = await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(ACCOUNT_ID);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.requested).toEqual([]);
    expect(result.alreadyRequested).toEqual([WhatsappSyncType.SMB_APP_STATE_SYNC, WhatsappSyncType.HISTORY]);
    expect(accountFakes.markSyncRequested).toHaveBeenCalledTimes(1); // alreadyRequested still flips account
  });

  test("transient Meta failure leaves rows PENDING for the sweeper (no requestId recorded)", async () => {
    fetchRespond = () => new Response(JSON.stringify({ error: { message: "boom" } }), { status: 500 });
    const { WhatsappCoexistenceSyncService } = await importService();
    const result = await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(ACCOUNT_ID);

    expect(result.pending).toEqual([WhatsappSyncType.SMB_APP_STATE_SYNC, WhatsappSyncType.HISTORY]);
    expect(result.requested).toEqual([]);
    expect(accountRow?.syncStatus).toBe(WhatsappSyncStatus.NOT_STARTED);
    expect([...requestRows.values()].every(r => r.requestId === null)).toBe(true);
    // Deadline is still stamped so the sweeper can expire the account later.
    expect(accountRow?.syncDeadlineAt).not.toBeNull();
  });

  test("window already closed before any accept: no POST, rows stay PENDING", async () => {
    accountRow = makeAccount({ syncDeadlineAt: new Date(NOW.getTime() - 60_000) });
    requestRows = new Map(); // ensure() will create fresh rows with the old deadline in place
    const { WhatsappCoexistenceSyncService } = await importService();
    const result = await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(ACCOUNT_ID);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.pending).toEqual([WhatsappSyncType.SMB_APP_STATE_SYNC, WhatsappSyncType.HISTORY]);
  });

  test("terminal request rows are never re-POSTed even without a requestId", async () => {
    requestRows = new Map([
      [
        WhatsappSyncType.SMB_APP_STATE_SYNC,
        makeRow(WhatsappSyncType.SMB_APP_STATE_SYNC, { status: WhatsappSyncRequestStatus.COMPLETE }),
      ],
      [WhatsappSyncType.HISTORY, makeRow(WhatsappSyncType.HISTORY, { status: WhatsappSyncRequestStatus.FAILED })],
    ]);
    const { WhatsappCoexistenceSyncService } = await importService();
    const result = await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(ACCOUNT_ID);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.requested).toEqual([]);
    expect(result.pending).toEqual([]);
    expect(result.alreadyRequested).toEqual([]);
  });

  test("skips enqueue when the account is offboarded", async () => {
    accountRow = makeAccount({ offboardedAt: NOW });
    const { WhatsappCoexistenceSyncService } = await importService();
    const result = await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(ACCOUNT_ID);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.requested).toEqual([]);
    expect(requestRows.size).toBe(0);
  });

  test("skips enqueue when credentials are still the placeholder", async () => {
    accountRow = makeAccount({ encryptedAccessToken: "pending" });
    const { WhatsappCoexistenceSyncService } = await importService();
    const result = await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(ACCOUNT_ID);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.requested).toEqual([]);
    expect(requestRows.size).toBe(0);
  });

  test("throws NotFoundError when the account does not exist", async () => {
    accountRow = null;
    const { WhatsappCoexistenceSyncService } = await importService();
    let thrown: unknown = null;
    try {
      await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(ACCOUNT_ID);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Error);
  });

  test("NotFoundError uses the caller-provided translations over the English default", async () => {
    accountRow = null;
    const { WhatsappCoexistenceSyncService } = await importService();
    const { errorsEn } = await import("@/shared/locale/en/errors");
    const callerErrors = { ...errorsEn, whatsappAccountNotFound: () => "wa-missing-marker" };
    let thrown: unknown = null;
    try {
      await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(ACCOUNT_ID, callerErrors);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Error);
    if (!(thrown instanceof Error)) throw new Error("unreachable");
    expect(thrown.message).toBe("wa-missing-marker");
  });
});

describe("sweepExpiredSyncs", () => {
  test("expires accounts past the deadline: rows → FAILED, account → syncDeadlineExpired", async () => {
    accountRow = makeAccount({
      syncStatus: WhatsappSyncStatus.REQUESTED,
      syncDeadlineAt: new Date(NOW.getTime() - 60_000),
    });
    requestRows = new Map([
      [WhatsappSyncType.SMB_APP_STATE_SYNC, makeRow(WhatsappSyncType.SMB_APP_STATE_SYNC)],
      [WhatsappSyncType.HISTORY, makeRow(WhatsappSyncType.HISTORY, { status: WhatsappSyncRequestStatus.REQUESTED })],
    ]);
    const { WhatsappCoexistenceSyncService } = await importService();
    const result = await WhatsappCoexistenceSyncService.sweepExpiredSyncs(NOW);

    expect(result).toEqual({ checkedAccounts: 1, expiredAccounts: 1, retriedAccounts: 0 });
    expect(requestRows.get(WhatsappSyncType.SMB_APP_STATE_SYNC)?.status).toBe(WhatsappSyncRequestStatus.FAILED);
    // REQUESTED row is untouched — only PENDING rows expire.
    expect(requestRows.get(WhatsappSyncType.HISTORY)?.status).toBe(WhatsappSyncRequestStatus.REQUESTED);
    expect(accountRow?.syncStatus).toBe(WhatsappSyncStatus.FAILED);
    expect(accountRow?.syncFailureReason).toBe("syncDeadlineExpired");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("retries outstanding POSTs when the window is still open", async () => {
    accountRow = makeAccount({ syncDeadlineAt: new Date(NOW.getTime() + 60_000) });
    requestRows = new Map([[WhatsappSyncType.SMB_APP_STATE_SYNC, makeRow(WhatsappSyncType.SMB_APP_STATE_SYNC)]]);
    const { WhatsappCoexistenceSyncService } = await importService();
    const result = await WhatsappCoexistenceSyncService.sweepExpiredSyncs(NOW);

    expect(result).toEqual({ checkedAccounts: 1, expiredAccounts: 0, retriedAccounts: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2); // existing state row + new history row
    expect(accountRow?.syncStatus).toBe(WhatsappSyncStatus.REQUESTED);
    expect(accountRow?.syncFailureReason).toBeNull();
  });

  test("skips terminal accounts entirely", async () => {
    accountRow = makeAccount({ syncStatus: WhatsappSyncStatus.FAILED, syncFailureReason: "syncDeadlineExpired" });
    requestRows = new Map([[WhatsappSyncType.HISTORY, makeRow(WhatsappSyncType.HISTORY)]]);
    const { WhatsappCoexistenceSyncService } = await importService();
    const result = await WhatsappCoexistenceSyncService.sweepExpiredSyncs(NOW);

    expect(result).toEqual({ checkedAccounts: 0, expiredAccounts: 0, retriedAccounts: 0 });
    expect(accountFakes.markSyncFailed).toHaveBeenCalledTimes(0);
  });
});

describe("handleHistoryDeclined (Meta error 2593109)", () => {
  test("fails the history row and the account when contacts are already terminal", async () => {
    requestRows = new Map([
      [WhatsappSyncType.HISTORY, makeRow(WhatsappSyncType.HISTORY, { status: WhatsappSyncRequestStatus.REQUESTED })],
      [
        WhatsappSyncType.SMB_APP_STATE_SYNC,
        makeRow(WhatsappSyncType.SMB_APP_STATE_SYNC, { status: WhatsappSyncRequestStatus.COMPLETE }),
      ],
    ]);
    const { WhatsappCoexistenceSyncService } = await importService();
    const handled = await WhatsappCoexistenceSyncService.handleHistoryDeclined(ACCOUNT_ID);

    expect(handled).toBe(true);
    expect(requestRows.get(WhatsappSyncType.HISTORY)?.status).toBe(WhatsappSyncRequestStatus.FAILED);
    expect(accountRow?.syncStatus).toBe(WhatsappSyncStatus.FAILED);
    expect(accountRow?.syncFailureReason).toBe("historyDeclined");
  });

  test("keeps the account alive while contacts are still streaming", async () => {
    requestRows = new Map([
      [WhatsappSyncType.HISTORY, makeRow(WhatsappSyncType.HISTORY, { status: WhatsappSyncRequestStatus.REQUESTED })],
      [
        WhatsappSyncType.SMB_APP_STATE_SYNC,
        makeRow(WhatsappSyncType.SMB_APP_STATE_SYNC, { status: WhatsappSyncRequestStatus.STREAMING }),
      ],
    ]);
    const { WhatsappCoexistenceSyncService } = await importService();
    const handled = await WhatsappCoexistenceSyncService.handleHistoryDeclined(ACCOUNT_ID);

    expect(handled).toBe(true);
    expect(requestRows.get(WhatsappSyncType.HISTORY)?.status).toBe(WhatsappSyncRequestStatus.FAILED);
    expect(accountFakes.markSyncFailed).not.toHaveBeenCalled();
    expect(accountRow?.syncFailureReason).toBeNull();
  });

  test("a completed history row outranks a late decline webhook", async () => {
    requestRows = new Map([
      [WhatsappSyncType.HISTORY, makeRow(WhatsappSyncType.HISTORY, { status: WhatsappSyncRequestStatus.COMPLETE })],
    ]);
    const { WhatsappCoexistenceSyncService } = await importService();
    const handled = await WhatsappCoexistenceSyncService.handleHistoryDeclined(ACCOUNT_ID);

    expect(handled).toBe(true);
    expect(requestRows.get(WhatsappSyncType.HISTORY)?.status).toBe(WhatsappSyncRequestStatus.COMPLETE);
    expect(requestFakes.updateStatus).not.toHaveBeenCalled();
  });

  test("returns false when no history row exists", async () => {
    const { WhatsappCoexistenceSyncService } = await importService();
    const handled = await WhatsappCoexistenceSyncService.handleHistoryDeclined(ACCOUNT_ID);
    expect(handled).toBe(false);
  });
});

describe("recordHistoryProgress", () => {
  test("mid-stream progress flips the row to STREAMING and updates the account", async () => {
    requestRows = new Map([
      [WhatsappSyncType.HISTORY, makeRow(WhatsappSyncType.HISTORY, { status: WhatsappSyncRequestStatus.REQUESTED })],
    ]);
    const { WhatsappCoexistenceSyncService } = await importService();
    await WhatsappCoexistenceSyncService.recordHistoryProgress(ACCOUNT_ID, 1, 42);

    expect(requestRows.get(WhatsappSyncType.HISTORY)?.status).toBe(WhatsappSyncRequestStatus.STREAMING);
    expect(accountRow?.syncPhase).toBe(1);
    expect(accountRow?.syncProgress).toBe(42);
  });

  test("clamps out-of-range progress values into [0, 100]", async () => {
    requestRows = new Map([
      [WhatsappSyncType.HISTORY, makeRow(WhatsappSyncType.HISTORY, { status: WhatsappSyncRequestStatus.REQUESTED })],
    ]);
    const { WhatsappCoexistenceSyncService } = await importService();
    await WhatsappCoexistenceSyncService.recordHistoryProgress(ACCOUNT_ID, 0, -25);

    expect(accountRow?.syncProgress).toBe(0);
    expect(requestRows.get(WhatsappSyncType.HISTORY)?.status).toBe(WhatsappSyncRequestStatus.STREAMING);
  });

  test("progress 100 completes the history row and marks the account complete", async () => {
    requestRows = new Map([
      [WhatsappSyncType.HISTORY, makeRow(WhatsappSyncType.HISTORY, { status: WhatsappSyncRequestStatus.STREAMING })],
    ]);
    accountRow = makeAccount({ syncStatus: WhatsappSyncStatus.SYNCING });
    const { WhatsappCoexistenceSyncService } = await importService();
    await WhatsappCoexistenceSyncService.recordHistoryProgress(ACCOUNT_ID, 2, 100);

    expect(requestRows.get(WhatsappSyncType.HISTORY)?.status).toBe(WhatsappSyncRequestStatus.COMPLETE);
    expect(accountRow?.syncStatus).toBe(WhatsappSyncStatus.COMPLETE);
    expect(accountRow?.syncProgress).toBe(100);
  });

  test("terminal history rows ignore further progress (Meta chunk redelivery)", async () => {
    requestRows = new Map([
      [WhatsappSyncType.HISTORY, makeRow(WhatsappSyncType.HISTORY, { status: WhatsappSyncRequestStatus.COMPLETE })],
    ]);
    const { WhatsappCoexistenceSyncService } = await importService();
    await WhatsappCoexistenceSyncService.recordHistoryProgress(ACCOUNT_ID, 2, 60);

    expect(requestFakes.updateStatus).not.toHaveBeenCalled();
    expect(accountFakes.markSyncProgress).not.toHaveBeenCalled();
  });

  test("no-op when the account has no history row", async () => {
    const { WhatsappCoexistenceSyncService } = await importService();
    await WhatsappCoexistenceSyncService.recordHistoryProgress(ACCOUNT_ID, 0, 10);

    expect(requestFakes.updateStatus).not.toHaveBeenCalled();
    expect(accountFakes.markSyncProgress).not.toHaveBeenCalled();
  });
});

describe("markContactsSyncComplete + getSyncStatus", () => {
  test("contacts completion after a declined history surfaces historyDeclined", async () => {
    requestRows = new Map([
      [WhatsappSyncType.SMB_APP_STATE_SYNC, makeRow(WhatsappSyncType.SMB_APP_STATE_SYNC)],
      [WhatsappSyncType.HISTORY, makeRow(WhatsappSyncType.HISTORY, { status: WhatsappSyncRequestStatus.FAILED })],
    ]);
    accountRow = makeAccount({ syncStatus: WhatsappSyncStatus.SYNCING });
    const { WhatsappCoexistenceSyncService } = await importService();
    const done = await WhatsappCoexistenceSyncService.markContactsSyncComplete(ACCOUNT_ID);

    expect(done).toBe(true);
    expect(requestRows.get(WhatsappSyncType.SMB_APP_STATE_SYNC)?.status).toBe(WhatsappSyncRequestStatus.COMPLETE);
    expect(accountRow?.syncStatus).toBe(WhatsappSyncStatus.FAILED);
    expect(accountRow?.syncFailureReason).toBe("historyDeclined");
  });

  test("returns false without a state row", async () => {
    const { WhatsappCoexistenceSyncService } = await importService();
    const done = await WhatsappCoexistenceSyncService.markContactsSyncComplete(ACCOUNT_ID);
    expect(done).toBe(false);
  });

  test("getSyncStatus returns the account-level overview with per-type rows", async () => {
    requestRows = new Map([
      [
        WhatsappSyncType.HISTORY,
        makeRow(WhatsappSyncType.HISTORY, { status: WhatsappSyncRequestStatus.REQUESTED, requestId: "req_t1" }),
      ],
    ]);
    accountRow = makeAccount({ syncStatus: WhatsappSyncStatus.REQUESTED });
    const { WhatsappCoexistenceSyncService } = await importService();
    const overview = await WhatsappCoexistenceSyncService.getSyncStatus(ACCOUNT_ID);

    expect(overview).not.toBeNull();
    expect(overview?.accountId).toBe(ACCOUNT_ID);
    expect(overview?.syncStatus).toBe(WhatsappSyncStatus.REQUESTED);
    expect(overview?.requests).toHaveLength(1);
    expect(overview?.requests[0]?.requestId).toBe("req_t1");
  });

  test("getSyncStatus returns null for a missing account", async () => {
    accountRow = null;
    const { WhatsappCoexistenceSyncService } = await importService();
    const overview = await WhatsappCoexistenceSyncService.getSyncStatus(ACCOUNT_ID);
    expect(overview).toBeNull();
  });
});
