import { WhatsappWebhookEventRepository } from "@/backend/db/repo/whatsapp";
import { logger } from "@/backend/lib/logger";
import { dispatchChange } from "@/backend/services/whatsapp/whatsapp-webhook-dispatch.helpers";
import { isRecord, toSafeString } from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";

/**
 * Durable-webhook-worker helpers for the WhatsApp webhook handler: per-event
 * row dispatch with markProcessed, and the bounded exponential-backoff sweep
 * that re-claims stale PROCESSING rows left by failed dispatches.
 *
 * Payloads are untrusted parsed JSON (guard-narrowed, never logged with
 * content); failures log ids and counts only.
 */

const SWEEP_CLAIM_LIMIT = 100;
const SWEEP_MAX_ROUNDS = 10;
const SWEEP_BACKOFF_BASE_MS = 60_000;

/** Per-event dispatch + markProcessed for the durable row runners. */
async function dispatchEventRow(eventId: string, field: string, payload: Record<string, unknown>): Promise<void> {
  const value = payload.value;
  if (!isRecord(value)) {
    await WhatsappWebhookEventRepository.markFailed(eventId);
    logger.error("whatsapp-webhook-handler: unusable event payload; terminally failed", { eventId, field });
    return;
  }
  const wabaId = toSafeString(payload.wabaId) ?? "";
  await dispatchChange(field, value, wabaId, new Map());
}

/** Process one claimed batch: dispatch → markProcessed, or keep PROCESSING on error. */
export async function drainClaimedEvents(
  events: { id: string; field: string; payload: Record<string, unknown>; attempts: number }[]
): Promise<{ processed: number; failed: number }> {
  // Rows are independent (unique wamid/LWW upserts inside dispatch) — parallelize.
  const outcomes = await Promise.all(
    events.map(async event => {
      try {
        await dispatchEventRow(event.id, event.field, event.payload);
        await WhatsappWebhookEventRepository.markProcessed(event.id);
        return true;
      } catch (error) {
        logger.error("whatsapp-webhook-handler: event dispatch failed; stays PROCESSING for sweep re-claim", {
          eventId: event.id,
          field: event.field,
          attempts: event.attempts,
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    })
  );
  return {
    processed: outcomes.filter(Boolean).length,
    failed: outcomes.filter(outcome => !outcome).length,
  };
}

interface SweepTallies {
  claimed: number;
  processed: number;
  failed: number;
}

/**
 * Recursive sweep: claim up to SWEEP_CLAIM_LIMIT eligible rows per round,
 * drain them, and continue while a full batch was claimed. Bounded at
 * SWEEP_MAX_ROUNDS so one tick cannot monopolize the worker.
 */
export async function drainSweepRounds(round: number, tallies: SweepTallies): Promise<SweepTallies> {
  if (round >= SWEEP_MAX_ROUNDS) {
    return tallies;
  }
  const batch = await WhatsappWebhookEventRepository.claimBatchWithBackoff(SWEEP_CLAIM_LIMIT, SWEEP_BACKOFF_BASE_MS);
  if (batch.length === 0) {
    return tallies;
  }
  const { processed, failed } = await drainClaimedEvents(batch);
  const next = {
    claimed: tallies.claimed + batch.length,
    processed: tallies.processed + processed,
    failed: tallies.failed + failed,
  };
  if (batch.length < SWEEP_CLAIM_LIMIT) {
    return next;
  }
  return drainSweepRounds(round + 1, next);
}
