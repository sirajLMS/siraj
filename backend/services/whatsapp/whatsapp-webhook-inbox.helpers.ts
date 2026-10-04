import {
  applyStateSync,
  ingestEchoes,
  ingestHistory,
  ingestInbound,
} from "@/backend/services/whatsapp/whatsapp-webhook-inbox-ingest.helpers";
import type { WhatsappAccountReturnType } from "@/backend/types";

/**
 * Inbox-facing ingest projections for the durable webhook worker: history
 * chunks, business-app contact sync, message echoes, inbound messages, and
 * media follow-up correlation. Every helper is idempotent — Meta redelivers
 * payloads for up to 7 days with no ordering guarantee, so every write keys
 * on the wamid / identity / LWW guards implemented by the repositories.
 *
 * Payloads are untrusted parsed JSON: every accessor narrows via guards
 * (`isRecord` / `toSafeString`) rather than casts, and message content is
 * never logged (ids and counts only). The per-shape work lives in the sibling
 * `*-ingest` / `*-message` / `*-mutation` helper modules.
 */

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
  await applyStateSync(account, value);
}

/** Ingest an `smb_message_echoes` change value. */
export async function ingestEchoesValue(
  account: WhatsappAccountReturnType,
  value: Record<string, unknown>
): Promise<void> {
  await ingestEchoes(account, value);
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
  await ingestInbound(account, value);
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
  await ingestHistory(account, value);
}
