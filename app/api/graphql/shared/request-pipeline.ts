import { appendMutableCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies as nextCookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { MAX_BATCHED_OPERATIONS, MAX_GRAPHQL_BODY_BYTES } from "@/app/api/graphql/shared/constants";
import { logger } from "@/backend/lib/logger";
import { checkRateLimit, getClientIdentifier, graphqlRateLimiter } from "@/backend/lib/ratelimit";
import { getServerTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

function createPayloadTooLargeResponse(locale: string): NextResponse {
  const tErrors = getServerTranslations(locale).errorsTranslations;
  return NextResponse.json(
    { errors: [{ message: tErrors.requestTooLarge, extensions: { code: "PAYLOAD_TOO_LARGE" } }] },
    { status: 413 }
  );
}

/**
 * Flush pending Set-Cookie entries from the request-scoped `next/headers`
 * `cookies()` adapter onto Apollo Server's outgoing Response. This mirrors
 * the exact mechanism Next.js itself uses during app-render (see the helper
 * `appendMutableCookies` in
 * `node_modules/next/dist/server/app-render/app-render.js`).
 *
 * Why this is needed:
 *   `@as-integrations/next`'s App Router branch builds its outgoing
 *   `Response` ONLY from Apollo Server's internal `HeaderMap` — it ignores
 *   any cookies written via `ctx.cookies.set(...)` (which target the
 *   `next/headers` request-scoped `ResponseCookies`). In production, those
 *   resolver-side writes were being silently dropped, causing the auth
 *   cookies (`session_id`, `refresh_token`, `access_token`) to never reach
 *   the browser — so the very next SSR navigation bounced the user to
 *   /login due to "no session_id cookie". `bun dev` did not reproduce
 *   because dev's route-handler plumbing flushes the mutable cookies via
 *   a different code path.
 *
 * Safety:
 *   - Reads only cookies already marked as modified in the current request;
 *     if a resolver set none, nothing is appended.
 *   - Uses the supported multi-valued header API under the hood
 *     (`Headers.append('set-cookie', ...)` is what `appendMutableCookies`
 *     emits via a fresh `ResponseCookies` adapter), so all three auth cookies
 *     arrive at the browser intact.
 */
async function flushPendingCookies(response: Response): Promise<Response> {
  const cookieStore = await nextCookies();
  appendMutableCookies(response.headers, cookieStore);
  return response;
}

/**
 * Charge one rate-limit unit per GraphQL operation so a batched request
 * consumes the same budget as the equivalent number of individual requests.
 * Each unit is a single atomic window increment; the increments are fired
 * concurrently, and the aggregate verdict uses the strictest result across
 * the batch (any exhausted unit fails the whole batch with 429, the most
 * conservative reset time drives Retry-After, and the lowest remaining count
 * is reported). A unit is consumed even when the batch is ultimately
 * rejected — identical to how a failed single request is already charged.
 */
async function chargeOperationRateLimitUnits(
  identifier: string,
  operationCount: number
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const results = await Promise.all(
    Array.from({ length: operationCount }, () => checkRateLimit(identifier, graphqlRateLimiter))
  );
  const initial = results[0] ?? { success: true, limit: 0, remaining: 0, reset: 0 };
  return results.reduce(
    (strictest, current) => ({
      success: strictest.success && current.success,
      limit: current.limit,
      remaining: Math.min(strictest.remaining, current.remaining),
      reset: Math.max(strictest.reset, current.reset),
    }),
    initial
  );
}

/**
 * Validates a batched GraphQL request body before Apollo parses it and
 * derives the operation count that drives per-operation rate-limit
 * accounting. Batched requests (JSON array body) carry multiple operations
 * in one POST — see the security decision block on `allowBatchedHttpRequests`
 * in `createApolloServer`.
 *
 * Oversized bodies are rejected 413 BEFORE Apollo parses/clones them:
 * Content-Length is a cheap pre-filter, and chunked bodies (no
 * Content-Length) are measured after the read.
 */
async function validateGraphqlRequestBody(
  request: NextRequest,
  identifier: string
): Promise<{ rejection: Response | null; operationCount: number }> {
  if (request.method !== "POST") {
    return { rejection: null, operationCount: 1 };
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > MAX_GRAPHQL_BODY_BYTES) {
      const locale = await getLocale();
      logger.warn(`GraphQL request rejected: body of ${contentLength} bytes from ${identifier}`);
      return { rejection: createPayloadTooLargeResponse(locale), operationCount: 1 };
    }
  }

  let operationCount = 1;
  try {
    const body: unknown = await request.clone().json();
    // JSON.stringify length is a cheap upper-bound approximation of the raw
    // body size; legitimate queries/mutations stay far below the cap.
    if (JSON.stringify(body).length > MAX_GRAPHQL_BODY_BYTES) {
      const locale = await getLocale();
      logger.warn(`GraphQL request rejected: parsed body exceeds ${MAX_GRAPHQL_BODY_BYTES} bytes from ${identifier}`);
      return { rejection: createPayloadTooLargeResponse(locale), operationCount: 1 };
    }
    if (Array.isArray(body) && body.length > 0) {
      operationCount = body.length;
      if (operationCount > MAX_BATCHED_OPERATIONS) {
        const locale = await getLocale();
        const tErrors = getServerTranslations(locale).errorsTranslations;
        logger.warn(`GraphQL batched request rejected: ${operationCount} operations from ${identifier}`);
        return {
          rejection: NextResponse.json(
            { errors: [{ message: tErrors.invalidRequestFormat, extensions: { code: "BAD_REQUEST" } }] },
            { status: 400 }
          ),
          operationCount: 1,
        };
      }
    }
  } catch {
    // malformed body — let Apollo handle it
  }

  return { rejection: null, operationCount };
}

/**
 * Rate limiting middleware wrapper
 * Checks rate limit before processing the request
 */
export async function withRateLimit(
  request: NextRequest,
  eventHandler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  const identifier = getClientIdentifier(request);

  const { rejection, operationCount } = await validateGraphqlRequestBody(request, identifier);
  if (rejection) {
    return rejection;
  }

  // Check rate limit
  const { success, limit, remaining, reset } = await chargeOperationRateLimitUnits(identifier, operationCount);

  if (!success) {
    logger.warn(`Rate limit exceeded for ${identifier}`);
    const locale = await getLocale();
    const errorsTranslations = getServerTranslations(locale).errorsTranslations;

    return NextResponse.json(
      {
        errors: [
          {
            message: errorsTranslations.rateLimitExceeded,
            extensions: {
              code: "RATE_LIMIT_EXCEEDED",
              limit,
              reset,
            },
          },
        ],
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  const response = await flushPendingCookies(await eventHandler(request));

  // Attach rate-limit headers to the ORIGINAL response. Constructing a new
  // Response (e.g. `new Response(response.body, response)`) silently strips
  // the `Set-Cookie` headers that auth mutations set via ctx.cookies.set(...),
  // which would log users out on the next SSR navigation. `flushPendingCookies`
  // above re-applies the cookies that @as-integrations/next dropped, so
  // mutating the original response here preserves them.
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", reset.toString());

  return response;
}
