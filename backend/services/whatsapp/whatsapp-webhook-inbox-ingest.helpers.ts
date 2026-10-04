/**
 * Ingest orchestration for the inbox-facing webhook helpers
 * (`whatsapp-webhook-inbox.helpers.ts`): contact sync, echo/inbound records,
 * and history chunks, each delegating persistence to the message/mutation
 * helpers.
 */

import { WhatsappContactRepository, WhatsappMessageRepository } from "@/backend/db/repo/whatsapp";
import { WhatsappMessageDirection } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import { logger } from "@/backend/lib/logger";
import { WhatsappCoexistenceSyncService } from "@/backend/services/whatsapp/whatsapp-coexistence-sync.service";
import {
  digitsOnly,
  type PeerIdentity,
  parseWebhookTimestamp,
  persistThreadMessage,
} from "@/backend/services/whatsapp/whatsapp-webhook-inbox-message.helpers";
import {
  applyEdit,
  applyRevoke,
  contactNameMap,
  contactUsernameMap,
  echoPeer,
  inboundPeer,
  ingestMediaFollowUps,
  isMutationType,
} from "@/backend/services/whatsapp/whatsapp-webhook-inbox-mutation.helpers";
import { isRecord, toSafeString } from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import type { WhatsappAccountReturnType, WhatsappContactSyncInput } from "@/backend/types";

/** History decline error code: the business turned history sharing off. */
const HISTORY_DECLINE_CODE = 2593109;

// ─── smb_app_state_sync ─────────────────────────────────────────────────────

/**
 * Ingest one `state_sync` item (`type: "contact"`, add/remove with LWW
 * timestamp). Unknown item shapes are skipped — Meta forwards exactly these
 * shapes, and anything unrecognized must not poison the event.
 */
function contactSyncActionOf(item: Record<string, unknown>): "add" | "remove" | null {
  if (item.action === "add" || item.action === "remove") {
    return item.action;
  }
  return null;
}

/** Project a state-sync item into the repository input. */
function contactSyncInputOf(
  accountId: string,
  item: Record<string, unknown>,
  action: "add" | "remove"
): WhatsappContactSyncInput | null {
  if (item.type !== undefined && item.type !== "contact") {
    return null;
  }
  const contact = isRecord(item.contact) ? item.contact : null;
  if (!contact) {
    return null;
  }
  const phoneNumber = toSafeString(contact.phone_number) ?? null;
  const userId = toSafeString(contact.user_id) ?? null;
  if (!phoneNumber && !userId) {
    return null;
  }
  const metadata = isRecord(item.metadata) ? item.metadata : {};
  const actionAt = parseWebhookTimestamp(metadata.timestamp) ?? new Date();
  return {
    accountId,
    phoneNumber,
    userId,
    username: toSafeString(contact.username) ?? null,
    fullName: toSafeString(contact.full_name) ?? null,
    firstName: toSafeString(contact.first_name) ?? null,
    action,
    actionAt,
  };
}

/**
 * Ingest an `smb_app_state_sync` value: the initial one-shot contacts burst
 * AND the ongoing mirror feed (later add/edit/remove in the Business app).
 * The first contact receipt also completes the contacts leg of the account's
 * onboarding sync state machine.
 */
export async function applyStateSync(
  account: WhatsappAccountReturnType,
  value: Record<string, unknown>
): Promise<void> {
  const items = Array.isArray(value.state_sync) ? value.state_sync : [];
  const inputs = items
    .filter(isRecord)
    .map(item => {
      const action = contactSyncActionOf(item);
      return action ? contactSyncInputOf(account.id, item, action) : null;
    })
    .filter((input): input is NonNullable<typeof input> => input !== null);
  // LWW timestamp guards make parallel item ingestion safe.
  await Promise.all(inputs.map(input => WhatsappContactRepository.upsertFromSyncAction(input)));
  if (inputs.length > 0) {
    await WhatsappCoexistenceSyncService.markContactsSyncComplete(account.id);
    logger.info("whatsapp-webhook-inbox: contact sync applied", { accountId: account.id, applied: inputs.length });
  }
}

// ─── smb_message_echoes + inbound messages ──────────────────────────────────

/**
 * Ingest one echo record: revoke/edit mutate the original row; everything
 * else is a business-app send mirrored into the inbox (direction ECHO).
 */
async function ingestEchoRecord(
  account: WhatsappAccountReturnType,
  raw: Record<string, unknown>,
  contacts: Record<string, unknown>[]
): Promise<void> {
  const usernames = contactUsernameMap(contacts);
  const names = contactNameMap(contacts);
  const peer = echoPeer(raw, usernames);
  if (isMutationType(raw.type)) {
    if (raw.type === "revoke") {
      await applyRevoke(account, raw, peer, WhatsappMessageDirection.ECHO);
    } else {
      await applyEdit(account, raw);
    }
    return;
  }
  const displayName = peer.waId ? (names.get(peer.waId) ?? null) : null;
  await persistThreadMessage(account, raw, { direction: WhatsappMessageDirection.ECHO, peer, displayName });
}

/** Ingest an `smb_message_echoes` change value. */
export async function ingestEchoes(account: WhatsappAccountReturnType, value: Record<string, unknown>): Promise<void> {
  const echoes = Array.isArray(value.message_echoes) ? value.message_echoes.filter(isRecord) : [];
  const contacts = Array.isArray(value.contacts) ? value.contacts.filter(isRecord) : [];
  // Echo rows are independent per wamid; revoke/edit target original wamids.
  await Promise.all(echoes.map(echo => ingestEchoRecord(account, echo, contacts)));
}

