import type { whatsappWebhookEvents } from "@/backend/db/schema";
import type { WhatsappWebhookEventStatus } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";

/**
 * Canonical type definitions for the `whatsapp_webhook_events` durable queue.
 *
 * The webhook route inserts one row per payload `change` before acking 200
 * (persist-first, process-async); the async worker claims PENDING rows and
 * dispatches by `field`. `payload` is the raw change value — kept untyped at
 * rest because the per-field shapes belong to `whatsapp-webhook.types.ts`.
 */

export type WhatsappWebhookEventSelectType = typeof whatsappWebhookEvents.$inferSelect;
export type WhatsappWebhookEventInsertType = typeof whatsappWebhookEvents.$inferInsert;

export type WhatsappWebhookEventReturnType = Omit<WhatsappWebhookEventSelectType, "status" | "payload"> & {
  status: WhatsappWebhookEventStatus; // Re-apply enum
  payload: Record<string, unknown>;
};

/**
 * Result of the route-side persist step: how many durable event rows were
 * written from one webhook payload, and whether the short-window exact-replay
 * dedupe skipped the insert entirely.
 */
export interface WhatsappWebhookIngestResult {
  inserted: number;
  /** True when an identical payload hash was seen inside the replay window. */
  skippedReplay: boolean;
}

/** Tallies from one worker pass over the durable event queue. */
export interface WhatsappWebhookWorkerResult {
  claimed: number;
  processed: number;
  /** Events that threw during dispatch; they stay PENDING for retry. */
  failed: number;
}

/** Extended worker tallies for the sweeper cron (adds the poison park count). */
export interface WhatsappWebhookSweepResult extends WhatsappWebhookWorkerResult {
  /** PENDING rows whose attempts exhausted the retry budget (parked FAILED). */
  parked: number;
}

/**
 * Webhook `change.field` values the durable-ingest worker dispatches on.
 * Unknown/future fields are preserved (stored and logged), never rejected.
 */
export type WhatsappWebhookEventField =
  | "messages"
  | "history"
  | "smb_app_state_sync"
  | "smb_message_echoes"
  | "account_update"
  | "phone_number_quality_update"
  | "business_capability_update"
  | "message_template_status_update"
  | "message_template_quality_update"
  | "template_category_update";
