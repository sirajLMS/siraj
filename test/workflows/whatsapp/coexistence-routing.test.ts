import { afterAll, beforeAll, describe, expect, mock, spyOn, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import {
  auditLogs,
  notificationDeliveries,
  whatsappContacts,
  whatsappConversations,
  whatsappMessages,
} from "@/backend/db/schema";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { WhatsappMessageDirection, WhatsappSyncStatus } from "@/backend/enum/whatsapp";
import {
  WhatsappAccountPurpose,
  WhatsappSyncRequestStatus,
  WhatsappSyncType,
} from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { ForbiddenError } from "@/backend/lib";
import { WHATSAPP_ACCOUNT_OFFBOARDED_CODE } from "@/backend/lib/errors";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  CommunicationService,
  getChannelForPurpose,
  getWhatsappChannel,
  resetWhatsappChannel,
} from "@/backend/services/communication";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import { NOTIFICATION_TEMPLATE_MAP } from "@/backend/services/notification/notification-payloads.builders";
import { redisService } from "@/backend/services/redis";
import {
  WhatsappAccountService,
  WhatsappCoexistenceSyncService,
  WhatsappInboxService,
  WhatsappWebhookHandler,
} from "@/backend/services/whatsapp";
import { persistWebhookChanges } from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import type { CommunicationPayload } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  cleanupWhatsappCast,
  dispatchTargetsForEvent,
  expectJourneyError,
  provisionWhatsappCast,
  type WhatsappJourneyCast,
} from "@/test/workflows/helpers";

/**
 * J1–J3 of the multi-number/coexistence spec: purpose routing lands template
 * sends on the right number (J1), offboard fails fast and reconnect re-arms
 * (cross-actor EARS), and a coexistence onboarding sync (enqueue + history /
 * state-sync / echo ingest) surfaces threads to staff in the inbox while an
 * unauthorized actor is denied (J2/J3).
 *
 * Real services + real DB, committed fixtures, no rollback wrapper. External
 * boundaries are intercepted at the network edge: `fetch` is stubbed per
 * URL (Graph template sends + smb_app_data sync POSTs) and `redisService`
 * get/set are backed by an in-memory map so pair-rate-limit state is
 * deterministic and nothing reaches a real Redis. The notification dispatch
 * boundary itself (`dispatchWithPreferences`) is spied CALL-THROUGH so the
 * real WhatsApp routing executes while the fan-out targets are asserted.
 */
interface RecordedFetch {
  readonly url: string;
  readonly method: string;
}

/** URL out of any fetch input shape (string / URL / Request). */
function fetchInputUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/**
 * Meta Graph stub: `/smb_app_data` POSTs get `{ request_id }`, everything
 * else is treated as a template send and gets a unique `messages[0].id`
 * (unique wamids keep the `provider_message_id` unique index happy).
 */
function stubResponse(url: string, counters: { wamid: number; request: number }): Response {
  const init = { status: 200, headers: { "content-type": "application/json" } };
  if (url.includes("/smb_app_data")) {
    counters.request += 1;
    return new Response(
      JSON.stringify({ messaging_product: "whatsapp", request_id: `req-jrn-${counters.request}` }),
      init
    );
  }
  counters.wamid += 1;
  return new Response(
    JSON.stringify({ contacts: [{ input: "r", wa_id: "r" }], messages: [{ id: `wamid.jrn${counters.wamid}` }] }),
    init
  );
}

