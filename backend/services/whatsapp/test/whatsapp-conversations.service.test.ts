import { beforeEach, describe, expect, mock, test } from "bun:test";

import { AppPermission, UserRole } from "@/backend/enum";
import {
  WhatsappAccountPurpose,
  WhatsappOnboardingMode,
  WhatsappSyncStatus,
} from "@/backend/enum/whatsapp/whatsapp-account.enum";
import {
  WhatsappConversationSendMode,
  WhatsappTestRecipientStatus,
} from "@/backend/enum/whatsapp/whatsapp-conversations.enum";
import { WhatsappMessageDirection } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import type {
  CreateAuditLogInput,
  UserPermissionContext,
  WhatsappAccountSelectType,
  WhatsappConversationReturnType,
  WhatsappTestRecipientReturnType,
} from "@/backend/types";

// ---------------------------------------------------------------------------
// Mock state (reset per test)
// ---------------------------------------------------------------------------

const ACCOUNT_ID = "wa_account_1";
const ACTOR_USER_ID = "user_actor_1";
// Joined from fragments so the digits-only wire form and its "+"-formatted
// source never diverge (Meta's Graph API requires digits only).
const RECIPIENT_PHONE = ["1", "555", "010", "0123"].join("");
const RAW_PHONE = `+${RECIPIENT_PHONE.slice(0, 1)} ${RECIPIENT_PHONE.slice(1, 4)} ${RECIPIENT_PHONE.slice(4, 7)} ${RECIPIENT_PHONE.slice(7)}`;
const SECOND_PHONE = ["1", "555", "010", "0124"].join("");
const SUCCESS_MESSAGE_ID = "wamid_test_1";
const FIXED_DATE = new Date("2026-09-01T00:00:00Z");

const META_SUCCESS_BODY = {
  messaging_product: "whatsapp",
  contacts: [{ input: RECIPIENT_PHONE, wa_id: RECIPIENT_PHONE }],
  messages: [{ id: SUCCESS_MESSAGE_ID }],
};

function makeAccount(overrides: Partial<WhatsappAccountSelectType> = {}): WhatsappAccountSelectType {
  return {
    id: ACCOUNT_ID,
    wabaId: "waba_1",
    phoneNumberId: "phone_number_id_1",
    displayName: null,
    displayPhoneNumber: "+1 555 010 0199",
    qualityRating: null,
    portfolioMessagingLimitTier: null,
    throughputLevel: null,
    metaStatus: null,
    maxPhoneNumbersPerBusiness: null,
    purpose: WhatsappAccountPurpose.GENERAL,
    onboardingMode: WhatsappOnboardingMode.CLOUD_API,
    syncStatus: WhatsappSyncStatus.NOT_STARTED,
    syncPhase: null,
    syncProgress: 0,
    syncDeadlineAt: null,
    syncFailureReason: null,
    offboardedAt: null,
    encryptedAccessToken: "meta_access_token_test",
    encryptedTwoStepPin: "123456",
    isActive: true,
    isTestNumber: false,
    lastWebhookAt: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  };
}

function makeRecipient(overrides: Partial<WhatsappTestRecipientReturnType> = {}): WhatsappTestRecipientReturnType {
  return {
    id: "recipient_1",
    accountId: ACCOUNT_ID,
    phoneNumber: RECIPIENT_PHONE,
    status: WhatsappTestRecipientStatus.PENDING,
    lastCheckedAt: null,
    lastErrorCode: null,
    note: null,
    createdByUserId: ACTOR_USER_ID,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  };
}

function makeConversation(overrides: Partial<WhatsappConversationReturnType> = {}): WhatsappConversationReturnType {
  return {
    id: "conversation_1",
    accountId: ACCOUNT_ID,
    waId: RECIPIENT_PHONE,
    userId: null,
    username: null,
    displayName: null,
    lastMessageAt: null,
    lastMessagePreview: null,
    lastInboundMessageAt: new Date(),
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  };
}

