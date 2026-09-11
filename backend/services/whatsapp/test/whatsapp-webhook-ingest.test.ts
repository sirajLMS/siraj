import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  WhatsappAccountPurpose,
  WhatsappOnboardingMode,
  WhatsappSyncStatus,
} from "@/backend/enum/whatsapp/whatsapp-account.enum";
import type { WhatsappAccountReturnType } from "@/backend/types";

// ---------------------------------------------------------------------------
// Mocks — must register before SUT import
// ---------------------------------------------------------------------------

const findByPhoneNumberIdMock = mock(async (): Promise<WhatsappAccountReturnType | null> => null);
const whatsappAccountUpdateMock = mock(async (..._args: unknown[]): Promise<boolean> => true);
const createManyAuditLogsMock = mock(async (_logs: unknown[]): Promise<void> => {});

// Durable-ingest collaborators
const claimBatchMock = mock(async (_limit?: number): Promise<unknown[]> => []);
const claimBatchWithBackoffMock = mock(async (): Promise<unknown[]> => []);
const markProcessedMock = mock(async (_id: string): Promise<unknown> => null);
const markFailedMock = mock(async (_id: string): Promise<unknown> => null);
const parkExhaustedMock = mock(async (_max: number): Promise<number> => 0);
const upsertByIdentityMock = mock(async (): Promise<unknown> => null);
const touchLastMessageMock = mock(async (): Promise<unknown> => null);
const upsertByWamidMock = mock(async (): Promise<unknown> => null);
const markRevokedMock = mock(async (): Promise<unknown> => null);
const attachMediaMock = mock(async (): Promise<unknown> => null);
const hasChunkMock = mock(async (): Promise<boolean> => false);
const findByWamidMock = mock(async (): Promise<unknown> => null);
const upsertFromSyncActionMock = mock(async (): Promise<unknown> => null);
const markOffboardedMock = mock(async (): Promise<unknown> => null);
const clearOffboardedMock = mock(async (): Promise<unknown> => null);
const markSyncFailedMock = mock(async (): Promise<unknown> => null);
const findByWabaIdMock = mock(async (): Promise<WhatsappAccountReturnType[]> => []);
const resetWhatsappChannelMock = mock(async (_id?: string): Promise<void> => {});
const handleHistoryDeclinedMock = mock(async (): Promise<boolean> => true);
const recordHistoryProgressMock = mock(async (): Promise<void> => {});
const markContactsSyncCompleteMock = mock(async (): Promise<boolean> => true);

await mock.module("@/backend/db/repo/whatsapp", () => ({
  WhatsappWebhookEventRepository: {
    claimBatch: claimBatchMock,
    claimBatchWithBackoff: claimBatchWithBackoffMock,
    markProcessed: markProcessedMock,
    markFailed: markFailedMock,
    parkExhausted: parkExhaustedMock,
  },
  WhatsappConversationRepository: { upsertByIdentity: upsertByIdentityMock, touchLastMessage: touchLastMessageMock },
  WhatsappMessageRepository: {
    upsertByWamid: upsertByWamidMock,
    markRevoked: markRevokedMock,
    applyEdit: async (): Promise<unknown> => null,
    attachMedia: attachMediaMock,
    hasChunk: hasChunkMock,
    findByWamid: findByWamidMock,
  },
  WhatsappContactRepository: { upsertFromSyncAction: upsertFromSyncActionMock },
  WhatsappAccountRepository: {
    markOffboarded: markOffboardedMock,
    clearOffboarded: clearOffboardedMock,
    markSyncFailed: markSyncFailedMock,
    findByWabaId: findByWabaIdMock,
  },
  WhatsappTestRecipientRepository: {
    listByAccountId: async () => [],
    countByAccountId: async () => 0,
    create: async () => null,
    deleteById: async () => null,
    findById: async () => null,
    findByAccountAndPhone: async () => null,
    recordVerify: async () => null,
  },
}));

