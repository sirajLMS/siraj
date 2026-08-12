import { type NextRequest, NextResponse } from "next/server";
import { CronTriggerSource } from "@/backend/enum/cron/cron.enums";
import { withCronAuth } from "@/backend/lib/cron-auth";
import { DomainError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { CronService, extractLocale, formatError, getCronErrorT } from "@/backend/services";

/**
 * Manual / per-schedule execute endpoint. Allows external schedulers to trigger
 * a specific schedule by ID, or a Vercel per-schedule cron to call this route
 * with the appropriate `scheduleId`.
 *
 * Auth: CRON_SECRET bearer (withCronAuth). GET-only.
 * maxDuration: 300s (Vercel Fluid Compute).
 * Must be a numeric literal — Next.js cannot statically analyze imported consts.
 *
 * Query: `?scheduleId=<uuid>` — the schedule to dispatch.
 */
export const maxDuration = 300;

export const GET = withCronAuth(async (request: NextRequest) => {
  const scheduleId = request.nextUrl.searchParams.get("scheduleId");

  const locale = extractLocale(request);
  const tCron = getCronErrorT(request);

  if (!scheduleId) {
    return NextResponse.json({ error: tCron.missingScheduleId }, { status: 400 });
  }

  // UUIDs are lowercase per RFC 4122; no case-insensitive flag needed
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  if (!UUID_REGEX.test(scheduleId)) {
    return NextResponse.json({ error: tCron.invalidScheduleIdFormat }, { status: 400 });
  }

  try {
    const dispatchResult = await CronService.dispatchScheduleById(
      {
        id: scheduleId,
        source: CronTriggerSource.VERCEL_EXPLICIT,
      },
      locale
    );

    // Handle SKIP concurrency policy result
    if (dispatchResult.skipped) {
      logger.info("cron.execute.skipped", {
        scheduleId,
        inFlightRunId: dispatchResult.runId,
      });
      return NextResponse.json({
        dispatchedCount: 0,
        skipped: true,
        scheduleId,
        inFlightRunId: dispatchResult.runId,
      });
    }

    logger.info("cron.execute.complete", {
      scheduleId,
      runId: dispatchResult.runId,
      queueJobId: dispatchResult.queueJobId,
    });

    return NextResponse.json({
      dispatchedCount: 1,
      runId: dispatchResult.runId,
      queueJobId: dispatchResult.queueJobId,
    });
  } catch (error) {
    const message = formatError(error);
    logger.error("cron.execute.failed", { scheduleId, error: message });

    if (isNotFoundError(error)) {
      return NextResponse.json({ error: tCron.scheduleNotFound(scheduleId) }, { status: 404 });
    }

    return NextResponse.json({ error: tCron.genericError }, { status: 500 });
  }
});

/**
 * Checks whether an error represents a "not found" condition.
 * Prefers the structured `code` property on {@link DomainError} (e.g. `SCHEDULE_NOT_FOUND`)
 * over fragile string matching on the error message.
 */
function isNotFoundError(error: unknown): boolean {
  if (error instanceof DomainError) {
    return error.code.endsWith("_NOT_FOUND");
  }

  // Handle errors that carry a `code` property but are not DomainError instances
  if (hasErrorCode(error)) {
    const { code } = error;
    return typeof code === "string" && code.endsWith("_NOT_FOUND");
  }

  return false;
}

/**
 * Type guard asserting the presence of a `code` property on an object.
 * Keeps narrowing logic centralized and avoids ad-hoc type assertions.
 */
function hasErrorCode(obj: unknown): obj is { code: unknown } {
  return obj !== null && typeof obj === "object" && "code" in obj;
}