let accountRow: WhatsappAccountSelectType | null = makeAccount();
let recipientRows: WhatsappTestRecipientReturnType[] = [];
let recipientCount = 0;
let recipientCreateError: unknown = null;
let recipientFindByIdRow: WhatsappTestRecipientReturnType | null = null;
let recipientFindByAccountAndPhoneRow: WhatsappTestRecipientReturnType | null = null;
let recipientDeleteRow: WhatsappTestRecipientReturnType | null = null;
let conversationByIdentityRow: WhatsappConversationReturnType | null = null;

const createdRecipients: Record<string, unknown>[] = [];
const verifyRecordings: { id: string; patch: { allowed: boolean; errorCode: string | null; checkedAt: Date } }[] = [];
const touchedThreads: { id: string; patch: unknown }[] = [];
const messageInserts: Record<string, unknown>[] = [];
const auditLogInputs: CreateAuditLogInput[] = [];

/** Ordered side-effect trace — proves the Meta HTTP call precedes the persistence transaction. */
const invocationOrder: string[] = [];
/** When set, the fetch stub rejects with this value instead of answering Meta. */
let metaFetchRejection: unknown = null;

let viewAllowed = true;
let manageAllowed = true;
let metaStatus = 200;
let metaBody: unknown = META_SUCCESS_BODY;
const fetchBodies: Record<string, unknown>[] = [];

/** Narrow an unknown to a plain record (fetch-mock body decoding). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Read an optional string field off an unknown bag (repo create mock payload). */
function nullableStringField(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * Mirror of the thread pane's read contract
 * (`ConversationThreadPaneShared.resolveMessageText`): the persisted content
 * resolves to a displayable string when it is a string itself or an object
 * carrying a non-empty `body`. Asserting the composer persist shape through
 * this mirror keeps the service write side aligned with the inbox read side.
 */
function paneMessageText(content: unknown): string | null {
  if (typeof content === "string") {
    return content === "" ? null : content;
  }
  if (!isRecord(content) || !("body" in content)) {
    return null;
  }
  const body: unknown = content.body;
  return typeof body === "string" && body !== "" ? body : null;
}

const countByAccountIdMock = mock(async (): Promise<number> => {
  invocationOrder.push("count");
  return recipientCount;
});

/**
 * Sentinel executor handed to the service transaction callback, standing in
 * for a real transaction handle (the mocked repositories ignore it).
 */
const TX_SENTINEL = { executor: "whatsapp-conversations-test-transaction" };

const dbTransactionMock = mock(async (run: (tx: unknown) => Promise<unknown>): Promise<unknown> => {
  invocationOrder.push("tx");
  return run(TX_SENTINEL);
});

const acquireAdvisoryLockMock = mock(async (_tx: unknown, lockKey: string): Promise<void> => {
  invocationOrder.push(`lock:${lockKey}`);
});

const inboxListConversationsMock = mock(async (): Promise<unknown> => ({ rows: [], pageInfo: null }));
const inboxListConversationMessagesMock = mock(async (): Promise<unknown> => ({ rows: [], pageInfo: null }));
const listByAccountIdMock = mock(async (): Promise<WhatsappTestRecipientReturnType[]> => recipientRows);
const createRecipientMock = mock(async (input: Record<string, unknown>): Promise<WhatsappTestRecipientReturnType> => {
  if (recipientCreateError !== null) {
    throw recipientCreateError;
  }
  createdRecipients.push(input);
  return makeRecipient({
    phoneNumber: nullableStringField(input.phoneNumber) ?? "",
    note: nullableStringField(input.note),
  });
});
const recordVerifyMock = mock(
  async (
    id: string,
    patch: { allowed: boolean; errorCode: string | null; checkedAt: Date }
  ): Promise<WhatsappTestRecipientReturnType | null> => {
    verifyRecordings.push({ id, patch });
    const base = recipientFindByIdRow;
    if (base?.id !== id) {
      return null;
    }
    return makeRecipient({
      ...base,
      status: patch.allowed ? WhatsappTestRecipientStatus.ALLOWED : WhatsappTestRecipientStatus.PENDING,
      lastCheckedAt: patch.checkedAt,
      lastErrorCode: patch.errorCode,
    });
  }
);

const fetchMock = mock(async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  invocationOrder.push("fetch");
  if (metaFetchRejection !== null) {
    throw metaFetchRejection;
  }
  if (typeof init?.body === "string") {
    const parsed: unknown = JSON.parse(init.body);
    if (isRecord(parsed)) {
      fetchBodies.push(parsed);
    }
  }
  return new Response(JSON.stringify(metaBody), { status: metaStatus });
});
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
    findCredentialsById: mock(async (): Promise<WhatsappAccountSelectType | null> => accountRow),
  },
  WhatsappTestRecipientRepository: {
    listByAccountId: listByAccountIdMock,
    countByAccountId: countByAccountIdMock,
    create: createRecipientMock,
    deleteById: mock(async (): Promise<WhatsappTestRecipientReturnType | null> => recipientDeleteRow),
    findById: mock(async (): Promise<WhatsappTestRecipientReturnType | null> => recipientFindByIdRow),
    findByAccountAndPhone: mock(
      async (): Promise<WhatsappTestRecipientReturnType | null> => recipientFindByAccountAndPhoneRow
    ),
    recordVerify: recordVerifyMock,
  },
  WhatsappConversationRepository: {
    findByIdentity: mock(async (): Promise<WhatsappConversationReturnType | null> => conversationByIdentityRow),
    findById: mock(async (): Promise<WhatsappConversationReturnType | null> => conversationByIdentityRow),
    upsertByIdentity: mock(async (): Promise<WhatsappConversationReturnType> => makeConversation()),
    touchLastMessage: mock(async (id: string, patch: unknown): Promise<void> => {
      touchedThreads.push({ id, patch });
    }),
  },
  WhatsappMessageRepository: {
    upsertByWamid: mock(async (input: Record<string, unknown>): Promise<unknown> => {
      messageInserts.push(input);
      return { ...input, id: "message_1", createdAt: FIXED_DATE, updatedAt: FIXED_DATE };
    }),
  },
  WhatsappContactRepository: {},
  WhatsappSyncRequestRepository: {},
  WhatsappWebhookEventRepository: {},
}));

