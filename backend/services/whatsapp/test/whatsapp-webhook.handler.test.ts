import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { WhatsappLimitTier } from "@/backend/enum/whatsapp/whatsapp.enum";
import {
  WhatsappAccountPurpose,
  WhatsappOnboardingMode,
  WhatsappSyncStatus,
} from "@/backend/enum/whatsapp/whatsapp-account.enum";
import type { NotificationDeliverySelectType, WhatsappAccountReturnType } from "@/backend/types";

// ---------------------------------------------------------------------------
// Mocks — must register before SUT import
// ---------------------------------------------------------------------------

const handleDeliveryWebhookMock = mock(async (): Promise<void> => {});
const getDeliveryByProviderMessageIdMock = mock(async (): Promise<NotificationDeliverySelectType | null> => null);
const getDeliveriesByProviderMessageIdsMock = mock(
  async (_ids: string[]): Promise<Map<string, NotificationDeliverySelectType>> => new Map()
);
const findByPhoneNumberIdMock = mock(async (): Promise<WhatsappAccountReturnType | null> => null);
const whatsappAccountUpdateMock = mock(async (): Promise<boolean> => true);
const createManyAuditLogsMock = mock(async (_logs: unknown[]): Promise<void> => {});
const findByPhoneMock = mock(async (): Promise<{ id: string } | null> => null);

// Durable-ingest collaborators (7.x): repo/whatsapp, channel factory, sync service.
const claimBatchMock = mock(async (_limit?: number): Promise<unknown[]> => []);
const claimBatchWithBackoffMock = mock(async (_limit?: number, _base?: number): Promise<unknown[]> => []);
const markProcessedMock = mock(async (_id: string): Promise<null> => null);
const markFailedMock = mock(async (_id: string): Promise<null> => null);
const parkExhaustedMock = mock(async (_max: number): Promise<number> => 0);
const upsertByIdentityMock = mock(async (): Promise<unknown> => null);
const touchLastMessageMock = mock(async () => null);
const upsertByWamidMock = mock(async () => null);
const markRevokedMock = mock(async () => null);
const applyEditMock = mock(async () => null);
const attachMediaMock = mock(async () => null);
const hasChunkMock = mock(async (): Promise<boolean> => false);
const findByWamidMock = mock(async (): Promise<unknown> => null);
const upsertFromSyncActionMock = mock(async () => null);
const markOffboardedMock = mock(async () => null);
const clearOffboardedMock = mock(async () => null);
const markSyncFailedMock = mock(async () => null);
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
  WhatsappConversationRepository: {
    upsertByIdentity: upsertByIdentityMock,
    touchLastMessage: touchLastMessageMock,
  },
  WhatsappMessageRepository: {
    upsertByWamid: upsertByWamidMock,
    markRevoked: markRevokedMock,
    applyEdit: applyEditMock,
    attachMedia: attachMediaMock,
    hasChunk: hasChunkMock,
    findByWamid: findByWamidMock,
  },
  WhatsappContactRepository: {
    upsertFromSyncAction: upsertFromSyncActionMock,
  },
  WhatsappAccountRepository: {
    markOffboarded: markOffboardedMock,
    clearOffboarded: clearOffboardedMock,
    markSyncFailed: markSyncFailedMock,
    findByWabaId: findByWabaIdMock,
  },
}));

await mock.module("@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory", () => ({
  resetWhatsappChannel: resetWhatsappChannelMock,
  getWhatsappChannel: async () => {
    throw new Error("not implemented in webhook tests");
  },
  getChannelForPurpose: async () => null,
  validateWhatsappChannelConfig: async () => false,
  whatsappChannel: {
    send: async () => ({ success: false, sendAttempted: false }),
    validateConfig: async () => false,
    disconnect: async () => {},
  },
}));

await mock.module("@/backend/services/whatsapp/whatsapp-coexistence-sync.service", () => ({
  WhatsappCoexistenceSyncService: {
    handleHistoryDeclined: handleHistoryDeclinedMock,
    recordHistoryProgress: recordHistoryProgressMock,
    markContactsSyncComplete: markContactsSyncCompleteMock,
  },
}));

await mock.module("@/backend/db/repo/notifications/notification.repository", () => ({
  NotificationRepository: {
    handleDeliveryWebhook: handleDeliveryWebhookMock,
    getDeliveryByProviderMessageId: getDeliveryByProviderMessageIdMock,
    getDeliveriesByProviderMessageIds: getDeliveriesByProviderMessageIdsMock,
  },
}));

await mock.module("@/backend/services/whatsapp/whatsapp-account.service", () => ({
  WhatsappAccountService: {
    systemFindByPhoneNumberId: findByPhoneNumberIdMock,
    systemUpdateAccount: whatsappAccountUpdateMock,
  },
}));

await mock.module("@/backend/db/repo/users/user.repository", () => ({
  UserRepository: {
    findByPhone: findByPhoneMock,
  },
}));

await mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: {
    createManyAuditLogs: createManyAuditLogsMock,
  },
}));

