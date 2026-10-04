import { type NextRequest, NextResponse } from "next/server";
import { getHandler } from "@/app/api/graphql/shared/apollo-server";
import { withIdempotency } from "@/app/api/graphql/shared/idempotency";
import { withRateLimit } from "@/app/api/graphql/shared/request-pipeline";
import { logger } from "@/backend/lib/logger";
import { getServerTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

/**
 * Health check handler
 * Lightweight HEAD handler for connectivity checks
 */
export function HEAD() {
  return new Response(null, { status: 204 });
}

/**
 * POST handler for GraphQL requests
 * Applies rate limiting and idempotency
 *
 * Only POST is supported for GraphQL requests. GET is intentionally excluded
 * to prevent CSRF attacks — browsers automatically send cookies with GET
 * requests, allowing malicious sites to make authenticated GraphQL queries.
 */
export async function POST(request: NextRequest) {
  try {
    return await withRateLimit(request, req => withIdempotency(req, getHandler()));
  } catch (error) {
    logger.error("Unhandled error in GraphQL POST handler", error);
    const locale = await getLocale();
    const errorsTranslations = getServerTranslations(locale).errorsTranslations;
    return NextResponse.json(
      {
        errors: [
          {
            message: errorsTranslations.internalServerError,
            extensions: {
              code: "INTERNAL_SERVER_ERROR",
            },
          },
        ],
      },
      { status: 500 }
    );
  }
}
