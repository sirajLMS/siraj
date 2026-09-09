import { beforeEach, describe, expect, mock, test } from "bun:test";

// ---------------------------------------------------------------------------
// Mock state (reset per test)
// ---------------------------------------------------------------------------

const hasPermissionMock = mock(async (): Promise<boolean> => true);
const findByPhoneNumberIdMock = mock(async (_phoneNumberId: string): Promise<unknown> => null);
const createAccountMock = mock(
  async (input: Record<string, unknown>): Promise<unknown> => ({
    id: "acc_es_1",
    ...input,
  })
);
const enqueueSyncMock = mock(
  async (_accountId: string): Promise<unknown> => ({
    accountId: "acc_es_1",
    requested: [],
    alreadyRequested: [],
    pending: [],
  })
);

/** Mutable env-config values resolved per test. */
const envValues = new Map<string, string | undefined>();

/** Controllable Meta responses, keyed by endpoint kind. */
type MetaResponses = {
  tokenStatus: number;
  tokenBody: unknown;
  phoneListStatus: number;
  phoneListBody: unknown;
  platformStatus: number;
  platformBody: unknown;
  subscribeStatus: number;
  subscribeBody: unknown;
};

function defaultMetaResponses(): MetaResponses {
  return {
    tokenStatus: 200,
    tokenBody: { access_token: "tok_test_a", token_type: "bearer" },
    phoneListStatus: 200,
    phoneListBody: {
      data: [{ id: "105", display_phone_number: "+1 555 000 0000", verified_name: "Test Biz" }],
    },
    platformStatus: 200,
    platformBody: {
      id: "105",
      is_on_biz_app: true,
      platform_type: "CLOUD_API",
      display_phone_number: "+1 555 000 0000",
    },
    subscribeStatus: 200,
    subscribeBody: { success: true },
  };
}

let meta: MetaResponses = defaultMetaResponses();
const fetchUrls: string[] = [];

function classifyUrl(url: string): "token" | "phoneList" | "platform" | "subscribe" | "other" {
  if (url.includes("/oauth/access_token")) return "token";
  if (url.includes("/subscribed_apps")) return "subscribe";
  if (url.includes("/phone_numbers")) return "phoneList";
  if (url.includes("fields=is_on_biz_app")) return "platform";
  return "other";
}

function requestUrlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

async function executeFetch(input: RequestInfo | URL): Promise<Response> {
  const url = requestUrlOf(input);
  fetchUrls.push(url);
  const kind = classifyUrl(url);
  if (kind === "token") return new Response(JSON.stringify(meta.tokenBody), { status: meta.tokenStatus });
  if (kind === "phoneList") return new Response(JSON.stringify(meta.phoneListBody), { status: meta.phoneListStatus });
  if (kind === "platform") return new Response(JSON.stringify(meta.platformBody), { status: meta.platformStatus });
  if (kind === "subscribe") return new Response(JSON.stringify(meta.subscribeBody), { status: meta.subscribeStatus });
  return new Response(JSON.stringify({}), { status: 404 });
}

const fetchMock = mock(executeFetch);
globalThis.fetch = Object.assign(fetchMock, {
  preconnect() {
    // no-op for tests
  },
});

// ---------------------------------------------------------------------------
// Module mocks (must precede SUT import)
// ---------------------------------------------------------------------------

void mock.module("@/backend/db/repo/whatsapp", () => ({
  WhatsappAccountRepository: {
    listActive: async (): Promise<unknown[]> => [],
    findById: async (): Promise<unknown> => null,
    findByPhoneNumberId: findByPhoneNumberIdMock,
    findFirstActiveForCredentials: async (): Promise<unknown> => null,
    findActiveGeneral: async (): Promise<unknown> => null,
    create: createAccountMock,
    update: async (): Promise<unknown> => null,
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
    hasPermission: hasPermissionMock,
    getUserContext: async () => ({ permissions: [], permissionGroups: ["super_admin"], isSuperAdmin: true }),
  },
}));

void mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: { createManyAuditLogs: async () => {} },
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

const actualSystem = await import("@/backend/services/system");

await mock.module("@/backend/services/system", () => ({
  ...actualSystem,
  resolveEnvConfig: async (key: string) => envValues.get(key),
  resolveEnvConfigMany: async (keys: string[]) => {
    const result: Record<string, string | undefined> = {};
    for (const key of keys) result[key] = envValues.get(key);
    return result;
  },
  invalidateEnvConfigCache: () => {},
}));

