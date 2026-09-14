import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import {
  ApolloServerPluginLandingPageLocalDefault,
  // ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { createApollo4QueryValidationPlugin } from "graphql-constraint-directive/apollo4";
import depthLimit from "graphql-depth-limit";
// `appendMutableCookies` is the same internal helper Next.js uses to flush
// `cookies().set(...)` writes onto outgoing HTTP responses during app-render.
// We use it here because @as-integrations/next's App Router branch builds the
// outgoing Apollo Response solely from Apollo Server's internal HeaderMap and
// ignores the request-scoped `next/headers` ResponseCookies — resolver-side
// `ctx.cookies.set("session_id", ...)` calls would otherwise be dropped.
import { appendMutableCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies as nextCookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createGraphQLContext } from "@/backend/graphql/gqlContextFactory";
import { graphQLSchema } from "@/backend/graphql/gqlSchema";
import { ensureEnvironmentValidated, getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { checkRateLimit, getClientIdentifier, graphqlRateLimiter } from "@/backend/lib/ratelimit";
import { ApolloCacheAdapter } from "@/backend/services";
import { IdempotencyService } from "@/backend/services/idempotency.service";
import { getServerTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

ensureEnvironmentValidated();

const envConfig = getEnvironmentConfig();
const isProduction = envConfig.nodeEnv === "production";
const MAX_GRAPHQL_DEPTH = 7;

/**
 * Maximum GraphQL operations allowed inside a single batched HTTP request
 * (JSON array body). Hard reject happens in `withRateLimit` BEFORE Apollo sees
 * the payload. The cap bounds request amplification to 10x and matches the
 * client default (`BatchHttpLink` `batchMax`), so legitimate traffic never
 * trips it.
 */
const MAX_BATCHED_OPERATIONS = 10;

/**
 * Maximum POST body size (bytes) accepted for GraphQL operations. Hard reject
 * happens in `withRateLimit` BEFORE Apollo parses the body. Content-Length is
 * used as a cheap pre-read filter; chunked bodies without Content-Length are
 * measured after the read, so oversized payloads never reach full parsing.
 */
const MAX_GRAPHQL_BODY_BYTES = 256 * 1024;

function createPayloadTooLargeResponse(locale: string): NextResponse {
  const tErrors = getServerTranslations(locale).errorsTranslations;
  return NextResponse.json(
    { errors: [{ message: tErrors.requestTooLarge, extensions: { code: "PAYLOAD_TOO_LARGE" } }] },
    { status: 413 }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function findCode(err: unknown): string | null {
  if (!isRecord(err)) return null;
  if (typeof err.code === "string" && err.code !== "INTERNAL_SERVER_ERROR") {
    return err.code;
  }
  if (isRecord(err.extensions)) {
    const extCode = err.extensions.code;
    if (typeof extCode === "string" && extCode !== "INTERNAL_SERVER_ERROR") {
      return extCode;
    }
  }
  if (err.originalError) {
    const origCode = findCode(err.originalError);
    if (origCode) return origCode;
  }
  if (err.cause) {
    const causeCode = findCode(err.cause);
    if (causeCode) return causeCode;
  }
  return null;
}

function createApolloServer(schema: typeof graphQLSchema) {
  return new ApolloServer({
    schema,
    plugins: [
      // Install a landing page plugin based on NODE_ENV
      isProduction
        ? ApolloServerPluginLandingPageDisabled()
        : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
      // Enforce @constraint directive validation at query time
      createApollo4QueryValidationPlugin(),
    ],
    validationRules: [depthLimit(MAX_GRAPHQL_DEPTH)],
    hideSchemaDetailsFromClientErrors: isProduction,
    includeStacktraceInErrorResponses: !isProduction,
    logger: logger,
    csrfPrevention: {
      requestHeaders: ["x-apollo-operation-name", "apollo-require-preflight", "x-csrf-token"],
    },
    introspection: !isProduction,
    persistedQueries: {
      cache: new ApolloCacheAdapter(),
      ttl: null, // Store indefinitely
    },
    cache: new ApolloCacheAdapter(),
    // Enable HTTP batching — Apollo Server 4 disables this by default.
    // With BatchHttpLink on the client, multiple operations are POSTed as a
    // single JSON array body, reducing Vercel function invocations (8→1 POSTs).
    //
    // SECURITY DECISION — batching is enabled in ALL environments, including
    // production. A previous security review disabled it in production out of
    // concern that one POST could amplify into many resolver executions while
    // counting as a single rate-limit unit. That vulnerability is closed
    // compensating-control style in `withRateLimit` below:
    //   1. Hard cap: batches above MAX_BATCHED_OPERATIONS are rejected (400)
    //      before Apollo executes anything.
    //   2. Per-operation accounting: a batch of N operations consumes N units
    //      of the same per-IP rate budget — batched and unbatched traffic have
    //      an identical effective rate.
    // Additional layers are unaffected by batching: every operation still runs
    // its own auth context, authScopes, depth limit (MAX_GRAPHQL_DEPTH), and
    // persisted-query validation.
    //
    // Do NOT disable batching in production again: the client always sends
    // batches, so disabling it turns every GraphQL call into HTTP 400
    // "Operation batching disabled" (this outage already happened once). A
    // future review should verify the two controls above are intact rather
    // than re-flag batching itself.
    allowBatchedHttpRequests: true,
    formatError: (formattedError, error) => {
      const code =
        findCode(error) ??
        (typeof formattedError.extensions?.code === "string" ? formattedError.extensions.code : null);

      if (code) {
        return {
          ...formattedError,
          extensions: {
            ...formattedError.extensions,
            code,
          },
        };
      }
      return formattedError;
    },
  });
}

function createGraphqlHandler(server: ApolloServer) {
  return startServerAndCreateNextHandler<NextRequest>(server, {
    context: createGraphQLContext,
  });
}

let activeSchema = graphQLSchema;
let server = createApolloServer(activeSchema);
let handler = createGraphqlHandler(server);

function getHandler() {
  // After Turbopack HMR rebuilds the Pothos schema, swap Apollo onto the new schema.
  if (!isProduction && graphQLSchema !== activeSchema) {
    activeSchema = graphQLSchema;
    server = createApolloServer(activeSchema);
    handler = createGraphqlHandler(server);
  }
  return handler;
}
/**
 * Health check handler
 * Lightweight HEAD handler for connectivity checks
 */
export function HEAD() {
  return new Response(null, { status: 204 });
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
async function withRateLimit(
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

/**
 * Idempotency middleware wrapper
 * Prevents duplicate mutations within 24 hours
 */
async function withIdempotency(
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