await mock.module("@/backend/lib/logger", () => ({
  logger: {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

// ---------------------------------------------------------------------------
// SUT import (deferred)
// ---------------------------------------------------------------------------

async function importHandler() {
  return import("@/backend/services/whatsapp/whatsapp-webhook.handler");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Type guard: checks if a value is a Record<string, unknown>. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Safely extract a mock call argument as a Record. */
function getMockCallArgAt(
  mockFn: { mock: { calls: unknown[] } },
  callIndex: number,
  argIndex: number
): Record<string, unknown> {
  const call = mockFn.mock.calls[callIndex];
  const arg = Array.isArray(call) ? call[argIndex] : undefined;
  return isRecord(arg) ? arg : {};
}

/** Build a NotificationDeliverySelectType mock with all required fields. */
function createDeliveryRow(overrides: Partial<NotificationDeliverySelectType>): NotificationDeliverySelectType {
  return {
    id: "delivery-id",
    userId: "user-id",
    deviceTokenId: null,
    channel: "whatsapp",
    eventType: NotificationEventType.CLASS_REMINDER,
    status: "sent",
    title: null,
    body: null,
    providerMessageId: null,
    failureReason: null,
    webhookPayload: null,
    metadata: null,
    sentAt: null,
    deliveredAt: null,
    openedAt: null,
    failedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Extract the first argument of the Nth call to a mock as a typed record. */
function getMockCallArg(mockFn: { mock: { calls: unknown[][] } }, callIndex: number): Record<string, unknown> {
  const arg = mockFn.mock.calls[callIndex]?.[0];
  return isRecord(arg) ? arg : {};
}

function makeWebhookBody(changes: unknown[]) {
  return {
    object: "whatsapp_business_account",
    entry: [{ id: "waba-123", changes }],
  };
}

function makeStatusChange(statuses: unknown[]) {
  return {
    field: "messages",
    value: { statuses },
  };
}

function makeTemplateChange(event: Record<string, unknown>, field = "message_template_status_update") {
  return {
    field,
    value: event,
  };
}

function makeQualityChange(value: Record<string, unknown>) {
  return {
    field: "phone_number_quality_update",
    value,
  };
}

function makeCapabilityChange(value: Record<string, unknown>) {
  return {
    field: "business_capability_update",
    value,
  };
}

function makeStatusUpdate(wamid: string, status: string, errors?: unknown[]) {
  return { id: wamid, status, timestamp: "1700000000", errors };
}

function makeStatusUpdateWithRecipient(wamid: string, status: string, recipientId: string, errors?: unknown[]) {
  return { id: wamid, status, timestamp: "1700000000", recipient_id: recipientId, errors };
}

/**
 * Configure findByPhoneMock to return a user for recipient_id → userId resolution.
 * Uses `mockResolvedValueOnce` intentionally — each call queues a one-shot
 * resolution that is consumed in FIFO order. Tests that process N status
 * updates must call this N times so each update's findByPhone lookup gets
 * a user. Using `mockResolvedValue` instead would make all future calls
 * resolve to the same user even after the test scope, risking cross-test
 * contamination because the mock is only reset in `beforeEach`.
 */
function mockResolvedUser(userId = "user-resolved-1") {
  findByPhoneMock.mockResolvedValueOnce({ id: userId });
}

/** Factory for a valid WhatsappAccountReturnType with overridable fields. */
function makeTestAccount(overrides: Partial<WhatsappAccountReturnType> = {}): WhatsappAccountReturnType {
  return {
    id: "acct-default",
    wabaId: "waba-default",
    phoneNumberId: "12345678901",
    displayName: null,
    displayPhoneNumber: null,
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
    lastWebhookAt: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Process a single status-update webhook event and assert handleDeliveryWebhook
 * was called with the expected delivery status (and optional failureReason).
 * Extracted to eliminate duplication across status-transition tests.
 */
async function processStatusAndAssert(
  wamid: string,
  rawStatus: string,
  expectedStatus: NotificationDeliveryStatus,
  options?: {
    errors?: unknown[];
    expectedFailureReason?: string | null;
    expectedUserId?: string;
  }
) {
  const { WhatsappWebhookHandler } = await importHandler();
  if (options?.expectedUserId != null) {
    mockResolvedUser(options.expectedUserId);
  } else {
    mockResolvedUser();
  }

  const update =
    options?.errors != null
      ? makeStatusUpdateWithRecipient(wamid, rawStatus, "[PHONE_REDACTED]", options.errors)
      : makeStatusUpdateWithRecipient(wamid, rawStatus, "[PHONE_REDACTED]");

  await WhatsappWebhookHandler.processEvent(makeWebhookBody([makeStatusChange([update])]));

  expect(handleDeliveryWebhookMock).toHaveBeenCalledWith(
    expect.objectContaining({
      providerMessageId: wamid,
      status: expectedStatus,
      channel: NotificationChannel.WHATSAPP,
    })
  );

  const arg = getMockCallArg(handleDeliveryWebhookMock, 0);
  const expectedUserId = options?.expectedUserId ?? "user-resolved-1";
  expect(arg.userId).toBe(expectedUserId);
  if (options?.expectedFailureReason != null) {
    expect(arg.failureReason).toBe(options.expectedFailureReason);
  } else {
    expect(arg.failureReason).toBeNull();
  }
}

/**
 * Process a status-update webhook where handleDeliveryWebhook is expected to
 * reject, then assert processEvent resolves gracefully and
 * getDeliveriesByProviderMessageIdsMock was queried for the wamid.
 * Extracted to eliminate duplication across error-handling tests.
 */
async function processStatusExpectRejection(wamid: string, rawStatus: string, rejectError: string) {
  const { WhatsappWebhookHandler } = await importHandler();
  mockResolvedUser();
  handleDeliveryWebhookMock.mockRejectedValueOnce(new Error(rejectError));

  const maybe = WhatsappWebhookHandler.processEvent(
    makeWebhookBody([makeStatusChange([makeStatusUpdateWithRecipient(wamid, rawStatus, "[PHONE_REDACTED]")])])
  );

  const result = await Promise.resolve(maybe);

  expect(result).toBeUndefined();

  expect(getDeliveriesByProviderMessageIdsMock).toHaveBeenCalledWith([wamid]);
}

/**
 * Extract the first audit-log input object from createManyAuditLogsMock.
 */
function getFirstAuditInput(): Record<string, unknown> {
  const calls = createManyAuditLogsMock.mock.calls;
  const firstArg = calls[0]?.[0];
  const firstLog = Array.isArray(firstArg) ? firstArg[0] : firstArg;
  return isRecord(firstLog) ? firstLog : {};
}

/**
 * Process a template-change webhook event and assert the audit-log entry was
 * created with the expected entityType, metadata fields, and that
 * handleDeliveryWebhook was NOT called.
 * Extracted to eliminate duplication across template-lifecycle tests.
 */
async function processTemplateChangeAndAssertAudit(
  event: Record<string, unknown>,
  field: string,
  expectedMetadata: Record<string, unknown>,
  expectedDescriptionContains?: string[]
) {
  const { WhatsappWebhookHandler } = await importHandler();

  await WhatsappWebhookHandler.processEvent(makeWebhookBody([makeTemplateChange(event, field)]));

  expect(createManyAuditLogsMock).toHaveBeenCalledTimes(1);
  const auditInput = getFirstAuditInput();
  expect(auditInput.entityType).toBe("WHATSAPP_ACCOUNT");

  if (expectedDescriptionContains) {
    for (const fragment of expectedDescriptionContains) {
      expect(auditInput.description).toContain(fragment);
    }
  }

  const metadataRaw = auditInput.metadata ?? {};
  const metadata = isRecord(metadataRaw) ? metadataRaw : {};
  for (const [key, value] of Object.entries(expectedMetadata)) {
    expect(metadata[key]).toBe(value);
  }
  expect(metadata.webhookField).toBe(field);

  expect(handleDeliveryWebhookMock).not.toHaveBeenCalled();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function resetMocks() {
  handleDeliveryWebhookMock.mockReset();
  handleDeliveryWebhookMock.mockResolvedValue(undefined);
  getDeliveryByProviderMessageIdMock.mockReset();
  getDeliveryByProviderMessageIdMock.mockResolvedValue(null);
  getDeliveriesByProviderMessageIdsMock.mockReset();
  // Default: every queried wamid has an existing delivery row (eventType CLASS_REMINDER).
  // Tests exercising the no-delivery-row path override this with an empty/partial map.
  getDeliveriesByProviderMessageIdsMock.mockImplementation(
    async (ids: string[]) => new Map(ids.map(id => [id, createDeliveryRow({ providerMessageId: id })]))
  );
  findByPhoneNumberIdMock.mockReset();
  findByPhoneNumberIdMock.mockResolvedValue(null);
  whatsappAccountUpdateMock.mockReset();
  whatsappAccountUpdateMock.mockResolvedValue(true);
  createManyAuditLogsMock.mockReset();
  createManyAuditLogsMock.mockResolvedValue(undefined);
  findByPhoneMock.mockReset();
  findByPhoneMock.mockResolvedValue(null);
  resetDurableMocks();
}

/** Reset the durable-ingest collaborator mocks to safe defaults. */
function resetDurableMocks() {
  claimBatchMock.mockReset();
  claimBatchMock.mockResolvedValue([]);
  claimBatchWithBackoffMock.mockReset();
  claimBatchWithBackoffMock.mockResolvedValue([]);
  markProcessedMock.mockReset();
  markProcessedMock.mockResolvedValue(null);
  markFailedMock.mockReset();
  markFailedMock.mockResolvedValue(null);
  parkExhaustedMock.mockReset();
  parkExhaustedMock.mockResolvedValue(0);
  upsertByIdentityMock.mockReset();
  upsertByIdentityMock.mockResolvedValue(null);
  touchLastMessageMock.mockReset();
  touchLastMessageMock.mockResolvedValue(null);
  upsertByWamidMock.mockReset();
  upsertByWamidMock.mockResolvedValue(null);
  markRevokedMock.mockReset();
  markRevokedMock.mockResolvedValue(null);
  applyEditMock.mockReset();
  applyEditMock.mockResolvedValue(null);
  attachMediaMock.mockReset();
  attachMediaMock.mockResolvedValue(null);
  hasChunkMock.mockReset();
  hasChunkMock.mockResolvedValue(false);
  findByWamidMock.mockReset();
  findByWamidMock.mockResolvedValue(null);
  upsertFromSyncActionMock.mockReset();
  upsertFromSyncActionMock.mockResolvedValue(null);
  markOffboardedMock.mockReset();
  markOffboardedMock.mockResolvedValue(null);
  clearOffboardedMock.mockReset();
  clearOffboardedMock.mockResolvedValue(null);
  markSyncFailedMock.mockReset();
  markSyncFailedMock.mockResolvedValue(null);
  findByWabaIdMock.mockReset();
  findByWabaIdMock.mockResolvedValue([]);
  resetWhatsappChannelMock.mockReset();
  resetWhatsappChannelMock.mockResolvedValue(undefined);
  handleHistoryDeclinedMock.mockReset();
  handleHistoryDeclinedMock.mockResolvedValue(true);
  recordHistoryProgressMock.mockReset();
  recordHistoryProgressMock.mockResolvedValue(undefined);
  markContactsSyncCompleteMock.mockReset();
  markContactsSyncCompleteMock.mockResolvedValue(true);
}

beforeEach(() => {
  resetMocks();
});

afterEach(() => {
  mock.restore();
});

describe("batchResolveEventTypes lookup-failure retry (mid-point review)", () => {
  /** Claimed durable event wrapping a single status update. */
  function claimedStatusEvent(id: string, wamid: string) {
    return {
      id,
      field: "messages",
      payload: { value: { statuses: [makeStatusUpdateWithRecipient(wamid, "sent", "[PHONE_REDACTED]")] } },
      attempts: 1,
    };
  }

  test("a DB error in the event-type lookup keeps the event claimable (not marked processed)", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    getDeliveriesByProviderMessageIdsMock.mockRejectedValueOnce(new Error("db blip"));
    claimBatchMock.mockResolvedValueOnce([claimedStatusEvent("evt-lookup-fail", "wamid.zk1.a1")]);

    const result = await WhatsappWebhookHandler.processPendingWebhookEvents();

    expect(result).toEqual({ claimed: 1, processed: 0, failed: 1 });
    expect(markProcessedMock).not.toHaveBeenCalled();
  });

  test("the next tick processes the same event once the lookup recovers", async () => {
    const { WhatsappWebhookHandler } = await importHandler();
    mockResolvedUser();
    claimBatchMock.mockResolvedValueOnce([claimedStatusEvent("evt-lookup-ok", "wamid.zk1.a2")]);

    const result = await WhatsappWebhookHandler.processPendingWebhookEvents();

    expect(result).toEqual({ claimed: 1, processed: 1, failed: 0 });
    expect(markProcessedMock).toHaveBeenCalledWith("evt-lookup-ok");
  });
});

describe("WhatsApp Webhook Handler (S3, B3, P3, R6, Q5)", () => {
  describe("processEvent — basic structure", () => {
    test("handles empty entry array gracefully", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      const maybe = WhatsappWebhookHandler.processEvent({ object: "whatsapp_business_account", entry: [] });

      const result = await Promise.resolve(maybe);

      expect(result).toBeUndefined();
    });

    test("handles null/undefined entry gracefully", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      const maybe = WhatsappWebhookHandler.processEvent({});

      const result = await Promise.resolve(maybe);

      expect(result).toBeUndefined();
    });

    test("skips changes with no field or value", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      await WhatsappWebhookHandler.processEvent({
        object: "whatsapp_business_account",
        entry: [{ id: "waba-1", changes: [{ field: undefined, value: undefined }] }],
      });

      expect(handleDeliveryWebhookMock).not.toHaveBeenCalled();
    });

    test("routes unknown field to debug log (no crash)", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      await WhatsappWebhookHandler.processEvent(makeWebhookBody([{ field: "unknown_field", value: { foo: "bar" } }]));

      expect(handleDeliveryWebhookMock).not.toHaveBeenCalled();
    });
  });

  describe("Inbound messages + statuses coexistence (S3 strip removed)", () => {
    test("messages[] alongside statuses is never mutated; statuses still process", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      const body = makeWebhookBody([
        {
          field: "messages",
          value: {
            messages: [{ from: "+123", text: "inbound PII" }],
            statuses: [makeStatusUpdate("wamid.123", "sent")],
          },
        },
      ]);

      await WhatsappWebhookHandler.processEvent(body);

      // Non-mutating: original body still has messages[] (S3 strips via shallow copy, not delete)
      const bodyEntry = isRecord(body) && "entry" in body ? body.entry : undefined;
      const entryArr = Array.isArray(bodyEntry) ? bodyEntry : [];
      const firstEntry = isRecord(entryArr[0]) ? entryArr[0] : {};
      const changesArr = "changes" in firstEntry && Array.isArray(firstEntry.changes) ? firstEntry.changes : [];
      const change = isRecord(changesArr[0]) ? changesArr[0] : {};
      const changeValue = "value" in change && isRecord(change.value) ? change.value : {};
      expect(changeValue.messages).toEqual([{ from: "+123", text: "inbound PII" }]);

      // Statuses are still processed even when messages[] is present
      expect(handleDeliveryWebhookMock).toHaveBeenCalledWith(
        expect.objectContaining({ providerMessageId: "wamid.123" })
      );
    });
  });

  describe("R1/R2: Status transitions", () => {
    test("maps status 'sent' → SENT and calls handleDeliveryWebhook", async () => {
      await processStatusAndAssert("wamid.sent.1", "sent", NotificationDeliveryStatus.SENT);
    });

    test("maps 'delivered' → DELIVERED", async () => {
      await processStatusAndAssert("wamid.del.1", "delivered", NotificationDeliveryStatus.DELIVERED);
    });

    test("maps 'read' → OPENED", async () => {
      await processStatusAndAssert("wamid.read.1", "read", NotificationDeliveryStatus.OPENED);
    });

    test("maps 'failed' → FAILED with failureReason from errors[0].message", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      mockResolvedUser();

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([
          makeStatusChange([
            makeStatusUpdateWithRecipient("wamid.fail.1", "failed", "1234567890", [
              { code: "131047", message: "Receptor issue" },
            ]),
          ]),
        ])
      );

      expect(handleDeliveryWebhookMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: NotificationDeliveryStatus.FAILED,
          failureReason: "Receptor issue",
        })
      );
      const failArg = getMockCallArg(handleDeliveryWebhookMock, 0);
      expect(failArg.userId).toBe("user-resolved-1");
      expect(failArg.failureReason).toBe("Receptor issue");
    });

    test("unknown status is ignored (no handleDeliveryWebhook call)", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdate("wamid.unk.1", "unknown_status")])])
      );

      expect(handleDeliveryWebhookMock).not.toHaveBeenCalled();
    });

    test("maps 'accepted' → PENDING", async () => {
      await processStatusAndAssert("wamid.acc.1", "accepted", NotificationDeliveryStatus.PENDING);
    });
  });

  describe("resolveRecipientUserId — recipient_id → userId lookup (r6-tq-02)", () => {
    test("resolves userId via UserRepository.findByPhone when recipient_id is present", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      findByPhoneMock.mockResolvedValueOnce({ id: "user-abc-123" });

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdateWithRecipient("wamid.recip.1", "delivered", "1234567890")])])
      );

      expect(findByPhoneMock).toHaveBeenCalledWith("1234567890");
      expect(handleDeliveryWebhookMock).toHaveBeenCalledWith(
        expect.objectContaining({
          providerMessageId: "wamid.recip.1",
          status: NotificationDeliveryStatus.DELIVERED,
          channel: NotificationChannel.WHATSAPP,
          userId: "user-abc-123",
        })
      );
    });

    test("handles handleDeliveryWebhook with undefined userId when findByPhone returns null", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdateWithRecipient("wamid.recip.2", "sent", "9999999999")])])
      );

      expect(findByPhoneMock).toHaveBeenCalledWith("9999999999");
      // H1 fix: handleDeliveryWebhook IS called even without userId —
      // the UPDATE path (existing row by providerMessageId) doesn't need userId.
      // Only the INSERT path uses userId; repo handles undefined by skipping INSERT.
      expect(handleDeliveryWebhookMock).toHaveBeenCalledWith(
        expect.objectContaining({
          providerMessageId: "wamid.recip.2",
          userId: undefined,
        })
      );
    });

    test("handles handleDeliveryWebhook with undefined userId when recipient_id is absent", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdate("wamid.norecip.1", "sent")])])
      );

      // No recipient_id → no findByPhone call
      expect(findByPhoneMock).not.toHaveBeenCalled();
      // H1 fix: still calls handleDeliveryWebhook — UPDATE path works without userId
      expect(handleDeliveryWebhookMock).toHaveBeenCalledWith(
        expect.objectContaining({
          providerMessageId: "wamid.norecip.1",
          userId: undefined,
        })
      );
    });

    test("gracefully handles findByPhone rejection (logs warning, still calls handleDeliveryWebhook with undefined userId)", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      findByPhoneMock.mockRejectedValueOnce(new Error("DB timeout"));

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdateWithRecipient("wamid.recip.3", "sent", "1111111111")])])
      );

      // H1 fix: error in findByPhone doesn't block the UPDATE path
      expect(handleDeliveryWebhookMock).toHaveBeenCalledWith(
        expect.objectContaining({
          providerMessageId: "wamid.recip.3",
          userId: undefined,
        })
      );
    });
  });

  describe("isValidWamid — format validation (r6-tq-03)", () => {
    test("wamid shorter than 8 chars is skipped (no handleDeliveryWebhook)", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdate("short", "sent")])])
      );

      expect(handleDeliveryWebhookMock).not.toHaveBeenCalled();
    });

    test("wamid longer than 128 chars is skipped (no handleDeliveryWebhook)", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      const longWamid = "wamid." + "a".repeat(130);

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdate(longWamid, "sent")])])
      );

      expect(handleDeliveryWebhookMock).not.toHaveBeenCalled();
    });

    test("wamid containing spaces is skipped (no handleDeliveryWebhook)", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdate("wamid has spaces", "sent")])])
      );

      expect(handleDeliveryWebhookMock).not.toHaveBeenCalled();
    });

    test("wamid with invalid characters (!) is skipped (no handleDeliveryWebhook)", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdate("wamid!invalid", "sent")])])
      );

      expect(handleDeliveryWebhookMock).not.toHaveBeenCalled();
    });
  });

  describe("isValidRecipientId — recipient_id validation (r6-tq-04)", () => {
    test("recipient_id with alphabet chars is skipped (no handleDeliveryWebhook)", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdateWithRecipient("wamid.rid-alpha", "sent", "abc12345")])])
      );

      expect(handleDeliveryWebhookMock).not.toHaveBeenCalled();
    });

    test("recipient_id longer than 32 chars is skipped (no handleDeliveryWebhook)", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      const longRecipientId = "1".repeat(33);

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdateWithRecipient("wamid.rid-long", "sent", longRecipientId)])])
      );

      expect(handleDeliveryWebhookMock).not.toHaveBeenCalled();
    });

    // r10-054: Positive test — valid recipient_id passes through to handleDeliveryWebhook
    test("valid recipient_id passes through and handleDeliveryWebhook is called", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      mockResolvedUser();

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdateWithRecipient("wamid.rid-ok", "sent", "1234567890")])])
      );

      expect(handleDeliveryWebhookMock).toHaveBeenCalledTimes(1);
      expect(handleDeliveryWebhookMock).toHaveBeenCalledWith(
        expect.objectContaining({
          providerMessageId: "wamid.rid-ok",
        })
      );
    });
  });

  describe("P3: Idempotency by wamid", () => {
    test("handler re-invokes handleDeliveryWebhook on duplicate wamid callbacks (upsert dedup is in repo)", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      mockResolvedUser();
      mockResolvedUser();

      // First callback
      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdateWithRecipient("wamid.dup.1", "sent", "1234567890")])])
      );
      // Duplicate
      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdateWithRecipient("wamid.dup.1", "sent", "1234567890")])])
      );

      expect(handleDeliveryWebhookMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("P3: Webhook before adapter row insert", () => {
    test("handleDeliveryWebhook error is caught at processChange level (does not crash processEvent)", async () => {
      await processStatusExpectRejection("wamid.early.1", "sent", "connection failed");
    });
  });

  describe("B3: Forward-only transitions (enforced in repository)", () => {
    test("successful handleDeliveryWebhook call does not invoke resurrection path", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      mockResolvedUser();

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeStatusChange([makeStatusUpdateWithRecipient("wamid.b3.1", "delivered", "1234567890")])])
      );

      // B3 forward-only logic is now in handleDeliveryWebhook itself
      expect(handleDeliveryWebhookMock).toHaveBeenCalledWith(
        expect.objectContaining({
          providerMessageId: "wamid.b3.1",
          status: NotificationDeliveryStatus.DELIVERED,
        })
      );
      // resolveEventTypeForWamid queries the delivery repo to resolve the event type
      expect(getDeliveriesByProviderMessageIdsMock).toHaveBeenCalledWith(["wamid.b3.1"]);
    });

    test("genuine DB error from handleDeliveryWebhook is re-thrown and caught at processChange", async () => {
      await processStatusExpectRejection("wamid.b3.2", "sent", "DB connection lost");
    });
  });

  describe("Batched events (multiple entry/changes)", () => {
    test("processes all statuses across multiple entries and changes", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      mockResolvedUser();
      mockResolvedUser();
      mockResolvedUser();

      await WhatsappWebhookHandler.processEvent({
        object: "whatsapp_business_account",
        entry: [
          {
            id: "waba-1",
            changes: [
              makeStatusChange([makeStatusUpdateWithRecipient("wamid.batch.1", "sent", "1234567890")]),
              makeStatusChange([makeStatusUpdateWithRecipient("wamid.batch.2", "delivered", "1234567890")]),
            ],
          },
          {
            id: "waba-2",
            changes: [makeStatusChange([makeStatusUpdateWithRecipient("wamid.batch.3", "read", "1234567890")])],
          },
        ],
      });

      expect(handleDeliveryWebhookMock).toHaveBeenCalledTimes(3);
    });
  });

  describe("R6: Template lifecycle events → audit log only", () => {
    test("creates audit entry with template fields", async () => {
      await processTemplateChangeAndAssertAudit(
        {
          message_template_id: "tmpl-123",
          message_template_name: "welcome_template",
          message_template_language: "en_US",
          event: "APPROVED",
          reason: null,
        },
        "message_template_status_update",
        { templateId: "tmpl-123" },
        ["welcome_template", "APPROVED"]
      );
    });

    test("skips audit when no message_template_id", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      await WhatsappWebhookHandler.processEvent(makeWebhookBody([makeTemplateChange({ event: "REJECTED" })]));

      expect(createManyAuditLogsMock).not.toHaveBeenCalled();
      // r10-060: Template lifecycle events should NOT trigger delivery webhook
      expect(handleDeliveryWebhookMock).not.toHaveBeenCalled();
    });

    test("template_category_update creates audit entry with category field", async () => {
      await processTemplateChangeAndAssertAudit(
        {
          message_template_id: "tmpl-cat-1",
          message_template_name: "order_confirm",
          message_template_language: "en_US",
          event: "CATEGORY_UPDATE",
          category: "MARKETING",
        },
        "template_category_update",
        { templateId: "tmpl-cat-1", category: "MARKETING" },
        ["order_confirm"]
      );
    });

    test("message_template_quality_update creates audit entry", async () => {
      await processTemplateChangeAndAssertAudit(
        {
          message_template_id: "tmpl-qual-1",
          message_template_name: "shipping_update",
          message_template_language: "en_US",
          event: "QUALITY_UPDATE",
          reason: "quality rating dropped",
        },
        "message_template_quality_update",
        { templateId: "tmpl-qual-1", reason: "quality rating dropped" }
      );
    });

    test("message_template_components_update creates audit entry", async () => {
      await processTemplateChangeAndAssertAudit(
        {
          message_template_id: "tmpl-comp-1",
          message_template_name: "appointment_reminder",
          message_template_language: "en_US",
          event: "COMPONENTS_UPDATE",
        },
        "message_template_components_update",
        { templateId: "tmpl-comp-1" }
      );
    });
  });

  describe("Q5: phone_number_quality_update → account fields", () => {
    test("updates account with portfolioMessagingLimitTier and qualityRating verbatim", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      const mockAccount = makeTestAccount({
        id: "acct-1",
        wabaId: "waba-123",
        phoneNumberId: "12345678901",
      });
      findByPhoneNumberIdMock.mockResolvedValueOnce(mockAccount);

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([
          makeQualityChange({
            phone_number_id: "12345678901",
            max_daily_conversations_per_business: "TIER_1K",
            quality_rating: "GREEN",
          }),
        ])
      );

      expect(findByPhoneNumberIdMock).toHaveBeenCalledWith("12345678901");
      expect(whatsappAccountUpdateMock).toHaveBeenCalledWith(
        "acct-1",
        expect.objectContaining({
          portfolioMessagingLimitTier: WhatsappLimitTier.TIER_1K,
          qualityRating: "GREEN",
          lastWebhookAt: expect.any(Date),
        })
      );
      // r10-027: Assert untouched fields are NOT in the update payload (preserved in DB)
      const updateCallArg = getMockCallArgAt(whatsappAccountUpdateMock, 0, 1);
      expect(updateCallArg).not.toHaveProperty("displayName");
      expect(updateCallArg).not.toHaveProperty("isActive");
      expect(updateCallArg).not.toHaveProperty("throughputLevel");
    });

    test("skips update when account not found", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      findByPhoneNumberIdMock.mockResolvedValueOnce(null);

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeQualityChange({ phone_number_id: "99999999999" })])
      );

      expect(whatsappAccountUpdateMock).not.toHaveBeenCalled();
    });

    test("skips update when phone_number_id is missing", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      await WhatsappWebhookHandler.processEvent(makeWebhookBody([makeQualityChange({})]));

      expect(findByPhoneNumberIdMock).not.toHaveBeenCalled();
    });
  });

  describe("Q5: business_capability_update → account fields + audit", () => {
    test("updates account with throughputLevel, portfolioMessagingLimitTier, and maxPhoneNumbersPerBusiness verbatim", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      const mockAccount = makeTestAccount({
        id: "acct-2",
        wabaId: "waba-123",
        phoneNumberId: "12345678902",
      });
      findByPhoneNumberIdMock.mockResolvedValueOnce(mockAccount);

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([
          makeCapabilityChange({
            phone_number_id: "12345678902",
            throughput_level: "HIGH",
            max_daily_conversations_per_business: "TIER_100K",
            max_phone_numbers_per_business: "25",
          }),
        ])
      );

      expect(whatsappAccountUpdateMock).toHaveBeenCalledWith(
        "acct-2",
        expect.objectContaining({
          throughputLevel: "HIGH",
          // max_daily_conversations_per_business is stored verbatim (not enum-validated)
          portfolioMessagingLimitTier: WhatsappLimitTier.TIER_100K,
          maxPhoneNumbersPerBusiness: "25",
        })
      );
      // r10-027: Assert untouched fields are NOT in the update payload (preserved in DB)
      const capUpdateArg = getMockCallArgAt(whatsappAccountUpdateMock, 0, 1);
      expect(capUpdateArg).not.toHaveProperty("displayName");
      expect(capUpdateArg).not.toHaveProperty("isActive");
      expect(capUpdateArg).not.toHaveProperty("qualityRating");
      expect(createManyAuditLogsMock).toHaveBeenCalledTimes(1);
      const auditInput = getFirstAuditInput();
      expect(auditInput.description).toBe("business_capability_update");
      expect(auditInput.changes).toEqual(
        expect.objectContaining({
          throughputLevel: "HIGH",
          portfolioMessagingLimitTier: WhatsappLimitTier.TIER_100K,
          maxPhoneNumbersPerBusiness: "25",
        })
      );
    });

    test("defaults maxPhoneNumbersPerBusiness to null in audit when absent from payload", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      const mockAccount = makeTestAccount({
        id: "acct-3",
        wabaId: "waba-123",
        phoneNumberId: "12345678903",
      });
      findByPhoneNumberIdMock.mockResolvedValueOnce(mockAccount);

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([
          makeCapabilityChange({
            phone_number_id: "12345678903",
            throughput_level: "STANDARD",
            max_daily_conversations_per_business: "TIER_1K",
          }),
        ])
      );

      // maxPhoneNumbersPerBusiness should NOT be in the update object when absent
      expect(whatsappAccountUpdateMock).toHaveBeenCalledWith(
        "acct-3",
        expect.not.objectContaining({ maxPhoneNumbersPerBusiness: expect.anything() })
      );
      // But the audit changes should include null for the missing field
      const auditInput = getFirstAuditInput();
      expect(auditInput.changes).toEqual(expect.objectContaining({ maxPhoneNumbersPerBusiness: null }));
    });

    test("skips when account not found", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      findByPhoneNumberIdMock.mockResolvedValueOnce(null);

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([makeCapabilityChange({ phone_number_id: "missing" })])
      );

      expect(whatsappAccountUpdateMock).not.toHaveBeenCalled();
    });
  });

  // r10-055: Tests for body.object mismatch and non-array changes
  describe("Body validation edge cases (r10-055)", () => {
    test("handler processes body with object !== 'whatsapp_business_account' (object check is in route.ts, not handler)", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      mockResolvedUser();

      // Handler does not filter by body.object — that check is in the route layer
      await WhatsappWebhookHandler.processEvent({
        object: "page",
        entry: [
          {
            id: "waba-1",
            changes: [makeStatusChange([makeStatusUpdateWithRecipient("wamid.obj.1", "sent", "1234567890")])],
          },
        ],
      });

      // Handler still processes entries regardless of object value
      expect(handleDeliveryWebhookMock).toHaveBeenCalledTimes(1);
    });

    test("handler handles non-array changes gracefully (no crash, no handleDeliveryWebhook)", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      await WhatsappWebhookHandler.processEvent({
        object: "whatsapp_business_account",
        entry: [{ id: "waba-1", changes: ["not-an-array"] as unknown[] }],
      });

      expect(handleDeliveryWebhookMock).not.toHaveBeenCalled();
    });

    test("handler handles missing changes field gracefully", async () => {
      const { WhatsappWebhookHandler } = await importHandler();

      await WhatsappWebhookHandler.processEvent({
        object: "whatsapp_business_account",
        entry: [{ id: "waba-1" }],
      });

      expect(handleDeliveryWebhookMock).not.toHaveBeenCalled();
    });
  });

  // Pure-inbound statuses (no delivery row) are skipped — the handler must NOT
  // fabricate a CLASS_REMINDER analytics event for wamids we never sent.
  describe("batchResolveEventTypes no-delivery-row skip", () => {
    test("statuses without a delivery row are skipped; rows with deliveries still update", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      mockResolvedUser();

      const deliveryMap = new Map<string, NotificationDeliverySelectType>();
      deliveryMap.set(
        "wamid-kn0wn-1",
        createDeliveryRow({ id: "delivery-1", eventType: NotificationEventType.COMPLAINT_RESPONSE })
      );
      getDeliveriesByProviderMessageIdsMock.mockResolvedValueOnce(deliveryMap);

      await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([
          makeStatusChange([
            makeStatusUpdateWithRecipient("wamid-kn0wn-1", "delivered", "[PHONE_REDACTED]"),
            makeStatusUpdateWithRecipient("wamid-pure-1", "delivered", "[PHONE_REDACTED]"),
          ]),
        ])
      );

      expect(handleDeliveryWebhookMock).toHaveBeenCalledTimes(1);
      const firstCall = getMockCallArgAt(handleDeliveryWebhookMock, 0, 0);
      expect(firstCall.providerMessageId).toBe("wamid-kn0wn-1");
      expect(firstCall.eventType).toBe(NotificationEventType.COMPLAINT_RESPONSE);
    });
  });

  describe("Promise.allSettled partial-failure (r10-008)", () => {
    test("one handleDeliveryWebhook rejection does not prevent other statuses from processing", async () => {
      const { WhatsappWebhookHandler } = await importHandler();
      mockResolvedUser();
      mockResolvedUser();
      mockResolvedUser();

      // First status succeeds, second rejects, third succeeds
      handleDeliveryWebhookMock
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("DB connection lost"))
        .mockResolvedValueOnce(undefined);

      // Should not throw — allSettled catches rejections at processChange level
      const result = await WhatsappWebhookHandler.processEvent(
        makeWebhookBody([
          makeStatusChange([
            makeStatusUpdateWithRecipient("wamid.partial.1", "sent", "[PHONE_REDACTED]"),
            makeStatusUpdateWithRecipient("wamid.partial.2", "delivered", "[PHONE_REDACTED]"),
            makeStatusUpdateWithRecipient("wamid.partial.3", "read", "[PHONE_REDACTED]"),
          ]),
        ])
      );

      expect(result).toBeUndefined();

      // All 3 statuses were attempted (allSettled processes all, one failure doesn't block others)
      expect(handleDeliveryWebhookMock).toHaveBeenCalledTimes(3);
    });
  });
});