await mock.module("@/backend/services/whatsapp/whatsapp-account.service", () => ({
  WhatsappAccountService: {
    systemFindByPhoneNumberId: findByPhoneNumberIdMock,
    systemUpdateAccount: whatsappAccountUpdateMock,
  },
}));

await mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: { createManyAuditLogs: createManyAuditLogsMock },
}));

await mock.module("@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory", () => ({
  resetWhatsappChannel: resetWhatsappChannelMock,
  getWhatsappChannel: async () => {
    throw new Error("not implemented in ingest tests");
  },
  getChannelForPurpose: async () => null,
  validateWhatsappChannelConfig: async () => false,
}));

await mock.module("@/backend/services/whatsapp/whatsapp-coexistence-sync.service", () => ({
  WhatsappCoexistenceSyncService: {
    handleHistoryDeclined: handleHistoryDeclinedMock,
    recordHistoryProgress: recordHistoryProgressMock,
    markContactsSyncComplete: markContactsSyncCompleteMock,
  },
}));

await mock.module("@/backend/lib/logger", () => ({
  logger: { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

async function importHandler() {
  return import("@/backend/services/whatsapp/whatsapp-webhook.handler");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getMockCallArg(mockFn: { mock: { calls: unknown[][] } }, callIndex: number): Record<string, unknown> {
  const arg = mockFn.mock.calls[callIndex]?.[0];
  return isRecord(arg) ? arg : {};
}

/** Second argument (conversation rollup) of the Nth touchLastMessage call. */
function getTouchRollupArg(callIndex: number): Record<string, unknown> {
  const calls: unknown = touchLastMessageMock.mock.calls;
  const call = Array.isArray(calls) ? calls[callIndex] : undefined;
  const rollup = Array.isArray(call) ? call[1] : undefined;
  return isRecord(rollup) ? rollup : {};
}

function makeTestAccount(overrides: Partial<WhatsappAccountReturnType> = {}): WhatsappAccountReturnType {
  return {
    id: "acct-ldev-1",
    wabaId: "waba-123",
    phoneNumberId: "99900001111",
    displayName: null,
    displayPhoneNumber: "+15550002222",
    qualityRating: null,
    portfolioMessagingLimitTier: null,
    throughputLevel: null,
    maxPhoneNumbersPerBusiness: null,
    purpose: WhatsappAccountPurpose.GENERAL,
    onboardingMode: WhatsappOnboardingMode.CLOUD_API,
    syncStatus: WhatsappSyncStatus.NOT_STARTED,
    syncPhase: null,
    syncProgress: 0,
    syncDeadlineAt: null,
    syncFailureReason: null,
    offboardedAt: null,
    isActive: true,
    isTestNumber: false,
    metaStatus: null,
    lastWebhookAt: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

function makeActiveInboxAccount(overrides: Partial<WhatsappAccountReturnType> = {}): WhatsappAccountReturnType {
  return makeTestAccount(overrides);
}

function makeHistoryChunk(phase: number, chunkOrder: number, progress: number, wamids: string[]) {
  return {
    metadata: { phase, chunk_order: chunkOrder, progress },
    threads: [
      {
        id: "15550003333",
        context: { wa_id: "15550003333" },
        messages: wamids.map(id => ({
          id,
          from: "15550003333",
          timestamp: "1720000000",
          type: "text",
          text: { body: "hi" },
        })),
      },
    ],
  };
}

function makeWebhookBody(changes: unknown[]) {
  return { object: "whatsapp_business_account", entry: [{ id: "waba-123", changes }] };
}

function makeInboxValue(extra: Record<string, unknown>) {
  return { metadata: { phone_number_id: "99900001111" }, ...extra };
}

beforeEach(() => {
  findByPhoneNumberIdMock.mockReset();
  findByPhoneNumberIdMock.mockResolvedValue(null);
  whatsappAccountUpdateMock.mockReset();
  whatsappAccountUpdateMock.mockResolvedValue(true);
  createManyAuditLogsMock.mockReset();
  claimBatchMock.mockReset();
  claimBatchMock.mockResolvedValue([]);
  claimBatchWithBackoffMock.mockReset();
  claimBatchWithBackoffMock.mockResolvedValue([]);
  markProcessedMock.mockReset();
  markProcessedMock.mockResolvedValue(null);
  markFailedMock.mockReset();
  markFailedMock.mockResolvedValue(null);
  parkExhaustedMock.mockReset();
  upsertByIdentityMock.mockReset();
  upsertByIdentityMock.mockResolvedValue(null);
  touchLastMessageMock.mockReset();
  upsertByWamidMock.mockReset();
  upsertByWamidMock.mockResolvedValue(null);
  markRevokedMock.mockReset();
  markRevokedMock.mockResolvedValue(null);
  attachMediaMock.mockReset();
  hasChunkMock.mockReset();
  hasChunkMock.mockResolvedValue(false);
  findByWamidMock.mockReset();
  findByWamidMock.mockResolvedValue(null);
  upsertFromSyncActionMock.mockReset();
  markOffboardedMock.mockReset();
  clearOffboardedMock.mockReset();
  markSyncFailedMock.mockReset();
  findByWabaIdMock.mockReset();
  findByWabaIdMock.mockResolvedValue([]);
  resetWhatsappChannelMock.mockReset();
  handleHistoryDeclinedMock.mockReset();
  handleHistoryDeclinedMock.mockResolvedValue(true);
  recordHistoryProgressMock.mockReset();
  recordHistoryProgressMock.mockResolvedValue(undefined);
  markContactsSyncCompleteMock.mockReset();
  markContactsSyncCompleteMock.mockResolvedValue(true);
});

describe("history ingest (burst chunks)", () => {
  test("a history chunk upserts conversations, messages, and sync progress", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockResolvedValueOnce(makeActiveInboxAccount());
    upsertByIdentityMock.mockResolvedValue({ id: "conv-1" });

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([
        {
          field: "history",
          value: makeInboxValue({ history: [makeHistoryChunk(1, 0, 50, ["wamid.hst.a1", "wamid.hst.a2"])] }),
        },
      ])
    );

    expect(upsertByIdentityMock).toHaveBeenCalled();
    expect(upsertByWamidMock).toHaveBeenCalledTimes(2);
    const upsertCall = getMockCallArg(upsertByWamidMock, 0);
    expect(upsertCall.wamid).toBe("wamid.hst.a1");
    expect(upsertCall.direction).toBe("INBOUND");
    expect(upsertCall.phase).toBe(1);
    expect(recordHistoryProgressMock).toHaveBeenCalledWith("acct-ldev-1", 1, 50);
    expect(touchLastMessageMock).toHaveBeenCalled();
  });

  test("identical chunk redelivery is deduped by (accountId, phase, chunk_order)", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockResolvedValueOnce(makeActiveInboxAccount());
    hasChunkMock.mockResolvedValueOnce(true);

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([
        { field: "history", value: makeInboxValue({ history: [makeHistoryChunk(1, 0, 50, ["wamid.dup.x1"])] }) },
      ])
    );

    expect(upsertByWamidMock).not.toHaveBeenCalled();
    expect(recordHistoryProgressMock).toHaveBeenCalled();
  });

  test("2593109 decline routes to the sync decline path with no writes", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockResolvedValueOnce(makeActiveInboxAccount());

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([
        {
          field: "history",
          value: makeInboxValue({
            history: [
              {
                metadata: { phase: 0, chunk_order: 0, progress: 0 },
                threads: [],
                errors: [{ code: 2593109, title: "declined" }],
              },
            ],
          }),
        },
      ])
    );

    expect(handleHistoryDeclinedMock).toHaveBeenCalledWith("acct-ldev-1");
    expect(upsertByWamidMock).not.toHaveBeenCalled();
  });
});

describe("smb_app_state_sync (contacts LWW)", () => {
  test("contact add actions reach the contact repo with the webhook timestamp", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockResolvedValueOnce(makeActiveInboxAccount());

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([
        {
          field: "smb_app_state_sync",
          value: makeInboxValue({
            state_sync: [
              {
                type: "contact",
                action: "add",
                contact: { full_name: "Test Person", phone_number: "15550003333" },
                metadata: { timestamp: "1720000100" },
              },
            ],
          }),
        },
      ])
    );

    expect(upsertFromSyncActionMock).toHaveBeenCalledTimes(1);
    const input = getMockCallArg(upsertFromSyncActionMock, 0);
    expect(input.action).toBe("add");
    expect(input.accountId).toBe("acct-ldev-1");
    expect(markContactsSyncCompleteMock).toHaveBeenCalledWith("acct-ldev-1");
  });
});

