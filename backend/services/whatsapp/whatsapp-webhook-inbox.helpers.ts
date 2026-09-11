import {
  WhatsappContactRepository,
  WhatsappConversationRepository,
  WhatsappMessageRepository,
} from "@/backend/db/repo/whatsapp";
import { WhatsappMessageDirection } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import { logger } from "@/backend/lib/logger";
import { WhatsappCoexistenceSyncService } from "@/backend/services/whatsapp/whatsapp-coexistence-sync.service";
import { isRecord, isValidWamid, toSafeString } from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import type {
  WhatsappAccountReturnType,
  WhatsappContactSyncInput,
  WhatsappConversationReturnType,
} from "@/backend/types";

/**
 * Inbox-facing ingest projections for the durable webhook worker: history
 * chunks, business-app contact sync, message echoes, inbound messages, and
 * media follow-up correlation. Every helper is idempotent — Meta redelivers
 * payloads for up to 7 days with no ordering guarantee, so every write keys
 * on the wamid / identity / LWW guards implemented by the repositories.
 *
 * Payloads are untrusted parsed JSON: every accessor narrows via guards
 * (`isRecord` / `toSafeString`) rather than casts, and message content is
 * never logged (ids and counts only).
 */

/** History decline error code: the business turned history sharing off. */
const HISTORY_DECLINE_CODE = 2593109;

/** Conversation list preview column cap (schema varchar(140)). */
const PREVIEW_MAX = 140;

/** Fallback type label for messages whose `type` is absent/unparseable. */
const UNKNOWN_MESSAGE_TYPE = "unknown";

