import { NextResponse } from "next/server";
import { ForbiddenError, getServerUserContext, logger, ValidationError } from "@/backend/lib";
import { checkRateLimit, exportRateLimiter } from "@/backend/lib/ratelimit";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/** Reads the export request locale: first accept-language subtag, `ar` fallback. */
export function readExportLocale(request: Request): string {
  return request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
}

/** Localized error translations bound to one export request. */
export function readExportErrorTranslations(locale: string): ErrorsLabels {
  return getServerTranslations(locale).errorsTranslations;
}

/**
 * Resolves the authenticated, rate-limited export actor: the localized 401
 * response when the session cookie is missing, the 429 response (with
 * `Retry-After`) when the export rate limiter rejects, otherwise the userId.
 */
export async function resolveExportUserId(tErrors: ErrorsLabels): Promise<string | Response> {
  const { userId } = await getServerUserContext();
  if (!userId) {
    return NextResponse.json({ error: tErrors.unauthorized }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(`export:${userId}`, exportRateLimiter);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: tErrors.rateLimitExceeded },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(0, Math.ceil((rateLimit.reset - Date.now()) / 1000)).toString(),
        },
      }
    );
  }
  return userId;
}

/** Maps a failed export onto its error response: 403 forbidden, 400 validation, 500 otherwise (with the failure logged). */
export function toExportErrorResponse(error: unknown, tErrors: ErrorsLabels, logLabel: string): Response {
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: tErrors.insufficientPermissions }, { status: 403 });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  logger.error(logLabel, { error: error instanceof Error ? error.message : String(error) });
  return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
}