describe("WhatsApp multi-number + coexistence journeys (real services, real DB)", () => {
  const PREFIX = `jrn_wa2_${randomUUID().slice(0, 8)}`;
  /** Parent's WhatsApp number, unique per run so pair keys never collide. */
  const PARENT_WA_ID = `1555${randomUUID().replace(/\D/g, "").slice(0, 7)}`;
  /** Coexistence thread peer + message wamids shared across the J2/J3 tests. */
  const PEER_WA_ID = `9665${randomUUID().replace(/\D/g, "").slice(0, 7)}`;
  const HIST_WAMID = `wamid.hist.${randomUUID().slice(0, 8)}`;
  const ECHO_WAMID = `wamid.echo.${randomUUID().slice(0, 8)}`;
  const INBOUND_WAMID = `wamid.inb.${randomUUID().slice(0, 8)}`;
  const WEBHOOK_TS = "1893450000";

  let tErrors: ErrorsLabels;
  let cast: WhatsappJourneyCast;
  const recordedFetches: RecordedFetch[] = [];
  const webhookHashes: string[] = [];
  const counters = { wamid: 0, request: 0 };
  let dispatchSpy: ReturnType<typeof spyOn>;
  let redisGetSpy: ReturnType<typeof spyOn>;
  let redisSetSpy: ReturnType<typeof spyOn>;
  const originalFetch = globalThis.fetch;

  function whatsappPayload(userId: string, extra: Record<string, unknown>): CommunicationPayload {
    return {
      userId,
      title: "t",
      body: null,
      channel: NotificationChannel.WHATSAPP,
      eventType: NotificationEventType.CLASS_REMINDER,
      metadata: {
        to: PARENT_WA_ID,
        whatsappTemplate: { name: "class_reminder_utility_v1", languageCode: "en", ...extra },
      },
    };
  }

  /** Persist + drain one webhook body through the durable queue (route-internal path). */
  async function ingestWebhook(value: Record<string, unknown>, field: string, wabaId: string): Promise<void> {
    const hash = createHash("sha256")
      .update(`${PREFIX}:${field}:${JSON.stringify(value)}`)
      .digest("hex");
    webhookHashes.push(hash);
    const body = { entry: [{ id: wabaId, changes: [{ field, value }] }] };
    const persisted = await persistWebhookChanges(body, hash);
    expect(persisted.inserted).toBe(1);
    const drained = await WhatsappWebhookHandler.processPendingWebhookEvents();
    expect(drained.failed).toBe(0);
  }

  function accountMetaValue(): Record<string, unknown> {
    return { metadata: { phone_number_id: cast.coexistAccount.phoneNumberId } };
  }

  function stateSyncValue(): Record<string, unknown> {
    return {
      ...accountMetaValue(),
      state_sync: [
        {
          type: "contact",
          action: "add",
          contact: { phone_number: PEER_WA_ID, full_name: `${PREFIX} Peer` },
          metadata: { timestamp: WEBHOOK_TS },
        },
      ],
    };
  }

  function textMessageRecord(direction: "from" | "to", wamid: string, body: string): Record<string, unknown> {
    return { id: wamid, [direction]: PEER_WA_ID, type: "text", text: { body }, timestamp: WEBHOOK_TS };
  }

  function historyChunkValue(): Record<string, unknown> {
    const thread = {
      id: PEER_WA_ID,
      context: { wa_id: PEER_WA_ID },
      messages: [textMessageRecord("from", HIST_WAMID, "hello from history")],
    };
    return {
      ...accountMetaValue(),
      history: [{ metadata: { phase: 0, chunk_order: 0, progress: 100 }, threads: [thread] }],
    };
  }

  function echoValue(): Record<string, unknown> {
    return { ...accountMetaValue(), message_echoes: [textMessageRecord("to", ECHO_WAMID, "echo from the app")] };
  }

  function inboundValue(): Record<string, unknown> {
    const message = textMessageRecord("from", INBOUND_WAMID, "reply from the parent");
    return { ...accountMetaValue(), messages: [message], contacts: [{ wa_id: PEER_WA_ID }] };
  }

  /**
   * The four coexistence webhook deliveries: contact state-sync, the history
   * chunk (progress 100), the companion-app echo, and the peer's reply.
   */
  async function ingestOnboardingArtifacts(): Promise<void> {
    const wabaId = cast.coexistAccount.wabaId;
    await ingestWebhook(stateSyncValue(), "smb_app_state_sync", wabaId);
    await ingestWebhook(historyChunkValue(), "history", wabaId);
    await ingestWebhook(echoValue(), "smb_message_echoes", wabaId);
    await ingestWebhook(inboundValue(), "messages", wabaId);
  }

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    cast = await provisionWhatsappCast(PREFIX);
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences"); // spy ON, calls through
    const redisMap = new Map<string, string>();
    redisGetSpy = spyOn(redisService, "get").mockImplementation(async (key: string) => redisMap.get(key) ?? null);
    redisSetSpy = spyOn(redisService, "set").mockImplementation(async (key: string, value: string) => {
      redisMap.set(key, value);
    });
    const fetchMock = Object.assign(
      mock(async (input: RequestInfo | URL) => {
        const url = fetchInputUrl(input);
        recordedFetches.push({ url, method: "POST" });
        return stubResponse(url, counters);
      }),
      {
        preconnect() {
          // no-op — fetch's static preload hint is irrelevant to the stub
        },
      }
    );
    globalThis.fetch = fetchMock;
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    globalThis.fetch = originalFetch;
    redisGetSpy.mockRestore();
    redisSetSpy.mockRestore();
    // Append-only audit rows (purpose assignment + account_update lifecycle)
    // reference the WABA accounts; sweep them with the immutability trigger
    // lifted, mirroring the adjustment-journey precedent.
    await db.execute(sql`ALTER TABLE audit_logs DISABLE TRIGGER prevent_audit_log_mod_trigger`);
    try {
      await db
        .delete(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, "WHATSAPP_ACCOUNT"),
            inArray(auditLogs.entityId, [cast.adsAccount.id, cast.studentsAccount.id, cast.coexistAccount.id])
          )
        );
    } finally {
      await db.execute(sql`ALTER TABLE audit_logs ENABLE TRIGGER prevent_audit_log_mod_trigger`);
    }
    await resetWhatsappChannel(); // drop journey-run adapters/credentials cache
    await cleanupWhatsappCast(cast, webhookHashes);
  });

  test("J1: admin assigns purposes; the class reminder routes to the students number with delivery attribution", async () => {
    const adminContext = await PermissionsService.getUserContext(cast.adminUser.id);

    const students = await WhatsappAccountService.updateAccountPurpose(
      cast.adminUser.id,
      adminContext,
      tErrors,
      cast.studentsAccount.id,
      WhatsappAccountPurpose.STUDENTS
    );
    expect(students.purpose).toBe(WhatsappAccountPurpose.STUDENTS);
    const ads = await WhatsappAccountService.updateAccountPurpose(
      cast.adminUser.id,
      adminContext,
      tErrors,
      cast.adsAccount.id,
      WhatsappAccountPurpose.ADVERTISING
    );
    expect(ads.purpose).toBe(WhatsappAccountPurpose.ADVERTISING);

    expect((await getChannelForPurpose(WhatsappAccountPurpose.STUDENTS))?.accountId).toBe(cast.studentsAccount.id);

    const templateDef = NOTIFICATION_TEMPLATE_MAP[NotificationEventType.CLASS_REMINDER];
    if (!templateDef) {
      throw new Error("CLASS_REMINDER missing from the template routing map");
    }
    const payload: CommunicationPayload = {
      userId: cast.parentUser.id,
      title: "reminder",
      body: null,
      channel: NotificationChannel.WHATSAPP,
      eventType: NotificationEventType.CLASS_REMINDER,
      metadata: {
        entityKind: "class",
        entityId: cast.classInstance.id,
        studentName: cast.student.name,
        scheduledStartAt: cast.classInstance.scheduledStartAt.toISOString(),
        to: PARENT_WA_ID,
        whatsappTemplate: {
          name: templateDef.templateName,
          languageCode: "en",
          paramsOrder: [...templateDef.paramsOrder],
          purpose: templateDef.purpose,
        },
      },
    };

    const results = await NotificationDispatchHelpers.dispatchWithPreferences([payload], [cast.parentUser.id], "en");
    expect(dispatchTargetsForEvent(dispatchSpy, NotificationEventType.CLASS_REMINDER)).toEqual([cast.parentUser.id]);
    expect(results).toHaveLength(1);
    const sent = results[0];
    expect(sent?.success).toBe(true);
    expect(sent?.providerMessageId).toBeTruthy();

    const sendCalls = recordedFetches.filter(call => call.url.includes("/messages"));
    expect(sendCalls).toHaveLength(1);
    expect(sendCalls[0]?.url).toContain(`/${cast.studentsAccount.phoneNumberId}/messages`);

    const [delivery] = await db
      .select({ status: notificationDeliveries.status, metadata: notificationDeliveries.metadata })
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.providerMessageId, String(sent?.providerMessageId)))
      .limit(1);
    expect(delivery?.status).toBe(NotificationDeliveryStatus.SENT);
    expect(delivery?.metadata?.senderAccountId).toBe(cast.studentsAccount.id);
  });

  test("J1: an ads-purpose send lands on the ads number, and the pair limiter is per (sender, recipient)", async () => {
    const adsResult = await CommunicationService.dispatch(
      whatsappPayload(cast.parentUser.id, {
        name: "ads_reply_utility_v1",
        purpose: WhatsappAccountPurpose.ADVERTISING,
      }),
      "en"
    );
    expect(adsResult.success).toBe(true);
    expect(adsResult.providerMessageId).toBeTruthy();

    const adsCalls = recordedFetches.filter(call => call.url.includes(`/${cast.adsAccount.phoneNumberId}/messages`));
    expect(adsCalls).toHaveLength(1);

    // Same (students number, parent) pair inside the 6s window is deferred —
    // the J1 reminder already recorded the pair; the ads number stayed free.
    const replay = await CommunicationService.dispatch(
      whatsappPayload(cast.parentUser.id, { purpose: WhatsappAccountPurpose.STUDENTS }),
      "en"
    );
    expect(replay.success).toBe(false);
    expect(replay.sendAttempted).toBe(false);
  });

  test("offboard deactivates the number and fails sends fast; reconnect re-arms it", async () => {
    const account = cast.studentsAccount;
    await ingestWebhook(
      { event: "ACCOUNT_OFFBOARDED", waba_id: account.wabaId, phone_number: account.displayPhoneNumber },
      "account_update",
      account.wabaId
    );

    const offboarded = await WhatsappAccountRepository.findById(account.id);
    expect(offboarded?.isActive).toBe(false);
    expect(offboarded?.offboardedAt).not.toBeNull();
    expect(offboarded?.syncStatus).toBe(WhatsappSyncStatus.FAILED);

    // Purpose routing never resolves the offboarded number again.
    expect((await getChannelForPurpose(WhatsappAccountPurpose.STUDENTS))?.accountId ?? null).not.toBe(account.id);

    // An explicit send to the offboarded number fails fast before any Graph call.
    const channel = await getWhatsappChannel(account.id);
    const blocked = await channel.send(
      {
        to: PARENT_WA_ID,
        eventType: NotificationEventType.CLASS_REMINDER,
        userId: cast.parentUser.id,
        template: { name: "class_reminder_utility_v1", languageCode: "en" },
      },
      "en"
    );
    expect(blocked.success).toBe(false);
    expect(blocked.sendAttempted).toBe(false);
    expect(blocked.errorCode).toBe(WHATSAPP_ACCOUNT_OFFBOARDED_CODE);
    expect(recordedFetches.filter(call => call.url.includes(`/${account.phoneNumberId}/messages`))).toHaveLength(1);

    // Meta reconnect lifecycle: the same durable ingest path re-arms the number.
    await ingestWebhook(
      { event: "ACCOUNT_RECONNECTED", waba_id: account.wabaId, phone_number: account.displayPhoneNumber },
      "account_update",
      account.wabaId
    );
    const reconnected = await WhatsappAccountRepository.findById(account.id);
    expect(reconnected?.isActive).toBe(true);
    expect(reconnected?.offboardedAt).toBeNull();
    expect((await getChannelForPurpose(WhatsappAccountPurpose.STUDENTS))?.accountId).toBe(account.id);
  });

  test("J2: onboarding enqueues both one-shot sync POSTs exactly once and tracks request ids", async () => {
    const account = cast.coexistAccount;
    const before = await WhatsappCoexistenceSyncService.getSyncStatus(account.id);
    expect(before?.syncStatus).toBe(WhatsappSyncStatus.NOT_STARTED);
    expect(before?.requests).toHaveLength(0);

    const enqueued = await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(account.id);
    expect(new Set(enqueued.requested)).toEqual(new Set(Object.values(WhatsappSyncType)));

    const syncCalls = recordedFetches.filter(call => call.url.includes(`/${account.phoneNumberId}/smb_app_data`));
    expect(syncCalls).toHaveLength(2);

    const after = await WhatsappCoexistenceSyncService.getSyncStatus(account.id);
    expect(after?.syncStatus).toBe(WhatsappSyncStatus.REQUESTED);
    expect(after?.syncDeadlineAt).not.toBeNull();
    expect(after?.requests).toHaveLength(2);
    expect(after?.requests.every(r => r.status === WhatsappSyncRequestStatus.REQUESTED && r.requestId !== null)).toBe(
      true
    );

    // One-shot guard: re-enqueue never re-POSTs the accepted types.
    const again = await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(account.id);
    expect(again.alreadyRequested).toHaveLength(2);
    expect(recordedFetches.filter(call => call.url.includes("/smb_app_data"))).toHaveLength(2);
  });

  test("J2/J3: history, contact and echo webhook chunks land in the inbox tables and complete the sync", async () => {
    const account = cast.coexistAccount;
    await ingestOnboardingArtifacts();

    const [contact] = await db
      .select({ fullName: whatsappContacts.fullName, removedAt: whatsappContacts.removedAt })
      .from(whatsappContacts)
      .where(and(eq(whatsappContacts.accountId, account.id), eq(whatsappContacts.phoneNumber, PEER_WA_ID)))
      .limit(1);
    expect(contact?.fullName).toBe(`${PREFIX} Peer`);
    expect(contact?.removedAt).toBeNull();

    const [conversation] = await db
      .select({ id: whatsappConversations.id, waId: whatsappConversations.waId })
      .from(whatsappConversations)
      .where(and(eq(whatsappConversations.accountId, account.id), eq(whatsappConversations.waId, PEER_WA_ID)))
      .limit(1);
    expect(conversation).toBeDefined();
    const messages = await db
      .select({ wamid: whatsappMessages.wamid, direction: whatsappMessages.direction })
      .from(whatsappMessages)
      .where(eq(whatsappMessages.conversationId, conversation?.id ?? ""));
    const byWamid = new Map(messages.map(m => [m.wamid, m.direction]));
    expect(byWamid.get(HIST_WAMID)).toBe(WhatsappMessageDirection.INBOUND);
    expect(byWamid.get(ECHO_WAMID)).toBe(WhatsappMessageDirection.ECHO);
    expect(byWamid.get(INBOUND_WAMID)).toBe(WhatsappMessageDirection.INBOUND);

    const overview = await WhatsappCoexistenceSyncService.getSyncStatus(account.id);
    expect(overview?.syncStatus).toBe(WhatsappSyncStatus.COMPLETE);
    expect(overview?.syncProgress).toBe(100);
  });

  test("J2: staff reads the synced inbox over the service layer; the intruder is denied by real permissions", async () => {
    const staffContext = await PermissionsService.getUserContext(cast.staffUser.id);
    const adminContext = await PermissionsService.getUserContext(cast.adminUser.id);
    const intruderContext = await PermissionsService.getUserContext(cast.intruderUser.id);

    const staffList = await WhatsappInboxService.listConversations(staffContext, tErrors, {
      accountId: cast.coexistAccount.id,
    });
    const conversation = staffList.rows.find(row => row.waId === PEER_WA_ID);
    expect(conversation).toBeDefined();
    expect(conversation?.accountPurpose).toBe(WhatsappAccountPurpose.GENERAL);

    const thread = await WhatsappInboxService.listConversationMessages(staffContext, tErrors, {
      conversationId: conversation?.id ?? "",
    });
    const threadWamids = new Set(thread.rows.map(m => m.wamid));
    expect(threadWamids.has(HIST_WAMID)).toBe(true);
    expect(threadWamids.has(ECHO_WAMID)).toBe(true);
    expect(threadWamids.has(INBOUND_WAMID)).toBe(true);

    // academy_admin holds whatsapp.inbox_view via migration — admins read too.
    const adminList = await WhatsappInboxService.listConversations(adminContext, tErrors, {
      accountId: cast.coexistAccount.id,
    });
    expect(adminList.totalCount).toBe(staffList.totalCount);

    // teacher_default has no whatsapp.inbox_view — honest denial.
    const error = await expectJourneyError(() =>
      WhatsappInboxService.listConversations(intruderContext, tErrors, { accountId: cast.coexistAccount.id })
    );
    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error.message).toBe(tErrors.insufficientPermissions);
  });

  test("J3: an app-side revoke echo marks the original message revoked", async () => {
    const account = cast.coexistAccount;
    await ingestWebhook(
      {
        metadata: { phone_number_id: account.phoneNumberId },
        message_echoes: [{ type: "revoke", revoke: { original_message_id: ECHO_WAMID }, timestamp: WEBHOOK_TS }],
      },
      "smb_message_echoes",
      account.wabaId
    );

    const [row] = await db
      .select({ revokedAt: whatsappMessages.revokedAt })
      .from(whatsappMessages)
      .where(eq(whatsappMessages.wamid, ECHO_WAMID))
      .limit(1);
    expect(row?.revokedAt).not.toBeNull();

    // The staff-visible thread still shows the (revoked) echo — no row vanishing.
    const staffContext = await PermissionsService.getUserContext(cast.staffUser.id);
    const list = await WhatsappInboxService.listConversations(staffContext, tErrors, {
      accountId: account.id,
    });
    const conversation = list.rows.find(item => item.waId === PEER_WA_ID);
    const thread = await WhatsappInboxService.listConversationMessages(staffContext, tErrors, {
      conversationId: conversation?.id ?? "",
    });
    expect(new Set(thread.rows.map(m => m.wamid)).has(ECHO_WAMID)).toBe(true);
  });
});
