import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { NotificationChannel, NotificationEventType } from "@/backend/enum";

// ---------------------------------------------------------------------------
// Mocks — must register before SUT import
// ---------------------------------------------------------------------------

const getByUserIdMock = mock(async (): Promise<unknown[]> => []);
const batchUpsertMock = mock(async (_userId: string, _inputs: Array<unknown>): Promise<void> => {});
const hasPermissionMock = mock(async (): Promise<boolean> => true);
const getUserContextMock = mock(async () => ({
  permissions: [] as string[],
  permissionGroups: ["super_admin"] as string[],
  isSuperAdmin: true,
}));
const createManyAuditLogsMock = mock(async (_logs: Array<unknown>): Promise<void> => {});

const listActiveMock = mock(async (): Promise<Array<unknown>> => []);
const findByIdMock = mock(async (_id: string): Promise<unknown> => null);
const findByPhoneNumberIdMock = mock(async (_phoneNumberId: string): Promise<unknown> => null);
const findFirstActiveForCredentialsMock = mock(async (_tx?: unknown): Promise<unknown> => null);
const TEST_ACCOUNT_ID = "11111111-1111-1111-1111-111111111111";
const createWhatsAppAccountMock = mock(async (_input: unknown): Promise<unknown> => ({ id: TEST_ACCOUNT_ID }));
const updateWhatsAppAccountMock = mock(async (_id: string, _input: unknown): Promise<boolean> => true);

void mock.module("@/backend/db/repo/notifications/notification-preferences.repository", () => ({
  NotificationPreferencesRepository: {
    getByUserId: getByUserIdMock,
    batchUpsert: batchUpsertMock,
  },
}));

void mock.module("@/backend/db/repo/whatsapp", () => ({
  WhatsappAccountRepository: {
    listActive: listActiveMock,
    findById: findByIdMock,
    findByPhoneNumberId: findByPhoneNumberIdMock,
    findFirstActiveForCredentials: findFirstActiveForCredentialsMock,
    create: createWhatsAppAccountMock,
    update: updateWhatsAppAccountMock,
  },
  // Static export surface required by the inbox/ingest helper modules that
  // hang off the whatsapp services barrel.
  WhatsappContactRepository: {
    upsertMany: async () => 0,
    removeMany: async () => 0,
    markComplete: async () => 0,
  },
  WhatsappConversationRepository: {
    upsertFromWebhook: async () => null,
    findById: async () => null,
  },
  WhatsappMessageRepository: {
    upsertFromWebhook: async () => null,
    findByWamid: async () => null,
  },
  WhatsappSyncRequestRepository: {
    ensure: async () => ({ request: null, created: false }),
    recordRequestId: async () => null,
    updateStatus: async () => null,
    findByAccountAndType: async () => null,
    listByAccount: async () => [],
    listPendingAccountIds: async () => [],
  },
  WhatsappWebhookEventRepository: {
    insertBatch: async () => [],
    claimBatch: async () => [],
    markProcessed: async () => null,
    markFailed: async () => null,
  },
}));

void mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
    getUserContext: getUserContextMock,
  },
}));

void mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: {
    createManyAuditLogs: createManyAuditLogsMock,
  },
}));