/** One inbound record: revoke/edit mutations or a user-sent content message. */
async function ingestInboundRecord(
  account: WhatsappAccountReturnType,
  raw: Record<string, unknown>,
  usernames: Map<string, string>,
  names: Map<string, string>
): Promise<void> {
  const peer = inboundPeer(raw, usernames);
  if (isMutationType(raw.type)) {
    if (raw.type === "revoke") {
      await applyRevoke(account, raw, peer, WhatsappMessageDirection.INBOUND);
    } else {
      await applyEdit(account, raw);
    }
    return;
  }
  const displayName = peer.waId ? (names.get(peer.waId) ?? null) : null;
  await persistThreadMessage(account, raw, { direction: WhatsappMessageDirection.INBOUND, peer, displayName });
}

/**
 * Ingest the inbound branch of a `messages` change: user → business messages
 * (the route no longer strips them). Edit/revoke of user messages also arrive
 * here per Meta's reference shape.
 */
export async function ingestInbound(account: WhatsappAccountReturnType, value: Record<string, unknown>): Promise<void> {
  const messages = Array.isArray(value.messages) ? value.messages : [];
  const contacts = Array.isArray(value.contacts) ? value.contacts.filter(isRecord) : [];
  const usernames = contactUsernameMap(contacts);
  const names = contactNameMap(contacts);
  await Promise.all(messages.filter(isRecord).map(raw => ingestInboundRecord(account, raw, usernames, names)));
}

// ─── history ────────────────────────────────────────────────────────────────

/** Direction of a history message: `to*` marks a business→user echo. */
function historyDirection(account: WhatsappAccountReturnType, raw: Record<string, unknown>): WhatsappMessageDirection {
  if (toSafeString(raw.to) ?? toSafeString(raw.to_user_id)) {
    return WhatsappMessageDirection.ECHO;
  }
  const from = toSafeString(raw.from);
  const business = account.displayPhoneNumber ? digitsOnly(account.displayPhoneNumber) : "";
  if (from && business && digitsOnly(from) === business) {
    return WhatsappMessageDirection.ECHO;
  }
  return WhatsappMessageDirection.INBOUND;
}

/** True when a history chunk carries the business decline (Meta 2593109). */
function chunkDeclined(chunk: Record<string, unknown>): boolean {
  const errors = Array.isArray(chunk.errors) ? chunk.errors : [];
  return errors.some((error: unknown) => isRecord(error) && error.code === HISTORY_DECLINE_CODE);
}

/** Numeric metadata accessor — returns null unless a finite number. */
function asNumber(raw: unknown): number | null {
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

/** Ingest every message of one history thread into its conversation. */
async function ingestHistoryThread(
  account: WhatsappAccountReturnType,
  thread: Record<string, unknown>,
  phase: number,
  chunkOrder: number
): Promise<void> {
  const context = isRecord(thread.context) ? thread.context : {};
  const peer: PeerIdentity = {
    waId: toSafeString(context.wa_id) ?? toSafeString(thread.id) ?? null,
    userId: toSafeString(context.user_id) ?? null,
    username: toSafeString(context.username) ?? null,
  };
  const messages = Array.isArray(thread.messages) ? thread.messages.filter(isRecord) : [];
  await Promise.all(
    messages.map(raw => {
      const status = isRecord(raw.history_context) ? toSafeString(raw.history_context.status) : undefined;
      return persistThreadMessage(account, raw, {
        direction: historyDirection(account, raw),
        peer,
        phase,
        chunkOrder,
        status,
      });
    })
  );
}

/**
 * Ingest one history chunk: messages are upserted per thread (wamid-keyed),
 * the chunk key `(accountId, phase, chunk_order)` dedupes redeliveries, and
 * the chunk's progress streams into the account sync state machine.
 * Declines (Meta 2593109) terminally fail the history sync instead.
 */
async function ingestHistoryChunk(account: WhatsappAccountReturnType, chunk: Record<string, unknown>): Promise<void> {
  if (chunkDeclined(chunk)) {
    await WhatsappCoexistenceSyncService.handleHistoryDeclined(account.id);
    return;
  }
  const metadata = isRecord(chunk.metadata) ? chunk.metadata : {};
  const phase = asNumber(metadata.phase) ?? 0;
  const chunkOrder = asNumber(metadata.chunk_order) ?? 0;
  const progress = asNumber(metadata.progress) ?? 0;

  const alreadyIngested = await WhatsappMessageRepository.hasChunk(account.id, phase, chunkOrder);
  if (!alreadyIngested) {
    const threads = Array.isArray(chunk.threads) ? chunk.threads.filter(isRecord) : [];
    // Threads are independent conversations — parallelize message batch upserts.
    await Promise.all(threads.map(thread => ingestHistoryThread(account, thread, phase, chunkOrder)));
  }
  await WhatsappCoexistenceSyncService.recordHistoryProgress(account.id, phase, progress);
}

/**
 * Ingest a `history` change value: every chunk plus the optional media
 * follow-up payloads (`messages` for user→business, `message_echoes` for
 * business→user) that Meta delivers on the same or a later history webhook.
 */
export async function ingestHistory(account: WhatsappAccountReturnType, value: Record<string, unknown>): Promise<void> {
  const chunks = Array.isArray(value.history) ? value.history.filter(isRecord) : [];
  // Chunks target per-thread upserts keyed on (phase, chunk_order) — parallel-safe.
  await Promise.all(chunks.map(chunk => ingestHistoryChunk(account, chunk)));
  await Promise.all([
    ingestMediaFollowUps(account, value.messages, WhatsappMessageDirection.INBOUND),
    ingestMediaFollowUps(account, value.message_echoes, WhatsappMessageDirection.ECHO),
  ]);
}
