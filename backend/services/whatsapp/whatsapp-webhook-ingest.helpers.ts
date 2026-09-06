import { WhatsappAccountRepository, WhatsappWebhookEventRepository } from "@/backend/db/repo/whatsapp";
import { logger } from "@/backend/lib/logger";
import { WhatsappAccountService } from "@/backend/services/whatsapp/whatsapp-account.service";
import type {
  WhatsappAccountReturnType,
  WhatsappWebhookEventInsertType,
  WhatsappWebhookIngestResult,
} from "@/backend/types";

/**
 * Route-side and worker-side shared plumbing for the durable webhook event
 * queue: payload fan-out into per-change event rows with a short exact-replay
 * window, plus small shape guards shared by the field handlers.
 *
 * Durability model: Meta retries deliveries for up to 7 days and may replay
 * byte-identical bodies (retries of the same POST). Entity-level upserts
 * (wamid, contact LWW, chunk keys) make long-window redelivery safe; the
 * short window here only collapses rapid-fire identical POSTs so bursts do
 * not inflate the queue.
 */

/** Exact-replay dedupe horizon: identical body hashes inside this window are acked without re-inserting. */
export const WEBHOOK_REPLAY_WINDOW_MS = 5 * 60 * 1000;

/**
 * Meta usually delivers a single change per POST but documents bursts up to
 * `max_batch_size` updates; the durable queue must absorb bursts without
 * dropping any change.
 */
const UNKNOWN_FIELD = "unknown";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Narrow an unknown payload member to a non-empty string. */
export function toSafeString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * WhatsApp message id (wamid) format check: alphanumeric with underscore /
 * dot / hyphen, 8–128 chars, at least one alphanumeric. Shared by the status
 * path and the inbox ingest path.
 */
export function isValidWamid(wamid: unknown): wamid is string {
  return (
    typeof wamid === "string" && wamid.length >= 8 && wamid.length <= 128 && /^(?=.*[a-zA-Z0-9])[\w.-]+$/.test(wamid)
  );
}

/**
 * Flatten a parsed webhook body into one durable event row per `change`.
 * The stored payload keeps the raw `value`, the change field name, and the
 * owning entry's WABA id so the worker can re-dispatch without the envelope.
 */
export function collectEventRows(body: unknown, payloadHash: string): WhatsappWebhookEventInsertType[] {
  if (!isRecord(body) || !Array.isArray(body.entry)) {
    return [];
  }
  const rows: WhatsappWebhookEventInsertType[] = [];
  for (const entry of body.entry) {
    if (!isRecord(entry) || !Array.isArray(entry.changes)) {
      continue;
    }
    const wabaId = toSafeString(entry.id) ?? null;
    for (const change of entry.changes) {
      if (!isRecord(change)) {
        continue;
      }
      rows.push({
        accountId: null,
        field: (toSafeString(change.field) ?? UNKNOWN_FIELD).slice(0, 64),
        payload: {
          field: toSafeString(change.field) ?? null,
          value: isRecord(change.value) ? change.value : null,
          wabaId,
        },
        payloadHash,
      });
    }
  }
  return rows;
}

/**
 * Persist one webhook payload as durable event rows BEFORE the route acks.
 * An identical `payloadHash` inside the replay window is acked but not
 * inserted again (the original delivery's rows are already queued); beyond
 * the window the same body inserts fresh rows and dedupe happens at the
 * entity level (wamid / chunk keys / LWW timestamps).
 */
export async function persistWebhookChanges(body: unknown, payloadHash: string): Promise<WhatsappWebhookIngestResult> {
  const since = new Date(Date.now() - WEBHOOK_REPLAY_WINDOW_MS);
  if (await WhatsappWebhookEventRepository.existsRecentByHash(payloadHash, since)) {
    logger.info("whatsapp-webhook-ingest: exact replay inside dedupe window — acked without insert");
    return { inserted: 0, skippedReplay: true };
  }
  const rows = collectEventRows(body, payloadHash);
  if (rows.length === 0) {
    return { inserted: 0, skippedReplay: false };
  }
  const inserted = await WhatsappWebhookEventRepository.insertBatch(rows);
  return { inserted, skippedReplay: false };
}

/**
 * Resolve the account owning a per-number webhook value via
 * `value.metadata.phone_number_id`; the entry WABA id (when present) must
 * match the stored account to guard against cross-tenant replays. Returns
 * `null` when the payload cannot be trusted or matched — callers decide
 * whether that is retryable (worker) or skippable (legacy in-memory path).
 */
export async function resolveAccountByPhoneNumberId(
  value: Record<string, unknown>,
  wabaId: string
): Promise<WhatsappAccountReturnType | null> {
  const metadata = isRecord(value.metadata) ? value.metadata : {};
  const phoneNumberId = toSafeString(metadata.phone_number_id) ?? toSafeString(value.phone_number_id);
  if (!phoneNumberId || phoneNumberId.length > 64) {
    return null;
  }
  const account = await WhatsappAccountService.systemFindByPhoneNumberId(phoneNumberId);
  if (!account) {
    logger.warn("whatsapp-webhook-ingest: no account for phone_number_id", { phoneNumberId });
    return null;
  }
  if (wabaId && account.wabaId && wabaId !== account.wabaId) {
    logger.error("whatsapp-webhook-ingest: entry WABA id does not match the stored account", {
      phoneNumberId,
    });
    return null;
  }
  return account;
}

/**
 * Resolve the account an `account_update` lifecycle event applies to.
 * Lifecycle payloads carry `phone_number`/`waba_id` (never `phone_number_id`),
 * and reconnect events must still find accounts deactivated by an earlier
 * offboard, so resolution goes through the WABA-scoped lookup plus an
 * optional display-number suffix disambiguation for multi-number WABAs.
 */
export async function resolveLifecycleAccount(
  value: Record<string, unknown>,
  entryWabaId: string
): Promise<WhatsappAccountReturnType | null> {
  const wabaId = toSafeString(value.waba_id) ?? entryWabaId;
  if (!wabaId) {
    return null;
  }
  const candidates = await WhatsappAccountRepository.findByWabaId(wabaId);
  if (candidates.length === 0) {
    logger.warn("whatsapp-webhook-ingest: lifecycle event for unknown WABA", { wabaId });
    return null;
  }
  if (candidates.length === 1) {
    return candidates[0];
  }
  return disambiguateByPhoneNumber(candidates, toSafeString(value.phone_number));
}

function disambiguateByPhoneNumber(
  candidates: WhatsappAccountReturnType[],
  phoneNumber: string | undefined
): WhatsappAccountReturnType | null {
  if (!phoneNumber) {
    return candidates[0];
  }
  const wanted = phoneNumber.replace(/\D/g, "");
  const matches = candidates.filter(candidate => {
    const stored = candidate.displayPhoneNumber?.replace(/\D/g, "") ?? "";
    return stored.length > 0 && (stored === wanted || stored.endsWith(wanted) || wanted.endsWith(stored));
  });
  if (matches.length === 1) {
    return matches[0];
  }
  logger.warn("whatsapp-webhook-ingest: ambiguous lifecycle account; applying to the oldest WABA number", {
    candidateCount: candidates.length,
  });
  return candidates[0];
}
