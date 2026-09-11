import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { auditLogs, whatsappAccounts, whatsappConversations, whatsappMessages } from "@/backend/db/schema";
import {
  WhatsappConversationSendMode,
  WhatsappTestRecipientStatus,
} from "@/backend/enum/whatsapp/whatsapp-conversations.enum";
import { WhatsappMessageDirection } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import { DomainError, ForbiddenError } from "@/backend/lib";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { invalidateEnvConfigCache } from "@/backend/services/system";
import {
  WhatsappAccountService,
  WhatsappConversationsService,
  WhatsappWebhookHandler,
} from "@/backend/services/whatsapp";
import { persistWebhookChanges } from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import type {
  UserPermissionContext,
  WhatsappAccountReturnType,
  WhatsappTestRecipientReturnType,
} from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  cleanupWhatsappCast,
  expectJourneyError,
  provisionWhatsappCast,
  type WhatsappJourneyCast,
} from "@/test/workflows/helpers";

/**
 * WhatsApp Conversations workspace journey (`/whatsapp`): the admin syncs a
 * Meta TEST number (stubbed Graph API), registers a recipient in the local
 * registry, proves it via the `hello_world` verify send, sends a template
 * (persisted as API_OUTBOUND), then — after a real inbound webhook opens the
 * 24h window — sends free-text. The 6-recipient Meta cap and the non-manage
 * denial close out the journey, all through real services against the real DB.
 *
 * Every bound gets intercepted at the network edge only: `globalThis.fetch`
 * answers Meta Graph calls by URL shape (`/{waba}/phone_numbers` list,
 * `/{phoneNumberId}?fields=` detail, `/{phoneNumberId}/messages` sends). The
 * env WABA/token resolve from `.env.test`; the stub is keyed on this run's
 * random phone-number id, never on the env values, so env-config cache state
 * from sibling suites cannot poison the journey.
 */
interface RecordedFetch {
  readonly url: string;
  readonly method: string;
  readonly body: Record<string, unknown> | null;
}

function fetchInputUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/** Random digit run (ids the Meta builders require to be numeric). */
function digits(count: number): string {
  return `${randomUUID().replace(/\D/g, "")}7777777`.slice(0, count);
}

