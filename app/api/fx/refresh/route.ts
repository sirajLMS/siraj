import { type NextRequest, NextResponse } from "next/server";
import { FxSyncTrigger } from "@/backend/enum";
import { logger } from "@/backend/lib";
import { withCronAuth } from "@/backend/lib/cron-auth";
import { FxIngestionService } from "@/backend/services";
import { getServerTranslations } from "@/shared/locale";

/**
 * Vercel Cron entry point for FX rate refresh.
 *
 * Auth: CRON_SECRET only (R1–R11). Vercel injects `Authorization: Bearer ${CRON_SECRET}`.
 * GET-only. `withCronAuth` rejects non-GET with 405. Staff manual refresh goes
 * through the GraphQL `refreshExchangeRates` mutation, not this route.
 */
export const GET = withCronAuth(async (request: NextRequest) => {
  try {
    const result = await FxIngestionService.refreshRates({
      triggeredByUserId: null,
      trigger: FxSyncTrigger.Cron,
      force: false,
    });

    logger.info("FX cron refresh completed", {
      success: result.success,
      pairsWritten: result.pairsWritten,
      syncRunId: result.syncRunId,
    });

    return NextResponse.json({
      success: result.success,
      pairsWritten: result.pairsWritten,
      pairsFailed: result.pairsFailed,
      syncRunId: result.syncRunId,
    });
  } catch (error) {
    logger.error("FX cron refresh failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    const locale = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
    const tErrors = getServerTranslations(locale).errorsTranslations;
    return NextResponse.json({ success: false, error: tErrors.fxRefreshFailed }, { status: 500 });
  }
});
