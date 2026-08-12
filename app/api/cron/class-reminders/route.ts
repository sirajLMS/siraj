import { type NextRequest, NextResponse } from "next/server";
import { withCronAuth } from "@/backend/lib/cron-auth";
import { logger } from "@/backend/lib/logger";
import { ClassReminderService, formatError, getCronErrorT } from "@/backend/services";

/**
 * Vercel Cron entry point for daily class reminders.
 *
 * Auth: CRON_SECRET only (R1–R11). Vercel injects `Authorization: ******`
 * header. GET-only. `withCronAuth` rejects non-GET with 405. Manual reminder
 * dispatch goes through the `ClassReminderService.dispatchDailyReminders`
 * service directly (e.g. via a Server Action or admin script), not this route.
 *
 * Schedule: `0 6 * * *` (06:00 UTC daily — see `vercel.json`). The service
 * defaults `withinHours: 24` so the 06:00 run covers instances starting between
 * 06:00 today and 06:00 tomorrow UTC.
 *
 * maxDuration: 300s (Vercel Fluid Compute).
 * Must be a numeric literal — Next.js cannot statically analyze imported consts.
 */
export const maxDuration = 300;

export const GET = withCronAuth(async (request: NextRequest) => {
  try {
    const result = await ClassReminderService.dispatchDailyReminders({ withinHours: 24 });

    logger.info("class-reminders.cron.complete", {
      success: result.success,
      instancesProcessed: result.instancesProcessed,
      deliveriesDispatched: result.deliveriesDispatched,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("class-reminders.cron.failed", {
      error: formatError(error),
    });
    const tCron = getCronErrorT(request);
    return NextResponse.json({ success: false, error: tCron.classRemindersFailed }, { status: 500 });
  }
});