void mock.module("@/backend/lib/logger", () => ({
  logger: {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

const actualSystem = await import("@/backend/services/system");

await mock.module("@/backend/services/system", () => ({
  ...actualSystem,
  resolveEnvConfig: async () => null,
  resolveEnvConfigMany: async (keys: string[]) => {
    const result: Record<string, string | undefined> = {};
    for (const key of keys) result[key] = undefined;
    return result;
  },
  invalidateEnvConfigCache: () => {},
}));

void mock.module("@/backend/services/communication/channels/whatsapp", () => ({
  resetWhatsappChannel: () => {},
  getWhatsappChannel: async () => ({
    send: async () => ({ success: true }),
    validateConfig: async () => true,
    disconnect: async () => {},
  }),
  whatsappChannel: {
    send: async () => ({ success: true }),
    validateConfig: async () => true,
    disconnect: async () => {},
  },
}));

void mock.module("@/backend/services", () => ({
  buildGetPhoneNumberRequest: () => ({ url: "https://graph.test", init: {} }),
  collectAllPhoneNumbers: async (): Promise<unknown[]> => [],
  collectAllTemplates: async (): Promise<unknown[]> => [],
  GraphApiError: class GraphApiError extends Error {
    constructor(
      public status: number,
      public body: unknown
    ) {
      super(`Graph API error ${status}`);
    }
  },
}));

// ---------------------------------------------------------------------------
// SUT import (deferred)
// ---------------------------------------------------------------------------

async function importService() {
  return import("@/backend/services/whatsapp/whatsapp-account.service");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const MOCK_USER_ID = "aaaa0001-aaaa-aaaa-aaaa-aaaa0001aaaa";
const MOCK_ACTOR_ID = "bbbb0002-bbbb-bbbb-bbbb-bbbb0002bbbb";

import { errorsEn } from "@/shared/locale/en/errors";

const mockErrors = errorsEn;

function resetMocks() {
  getByUserIdMock.mockReset();
  getByUserIdMock.mockResolvedValue([]);
  batchUpsertMock.mockReset();
  batchUpsertMock.mockResolvedValue(undefined);
  hasPermissionMock.mockReset();
  hasPermissionMock.mockResolvedValue(true);
  getUserContextMock.mockReset();
  getUserContextMock.mockResolvedValue({
    permissions: [],
    permissionGroups: ["super_admin"],
    isSuperAdmin: true,
  });
  createManyAuditLogsMock.mockReset();
  createManyAuditLogsMock.mockResolvedValue(undefined);
  listActiveMock.mockReset();
  listActiveMock.mockResolvedValue([]);
  findByIdMock.mockReset();
  findByIdMock.mockResolvedValue(null);
  findByPhoneNumberIdMock.mockReset();
  findByPhoneNumberIdMock.mockResolvedValue(null);
  findFirstActiveForCredentialsMock.mockReset();
  findFirstActiveForCredentialsMock.mockResolvedValue(null);
  createWhatsAppAccountMock.mockReset();
  createWhatsAppAccountMock.mockResolvedValue({ id: TEST_ACCOUNT_ID });
  updateWhatsAppAccountMock.mockReset();
  updateWhatsAppAccountMock.mockResolvedValue(true);
}

beforeEach(() => {
  resetMocks();
});

afterEach(() => {
  mock.restore();
});

async function checkOptInState(
  prefs: Array<{ channel: NotificationChannel; enabled: boolean; eventType: NotificationEventType }>
): Promise<boolean> {
  const { WhatsappAccountService } = await importService();
  getByUserIdMock.mockResolvedValueOnce(prefs);
  return WhatsappAccountService.isUserWhatsappOptIn(MOCK_USER_ID);
}

async function assertOptInBatchUpsert(targetUserId: string) {
  expect(batchUpsertMock).toHaveBeenCalledTimes(1);
  const firstCall = batchUpsertMock.mock.calls[0];
  const userIdArg = firstCall[0];
  const inputsArg = firstCall[1];
  expect(userIdArg).toBe(targetUserId);
  expect(Array.isArray(inputsArg)).toBe(true);

  const { EVENT_CHANNEL_ALLOWLIST } = await import("@/backend/services/notification/notification-dispatch.helpers");
  const { NOTIFICATION_TEMPLATE_MAP } = await import("@/backend/services/notification/notification-payloads.builders");
  const expectedCount = (Object.values(NotificationEventType) as NotificationEventType[]).filter(et => {
    const allowed = EVENT_CHANNEL_ALLOWLIST[et];
    return (!allowed || allowed.includes(NotificationChannel.WHATSAPP)) && NOTIFICATION_TEMPLATE_MAP[et] != null;
  }).length;

  // Anchor for the allowlist-absolute-index bug: no allowlist entry lists
  // WHATSAPP, so a strict `includes` filter would yield zero rows. Opt-in
  // must always write at least one WhatsApp pref row.
  expect(expectedCount).toBeGreaterThan(0);
  expect(inputsArg).toHaveLength(expectedCount);
  if (Array.isArray(inputsArg)) {
    for (const input of inputsArg) {
      expect(input).toEqual(expect.objectContaining({ channel: NotificationChannel.WHATSAPP, enabled: true }));
    }
  }
}

async function assertPermissionDenied(action: () => Promise<unknown>, notCalledMock: { mock: { calls: unknown[] } }) {
  let caughtErr: Error | undefined;
  try {
    await action();
    throw new Error("Expected action to throw");
  } catch (err) {
    if (err instanceof Error) caughtErr = err;
  }
  expect(caughtErr?.message ?? "").toContain(mockErrors.insufficientPermissions);
  expect(notCalledMock.mock.calls).toHaveLength(0);
}

describe("REQ-10/BL1: WhatsApp Opt-In", () => {
  describe("isUserWhatsappOptIn", () => {
    test("returns false when no preferences exist (default OFF)", async () => {
      const { WhatsappAccountService } = await importService();
      getByUserIdMock.mockResolvedValueOnce([]);

      const result = await WhatsappAccountService.isUserWhatsappOptIn(MOCK_USER_ID);

      expect(result).toBe(false);
    });

    test("returns true when all WhatsApp prefs are enabled", async () => {
      const result = await checkOptInState([
        { channel: NotificationChannel.WHATSAPP, enabled: true, eventType: NotificationEventType.COMPLAINT_RESPONSE },
        {
          channel: NotificationChannel.WHATSAPP,
          enabled: true,
          eventType: NotificationEventType.SUGGESTION_ACKNOWLEDGED,
        },
      ]);
      expect(result).toBe(true);
    });

    test("returns false when any WhatsApp pref is disabled", async () => {
      const result = await checkOptInState([
        { channel: NotificationChannel.WHATSAPP, enabled: true, eventType: NotificationEventType.COMPLAINT_RESPONSE },
        {
          channel: NotificationChannel.WHATSAPP,
          enabled: false,
          eventType: NotificationEventType.SUGGESTION_ACKNOWLEDGED,
        },
      ]);
      expect(result).toBe(false);
    });

    test("returns false when prefs exist for other channels but none for WhatsApp (default OFF)", async () => {
      const { WhatsappAccountService } = await importService();
      getByUserIdMock.mockResolvedValueOnce([
        { channel: NotificationChannel.SMS, enabled: true, eventType: NotificationEventType.COMPLAINT_RESPONSE },
      ]);

      const result = await WhatsappAccountService.isUserWhatsappOptIn(MOCK_USER_ID);

      expect(result).toBe(false);
    });
  });

  describe("setUserWhatsappOptIn", () => {
    test("throws when actor is not SUPER_ADMIN", async () => {
      const { WhatsappAccountService } = await importService();
      getUserContextMock.mockResolvedValueOnce({
        permissions: [],
        permissionGroups: ["academy_admin"],
        isSuperAdmin: false,
      });

      let caughtErr: Error | undefined;
      try {
        await WhatsappAccountService.setUserWhatsappOptIn(MOCK_ACTOR_ID, mockErrors, MOCK_USER_ID, true, "graphql");
        throw new Error("Expected setUserWhatsappOptIn to throw");
      } catch (err) {
        if (err instanceof Error) caughtErr = err;
      }
      expect(caughtErr?.message ?? "").toContain(mockErrors.insufficientPermissions);

      expect(batchUpsertMock).not.toHaveBeenCalled();
    });

    test("enables WhatsApp opt-in — batchUpsert called for all WhatsApp-eligible NotificationEventType values", async () => {
      const { WhatsappAccountService } = await importService();
      await WhatsappAccountService.setUserWhatsappOptIn(MOCK_ACTOR_ID, mockErrors, MOCK_USER_ID, true, "graphql");
      await assertOptInBatchUpsert(MOCK_USER_ID);
    });

    test("disables WhatsApp opt-in — emitted disabled prefs actually suppress the opt-in state", async () => {
      const { WhatsappAccountService } = await importService();

      await WhatsappAccountService.setUserWhatsappOptIn(MOCK_ACTOR_ID, mockErrors, MOCK_USER_ID, false, "graphql");

      const inputsArg = Array.isArray(batchUpsertMock.mock.calls[0][1]) ? batchUpsertMock.mock.calls[0][1] : [];
      expect(inputsArg.length).toBeGreaterThan(0);
      for (const input of inputsArg) {
        expect(input).toEqual(expect.objectContaining({ channel: NotificationChannel.WHATSAPP, enabled: false }));
      }

      // Feed exactly the rows the service wrote back to the preferences store:
      // the opt-in surface must now report OFF (dispatch consults the same rows).
      getByUserIdMock.mockResolvedValueOnce(inputsArg);
      expect(await WhatsappAccountService.isUserWhatsappOptIn(MOCK_USER_ID)).toBe(false);
    });

    test("writes audit event with (userId, source)", async () => {
      const { WhatsappAccountService } = await importService();

      await WhatsappAccountService.setUserWhatsappOptIn(MOCK_ACTOR_ID, mockErrors, MOCK_USER_ID, true, "graphql");

      expect(createManyAuditLogsMock).toHaveBeenCalledTimes(1);
      const auditInput = createManyAuditLogsMock.mock.calls[0][0][0];
      expect(auditInput).toEqual(
        expect.objectContaining({
          actorType: "USER",
          action: "WHATSAPP_OPT_IN",
          description: expect.stringContaining("Enabled"),
          metadata: expect.objectContaining({ userId: MOCK_USER_ID, source: "graphql", whatsappEnabled: true }),
        })
      );
      expect(auditInput).toEqual(
        expect.objectContaining({
          description: expect.stringContaining(MOCK_USER_ID),
        })
      );
    });

    test("audit event for disable contains 'Disabled' in description", async () => {
      const { WhatsappAccountService } = await importService();

      await WhatsappAccountService.setUserWhatsappOptIn(MOCK_ACTOR_ID, mockErrors, MOCK_USER_ID, false, "web");

      const auditInput = createManyAuditLogsMock.mock.calls[0][0][0];
      expect(auditInput).toEqual(
        expect.objectContaining({
          description: expect.stringContaining("Disabled"),
          metadata: expect.objectContaining({ userId: MOCK_USER_ID, source: "web", whatsappEnabled: false }),
        })
      );
    });

    test("self-toggle (userId === actorUserId) succeeds without super-admin permission", async () => {
      const { WhatsappAccountService } = await importService();

      // Actor is NOT a super-admin (no super_admin group) but toggles own opt-in
      getUserContextMock.mockResolvedValueOnce({
        permissions: [],
        permissionGroups: ["academy_admin"],
        isSuperAdmin: false,
      });

      // userId === actorUserId → assertSuperAdmin is skipped
      await WhatsappAccountService.setUserWhatsappOptIn(MOCK_USER_ID, mockErrors, MOCK_USER_ID, true, "graphql");
      await assertOptInBatchUpsert(MOCK_USER_ID);
    });

    test("batchUpsert throw propagates error and audit is not written", async () => {
      const { WhatsappAccountService } = await importService();

      const upsertError = new Error("batchUpsert database failure");
      batchUpsertMock.mockRejectedValueOnce(upsertError);

      let caughtErr: Error | undefined;
      try {
        await WhatsappAccountService.setUserWhatsappOptIn(MOCK_ACTOR_ID, mockErrors, MOCK_USER_ID, true, "graphql");
        throw new Error("Expected setUserWhatsappOptIn to throw");
      } catch (err) {
        if (err instanceof Error) caughtErr = err;
      }
      expect(caughtErr?.message).toContain("batchUpsert database failure");

      // batchUpsert was attempted exactly once
      expect(batchUpsertMock).toHaveBeenCalledTimes(1);
      // audit write must NOT have been called because the error propagated before reaching auditChange
      expect(createManyAuditLogsMock).not.toHaveBeenCalled();
    });
  });

  describe("listAccounts permission gating", () => {
    test("rejects when actor lacks WHATSAPP_VIEW permission", async () => {
      const { WhatsappAccountService } = await importService();
      hasPermissionMock.mockResolvedValueOnce(false);
      await assertPermissionDenied(
        () => WhatsappAccountService.listAccounts(MOCK_ACTOR_ID, mockErrors),
        listActiveMock
      );
    });

    test("succeeds when actor has WHATSAPP_VIEW permission", async () => {
      const { WhatsappAccountService } = await importService();
      hasPermissionMock.mockResolvedValueOnce(true);
      listActiveMock.mockResolvedValueOnce([{ id: "11111111-1111-1111-1111-111111111111" }]);

      const result = await WhatsappAccountService.listAccounts(MOCK_ACTOR_ID, mockErrors);

      expect(hasPermissionMock).toHaveBeenCalledTimes(1);
      expect(listActiveMock).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });
  });

  describe("getAccount permission gating", () => {
    test("rejects when actor lacks WHATSAPP_VIEW permission", async () => {
      const { WhatsappAccountService } = await importService();
      hasPermissionMock.mockResolvedValueOnce(false);
      await assertPermissionDenied(
        () => WhatsappAccountService.getAccount(MOCK_ACTOR_ID, mockErrors, "[CARD_REDACTED]-[CARD_REDACTED]"),
        findByIdMock
      );
    });

    test("succeeds when actor has WHATSAPP_VIEW permission", async () => {
      const { WhatsappAccountService } = await importService();
      hasPermissionMock.mockResolvedValueOnce(true);
      findByIdMock.mockResolvedValueOnce({
        id: "11111111-1111-1111-1111-111111111111",
        displayPhoneNumber: "+1234567890",
      });

      const result = await WhatsappAccountService.getAccount(
        MOCK_ACTOR_ID,
        mockErrors,
        "11111111-1111-1111-1111-111111111111"
      );

      expect(hasPermissionMock).toHaveBeenCalledTimes(1);
      expect(findByIdMock).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111", undefined);
      expect(result).toEqual(
        expect.objectContaining({
          id: "11111111-1111-1111-1111-111111111111",
          displayPhoneNumber: "+1234567890",
        })
      );
    });
  });

  describe("syncFromMeta permission gating", () => {
    test("rejects when actor lacks WHATSAPP_CONFIG_MANAGE permission", async () => {
      const { WhatsappAccountService } = await importService();
      hasPermissionMock.mockResolvedValueOnce(false);

      await assertPermissionDenied(
        () => WhatsappAccountService.syncFromMeta(MOCK_ACTOR_ID, mockErrors),
        listActiveMock
      );

      // Must short-circuit before reaching repository or Graph API calls
      expect(findByPhoneNumberIdMock).not.toHaveBeenCalled();
      expect(createWhatsAppAccountMock).not.toHaveBeenCalled();
      expect(createManyAuditLogsMock).not.toHaveBeenCalled();
    });
  });
});
