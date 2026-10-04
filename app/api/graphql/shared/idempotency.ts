import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/backend/lib/logger";
import { getClientIdentifier } from "@/backend/lib/ratelimit";
import { IdempotencyService } from "@/backend/services/idempotency.service";
import { getServerTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

/**
 * Idempotency middleware wrapper
 * Prevents duplicate mutations within 24 hours
 */
export async function withIdempotency(
  request: NextRequest,
  eventHandler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  const idempotencyKey = request.headers.get("x-idempotency-key");

  // Only apply to POST requests with an idempotency key
  if (request.method !== "POST" || !idempotencyKey) {
    return eventHandler(request);
  }

  // We use the client identifier (IP/etc) to scope the idempotency key
  const identifier = getClientIdentifier(request);

  const isNew = await IdempotencyService.checkAndMark(idempotencyKey, identifier);

  if (!isNew) {
    logger.warn(`Duplicate request detected with idempotency key: ${idempotencyKey} for ${identifier}`);
    const locale = await getLocale();
    const errorsTranslations = getServerTranslations(locale).errorsTranslations;
    return NextResponse.json(
      {
        errors: [
          {
            message: errorsTranslations.duplicateRequest,
            extensions: {
              code: "DUPLICATE_REQUEST",
            },
          },
        ],
      },
      { status: 409 }
    );
  }

  try {
    return await eventHandler(request);
  } catch (error) {
    // On server error, release the key to allow retry
    await IdempotencyService.release(idempotencyKey, identifier);
    throw error;
  }
}
