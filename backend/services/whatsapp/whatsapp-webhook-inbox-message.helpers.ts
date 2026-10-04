/**
 * Message-core internals for the inbox-facing webhook helpers
 * (`whatsapp-webhook-inbox.helpers.ts`): untrusted message narrowing, peer
 * identity, and the idempotent conversation/message persistence pair.
 */

import { WhatsappConversationRepository, WhatsappMessageRepository } from "@/backend/db/repo/whatsapp";
import { WhatsappMessageDirection } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import { logger } from "@/backend/lib/logger";
import { isRecord, isValidWamid, toSafeString } from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import type { WhatsappAccountReturnType, WhatsappConversationReturnType } from "@/backend/types";

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
export interface PeerIdentity {
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
export function digitsOnly(raw: string): string {
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
export function mediaFields(content: Record<string, unknown>): {
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
export function normalizeMessage(raw: unknown): NormalizedInboundMessage | null {
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
export async function upsertThreadConversation(
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
export async function persistThreadMessage(
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
