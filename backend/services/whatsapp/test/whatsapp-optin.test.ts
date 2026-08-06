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

mock.module("@/backend/db/repo/notifications/notification-preferences.repository", () => ({
  NotificationPreferencesRepository: {
    getByUserId: getByUserIdMock,
    batchUpsert: batchUpsertMock,
  },
}));

mock.module("@/backend/db/repo/whatsapp", () => ({
  WhatsappAccountRepository: {
    listActive: listActiveMock,
    findById: findByIdMock,
    findByPhoneNumberId: findByPhoneNumberIdMock,
    findFirstActiveForCredentials: findFirstActiveForCredentialsMock,
    create: createWhatsAppAccountMock,
    update: updateWhatsAppAccountMock,
  },
}));

mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
    getUserContext: getUserContextMock,
  },
}));

mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: {
    createManyAuditLogs: createManyAuditLogsMock,
  },
}));

mock.module("@/backend/lib/logger", () => ({
  logger: {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

mock.module("@/backend/lib/env-config-resolver", () => ({
  resolveEnvConfig: async () => null,
  resolveEnvConfigMany: async (keys: string[]) => {
    const result: Record<string, string | undefined> = {};
    for (const key of keys) result[key] = undefined;
    return result;
  },
  invalidateEnvConfigCache: () => {},
}));

mock.module("@/backend/services/communication/channels/whatsapp", () => ({
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

mock.module("@/backend/services/communication/channels/whatsapp/cloud-api", () => ({
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

const mockErrors: import("@/shared/locale").ErrorsLabels = new Proxy(
  {},
  {
    get: (_target, prop: string) => {
      if (prop === "insufficientPermissions") return "Insufficient permissions";
      if (prop === "invalidInput") return "Invalid input";
      if (prop === "whatsappWabaIdNotConfigured") return "WhatsApp WABA ID not configured";
      if (prop === "whatsappAccountNotFound") return (id: string) => `WhatsApp account not found: ${id}`;
      if (prop === "whatsappAccessTokenNotConfigured") return "WhatsApp access token not configured";
      return String(prop);
    },
  }
) as import("@/shared/locale").ErrorsLabels;

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

describe("REQ-10/BL1: WhatsApp Opt-In", () => {
  describe("isUserWhatsappOptIn", () => {
    test("returns false when no preferences exist (default OFF)", async () => {
      const { WhatsappAccountService } = await importService();
      getByUserIdMock.mockResolvedValueOnce([]);

      const result = await WhatsappAccountService.isUserWhatsappOptIn(MOCK_USER_ID);

      expect(result).toBe(false);
    });

    test("returns true when all WhatsApp prefs are enabled", async () => {
      const { WhatsappAccountService } = await importService();
      getByUserIdMock.mockResolvedValueOnce([
        { channel: NotificationChannel.WHATSAPP, enabled: true, eventType: NotificationEventType.COMPLAINT_RESPONSE },
        {
          channel: NotificationChannel.WHATSAPP,
          enabled: true,
          eventType: NotificationEventType.SUGGESTION_ACKNOWLEDGED,
        },
      ]);

      const result = await WhatsappAccountService.isUserWhatsappOptIn(MOCK_USER_ID);

      expect(result).toBe(true);
    });

    test("returns false when any WhatsApp pref is disabled", async () => {
      const { WhatsappAccountService } = await importService();
      getByUserIdMock.mockResolvedValueOnce([
        { channel: NotificationChannel.WHATSAPP, enabled: true, eventType: NotificationEventType.COMPLAINT_RESPONSE },
        {
          channel: NotificationChannel.WHATSAPP,
          enabled: false,
          eventType: NotificationEventType.SUGGESTION_ACKNOWLEDGED,
        },
      ]);

      const result = await WhatsappAccountService.isUserWhatsappOptIn(MOCK_USER_ID);

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

      await expect(
        WhatsappAccountService.setUserWhatsappOptIn(MOCK_ACTOR_ID, mockErrors, MOCK_USER_ID, true, "graphql")
      ).rejects.toThrow(mockErrors.insufficientPermissions);

      expect(batchUpsertMock).not.toHaveBeenCalled();
    });

    test("enables WhatsApp opt-in — batchUpsert called for all WhatsApp-eligible NotificationEventType values", async () => {
      const { WhatsappAccountService } = await importService();

      await WhatsappAccountService.setUserWhatsappOptIn(MOCK_ACTOR_ID, mockErrors, MOCK_USER_ID, true, "graphql");

      expect(batchUpsertMock).toHaveBeenCalledTimes(1);
      const [userIdArg, inputsArg] = batchUpsertMock.mock.calls[0] as [
        string,
        Array<{ channel: string; enabled: boolean }>,
      ];
      expect(userIdArg).toBe(MOCK_USER_ID);
      expect(Array.isArray(inputsArg)).toBe(true);
      // Only events where WhatsApp is allowlisted AND has a template mapping
      const { EVENT_CHANNEL_ALLOWLIST } = await import("@/backend/services/notification/notification-dispatch.helpers");
      const { NOTIFICATION_TEMPLATE_MAP } = await import(
        "@/backend/services/notification/notification-payloads.builders"
      );
      const expectedCount = (Object.values(NotificationEventType) as NotificationEventType[]).filter(et => {
        const allowed = EVENT_CHANNEL_ALLOWLIST[et];
        return allowed?.includes(NotificationChannel.WHATSAPP) && NOTIFICATION_TEMPLATE_MAP[et] != null;
      }).length;
      expect(inputsArg).toHaveLength(expectedCount);
      for (const input of inputsArg) {
        expect(input.channel).toBe(NotificationChannel.WHATSAPP);
        expect(input.enabled).toBe(true);
      }
    });

    test("disables WhatsApp opt-in — all inputs have enabled=false", async () => {
      const { WhatsappAccountService } = await importService();

      await WhatsappAccountService.setUserWhatsappOptIn(MOCK_ACTOR_ID, mockErrors, MOCK_USER_ID, false, "graphql");

      const inputsArg = batchUpsertMock.mock.calls[0][1] as Array<{ enabled: boolean }>;
      for (const input of inputsArg) {
        expect(input.enabled).toBe(false);
      }
    });

    test("writes audit event with (userId, source)", async () => {
      const { WhatsappAccountService } = await importService();

      await WhatsappAccountService.setUserWhatsappOptIn(MOCK_ACTOR_ID, mockErrors, MOCK_USER_ID, true, "graphql");

      expect(createManyAuditLogsMock).toHaveBeenCalledTimes(1);
      const auditInput = createManyAuditLogsMock.mock.calls[0][0][0] as Record<string, unknown>;
      expect(auditInput.actorType).toBe("USER");
      expect(auditInput.action).toBe("WHATSAPP_OPT_IN");
      expect(auditInput.description).toContain("Enabled");
      expect(auditInput.description).toContain(MOCK_USER_ID);
      expect(auditInput.metadata).toEqual(
        expect.objectContaining({ userId: MOCK_USER_ID, source: "graphql", whatsappEnabled: true })
      );
    });

    test("audit event for disable contains 'Disabled' in description", async () => {
      const { WhatsappAccountService } = await importService();

      await WhatsappAccountService.setUserWhatsappOptIn(MOCK_ACTOR_ID, mockErrors, MOCK_USER_ID, false, "web");

      const auditInput = createManyAuditLogsMock.mock.calls[0][0][0] as Record<string, unknown>;
      expect(auditInput.description).toContain("Disabled");
      expect(auditInput.metadata).toEqual(
        expect.objectContaining({ userId: MOCK_USER_ID, source: "web", whatsappEnabled: false })
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

      expect(batchUpsertMock).toHaveBeenCalledTimes(1);
      const [userIdArg, inputsArg] = batchUpsertMock.mock.calls[0] as [
        string,
        Array<{ channel: string; enabled: boolean }>,
      ];
      expect(userIdArg).toBe(MOCK_USER_ID);
      // Only events where WhatsApp is allowlisted AND has a template mapping
      const { EVENT_CHANNEL_ALLOWLIST } = await import("@/backend/services/notification/notification-dispatch.helpers");
      const { NOTIFICATION_TEMPLATE_MAP } = await import(
        "@/backend/services/notification/notification-payloads.builders"
      );
      const expectedCount = (Object.values(NotificationEventType) as NotificationEventType[]).filter(et => {
        const allowed = EVENT_CHANNEL_ALLOWLIST[et];
        return allowed?.includes(NotificationChannel.WHATSAPP) && NOTIFICATION_TEMPLATE_MAP[et] != null;
      }).length;
      expect(inputsArg).toHaveLength(expectedCount);
      for (const input of inputsArg) {
        expect(input.channel).toBe(NotificationChannel.WHATSAPP);
        expect(input.enabled).toBe(true);
      }
    });

    test("batchUpsert throw propagates error and audit is not written", async () => {
      const { WhatsappAccountService } = await importService();

      const upsertError = new Error("batchUpsert database failure");
      batchUpsertMock.mockRejectedValueOnce(upsertError);

      await expect(
        WhatsappAccountService.setUserWhatsappOptIn(MOCK_ACTOR_ID, mockErrors, MOCK_USER_ID, true, "graphql")
      ).rejects.toThrow("batchUpsert database failure");

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

      await expect(WhatsappAccountService.listAccounts(MOCK_ACTOR_ID, mockErrors)).rejects.toThrow(
        mockErrors.insufficientPermissions
      );

      expect(listActiveMock).not.toHaveBeenCalled();
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

      await expect(
        WhatsappAccountService.getAccount(MOCK_ACTOR_ID, mockErrors, "11111111-1111-1111-1111-111111111111")
      ).rejects.toThrow(mockErrors.insufficientPermissions);

      expect(findByIdMock).not.toHaveBeenCalled();
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

      await expect(WhatsappAccountService.syncFromMeta(MOCK_ACTOR_ID, mockErrors)).rejects.toThrow(
        mockErrors.insufficientPermissions
      );

      // Must short-circuit before reaching repository or Graph API calls
      expect(listActiveMock).not.toHaveBeenCalled();
      expect(findByPhoneNumberIdMock).not.toHaveBeenCalled();
      expect(createWhatsAppAccountMock).not.toHaveBeenCalled();
      expect(createManyAuditLogsMock).not.toHaveBeenCalled();
    });
  });
});