void mock.module("@/backend/services/communication/channels/whatsapp", () => ({
  resetWhatsappChannel: async () => {},
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

void mock.module("@/backend/services/whatsapp/whatsapp-coexistence-sync.service", () => ({
  WhatsappCoexistenceSyncService: {
    enqueuePostOnboardingSync: enqueueSyncMock,
  },
  WHATSAPP_SYNC_FAILURE_DEADLINE: "syncDeadlineExpired",
  WHATSAPP_SYNC_FAILURE_HISTORY_DECLINED: "historyDeclined",
}));

// The services barrel is mocked narrow so importing the account service never
// loads the entire backend services graph.
void mock.module("@/backend/services", () => ({
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
// SUT + fixtures
// ---------------------------------------------------------------------------

const { WhatsappAccountService } = await import("@/backend/services/whatsapp/whatsapp-account.service");
const { WhatsappEmbeddedSignupError } = await import("@/backend/lib");
const { errorsEn } = await import("@/shared/locale/en/errors");

const ACTOR_ID = "aaaa0001-aaaa-aaaa-aaaa-aaaa0001aaaa";
const BASE_INPUT = { code: "code_test_a", wabaId: "10001", businessId: "20002" } as const;

beforeEach(() => {
  meta = defaultMetaResponses();
  fetchUrls.length = 0;
  envValues.clear();
  envValues.set("WHATSAPP_APP_ID", "app_test_1");
  envValues.set("WHATSAPP_APP_SECRET", "sec_test_1");
  hasPermissionMock.mockClear();
  hasPermissionMock.mockResolvedValue(true);
  findByPhoneNumberIdMock.mockClear();
  findByPhoneNumberIdMock.mockResolvedValue(null);
  createAccountMock.mockClear();
  enqueueSyncMock.mockClear();
  fetchMock.mockClear();
});

async function expectEmbeddedSignupError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected the call to reject, but it resolved");
}

describe("completeEmbeddedSignup — happy paths", () => {
  test("completes with an explicit phoneNumberId (skips phone-list resolution)", async () => {
    const result = await WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, {
      ...BASE_INPUT,
      phoneNumberId: "105",
    });

    expect(fetchUrls.some(u => u.includes("/oauth/access_token"))).toBe(true);
    expect(fetchUrls.some(u => u.includes("/phone_numbers"))).toBe(false);
    expect(fetchUrls.some(u => u.includes("is_on_biz_app"))).toBe(true);
    expect(fetchUrls.some(u => u.includes("/subscribed_apps"))).toBe(true);

    expect(createAccountMock).toHaveBeenCalledTimes(1);
    const created = createAccountMock.mock.calls[0][0];
    expect(created.phoneNumberId).toBe("105");
    expect(created.wabaId).toBe("10001");
    expect(created.onboardingMode).toBe("COEXISTENCE");
    expect(created.isActive).toBe(true);
    expect(created.displayPhoneNumber).toBe("+1 555 000 0000");

    expect(enqueueSyncMock).toHaveBeenCalledTimes(1);
    // Sync enqueue runs outside any caller transaction but receives the
    // caller's localized error labels.
    expect(enqueueSyncMock).toHaveBeenCalledWith("acc_es_1", errorsEn);
    expect(result.id).toBe("acc_es_1");
  });

  test("only-waba_id payload resolves the single WABA phone number", async () => {
    const result = await WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, { ...BASE_INPUT });

    expect(fetchUrls.some(u => u.includes("/phone_numbers"))).toBe(true);
    const created = createAccountMock.mock.calls[0][0];
    expect(created.phoneNumberId).toBe("105");
    expect(result.id).toBe("acc_es_1");
  });

  test("subscribed_apps failure is tolerated (account still created)", async () => {
    meta.subscribeStatus = 400;
    meta.subscribeBody = { error: { code: 100, message: "boom" } };

    const result = await WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, {
      ...BASE_INPUT,
      phoneNumberId: "105",
    });
    expect(result.id).toBe("acc_es_1");
    expect(createAccountMock).toHaveBeenCalledTimes(1);
  });

  test("sync enqueue failure does not roll back account creation", async () => {
    enqueueSyncMock.mockRejectedValueOnce(new Error("sync boom"));
    const result = await WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, {
      ...BASE_INPUT,
      phoneNumberId: "105",
    });
    expect(result.id).toBe("acc_es_1");
  });
});

describe("completeEmbeddedSignup — failure paths", () => {
  test("permission denial throws before any Meta call", async () => {
    hasPermissionMock.mockResolvedValue(false);
    const error = await expectEmbeddedSignupError(
      WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, { ...BASE_INPUT, phoneNumberId: "105" })
    );
    expect(error).toBeInstanceOf(Error);
    expect(fetchUrls).toHaveLength(0);
    expect(createAccountMock).not.toHaveBeenCalled();
  });

  test("missing app credentials fails before the code exchange", async () => {
    envValues.delete("WHATSAPP_APP_SECRET");
    const error = await expectEmbeddedSignupError(
      WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, { ...BASE_INPUT, phoneNumberId: "105" })
    );
    expect(error).toBeInstanceOf(WhatsappEmbeddedSignupError);
    expect(fetchUrls).toHaveLength(0);
  });

  test("code-exchange failure (replayed/invalid code) maps to embeddedSignupFailed", async () => {
    meta.tokenStatus = 400;
    meta.tokenBody = { error: { code: 190, message: "Invalid OAuth 2.0 Access Token" } };
    const error = await expectEmbeddedSignupError(
      WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, { ...BASE_INPUT, phoneNumberId: "105" })
    );
    expect(error).toBeInstanceOf(WhatsappEmbeddedSignupError);
    if (!(error instanceof WhatsappEmbeddedSignupError)) throw new Error("unreachable");
    expect(error.code).toBe("whatsapp.embeddedSignupFailed");
    expect(error.message).toBe(errorsEn.whatsappEmbeddedSignupFailed);
  });

  test("declined coexistence (is_on_biz_app false) aborts onboarding", async () => {
    meta.platformBody = { id: "105", is_on_biz_app: false, platform_type: "CLOUD_API" };
    const error = await expectEmbeddedSignupError(
      WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, { ...BASE_INPUT, phoneNumberId: "105" })
    );
    expect(error).toBeInstanceOf(WhatsappEmbeddedSignupError);
    expect(createAccountMock).not.toHaveBeenCalled();
    expect(enqueueSyncMock).not.toHaveBeenCalled();
  });

  test("non-CLOUD_API platform_type aborts onboarding", async () => {
    meta.platformBody = { id: "105", is_on_biz_app: true, platform_type: "ON_PREMISE" };
    const error = await expectEmbeddedSignupError(
      WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, { ...BASE_INPUT, phoneNumberId: "105" })
    );
    expect(error).toBeInstanceOf(WhatsappEmbeddedSignupError);
    expect(createAccountMock).not.toHaveBeenCalled();
  });

  test("ambiguous WABA (multiple numbers, no phoneNumberId) fails", async () => {
    meta.phoneListBody = {
      data: [
        { id: "105", display_phone_number: "+1 555 000 0000", verified_name: "A" },
        { id: "106", display_phone_number: "+1 555 000 0001", verified_name: "B" },
      ],
    };
    const error = await expectEmbeddedSignupError(
      WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, { ...BASE_INPUT })
    );
    expect(error).toBeInstanceOf(WhatsappEmbeddedSignupError);
    expect(createAccountMock).not.toHaveBeenCalled();
  });

  test("empty WABA number list fails", async () => {
    meta.phoneListBody = { data: [] };
    const error = await expectEmbeddedSignupError(
      WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, { ...BASE_INPUT })
    );
    expect(error).toBeInstanceOf(WhatsappEmbeddedSignupError);
  });

  test("existing account for the phone number is rejected", async () => {
    findByPhoneNumberIdMock.mockResolvedValue({ id: "existing-1" });
    const error = await expectEmbeddedSignupError(
      WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, { ...BASE_INPUT, phoneNumberId: "105" })
    );
    expect(error).toBeInstanceOf(WhatsappEmbeddedSignupError);
    expect(createAccountMock).not.toHaveBeenCalled();
  });

  test("concurrent signup losing the unique insert (23505) maps to embeddedSignupFailed", async () => {
    const uniqueViolation = Object.assign(
      new Error('duplicate key value violates unique constraint "whatsapp_accounts_phone_number_id_unique"'),
      { code: "23505" }
    );
    createAccountMock.mockRejectedValueOnce(uniqueViolation);

    const error = await expectEmbeddedSignupError(
      WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, { ...BASE_INPUT, phoneNumberId: "105" })
    );
    expect(error).toBeInstanceOf(WhatsappEmbeddedSignupError);
    if (!(error instanceof WhatsappEmbeddedSignupError)) throw new Error("unreachable");
    expect(error.code).toBe("whatsapp.embeddedSignupFailed");
    expect(error.message).toBe(errorsEn.whatsappEmbeddedSignupFailed);
    // The raw driver error must not leak into the client message.
    expect(error.message).not.toContain("duplicate key");
    expect(enqueueSyncMock).not.toHaveBeenCalled();
  });

  test("non-duplicate create failure propagates unwrapped", async () => {
    createAccountMock.mockRejectedValueOnce(new Error("db boom"));

    const error = await expectEmbeddedSignupError(
      WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, { ...BASE_INPUT, phoneNumberId: "105" })
    );
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(WhatsappEmbeddedSignupError);
    if (!(error instanceof Error)) throw new Error("unreachable");
    expect(error.message).toBe("db boom");
  });

  test("invalid input fails validation without Meta calls", async () => {
    const error = await expectEmbeddedSignupError(
      WhatsappAccountService.completeEmbeddedSignup(ACTOR_ID, errorsEn, { code: " ", wabaId: "not-a-number" })
    );
    expect(error).toBeInstanceOf(Error);
    expect(fetchUrls).toHaveLength(0);
  });
});

describe("resolveEmbeddedSignupAllowedOriginsUrl", () => {
  test("builds the App Dashboard settings deep link from the configured app id", async () => {
    envValues.set("WHATSAPP_APP_ID", "123456789");

    const url = await WhatsappAccountService.resolveEmbeddedSignupAllowedOriginsUrl();

    expect(url).toBe("https://developers.facebook.com/apps/123456789/fb-business-login/settings/");
  });

  test("returns null when the app id is not configured", async () => {
    envValues.delete("WHATSAPP_APP_ID");

    expect(await WhatsappAccountService.resolveEmbeddedSignupAllowedOriginsUrl()).toBeNull();
  });
});
