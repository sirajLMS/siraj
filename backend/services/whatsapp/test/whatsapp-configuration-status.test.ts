import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

// ---------------------------------------------------------------------------
// Mocks — must register before SUT import
// ---------------------------------------------------------------------------

const listActiveMock = mock(async (): Promise<Array<{ id: string }>> => []);
const findFirstActiveForCredentialsMock = mock(async (): Promise<unknown> => null);

const resolveEnvConfigMock = mock(async (_key: string): Promise<string | undefined> => undefined);
const resolveEnvConfigManyMock = mock(async (keys: string[]): Promise<Record<string, string | undefined>> => {
  const result: Record<string, string | undefined> = {};
  for (const key of keys) result[key] = undefined;
  return result;
});

const validateWhatsappChannelConfigMock = mock(async (_accountId: string): Promise<boolean> => false);

void mock.module("@/backend/db/repo/whatsapp", () => ({
  WhatsappAccountRepository: {
    listActive: listActiveMock,
    findFirstActiveForCredentials: findFirstActiveForCredentialsMock,
  },
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
    hasPermission: async () => true,
    getUserContext: async () => ({
      permissions: [] as string[],
      permissionGroups: ["super_admin"],
      isSuperAdmin: true,
    }),
  },
}));

void mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: {
    createManyAuditLogs: async () => {},
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
  resolveEnvConfig: resolveEnvConfigMock,
  resolveEnvConfigMany: resolveEnvConfigManyMock,
  invalidateEnvConfigCache: () => {},
}));

void mock.module("@/backend/services/communication/channels/whatsapp", () => ({
  resetWhatsappChannel: () => {},
  validateWhatsappChannelConfig: validateWhatsappChannelConfigMock,
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

const ENV_BOTH_SET: Record<string, string | undefined> = {
  WHATSAPP_ACCESS_TOKEN: "env-token",
  WHATSAPP_WABA_ID: "waba-123",
};

function relyOnEnv(envValues: Record<string, string | undefined>) {
  resolveEnvConfigMock.mockImplementation(async key => envValues[key]);
  resolveEnvConfigManyMock.mockImplementation(async keys => {
    const result: Record<string, string | undefined> = {};
    for (const key of keys) result[key] = envValues[key];
    return result;
  });
}

beforeEach(() => {
  listActiveMock.mockReset();
  listActiveMock.mockResolvedValue([]);
  findFirstActiveForCredentialsMock.mockReset();
  findFirstActiveForCredentialsMock.mockResolvedValue(null);
  validateWhatsappChannelConfigMock.mockReset();
  validateWhatsappChannelConfigMock.mockResolvedValue(false);
  relyOnEnv({});
});

afterEach(() => {
  mock.restore();
});

describe("WhatsappAccountService.getConfigurationStatus", () => {
  test("no accounts + both env keys set → isConfigured true via env bootstrap", async () => {
    relyOnEnv(ENV_BOTH_SET);

    const { WhatsappAccountService } = await importService();
    const status = await WhatsappAccountService.getConfigurationStatus();

    expect(status.isConfigured).toBe(true);
    expect(status.envBootstrapAvailable).toBe(true);
    expect(status.missingEnvKeys).toEqual([]);
    expect(validateWhatsappChannelConfigMock).not.toHaveBeenCalled();
  });

  test("no accounts + missing one env key → isConfigured false, missingEnvKeys lists it", async () => {
    relyOnEnv({ WHATSAPP_ACCESS_TOKEN: "env-token", WHATSAPP_WABA_ID: undefined });

    const { WhatsappAccountService } = await importService();
    const status = await WhatsappAccountService.getConfigurationStatus();

    expect(status.isConfigured).toBe(false);
    expect(status.envBootstrapAvailable).toBe(false);
    expect(status.missingEnvKeys).toEqual(["WHATSAPP_WABA_ID"]);
  });

  test("valid account + no env keys → isConfigured true, envBootstrapAvailable false, both keys listed", async () => {
    listActiveMock.mockResolvedValue([{ id: "acc-1" }]);
    validateWhatsappChannelConfigMock.mockResolvedValue(true);

    const { WhatsappAccountService } = await importService();
    const status = await WhatsappAccountService.getConfigurationStatus();

    expect(status.isConfigured).toBe(true);
    expect(status.envBootstrapAvailable).toBe(false);
    expect(status.missingEnvKeys).toEqual(["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_WABA_ID"]);
  });

  test("invalid account + no env keys → isConfigured false", async () => {
    listActiveMock.mockResolvedValue([{ id: "acc-1" }]);
    validateWhatsappChannelConfigMock.mockResolvedValue(false);

    const { WhatsappAccountService } = await importService();
    const status = await WhatsappAccountService.getConfigurationStatus();

    expect(status.isConfigured).toBe(false);
    expect(status.envBootstrapAvailable).toBe(false);
  });

  test("isConfigured() is a thin wrapper over getConfigurationStatus()", async () => {
    relyOnEnv(ENV_BOTH_SET);

    const { WhatsappAccountService } = await importService();
    const [status, configured] = await Promise.all([
      WhatsappAccountService.getConfigurationStatus(),
      WhatsappAccountService.isConfigured(),
    ]);

    expect(configured).toBe(status.isConfigured);
  });
});