describe("smb_message_echoes (revoke-before-original)", () => {
  test("revoke arriving before the original creates a revoked stub row", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockResolvedValueOnce(makeActiveInboxAccount());
    markRevokedMock.mockResolvedValueOnce(null);
    upsertByIdentityMock.mockResolvedValueOnce({ id: "conv-rev" });

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([
        {
          field: "smb_message_echoes",
          value: makeInboxValue({
            message_echoes: [
              {
                id: "wamid.rev.stub",
                type: "revoke",
                revoke: { original_message_id: "wamid.orig.gone" },
                to: "15550003333",
                timestamp: "1720000200",
              },
            ],
          }),
        },
      ])
    );

    expect(markRevokedMock).toHaveBeenCalledWith("wamid.orig.gone", expect.any(Date));
    const stubCall = getMockCallArg(upsertByWamidMock, 0);
    expect(stubCall.wamid).toBe("wamid.orig.gone");
    expect(stubCall.type).toBe("revoke");
    expect(stubCall.revokedAt).toBeInstanceOf(Date);
  });
});

describe("media placeholder → follow-up correlation (7-day webhook media window)", () => {
  test("placeholder row is flipped via attachMedia with the asset identity", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockResolvedValueOnce(makeActiveInboxAccount());
    findByWamidMock.mockResolvedValueOnce({ id: "msg-1", mediaPlaceholder: true });

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([
        {
          field: "history",
          value: makeInboxValue({
            messages: [
              {
                id: "wamid.media.f1",
                from: "15550003333",
                timestamp: "1720000300",
                type: "image",
                image: { id: "asset-1", mime_type: "image/jpeg", sha256: "abc" },
              },
            ],
          }),
        },
      ])
    );

    expect(attachMediaMock).toHaveBeenCalledWith(
      "wamid.media.f1",
      expect.objectContaining({ mediaId: "asset-1", mediaMime: "image/jpeg", mediaSha256: "abc" })
    );
    expect(upsertByWamidMock).not.toHaveBeenCalled();
  });

  test("follow-up arriving before the placeholder persists the real content", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockResolvedValueOnce(makeActiveInboxAccount());
    findByWamidMock.mockResolvedValueOnce(null);
    upsertByIdentityMock.mockResolvedValueOnce({ id: "conv-m2" });

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([
        {
          field: "history",
          value: makeInboxValue({
            messages: [
              {
                id: "wamid.media.e1",
                from: "15550003333",
                timestamp: "1720000300",
                type: "image",
                image: { id: "asset-2" },
              },
            ],
          }),
        },
      ])
    );

    expect(upsertByWamidMock).toHaveBeenCalled();
    const call = getMockCallArg(upsertByWamidMock, 0);
    expect(call.wamid).toBe("wamid.media.e1");
    expect(call.mediaPlaceholder).toBe(false);
    expect(call.mediaId).toBe("asset-2");
  });
});