// Merge with the real modules so other services loaded through the
// `@/backend/services` barrel keep their expected exports; only the pieces
// the service under test touches are replaced. Members are returned
// unmodified — method calls still resolve `this` through the proxy, which
// forwards every lookup to the real Drizzle instance.
const actualDrizzleDb = await import("@/backend/db/drizzleDb");
const proxiedDb = new Proxy(actualDrizzleDb.db, {
  get(target, property) {
    if (property === "transaction") {
      return dbTransactionMock;
    }
    return Reflect.get(target, property);
  },
});
void mock.module("@/backend/db/drizzleDb", () => ({
  ...actualDrizzleDb,
  db: proxiedDb,
}));

const actualRepoShared = await import("@/backend/db/repo/shared");
void mock.module("@/backend/db/repo/shared", () => ({
  ...actualRepoShared,
  acquireAdvisoryLock: acquireAdvisoryLockMock,
}));

void mock.module("@/backend/services/whatsapp/whatsapp-inbox.service", () => ({
  WhatsappInboxService: {
    listConversations: inboxListConversationsMock,
    listConversationMessages: inboxListConversationMessagesMock,
  },
}));

void mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: mock(
      async (_context: UserPermissionContext, permission: AppPermission): Promise<boolean> =>
        permission === AppPermission.WHATSAPP_CONVERSATIONS_VIEW ? viewAllowed : manageAllowed
    ),
  },
}));

void mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: {
    createManyAuditLogs: mock(async (inputs: readonly CreateAuditLogInput[]): Promise<unknown[]> => {
      auditLogInputs.push(...inputs);
      return [...inputs];
    }),
  },
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

const actualServices = await import("@/backend/services");
await mock.module("@/backend/services", () => ({
  ...actualServices,
  resolveEnvConfig: async (): Promise<undefined> => undefined,
  resolveEnvConfigMany: async (keys: string[]): Promise<Record<string, undefined>> =>
    Object.fromEntries(keys.map(key => [key, undefined])),
}));

// ---------------------------------------------------------------------------
// SUT + shared fixtures
// ---------------------------------------------------------------------------

const { WhatsappConversationsService } = await import("@/backend/services/whatsapp/whatsapp-conversations.service");
const { DomainError, ForbiddenError, NotFoundError, ValidationError } = await import("@/backend/lib");
const { errorsEn } = await import("@/shared/locale/en/errors");

