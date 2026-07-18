import { type NextRequest, NextResponse } from "next/server";
import { verifyCronSecretAuth } from "@/backend/lib/cron-auth";
import { logger } from "@/backend/lib/logger";
import { ClassReminderService } from "@/backend/services/notification/class-reminder.service";

/**
 * Vercel Cron entry point for daily class reminders.
 *
 * Auth: CRON_SECRET only (R1–R11). Vercel injects `Authorization: Bearer ${CRON_SECRET}`.
 * GET-only. verifyCronSecretAuth rejects non-GET with 405. Manual reminder
 * dispatch goes through the `ClassReminderService.dispatchDailyReminders`
 * service directly (e.g. via a Server Action or admin script), not this route.
 *
 * Schedule: `0 6 * * *` (06:00 UTC daily — see `vercel.json`). The service
 * defaults `withinHours: 24` so the 06:00 run covers instances starting between
 * 06:00 today and 06:00 tomorrow UTC.
 */
export async function GET(request: NextRequest) {
  const authResult = verifyCronSecretAuth(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const result = await ClassReminderService.dispatchDailyReminders({ withinHours: 24 });

    logger.info("Class reminders cron completed", {
      success: result.success,
      instancesProcessed: result.instancesProcessed,
      deliveriesDispatched: result.deliveriesDispatched,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Class reminders cron failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: "Class reminders failed" }, { status: 500 });
  }
}