describe("account_update lifecycle (offboard / reconnect / uninstall)", () => {
  test("ACCOUNT_OFFBOARDED deactivates, fails sync, and evicts the adapter", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    const account = makeActiveInboxAccount({ syncStatus: WhatsappSyncStatus.SYNCING });
    findByWabaIdMock.mockResolvedValueOnce([account]);

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([{ field: "account_update", value: { event: "ACCOUNT_OFFBOARDED", waba_id: "waba-123" } }])
    );

    expect(markOffboardedMock).toHaveBeenCalledWith("acct-ldev-1", expect.any(Date));
    expect(markSyncFailedMock).toHaveBeenCalledWith("acct-ldev-1", "accountOffboarded");
    expect(resetWhatsappChannelMock).toHaveBeenCalledWith("acct-ldev-1");
    expect(createManyAuditLogsMock).toHaveBeenCalled();
  });

  test("ACCOUNT_RECONNECTED reactivates and re-arms the adapter", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByWabaIdMock.mockResolvedValueOnce([makeActiveInboxAccount({ offboardedAt: new Date(), isActive: false })]);

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([{ field: "account_update", value: { event: "ACCOUNT_RECONNECTED", waba_id: "waba-123" } }])
    );

    expect(clearOffboardedMock).toHaveBeenCalledWith("acct-ldev-1");
    expect(resetWhatsappChannelMock).toHaveBeenCalledWith("acct-ldev-1");
    expect(markOffboardedMock).not.toHaveBeenCalled();
  });

  test("PARTNER_REMOVED records disconnection_info.reason and deactivates", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByWabaIdMock.mockResolvedValueOnce([makeActiveInboxAccount()]);

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([
        {
          field: "account_update",
          value: {
            event: "PARTNER_REMOVED",
            waba_id: "waba-123",
            disconnection_info: { reason: "USER_RE_REGISTERED" },
          },
        },
      ])
    );

    expect(whatsappAccountUpdateMock).toHaveBeenCalledWith("acct-ldev-1", expect.objectContaining({ isActive: false }));
    expect(resetWhatsappChannelMock).toHaveBeenCalledWith("acct-ldev-1");
  });

  test("DISABLED_UPDATE writes audit only — no state change", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByWabaIdMock.mockResolvedValueOnce([makeActiveInboxAccount()]);

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([
        {
          field: "account_update",
          value: { event: "DISABLED_UPDATE", waba_id: "waba-123", ban_info: { waba_ban_state: "DISABLE" } },
        },
      ])
    );

    expect(markOffboardedMock).not.toHaveBeenCalled();
    expect(resetWhatsappChannelMock).not.toHaveBeenCalled();
    expect(createManyAuditLogsMock).toHaveBeenCalled();
  });
});