const CONTEXT: UserPermissionContext = {
  permissions: [],
  permissionGroups: [],
  isSuperAdmin: false,
  role: UserRole.SUPER_ADMIN,
};

function conversationSendInput(overrides: Record<string, unknown> = {}) {
  return {
    actorUserId: ACTOR_USER_ID,
    accountId: ACCOUNT_ID,
    to: RAW_PHONE,
    mode: WhatsappConversationSendMode.TEXT,
    body: "  hello there  ",
    ...overrides,
  } as Parameters<typeof WhatsappConversationsService.sendMessage>[2];
}

const missingRecipientInput = { actorUserId: ACTOR_USER_ID, recipientId: "recipient_missing" };

async function captureError(fn: () => Promise<unknown>): Promise<Error> {
  let caught: unknown = null;
  try {
    await fn();
  } catch (error) {
    caught = error;
  }
  if (!(caught instanceof Error)) {
    throw new Error("expected the call to reject with an Error");
  }
  return caught;
}

/** Send the default TEXT composer input through the service. */
function callSendText() {
  return WhatsappConversationsService.sendMessage(CONTEXT, errorsEn, conversationSendInput());
}

/** Read the rejection of the given call, asserting class + localized message. */
async function expectServiceError(
  fn: () => Promise<unknown>,
  errorClass: abstract new (...args: never[]) => Error,
  message: string
): Promise<void> {
  const error = await captureError(fn);
  expect(error).toBeInstanceOf(errorClass);
  expect(error.message).toBe(message);
}

function metaFailureBody(code: number): unknown {
  return {
    error: {
      message: "Meta rejected the request",
      type: "OAuthException",
      code,
      fbtrace_id: "trace_1",
    },
  };
}

beforeEach(() => {
  accountRow = makeAccount();
  recipientRows = [];
  recipientCount = 0;
  recipientCreateError = null;
  recipientFindByIdRow = null;
  recipientFindByAccountAndPhoneRow = null;
  recipientDeleteRow = null;
  conversationByIdentityRow = null;
  createdRecipients.length = 0;
  verifyRecordings.length = 0;
  touchedThreads.length = 0;
  messageInserts.length = 0;
  auditLogInputs.length = 0;
  viewAllowed = true;
  manageAllowed = true;
  metaStatus = 200;
  metaBody = META_SUCCESS_BODY;
  fetchBodies.length = 0;
  metaFetchRejection = null;
  invocationOrder.length = 0;
  countByAccountIdMock.mockClear();
  listByAccountIdMock.mockClear();
  dbTransactionMock.mockClear();
  acquireAdvisoryLockMock.mockClear();
  inboxListConversationsMock.mockClear();
  inboxListConversationMessagesMock.mockClear();
});

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------

