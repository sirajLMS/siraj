import { type NextRequest, NextResponse } from "next/server";
import { withCronAuth } from "@/backend/lib/cron-auth";
import { logger } from "@/backend/lib/logger";
import { formatError, getCronErrorT } from "@/backend/services";
import { WhatsappWebhookHandler } from "@/backend/services/whatsapp";

/**
 * Vercel Cron entry point for the durable WhatsApp webhook event sweeper.
 *
 * Auth: CRON_SECRET only. Vercel injects `Authorization: ******`.
 * GET-only. `withCronAuth` rejects non-GET with 405.
 *
 * The sweeper is the durability backstop for webhook ingest: it parks poison
 * rows that exhausted the retry budget (FAILED, surfaced rather than dropped)
 * and reclaims stale PENDING rows with an exponential per-attempt backoff so
 * events the inline `after()` processor never reached are drained. Nothing is
 * lost when the inline path fails — Meta webhooks carry customer replies and
 * history sync chunks that must never be dropped between receipt and DB.
 *
 * Schedule: every 5 minutes (see `vercel.json`).
 *
 * maxDuration: 300s (Vercel Fluid Compute).
 * Must be a numeric literal — Next.js cannot statically analyze imported consts.
 */
export const maxDuration = 300;

export const GET = withCronAuth(async (request: NextRequest) => {
  try {
    const result = await WhatsappWebhookHandler.sweepPendingWebhookEvents();

    logger.info("whatsapp-webhook-sweep.cron.complete", {
      claimed: result.claimed,
      processed: result.processed,
      failed: result.failed,
      parked: result.parked,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("whatsapp-webhook-sweep.cron.failed", { error: formatError(error) });
    const tCron = getCronErrorT(request);
    return NextResponse.json({ success: false, error: tCron.whatsappWebhookSweepFailed }, { status: 500 });
  }
});