describe("durable worker (processPendingWebhookEvents)", () => {
  test("claims PENDING rows, dispatches, marks PROCESSED; failures stay PENDING", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockResolvedValueOnce(makeActiveInboxAccount());
    claimBatchMock.mockResolvedValueOnce([
      {
        id: "evt-ok-1",
        field: "history",
        payload: { field: "history", wabaId: "waba-123", value: makeInboxValue({ history: [] }) },
        attempts: 1,
      },
      {
        id: "evt-bad-1",
        field: "messages",
        payload: { field: "messages", wabaId: "waba-123", value: "not-a-record" },
        attempts: 1,
      },
    ]);

    const result = await WhatsappWebhookHandler.processPendingWebhookEvents();

    expect(result).toEqual({ claimed: 2, processed: 2, failed: 0 });
    expect(markProcessedMock).toHaveBeenCalledWith("evt-ok-1");
    expect(markFailedMock).toHaveBeenCalledWith("evt-bad-1");
  });

  test("a throwing dispatch keeps the row PENDING (no markProcessed) and counts failed", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockRejectedValueOnce(new Error("db down"));
    claimBatchMock.mockResolvedValueOnce([
      {
        id: "evt-throw-1",
        field: "history",
        payload: { field: "history", wabaId: "waba-123", value: makeInboxValue({ history: [] }) },
        attempts: 2,
      },
    ]);

    const result = await WhatsappWebhookHandler.processPendingWebhookEvents();

    expect(result).toEqual({ claimed: 1, processed: 0, failed: 1 });
    expect(markProcessedMock).not.toHaveBeenCalled();
  });
});

