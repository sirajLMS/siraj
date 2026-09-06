import { type NextRequest, NextResponse } from "next/server";
import { withCronAuth } from "@/backend/lib/cron-auth";
import { logger } from "@/backend/lib/logger";
import { formatError, getCronErrorT } from "@/backend/services";
import { WhatsappCoexistenceSyncService } from "@/backend/services/whatsapp";

/**
 * Vercel Cron entry point for the coexistence sync deadline sweeper.
 *
 * Auth: CRON_SECRET only. Vercel injects `Authorization: ******`.
 * GET-only. `withCronAuth` rejects non-GET with 405.
 *
 * The sweeper enforces the one-shot SMB app-data sync window (24h after
 * coexistence onboarding): accounts with PENDING sync requests past their
 * deadline are flipped to FAILED (`syncDeadlineExpired`); accounts still
 * inside the window get their outstanding POSTs retried (retry-safe via the
 * `requestId` guard — a retried tick never double-calls Meta).
 *
 * Schedule: hourly (see `vercel.json`).
 *
 * maxDuration: 300s (Vercel Fluid Compute).
 * Must be a numeric literal — Next.js cannot statically analyze imported consts.
 */
export const maxDuration = 300;

export const GET = withCronAuth(async (request: NextRequest) => {
  try {
    const result = await WhatsappCoexistenceSyncService.sweepExpiredSyncs();

    logger.info("whatsapp-sync-sweep.cron.complete", {
      checkedAccounts: result.checkedAccounts,
      expiredAccounts: result.expiredAccounts,
      retriedAccounts: result.retriedAccounts,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("whatsapp-sync-sweep.cron.failed", {
      error: formatError(error),
    });
    const tCron = getCronErrorT(request);
    return NextResponse.json({ success: false, error: tCron.whatsappSyncSweepFailed }, { status: 500 });
  }
});