/** Narrow an unknown to a plain record (fetch-stub body decoding). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function graphJson(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

describe("WhatsApp conversations journey (real services, real DB)", () => {
  const PREFIX = `jrn_wac_${randomUUID().slice(0, 8)}`;
  /** Meta test number's phone_number_id — digits only, unique per run. */
  const PHONE_NUMBER_ID = `9${digits(14)}`;
  /** "Test Number" display phone — digits start with 1555 for the isTestNumber rule. */
  const DISPLAY_PHONE = ["+1", "555", "010", digits(4)].join("-");
  /** Registry recipient A (verified + messaged) and B (second registration). */
  const RECIPIENT_ONE = `9665${digits(7)}`;
  const RECIPIENT_TWO = `9665${digits(7)}`;
  /** Unique per run so the `whatsapp_messages.wamid` unique index stays safe. */
  const INBOUND_WAMID = `wamid.wac.in.${randomUUID().slice(0, 8)}`;

  let tErrors: ErrorsLabels;
  let cast: WhatsappJourneyCast;
  let adminContext: UserPermissionContext;
  let staffContext: UserPermissionContext;
  let syncedAccount: WhatsappAccountReturnType | null = null;
  let recipientOne: WhatsappTestRecipientReturnType | null = null;
  let conversationId = "";

  const recordedFetches: RecordedFetch[] = [];
  const webhookHashes: string[] = [];
  const counters = { wamid: 0 };
  const originalFetch = globalThis.fetch;
  const previousWabaEnv = process.env.WHATSAPP_WABA_ID;
  const previousTokenEnv = process.env.WHATSAPP_ACCESS_TOKEN;

  function metaStub(url: string): Response {
    if (url.endsWith("/phone_numbers?limit=100")) {
      return graphJson({
        data: [{ id: PHONE_NUMBER_ID, display_phone_number: DISPLAY_PHONE, verified_name: "Test Number" }],
      });
    }
    if (url.endsWith("/message_templates?limit=100")) {
      return graphJson({ data: [] });
    }
    if (url.includes(`/${PHONE_NUMBER_ID}/messages`)) {
      counters.wamid += 1;
      return graphJson({
        messaging_product: "whatsapp",
        contacts: [{ input: RECIPIENT_ONE, wa_id: RECIPIENT_ONE }],
        messages: [{ id: `wamid.wac.${PREFIX.slice(8)}.${counters.wamid}` }],
      });
    }
    if (url.includes(`/${PHONE_NUMBER_ID}?fields=`)) {
      return graphJson({
        id: PHONE_NUMBER_ID,
        display_phone_number: DISPLAY_PHONE,
        verified_name: "Test Number",
        code_verification_status: "NOT_VERIFIED",
        quality_rating: "GREEN",
        status: "CONNECTED",
      });
    }
    throw new Error(`journey fetch stub: unexpected Meta URL ${url}`);
  }

  function account() {
    if (!syncedAccount) {
      throw new Error("journey: account missing — run the sync step first");
    }
    return syncedAccount;
  }

  function sentMessageCalls(): RecordedFetch[] {
    return recordedFetches.filter(call => call.url.includes(`/${PHONE_NUMBER_ID}/messages`));
  }

  async function addRecipient(phoneNumber: string): Promise<WhatsappTestRecipientReturnType> {
    return WhatsappConversationsService.addRecipient(adminContext, tErrors, {
      actorUserId: cast.adminUser.id,
      accountId: account().id,
      phoneNumber,
    });
  }

  function sendMessageInput(mode: WhatsappConversationSendMode, extra: { body?: string; templateName?: string }) {
    return { actorUserId: cast.adminUser.id, accountId: account().id, to: RECIPIENT_ONE, mode, ...extra };
  }

  /** Persist + drain one inbound webhook through the durable queue. */
  async function ingestInbound(body: string): Promise<void> {
    const value = {
      metadata: { phone_number_id: account().phoneNumberId },
      messages: [
        {
          id: INBOUND_WAMID,
          from: RECIPIENT_ONE,
          type: "text",
          text: { body },
          timestamp: String(Math.floor(Date.now() / 1000)),
        },
      ],
      contacts: [{ wa_id: RECIPIENT_ONE }],
    };
    const hash = createHash("sha256")
      .update(`${PREFIX}:messages:${JSON.stringify(value)}`)
      .digest("hex");
    webhookHashes.push(hash);
    const persisted = await persistWebhookChanges(
      { entry: [{ id: account().wabaId, changes: [{ field: "messages", value }] }] },
      hash
    );
    expect(persisted.inserted).toBe(1);
    const drained = await WhatsappWebhookHandler.processPendingWebhookEvents();
    expect(drained.failed).toBe(0);
  }

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    cast = await provisionWhatsappCast(PREFIX);
    adminContext = await PermissionsService.getUserContext(cast.adminUser.id);
    staffContext = await PermissionsService.getUserContext(cast.staffUser.id);
    // Fallback only: `.env.test` normally provides both; keep keys scoped to
    // this run when the local env file lacks them.
    if (!process.env.WHATSAPP_WABA_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
      process.env.WHATSAPP_WABA_ID = process.env.WHATSAPP_WABA_ID ?? `${PREFIX}-waba-sync`;
      process.env.WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? `${PREFIX}-token-sync`;
      invalidateEnvConfigCache();
    }
    globalThis.fetch = Object.assign(
      mock(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = fetchInputUrl(input);
        const textBody = typeof init?.body === "string" ? init.body : null;
        const parsed: unknown = textBody ? JSON.parse(textBody) : null;
        recordedFetches.push({
          url,
          method: init?.method ?? "GET",
          body: isRecord(parsed) ? parsed : null,
        });
        return metaStub(url);
      }),
      { preconnect: () => undefined }
    );
  });

  afterAll(async () => {
    globalThis.fetch = originalFetch;
    if (previousWabaEnv === undefined) {
      delete process.env.WHATSAPP_WABA_ID;
    } else {
      process.env.WHATSAPP_WABA_ID = previousWabaEnv;
    }
    if (previousTokenEnv === undefined) {
      delete process.env.WHATSAPP_ACCESS_TOKEN;
    } else {
      process.env.WHATSAPP_ACCESS_TOKEN = previousTokenEnv;
    }
    invalidateEnvConfigCache();
    const finalAccount = syncedAccount;
    if (finalAccount) {
      // Append-only audit rows (registry + verify + sends + sync UPSERT, the
      // latter keyed by the env WABA id) reference the account; sweep them
      // with the immutability trigger lifted, mirroring the sibling suite.
      await db.execute(sql`ALTER TABLE audit_logs DISABLE TRIGGER prevent_audit_log_mod_trigger`);
      try {
        await db
          .delete(auditLogs)
          .where(
            and(
              eq(auditLogs.entityType, "WHATSAPP_ACCOUNT"),
              inArray(auditLogs.entityId, [finalAccount.id, finalAccount.wabaId])
            )
          );
      } finally {
        await db.execute(sql`ALTER TABLE audit_logs ENABLE TRIGGER prevent_audit_log_mod_trigger`);
      }
      // Cascades: recipients, conversations, messages, webhook-sync requests.
      await db.delete(whatsappAccounts).where(eq(whatsappAccounts.id, finalAccount.id));
    }
    await cleanupWhatsappCast(cast, webhookHashes);
  });

  test("sync-from-Meta provisions the test number and stamps isTestNumber", async () => {
    const result = await WhatsappAccountService.syncFromMeta(cast.adminUser.id, tErrors);
    const created = result.accounts.find(a => a.phoneNumberId === PHONE_NUMBER_ID);
    expect(created).toBeDefined();
    syncedAccount = created ?? null;
    expect(syncedAccount?.isTestNumber).toBe(true);

    const row = await WhatsappAccountRepository.findById(account().id);
    expect(row?.isTestNumber).toBe(true);
    expect(row?.displayPhoneNumber).toBe(DISPLAY_PHONE);

    const detailCalls = recordedFetches.filter(call => call.url.includes(`/${PHONE_NUMBER_ID}?fields=`));
    expect(detailCalls).toHaveLength(1);
  });

  test("addRecipient registers a PENDING row and writes the audit entry", async () => {
    recipientOne = await addRecipient(RECIPIENT_ONE);
    expect(recipientOne.status).toBe(WhatsappTestRecipientStatus.PENDING);
    expect(recipientOne.phoneNumber).toBe(RECIPIENT_ONE);

    const audits = await db
      .select({ action: auditLogs.action, description: auditLogs.description })
      .from(auditLogs)
      .where(and(eq(auditLogs.entityType, "WHATSAPP_ACCOUNT"), eq(auditLogs.entityId, account().id)));
    const register = audits.find(audit => audit.description === "whatsapp-test-recipient registered");
    expect(register?.action).toBe("CREATE");
  });

  test("verifyRecipient hello_world accept flips the registry row to ALLOWED", async () => {
    const recipient = recipientOne;
    if (!recipient) {
      throw new Error("journey: recipient missing — run the addRecipient step first");
    }
    const sendsBefore = sentMessageCalls().length;
    const verified = await WhatsappConversationsService.verifyRecipient(adminContext, tErrors, {
      actorUserId: cast.adminUser.id,
      recipientId: recipient.id,
    });
    expect(verified.status).toBe(WhatsappTestRecipientStatus.ALLOWED);
    expect(verified.lastErrorCode).toBeNull();
    expect(verified.lastCheckedAt).not.toBeNull();

    const sends = sentMessageCalls();
    expect(sends).toHaveLength(sendsBefore + 1);
    const template = isRecord(sends[sendsBefore]?.body?.template) ? sends[sendsBefore]?.body?.template : undefined;
    expect(template?.name).toBe("hello_world");
    const language = isRecord(template?.language) ? template.language : undefined;
    expect(language?.code).toBe("en_US");
  });

  test("template hello_world send persists API_OUTBOUND and rolls the thread", async () => {
    const result = await WhatsappConversationsService.sendMessage(
      adminContext,
      tErrors,
      sendMessageInput(WhatsappConversationSendMode.TEMPLATE, { templateName: "hello_world" })
    );
    expect(result.message.direction).toBe(WhatsappMessageDirection.API_OUTBOUND);
    expect(result.message.type).toBe("template");
    expect(result.message.status).toBe("sent");
    conversationId = result.message.conversationId;

    const [conversation] = await db
      .select({
        lastMessageAt: whatsappConversations.lastMessageAt,
        preview: whatsappConversations.lastMessagePreview,
        inboundAt: whatsappConversations.lastInboundMessageAt,
      })
      .from(whatsappConversations)
      .where(eq(whatsappConversations.id, conversationId))
      .limit(1);
    expect(conversation?.lastMessageAt).not.toBeNull();
    expect(conversation?.preview).toBe("[template] hello_world");
    expect(conversation?.inboundAt).toBeNull();

    const [messageRow] = await db
      .select({ direction: whatsappMessages.direction, wamid: whatsappMessages.wamid })
      .from(whatsappMessages)
      .where(eq(whatsappMessages.id, result.message.id))
      .limit(1);
    expect(messageRow?.wamid).toBe(result.message.wamid);
  });

  test("free-text waits for the 24h window, then sends after the inbound reply", async () => {
    const blocked = await expectJourneyError(() =>
      WhatsappConversationsService.sendMessage(
        adminContext,
        tErrors,
        sendMessageInput(WhatsappConversationSendMode.TEXT, { body: `${PREFIX} window probe` })
      )
    );
    expect(blocked).toBeInstanceOf(DomainError);
    expect(blocked.message).toBe(tErrors.whatsappOutsideServiceWindow);

    await ingestInbound(`${PREFIX} inbound reply`);

    const [conversation] = await db
      .select({ inboundAt: whatsappConversations.lastInboundMessageAt })
      .from(whatsappConversations)
      .where(eq(whatsappConversations.id, conversationId))
      .limit(1);
    expect(conversation?.inboundAt).not.toBeNull();

    const result = await WhatsappConversationsService.sendMessage(
      adminContext,
      tErrors,
      sendMessageInput(WhatsappConversationSendMode.TEXT, { body: `${PREFIX} free text inside the window` })
    );
    expect(result.message.direction).toBe(WhatsappMessageDirection.API_OUTBOUND);
    expect(result.message.type).toBe("text");

    const [messageRow] = await db
      .select({ content: whatsappMessages.content })
      .from(whatsappMessages)
      .where(eq(whatsappMessages.id, result.message.id))
      .limit(1);
    const content = isRecord(messageRow?.content) ? messageRow.content : undefined;
    expect(content?.body).toBe(`${PREFIX} free text inside the window`);
  });

  test("the sixth recipient on a test number hits the Meta 5-recipient cap", async () => {
    const second = await addRecipient(RECIPIENT_TWO);
    expect(second.status).toBe(WhatsappTestRecipientStatus.PENDING);

    // Fill the remaining three slots (the cap check takes an account-scoped
    // advisory lock, so parallel adds serialize safely), then prove the sixth
    // registration fails.
    await Promise.all([
      addRecipient(`9665${digits(7)}`),
      addRecipient(`9665${digits(7)}`),
      addRecipient(`9665${digits(7)}`),
    ]);
    const capped = await expectJourneyError(() => addRecipient(`9665${digits(7)}`));
    expect(capped).toBeInstanceOf(DomainError);
    expect(capped.message).toBe(tErrors.whatsappRecipientLimitReached);

    const recipients = await WhatsappConversationsService.listRecipients(adminContext, tErrors, {
      accountId: account().id,
    });
    expect(recipients).toHaveLength(5);
  });

  test("a view-only staff actor is denied sends by real permission rows", async () => {
    const sendsBefore = sentMessageCalls().length;
    const denied = await expectJourneyError(() =>
      WhatsappConversationsService.sendMessage(
        staffContext,
        tErrors,
        sendMessageInput(WhatsappConversationSendMode.TEMPLATE, { templateName: "hello_world" })
      )
    );
    expect(denied).toBeInstanceOf(ForbiddenError);
    expect(denied.message).toBe(tErrors.insufficientPermissions);
    expect(sentMessageCalls()).toHaveLength(sendsBefore);
  });

  test("listConversations surfaces the thread with outbound + inbound rows to a view actor", async () => {
    const list = await WhatsappConversationsService.listConversations(staffContext, tErrors, {
      accountId: account().id,
    });
    const conversation = list.rows.find(row => row.waId === RECIPIENT_ONE);
    expect(conversation).toBeDefined();
    expect(conversation?.lastMessageAt).not.toBeNull();
    expect(conversation?.lastInboundMessageAt).not.toBeNull();

    const thread = await WhatsappConversationsService.listConversationMessages(staffContext, tErrors, {
      conversationId: conversation?.id ?? "",
    });
    const wamids = new Set(thread.rows.map(m => m.wamid));
    expect(wamids.has(INBOUND_WAMID)).toBe(true);
    const directions = new Set(thread.rows.map(m => m.direction));
    expect(directions.has(WhatsappMessageDirection.API_OUTBOUND)).toBe(true);
    expect(directions.has(WhatsappMessageDirection.INBOUND)).toBe(true);
  });
});
