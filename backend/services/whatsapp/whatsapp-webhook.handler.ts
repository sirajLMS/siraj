import { WhatsappWebhookEventRepository } from "@/backend/db/repo/whatsapp";
import { logger } from "@/backend/lib/logger";
import { collectEntryChanges, isWebhookEntry } from "@/backend/services/whatsapp/whatsapp-webhook-dispatch.helpers";
import { drainClaimedEvents, drainSweepRounds } from "@/backend/services/whatsapp/whatsapp-webhook-durable.helpers";
import { isRecord } from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import { logRejectedResult } from "@/backend/services/whatsapp/whatsapp-webhook-status.helpers";
import type { WhatsappWebhookSweepResult, WhatsappWebhookWorkerResult } from "@/backend/types";

export { WHATSAPP_SYNC_FAILURE_ACCOUNT_OFFBOARDED } from "@/backend/services/whatsapp/whatsapp-webhook-account.helpers";

/**
 * WhatsApp webhook handler — processes inbound webhook events from Meta Cloud API.
 *
 * Durable ingest model: the route persists one `whatsapp_webhook_events` row
 * per change BEFORE acking 200; `after()` and the sweeper cron then call
 * `processPendingWebhookEvents` / `sweepPendingWebhookEvents`, which claim
 * PENDING rows (SKIP LOCKED → PROCESSING), dispatch them through the field
 * routers in the sibling `whatsapp-webhook-*.helpers` modules, and mark
 * PROCESSED. Failed dispatches stay PROCESSING and are re-claimed by the
 * sweeper once their backoff horizon elapses; rows that exhaust the attempt
 * budget are parked FAILED.
 *
 * `processEvent` remains as the in-memory dispatcher over a raw body (status
 * delivery path parity + tests); the durable row path is the production flow.
 *
 * Security: payloads are untrusted parsed JSON (guard-narrowed, never logged
 * w/ content); failures log ids and counts only.
 */

/** Events the inbox dispatcher handles (others fall through to the generic path). */
const EVENT_CLAIM_LIMIT = 100;
const WEBHOOK_EVENT_MAX_ATTEMPTS = 8;

export const WhatsappWebhookHandler = {
  /**
   * In-memory dispatcher over a raw webhook body — used by legacy call sites
   * and tests. The production path persists events durably and processes
   * them via {@link WhatsappWebhookHandler.processPendingWebhookEvents}.
   */
  async processEvent(webhookBody: unknown): Promise<void> {
    if (!isRecord(webhookBody)) {
      logger.warn("whatsapp-webhook-handler: no entry array");
      return;
    }
    const rawEntry = webhookBody.entry;
    if (!Array.isArray(rawEntry)) {
      logger.warn("whatsapp-webhook-handler: no entry array");
      return;
    }
    const recipientUserIdCache = new Map<string, string | null>();
    const changePromises: Promise<void>[] = [];
    for (const entry of rawEntry) {
      if (isWebhookEntry(entry)) {
        collectEntryChanges(entry, changePromises, recipientUserIdCache);
      }
    }
    const results = await Promise.allSettled(changePromises);
    for (const result of results) {
      logRejectedResult(result, "unhandled rejection in change processing");
    }
  },

  /**
   * Claim a batch of durable PENDING events and dispatch each through the
   * per-field handlers. A claimed row whose dispatch throws stays PROCESSING
   * (its `attempts` counter already incremented by the claim) and is
   * re-claimed by the sweeper after its backoff horizon; success flips it to
   * PROCESSED. Rows whose stored payload is structurally unusable are
   * terminally failed instead.
   */
  async processPendingWebhookEvents(limit = EVENT_CLAIM_LIMIT): Promise<WhatsappWebhookWorkerResult> {
    const events = await WhatsappWebhookEventRepository.claimBatch(limit);
    const { processed, failed } = await drainClaimedEvents(events);
    return { claimed: events.length, processed, failed };
  },

  /**
   * Sweeper tick: park poison rows that exhausted the attempt budget, then
   * drain eligible stale events with an exponentially widening retry delay
   * (per-attempt backoff anchored at receipt time). Bounded rounds keep one
   * tick from monopolizing the worker.
   */
  async sweepPendingWebhookEvents(maxAttempts = WEBHOOK_EVENT_MAX_ATTEMPTS): Promise<WhatsappWebhookSweepResult> {
    const parked = await WhatsappWebhookEventRepository.parkExhausted(maxAttempts);
    if (parked > 0) {
      logger.error("whatsapp-webhook-handler: poison webhook events parked after exhausting retries", { parked });
    }
    const tallies = await drainSweepRounds(0, { claimed: 0, processed: 0, failed: 0 });
    return { ...tallies, parked };
  },
};