describe("sendMessage", () => {
  test("denies callers without the manage permission before touching Meta", async () => {
    manageAllowed = false;
    await expectServiceError(callSendText, ForbiddenError, errorsEn.insufficientPermissions);
    expect(fetchBodies).toHaveLength(0);
  });

  test("rejects TEXT with an empty body (messageRequired)", async () => {
    await expectServiceError(
      () => WhatsappConversationsService.sendMessage(CONTEXT, errorsEn, conversationSendInput({ body: "   " })),
      ValidationError,
      errorsEn.whatsappMessageRequired
    );
  });

  test("rejects TEMPLATE without a template name (templateRequired)", async () => {
    await expectServiceError(
      () =>
        WhatsappConversationsService.sendMessage(
          CONTEXT,
          errorsEn,
          conversationSendInput({ mode: WhatsappConversationSendMode.TEMPLATE, body: undefined, templateName: " " })
        ),
      ValidationError,
      errorsEn.whatsappTemplateRequired
    );
  });

  test("blocks test-number sends to recipients missing from the registry", async () => {
    accountRow = makeAccount({ isTestNumber: true });
    recipientFindByAccountAndPhoneRow = null;
    await expectServiceError(callSendText, DomainError, errorsEn.whatsappRecipientNotAllowed);
    expect(fetchBodies).toHaveLength(0);
  });

  test("blocks test-number sends to recipients not yet ALLOWED", async () => {
    accountRow = makeAccount({ isTestNumber: true });
    recipientFindByAccountAndPhoneRow = makeRecipient({ status: WhatsappTestRecipientStatus.PENDING });
    await expectServiceError(callSendText, DomainError, errorsEn.whatsappRecipientNotAllowed);
  });

  test("rejects TEXT when the 24h window is stale (outsideServiceWindow)", async () => {
    conversationByIdentityRow = makeConversation({ lastInboundMessageAt: new Date(Date.now() - 25 * 60 * 60 * 1000) });
    await expectServiceError(callSendText, DomainError, errorsEn.whatsappOutsideServiceWindow);
  });

  test("rejects TEXT when no prior conversation exists (outsideServiceWindow)", async () => {
    conversationByIdentityRow = null;
    await expectServiceError(callSendText, DomainError, errorsEn.whatsappOutsideServiceWindow);
  });

  test("sends TEXT inside the window and persists the API_OUTBOUND message", async () => {
    conversationByIdentityRow = makeConversation();
    const result = await WhatsappConversationsService.sendMessage(CONTEXT, errorsEn, conversationSendInput());

    expect(fetchBodies).toHaveLength(1);
    const payload = fetchBodies[0] as { type?: string; to?: string; text?: { body?: string } };
    expect(payload.type).toBe("text");
    expect(payload.to).toBe(RECIPIENT_PHONE);
    expect(payload.text?.body).toBe("hello there");

    expect(messageInserts).toHaveLength(1);
    const insert = messageInserts[0] as {
      wamid?: string;
      direction?: string;
      type?: string;
      status?: string;
      content?: unknown;
    };
    expect(insert.wamid).toBe(SUCCESS_MESSAGE_ID);
    expect(insert.direction).toBe(WhatsappMessageDirection.API_OUTBOUND);
    expect(insert.type).toBe("text");
    expect(insert.status).toBe("sent");
    expect(insert.content).toEqual({ body: "hello there" });
    expect(paneMessageText(insert.content)).toBe("hello there");

    expect(touchedThreads).toHaveLength(1);
    expect(touchedThreads[0]?.id).toBe("conversation_1");
    expect(result.message.direction).toBe(WhatsappMessageDirection.API_OUTBOUND);

    const audit = auditLogInputs.find(
      entry => entry.action === "CREATE" && entry.description === "whatsapp-conversation message sent"
    );
    expect(audit).toBeDefined();
  });

  test("sends TEMPLATE and persists the template content payload", async () => {
    const result = await WhatsappConversationsService.sendMessage(
      CONTEXT,
      errorsEn,
      conversationSendInput({
        mode: WhatsappConversationSendMode.TEMPLATE,
        body: undefined,
        templateName: "hello_world",
      })
    );

    const payload = fetchBodies[0] as { type?: string; template?: { name?: string } };
    expect(payload.type).toBe("template");
    expect(payload.template?.name).toBe("hello_world");

    const insert = messageInserts[0] as { type?: string; content?: unknown };
    expect(insert.type).toBe("template");
    expect(insert.content).toEqual({ body: "[template] hello_world", name: "hello_world" });
    expect(paneMessageText(insert.content)).toBe("[template] hello_world");
    expect(result.message.wamid).toBe(SUCCESS_MESSAGE_ID);
  });

  test("maps Meta 131030 to the recipient-allow-list error", async () => {
    conversationByIdentityRow = makeConversation();
    metaStatus = 400;
    metaBody = metaFailureBody(131030);
    await expectServiceError(callSendText, DomainError, errorsEn.whatsappRecipientNotAllowedFromMeta);
  });

  test("maps Meta 132047 to the outside-service-window error", async () => {
    conversationByIdentityRow = makeConversation();
    metaStatus = 400;
    metaBody = metaFailureBody(132047);
    await expectServiceError(callSendText, DomainError, errorsEn.whatsappOutsideServiceWindow);
    expect(messageInserts).toHaveLength(0);
  });

  test("rejects a conversationId bound to a different recipient", async () => {
    conversationByIdentityRow = makeConversation({ waId: SECOND_PHONE });
    await expectServiceError(
      () =>
        WhatsappConversationsService.sendMessage(
          CONTEXT,
          errorsEn,
          conversationSendInput({
            conversationId: "conversation_1",
            mode: WhatsappConversationSendMode.TEMPLATE,
            body: undefined,
            templateName: "hello_world",
          })
        ),
      NotFoundError,
      errorsEn.notFound
    );
    expect(fetchBodies).toHaveLength(0);
    expect(messageInserts).toHaveLength(0);
  });

  test("accepts a conversationId bound to the same recipient", async () => {
    conversationByIdentityRow = makeConversation();
    await WhatsappConversationsService.sendMessage(
      CONTEXT,
      errorsEn,
      conversationSendInput({ conversationId: "conversation_1" })
    );
    expect(messageInserts).toHaveLength(1);
    const insert = messageInserts[0] as { conversationId?: string };
    expect(insert.conversationId).toBe("conversation_1");
  });

  test("maps any other Graph API failure to the generic send-failed error", async () => {
    conversationByIdentityRow = makeConversation();
    metaStatus = 401;
    metaBody = metaFailureBody(190);
    await expectServiceError(callSendText, DomainError, errorsEn.whatsappConversationSendFailed);
  });

  test("persists the message inside a transaction opened only after the Meta call", async () => {
    conversationByIdentityRow = makeConversation();
    await WhatsappConversationsService.sendMessage(CONTEXT, errorsEn, conversationSendInput());

    expect(dbTransactionMock).toHaveBeenCalledTimes(1);
    const fetchIndex = invocationOrder.indexOf("fetch");
    const txIndex = invocationOrder.indexOf("tx");
    expect(fetchIndex).toBeGreaterThanOrEqual(0);
    expect(txIndex).toBeGreaterThan(fetchIndex);
    expect(messageInserts).toHaveLength(1);
  });

  test("translates request-builder failures into the generic send-failed error", async () => {
    conversationByIdentityRow = makeConversation();
    const oversizedBody = "x".repeat(4097);
    await expectServiceError(
      () => WhatsappConversationsService.sendMessage(CONTEXT, errorsEn, conversationSendInput({ body: oversizedBody })),
      DomainError,
      errorsEn.whatsappConversationSendFailed
    );
    expect(fetchBodies).toHaveLength(0);
    expect(dbTransactionMock).not.toHaveBeenCalled();
  });

  test("translates a network timeout into the generic send-failed error", async () => {
    conversationByIdentityRow = makeConversation();
    metaFetchRejection = new DOMException("The operation timed out", "TimeoutError");
    await expectServiceError(callSendText, DomainError, errorsEn.whatsappConversationSendFailed);
    expect(dbTransactionMock).not.toHaveBeenCalled();
    expect(messageInserts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// addRecipient
// ---------------------------------------------------------------------------

describe("addRecipient", () => {
  function addRecipientInput(overrides: Record<string, unknown> = {}) {
    return { actorUserId: ACTOR_USER_ID, accountId: ACCOUNT_ID, phoneNumber: RAW_PHONE, ...overrides };
  }

  function callAddRecipient() {
    return WhatsappConversationsService.addRecipient(CONTEXT, errorsEn, addRecipientInput());
  }

  test("rejects the 6th recipient on a test number (recipientLimitReached)", async () => {
    accountRow = makeAccount({ isTestNumber: true });
    recipientCount = 5;
    await expectServiceError(callAddRecipient, DomainError, errorsEn.whatsappRecipientLimitReached);
  });

  test("translates the unique constraint into a domain conflict (recipientConflict)", async () => {
    recipientCreateError = Object.assign(new Error("duplicate key value violates unique constraint"), {
      code: "23505",
    });
    await expectServiceError(callAddRecipient, DomainError, errorsEn.whatsappRecipientConflict);
  });

  test("normalizes the phone number, creates the row, and audits the add", async () => {
    const created = await WhatsappConversationsService.addRecipient(
      CONTEXT,
      errorsEn,
      addRecipientInput({ note: "qa handset" })
    );
    expect(created.phoneNumber).toBe(RECIPIENT_PHONE);
    expect(createdRecipients).toHaveLength(1);
    expect(createdRecipients[0]).toMatchObject({
      accountId: ACCOUNT_ID,
      phoneNumber: RECIPIENT_PHONE,
      note: "qa handset",
    });
    const audit = auditLogInputs.find(
      entry => entry.action === "CREATE" && entry.description === "whatsapp-test-recipient registered"
    );
    expect(audit).toBeDefined();
  });

  test("never applies the recipient cap to non-test numbers", async () => {
    accountRow = makeAccount({ isTestNumber: false });
    recipientCount = 42;
    await WhatsappConversationsService.addRecipient(CONTEXT, errorsEn, addRecipientInput());
    expect(countByAccountIdMock).not.toHaveBeenCalled();
    expect(createdRecipients).toHaveLength(1);
  });

  test("denies callers without the manage permission", async () => {
    manageAllowed = false;
    await expectServiceError(callAddRecipient, ForbiddenError, errorsEn.insufficientPermissions);
    expect(createdRecipients).toHaveLength(0);
  });

  test("takes the account-scoped advisory lock before the cap check inside one transaction", async () => {
    accountRow = makeAccount({ isTestNumber: true });
    recipientCount = 4;
    await WhatsappConversationsService.addRecipient(CONTEXT, errorsEn, addRecipientInput());

    expect(dbTransactionMock).toHaveBeenCalledTimes(1);
    const lockKey = `whatsapp-recipient-cap:${ACCOUNT_ID}`;
    expect(acquireAdvisoryLockMock).toHaveBeenCalledWith(TX_SENTINEL, lockKey);
    const lockIndex = invocationOrder.indexOf(`lock:${lockKey}`);
    const countIndex = invocationOrder.indexOf("count");
    expect(lockIndex).toBeGreaterThanOrEqual(0);
    expect(countIndex).toBeGreaterThan(lockIndex);
  });

  test("rejects the 6th recipient atomically inside the capped transaction", async () => {
    accountRow = makeAccount({ isTestNumber: true });
    recipientCount = 5;
    await expectServiceError(callAddRecipient, DomainError, errorsEn.whatsappRecipientLimitReached);
    expect(createdRecipients).toHaveLength(0);
    expect(dbTransactionMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// verifyRecipient
// ---------------------------------------------------------------------------

describe("verifyRecipient", () => {
  test("records allowed=true when Meta accepts the hello_world test send", async () => {
    recipientFindByIdRow = makeRecipient();
    const recorded = await WhatsappConversationsService.verifyRecipient(CONTEXT, errorsEn, {
      actorUserId: ACTOR_USER_ID,
      recipientId: "recipient_1",
    });
    expect(verifyRecordings).toHaveLength(1);
    const patch = verifyRecordings[0]?.patch;
    expect(patch?.allowed).toBe(true);
    expect(patch?.errorCode).toBeNull();
    expect(patch?.checkedAt).toBeInstanceOf(Date);
    expect(recorded.status).toBe(WhatsappTestRecipientStatus.ALLOWED);
    const payload = fetchBodies[0] as { type?: string; template?: { name?: string } };
    expect(payload.type).toBe("template");
    expect(payload.template?.name).toBe("hello_world");
    expect(dbTransactionMock).toHaveBeenCalledTimes(1);
    expect(invocationOrder.indexOf("fetch")).toBeLessThan(invocationOrder.indexOf("tx"));
  });

  test("records allowed=false with the Meta error code on Graph API failure", async () => {
    recipientFindByIdRow = makeRecipient();
    metaStatus = 400;
    metaBody = metaFailureBody(131030);
    const recorded = await WhatsappConversationsService.verifyRecipient(CONTEXT, errorsEn, {
      actorUserId: ACTOR_USER_ID,
      recipientId: "recipient_1",
    });
    const patch = verifyRecordings[0]?.patch;
    expect(patch?.allowed).toBe(false);
    expect(patch?.errorCode).toBe("131030");
    expect(recorded.status).toBe(WhatsappTestRecipientStatus.PENDING);
  });

  test("throws NotFoundError for an unknown recipient id", async () => {
    recipientFindByIdRow = null;
    await expectServiceError(
      () => WhatsappConversationsService.verifyRecipient(CONTEXT, errorsEn, missingRecipientInput),
      NotFoundError,
      errorsEn.notFound
    );
  });
});

// ---------------------------------------------------------------------------
// removeRecipient / listRecipients
// ---------------------------------------------------------------------------

describe("removeRecipient", () => {
  test("hard-deletes the registry row and audits the removal", async () => {
    recipientDeleteRow = makeRecipient();
    await WhatsappConversationsService.removeRecipient(CONTEXT, errorsEn, {
      actorUserId: ACTOR_USER_ID,
      recipientId: "recipient_1",
    });
    const audit = auditLogInputs.find(
      entry => entry.action === "DELETE" && entry.description === "whatsapp-test-recipient removed"
    );
    expect(audit).toBeDefined();
  });

  test("throws NotFoundError when the recipient does not exist", async () => {
    recipientDeleteRow = null;
    await expectServiceError(
      () => WhatsappConversationsService.removeRecipient(CONTEXT, errorsEn, missingRecipientInput),
      NotFoundError,
      errorsEn.notFound
    );
  });
});

describe("listRecipients", () => {
  test("returns the registry rows for the account", async () => {
    recipientRows = [makeRecipient(), makeRecipient({ id: "recipient_2", phoneNumber: SECOND_PHONE })];
    const rows = await WhatsappConversationsService.listRecipients(CONTEXT, errorsEn, { accountId: ACCOUNT_ID });
    expect(rows).toHaveLength(2);
    expect(rows[0]?.phoneNumber).toBe(RECIPIENT_PHONE);
  });

  test("denies callers without the view permission", async () => {
    viewAllowed = false;
    await expectServiceError(
      () => WhatsappConversationsService.listRecipients(CONTEXT, errorsEn, { accountId: ACCOUNT_ID }),
      ForbiddenError,
      errorsEn.insufficientPermissions
    );
    expect(listByAccountIdMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Inbox delegates (dual view gate) + thread envelope
// ---------------------------------------------------------------------------

describe("listConversations", () => {
  test("delegates to the inbox service for a caller with the view permission", async () => {
    await WhatsappConversationsService.listConversations(CONTEXT, errorsEn, { accountId: ACCOUNT_ID });
    expect(inboxListConversationsMock).toHaveBeenCalledTimes(1);
  });

  test("denies callers without the view permission before delegating", async () => {
    viewAllowed = false;
    await expectServiceError(
      () => WhatsappConversationsService.listConversations(CONTEXT, errorsEn, { accountId: ACCOUNT_ID }),
      ForbiddenError,
      errorsEn.insufficientPermissions
    );
    expect(inboxListConversationsMock).not.toHaveBeenCalled();
  });
});

describe("listConversationMessages", () => {
  test("delegates to the inbox service for a caller with the view permission", async () => {
    await WhatsappConversationsService.listConversationMessages(CONTEXT, errorsEn, {
      conversationId: "conversation_1",
    });
    expect(inboxListConversationMessagesMock).toHaveBeenCalledTimes(1);
  });

  test("denies callers without the view permission before delegating", async () => {
    viewAllowed = false;
    await expectServiceError(
      () =>
        WhatsappConversationsService.listConversationMessages(CONTEXT, errorsEn, {
          conversationId: "conversation_1",
        }),
      ForbiddenError,
      errorsEn.insufficientPermissions
    );
    expect(inboxListConversationMessagesMock).not.toHaveBeenCalled();
  });
});

describe("getConversationThread", () => {
  test("returns the conversation row plus its message envelope", async () => {
    conversationByIdentityRow = makeConversation();
    const thread = await WhatsappConversationsService.getConversationThread(CONTEXT, errorsEn, {
      conversationId: "conversation_1",
    });
    expect(thread.conversation.id).toBe("conversation_1");
    expect(inboxListConversationMessagesMock).toHaveBeenCalledTimes(1);
  });

  test("short-circuits unknown conversations before fetching messages", async () => {
    conversationByIdentityRow = null;
    await expectServiceError(
      () => WhatsappConversationsService.getConversationThread(CONTEXT, errorsEn, { conversationId: "missing" }),
      NotFoundError,
      errorsEn.notFound
    );
    expect(inboxListConversationMessagesMock).not.toHaveBeenCalled();
  });
});