describe("sweeper (sweepPendingWebhookEvents)", () => {
  test("parks exhausted poison rows and reports tallies", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    parkExhaustedMock.mockResolvedValueOnce(2);

    const result = await WhatsappWebhookHandler.sweepPendingWebhookEvents();

    expect(parkExhaustedMock).toHaveBeenCalled();
    expect(claimBatchWithBackoffMock).toHaveBeenCalled();
    expect(result.parked).toBe(2);
    expect(result.claimed).toBe(0);
  });
});

describe("business_capability_update tolerant parsing", () => {
  test("integer max_daily_conversations_per_business (messaging-limits form)", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockResolvedValueOnce(makeActiveInboxAccount({ id: "acct-t1" }));

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([
        {
          field: "business_capability_update",
          value: { phone_number_id: "99900001111", max_daily_conversations_per_business: 250 },
        },
      ])
    );

    expect(whatsappAccountUpdateMock).toHaveBeenCalledWith(
      "acct-t1",
      expect.objectContaining({ portfolioMessagingLimitTier: "TIER_250" })
    );
  });

  test("legacy max_daily_conversation_per_phone (pre-v24.0) is honored", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockResolvedValueOnce(makeActiveInboxAccount({ id: "acct-t2" }));

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([
        {
          field: "business_capability_update",
          value: { phone_number_id: "99900001111", max_daily_conversation_per_phone: "TIER_10K" },
        },
      ])
    );

    expect(whatsappAccountUpdateMock).toHaveBeenCalledWith(
      "acct-t2",
      expect.objectContaining({ portfolioMessagingLimitTier: "TIER_10K" })
    );
  });

  test("absent cap fields leave the row untouched (absence ≠ no cap)", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockResolvedValueOnce(makeActiveInboxAccount({ id: "acct-t3" }));

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([{ field: "business_capability_update", value: { phone_number_id: "99900001111" } }])
    );

    expect(whatsappAccountUpdateMock).toHaveBeenCalledWith(
      "acct-t3",
      expect.objectContaining({ lastWebhookAt: expect.any(Date) })
    );
    const rawArg = whatsappAccountUpdateMock.mock.calls[0]?.[1];
    const arg = isRecord(rawArg) ? rawArg : {};
    expect(arg).not.toHaveProperty("portfolioMessagingLimitTier");
    expect(arg).not.toHaveProperty("maxPhoneNumbersPerBusiness");
  });
});

describe("conversation rollup inbound stamp", () => {
  test("an inbound user message advances lastInboundMessageAt to the message timestamp", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockResolvedValueOnce(makeActiveInboxAccount());
    upsertByIdentityMock.mockResolvedValue({ id: "conv-in" });
    const timestamp = "1700000000";

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([
        {
          field: "messages",
          value: makeInboxValue({
            messages: [
              { id: "wamid.inbound.stamp", from: "966555000111", timestamp, type: "text", text: { body: "hello" } },
            ],
          }),
        },
      ])
    );

    expect(touchLastMessageMock).toHaveBeenCalled();
    const stamp = getTouchRollupArg(0).inboundAt;
    if (!(stamp instanceof Date)) {
      throw new Error("expected touchLastMessage to receive a Date inbound stamp");
    }
    expect(stamp.getTime()).toBe(Number(timestamp) * 1000);
  });

  test("a business-app echo rolls the conversation forward but never marks lastInboundMessageAt", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    findByPhoneNumberIdMock.mockResolvedValueOnce(makeActiveInboxAccount());
    upsertByIdentityMock.mockResolvedValue({ id: "conv-echo" });

    await WhatsappWebhookHandler.processEvent(
      makeWebhookBody([
        {
          field: "smb_message_echoes",
          value: makeInboxValue({
            message_echoes: [
              {
                id: "wamid.echo.stamp",
                from: "966500000001",
                to: "966555000111",
                timestamp: "1700000000",
                type: "text",
                text: { body: "echo body" },
              },
            ],
          }),
        },
      ])
    );

    expect(touchLastMessageMock).toHaveBeenCalled();
    expect(getTouchRollupArg(0).inboundAt).toBeNull();
  });
});
