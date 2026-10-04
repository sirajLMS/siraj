/**
 * Mutation / media-follow-up internals for the inbox-facing webhook helpers
 * (`whatsapp-webhook-inbox.helpers.ts`): revoke/edit echoes, media follow-up
 * correlation, and peer-identity extraction from untrusted records.
 */

import { WhatsappMessageRepository } from "@/backend/db/repo/whatsapp";
import { WhatsappMessageDirection } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import { logger } from "@/backend/lib/logger";
import {
  mediaFields,
  normalizeMessage,
  type PeerIdentity,
  parseWebhookTimestamp,
  persistThreadMessage,
  upsertThreadConversation,
} from "@/backend/services/whatsapp/whatsapp-webhook-inbox-message.helpers";
import { isRecord, isValidWamid, toSafeString } from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import type { WhatsappAccountReturnType } from "@/backend/types";

/**
 * Apply an echo `type: "revoke"` marker against the original message.
 * Out-of-order deliveries (revoke before the original is ingested) create a
 * stub row so a later history chunk repair never resurrects the message.
 */
export async function applyRevoke(
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
export async function applyEdit(account: WhatsappAccountReturnType, raw: unknown): Promise<void> {
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
export function isMutationType(type: unknown): boolean {
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

/** Build a wa_id/user_id → value map from a webhook `contacts[]` array. */
function contactValueMap(
  rawContacts: unknown,
  extractValue: (raw: Record<string, unknown>) => string | null
): Map<string, string> {
  const map = new Map<string, string>();
  if (!Array.isArray(rawContacts)) {
    return map;
  }
  for (const raw of rawContacts) {
    if (!isRecord(raw)) {
      continue;
    }
    const value = extractValue(raw);
    if (!value) {
      continue;
    }
    for (const key of [toSafeString(raw.wa_id), toSafeString(raw.user_id)]) {
      if (key) {
        map.set(key, value);
      }
    }
  }
  return map;
}

/** Map of wa_id/user_id → username from a webhook `contacts[]` array. */
export function contactUsernameMap(rawContacts: unknown): Map<string, string> {
  return contactValueMap(rawContacts, raw => {
    const username =
      toSafeString(raw.username) ?? (isRecord(raw.profile) ? toSafeString(raw.profile.username) : undefined);
    return username ?? null;
  });
}

/** Map of wa_id/user_id → display name from a webhook `contacts[]` array. */
export function contactNameMap(rawContacts: unknown): Map<string, string> {
  return contactValueMap(rawContacts, raw => (isRecord(raw.profile) ? (toSafeString(raw.profile.name) ?? null) : null));
}