/** Meta Unix-seconds timestamp string → Date; anything else → null. */
export function parseWebhookTimestamp(raw: unknown): Date | null {
  if (typeof raw === "string" && /^\d{9,13}$/.test(raw)) {
    const ms = Number(raw) * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/** Flexible peer identity triple (wa_id phone / BSUID / username). */
interface PeerIdentity {
  readonly waId: string | null;
  readonly userId: string | null;
  readonly username: string | null;
}

/** Normalized view of one webhook message record (untrusted input). */
interface NormalizedInboundMessage {
  readonly wamid: string;
  readonly type: string;
  readonly content: Record<string, unknown>;
  readonly sentAt: Date | null;
}

/** Digits-only form used to compare the business sender against a thread `from`. */
function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Read the per-type content object of an untrusted message record: the value
 * of the key named by `type` (e.g. `text`, `image`, `media_placeholder`).
 */
function extractTypedContent(message: Record<string, unknown>): { type: string; content: Record<string, unknown> } {
  const type = toSafeString(message.type) ?? UNKNOWN_MESSAGE_TYPE;
  const content = isRecord(message[type]) ? message[type] : {};
  return { type, content };
}

/** Media asset fields carried by a media typed-content object. */
function mediaFields(content: Record<string, unknown>): {
  mediaId: string | null;
  mediaMime: string | null;
  mediaSha256: string | null;
} {
  return {
    mediaId: toSafeString(content.id) ?? null,
    mediaMime: toSafeString(content.mime_type) ?? null,
    mediaSha256: toSafeString(content.sha256) ?? null,
  };
}

/** Short preview for the conversation rollup; never longer than the column. */
function messagePreview(type: string, content: Record<string, unknown>): string | null {
  const body = toSafeString(content.body);
  if (body) {
    return body.slice(0, PREVIEW_MAX);
  }
  if (type === "media_placeholder" || type === UNKNOWN_MESSAGE_TYPE) {
    return `[media]`; // placeholder rows render a media card; content arrives later
  }
  return `[${type.slice(0, 32)}]`;
}

/** Downgrade an untrusted value to the persisted message type vocabulary. */
function normalizeMessage(raw: unknown): NormalizedInboundMessage | null {
  if (!isRecord(raw)) {
    return null;
  }
  if (!isValidWamid(raw.id)) {
    logger.warn("whatsapp-webhook-inbox: message skipped — invalid wamid", { wamid: String(raw.id).slice(0, 20) });
    return null;
  }
  const { type, content } = extractTypedContent(raw);
  return { wamid: raw.id, type, content, sentAt: parseWebhookTimestamp(raw.timestamp) };
}

/**
 * Upsert the conversation for a peer identity and roll its last-message
 * columns forward. Returns `null` when the payload carries no usable peer
 * identity (the row would be unreachable by the identity indexes).
 */
async function upsertThreadConversation(
  accountId: string,
  peer: PeerIdentity,
  displayName: string | null,
  at: Date,
  preview: string | null
): Promise<WhatsappConversationReturnType | null> {
  if (!peer.waId && !peer.userId) {
    logger.warn("whatsapp-webhook-inbox: payload has no peer identity — message skipped");
    return null;
  }
  return WhatsappConversationRepository.upsertByIdentity({
    accountId,
    waId: peer.waId,
    userId: peer.userId,
    username: peer.username,
    displayName,
    lastMessageAt: at,
    lastMessagePreview: preview,
  });
}

interface ThreadMessageContext {
  readonly direction: WhatsappMessageDirection;
  readonly peer: PeerIdentity;
  readonly displayName?: string | null;
  readonly phase?: number | null;
  readonly chunkOrder?: number | null;
  readonly status?: string | null;
}

/**
 * Idempotent message persist: conversation upsert + `wamid` upsert + sticky
 * conversation rollup. Duplicate deliveries (history + live + inbound of the
 * same wamid) collapse onto the same row via the unique wamid constraint.
 */
async function persistThreadMessage(
  account: WhatsappAccountReturnType,
  raw: unknown,
  ctx: ThreadMessageContext
): Promise<void> {
  const message = normalizeMessage(raw);
  if (!message) {
    return;
  }
  const media = mediaFields(message.content);
  const conversation = await upsertThreadConversation(
    account.id,
    ctx.peer,
    ctx.displayName ?? null,
    message.sentAt ?? new Date(),
    messagePreview(message.type, message.content)
  );
  if (!conversation) {
    return;
  }
  await persistMessageRow(account, conversation.id, message, media, ctx);
}

/** Insert/attach one normalized message row and roll the conversation forward. */
async function persistMessageRow(
  account: WhatsappAccountReturnType,
  conversationId: string,
  message: NormalizedInboundMessage,
  media: ReturnType<typeof mediaFields>,
  ctx: ThreadMessageContext
): Promise<void> {
  const isPlaceholder = message.type === "media_placeholder";
  await WhatsappMessageRepository.upsertByWamid({
    conversationId,
    accountId: account.id,
    wamid: message.wamid,
    direction: ctx.direction,
    type: message.type,
    content: message.content,
    status: ctx.status ?? null,
    mediaPlaceholder: isPlaceholder,
    mediaId: isPlaceholder ? null : media.mediaId,
    mediaMime: isPlaceholder ? null : media.mediaMime,
    mediaSha256: isPlaceholder ? null : media.mediaSha256,
    phase: ctx.phase ?? null,
    chunkOrder: ctx.chunkOrder ?? null,
    sentAt: message.sentAt,
    editedAt: null,
    revokedAt: null,
  });
  const at = message.sentAt ?? new Date();
  await WhatsappConversationRepository.touchLastMessage(conversationId, {
    at,
    preview: messagePreview(message.type, message.content),
    // Only user-sent rows advance the inbound (24h service-window) marker;
    // business-app echoes never do.
    inboundAt: ctx.direction === WhatsappMessageDirection.INBOUND ? at : null,
  });
}

/**
 * Apply an echo `type: "revoke"` marker against the original message.
 * Out-of-order deliveries (revoke before the original is ingested) create a
 * stub row so a later history chunk repair never resurrects the message.
 */
async function applyRevoke(
  account: WhatsappAccountReturnType,
  raw: unknown,
  peer: PeerIdentity,
  direction: WhatsappMessageDirection
): Promise<void> {
  const msg = isRecord(raw) && isRecord(raw.revoke) ? raw.revoke : null;
  const original = toSafeString(msg?.original_message_id);
  if (!original || !isValidWamid(original)) {
    return;
  }
  const at = isRecord(raw) ? (parseWebhookTimestamp(raw.timestamp) ?? new Date()) : new Date();
  const updated = await WhatsappMessageRepository.markRevoked(original, at);
  if (updated) {
    return;
  }
  await persistRevokeStub(account, original, at, peer, direction);
}

/** Stub row for a revoke that arrived before the original message did. */
async function persistRevokeStub(
  account: WhatsappAccountReturnType,
  wamid: string,
  revokedAt: Date,
  peer: PeerIdentity,
  direction: WhatsappMessageDirection
): Promise<void> {
  const conversation = await upsertThreadConversation(account.id, peer, null, revokedAt, "[revoked]");
  if (!conversation) {
    return;
  }
  await WhatsappMessageRepository.upsertByWamid({
    conversationId: conversation.id,
    accountId: account.id,
    wamid,
    direction,
    type: "revoke",
    content: {},
    status: null,
    mediaPlaceholder: false,
    phase: null,
    chunkOrder: null,
    sentAt: null,
    editedAt: null,
    revokedAt,
  });
}

/**
 * Read the nested replacement content of an `edit` echo:
 * `edit.message` is a normal message record whose typed content replaces the
 * original row's content.
 */
function readEditedContent(raw: unknown): { content: Record<string, unknown>; editedAt: Date } | null {
  const edit = isRecord(raw) && isRecord(raw.edit) ? raw.edit : null;
  const original = toSafeString(edit?.original_message_id);
  if (!edit || !original || !isValidWamid(original)) {
    return null;
  }
  const inner = isRecord(edit.message) ? edit.message : null;
  const innerType = inner ? toSafeString(inner.type) : undefined;
  const content = inner && innerType && isRecord(inner[innerType]) ? inner[innerType] : {};
  const editedAt = parseWebhookTimestamp(isRecord(raw) ? raw.timestamp : undefined) ?? new Date();
  return { content: wrapEditContent(innerType, content), editedAt };
}

/** Preserve the edited message's type inside the stored content envelope. */
function wrapEditContent(innerType: string | undefined, content: Record<string, unknown>): Record<string, unknown> {
  return innerType ? { ...content, __edited_type: innerType } : content;
}

/**
 * Apply an `edit` echo: replace the original row's content and stamp
 * `editedAt`. When the original has not been ingested yet, nothing is stored —
 * the original arrives later with its final content via history/echo replay.
 */
async function applyEdit(account: WhatsappAccountReturnType, raw: unknown): Promise<void> {
  const edit = isRecord(raw) && isRecord(raw.edit) ? raw.edit : null;
  const original = toSafeString(edit?.original_message_id);
  if (!original || !isValidWamid(original)) {
    return;
  }
  const parsed = readEditedContent(raw);
  if (!parsed) {
    return;
  }
  const updated = await WhatsappMessageRepository.applyEdit(original, parsed);
  if (!updated) {
    logger.warn("whatsapp-webhook-inbox: edit arrived before the original message; skipped", {
      accountId: account.id,
      wamid: original,
    });
  }
}

/** True when a mutating echo (`revoke`/`edit`) rather than a content message. */
function isMutationType(type: unknown): boolean {
  return type === "revoke" || type === "edit";
}

/**
 * Correlate a media follow-up delivery with its placeholder row: flips
 * `mediaPlaceholder` off and persists the asset identity. Webhook-delivered
 * asset ids are fetchable for 7 days after THIS webhook's receipt (the 14-day
 * figure is only the history follow-up eligibility cutoff), so the id is
 * persisted immediately and any binary fetch happens within that window.
 * When the placeholder row has not arrived yet (out-of-order delivery), the
 * message is upserted directly with content — wamid keying makes either order
 * converge.
 */
export async function ingestMediaFollowUps(
  account: WhatsappAccountReturnType,
  raw: unknown,
  direction: WhatsappMessageDirection
): Promise<void> {
  if (!Array.isArray(raw)) {
    return;
  }
  // Items are independent wamid-keyed upserts — parallelize the batch.
  await Promise.all(raw.map(entry => correlateMediaFollowUp(account, entry, direction)));
}

/** Single follow-up: attach to the stored row or persist it as the original. */
async function correlateMediaFollowUp(
  account: WhatsappAccountReturnType,
  raw: unknown,
  direction: WhatsappMessageDirection
): Promise<void> {
  const message = normalizeMessage(raw);
  if (!message) {
    return;
  }
  const existing = await WhatsappMessageRepository.findByWamid(message.wamid);
  if (existing?.mediaPlaceholder) {
    const media = mediaFields(message.content);
    await WhatsappMessageRepository.attachMedia(message.wamid, { ...media, content: message.content });
    return;
  }
  if (existing) {
    return; // already carries the real media — replay is a no-op
  }
  const peer = direction === WhatsappMessageDirection.ECHO ? followUpEchoPeer(raw) : followUpInboundPeer(raw);
  await persistThreadMessage(account, raw, { direction, peer });
}

/** Echo-path peer for a follow-up surfaced without a contacts block. */
function followUpEchoPeer(raw: unknown): PeerIdentity {
  const record = isRecord(raw) ? raw : {};
  return { waId: toSafeString(record.to) ?? null, userId: toSafeString(record.to_user_id) ?? null, username: null };
}

/** Inbound-path peer for a follow-up surfaced without a contacts block. */
function followUpInboundPeer(raw: unknown): PeerIdentity {
  const record = isRecord(raw) ? raw : {};
  return { waId: toSafeString(record.from) ?? null, userId: toSafeString(record.from_user_id) ?? null, username: null };
}

// ─── smb_app_state_sync ─────────────────────────────────────────────────────

/**
 * Ingest one `state_sync` item (`type: "contact"`, add/remove with LWW
 * timestamp). Unknown item shapes are skipped — Meta forwards exactly these
 * shapes, and anything unrecognized must not poison the event.
 */
export function contactSyncActionOf(item: Record<string, unknown>): "add" | "remove" | null {
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
export async function ingestStateSyncValue(
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
export async function ingestEchoMessage(
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
export async function ingestEchoesValue(
  account: WhatsappAccountReturnType,
  value: Record<string, unknown>
): Promise<void> {
  const echoes = Array.isArray(value.message_echoes) ? value.message_echoes.filter(isRecord) : [];
  const contacts = Array.isArray(value.contacts) ? value.contacts.filter(isRecord) : [];
  // Echo rows are independent per wamid; revoke/edit target original wamids.
  await Promise.all(echoes.map(echo => ingestEchoMessage(account, echo, contacts)));
}

/**
 * Ingest the inbound branch of a `messages` change: user → business messages
 * (the route no longer strips them). Edit/revoke of user messages also arrive
 * here per Meta's reference shape.
 */
export async function ingestInboundMessages(
  account: WhatsappAccountReturnType,
  value: Record<string, unknown>
): Promise<void> {
  const messages = Array.isArray(value.messages) ? value.messages : [];
  const contacts = Array.isArray(value.contacts) ? value.contacts.filter(isRecord) : [];
  const usernames = contactUsernameMap(contacts);
  const names = contactNameMap(contacts);
  await Promise.all(messages.filter(isRecord).map(raw => ingestInboundMessage(account, raw, usernames, names)));
}

/** One inbound record: revoke/edit mutations or a user-sent content message. */
async function ingestInboundMessage(
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
 * Ingest a `history` change value: every chunk plus the optional media
 * follow-up payloads (`messages` for user→business, `message_echoes` for
 * business→user) that Meta delivers on the same or a later history webhook.
 */
export async function ingestHistoryValue(
  account: WhatsappAccountReturnType,
  value: Record<string, unknown>
): Promise<void> {
  const chunks = Array.isArray(value.history) ? value.history.filter(isRecord) : [];
  // Chunks target per-thread upserts keyed on (phase, chunk_order) — parallel-safe.
  await Promise.all(chunks.map(chunk => ingestHistoryChunk(account, chunk)));
  await Promise.all([
    ingestMediaFollowUps(account, value.messages, WhatsappMessageDirection.INBOUND),
    ingestMediaFollowUps(account, value.message_echoes, WhatsappMessageDirection.ECHO),
  ]);
}

/**
 * Peer identity for an echo (business → user): the peer is the recipient
 * (`to` / `to_user_id`), enriched with the contacts[] username when present.
 */
export function echoPeer(raw: Record<string, unknown>, usernames: Map<string, string>): PeerIdentity {
  const waId = toSafeString(raw.to) ?? null;
  const userId = toSafeString(raw.to_user_id) ?? null;
  const username = (waId ? usernames.get(waId) : undefined) ?? (userId ? usernames.get(userId) : undefined) ?? null;
  return { waId, userId, username };
}

/** Peer identity for an inbound (user → business) record: the sender. */
export function inboundPeer(raw: Record<string, unknown>, usernames: Map<string, string>): PeerIdentity {
  const waId = toSafeString(raw.from) ?? null;
  const userId = toSafeString(raw.from_user_id) ?? null;
  const username = (waId ? usernames.get(waId) : undefined) ?? (userId ? usernames.get(userId) : undefined) ?? null;
  return { waId, userId, username };
}

/** Map of wa_id/user_id → username from a webhook `contacts[]` array. */
export function contactUsernameMap(rawContacts: unknown): Map<string, string> {
  const map = new Map<string, string>();
  if (!Array.isArray(rawContacts)) {
    return map;
  }
  for (const raw of rawContacts) {
    if (!isRecord(raw)) {
      continue;
    }
    const username =
      toSafeString(raw.username) ?? (isRecord(raw.profile) ? toSafeString(raw.profile.username) : undefined);
    if (!username) {
      continue;
    }
    for (const key of [toSafeString(raw.wa_id), toSafeString(raw.user_id)]) {
      if (key) {
        map.set(key, username);
      }
    }
  }
  return map;
}

/** Map of wa_id/user_id → display name from a webhook `contacts[]` array. */
export function contactNameMap(rawContacts: unknown): Map<string, string> {
  const map = new Map<string, string>();
  if (!Array.isArray(rawContacts)) {
    return map;
  }
  for (const raw of rawContacts) {
    if (!isRecord(raw)) {
      continue;
    }
    const name = isRecord(raw.profile) ? (toSafeString(raw.profile.name) ?? null) : null;
    if (!name) {
      continue;
    }
    for (const key of [toSafeString(raw.wa_id), toSafeString(raw.user_id)]) {
      if (key) {
        map.set(key, name);
      }
    }
  }
  return map;
}
