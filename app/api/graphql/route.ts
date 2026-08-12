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
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createGraphQLContext } from "@/backend/graphql/gqlContextFactory";
import { graphQLSchema } from "@/backend/graphql/gqlSchema";
import { ensureEnvironmentValidated, getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { checkRateLimit, getClientIdentifier, graphqlRateLimiter } from "@/backend/lib/ratelimit";
import { ApolloCacheAdapter } from "@/backend/services";
import { IdempotencyService } from "@/backend/services/idempotency.service";
import { getServerTranslations } from "@/shared/locale";

ensureEnvironmentValidated();

const envConfig = getEnvironmentConfig();
const isProduction = envConfig.nodeEnv === "production";
const MAX_GRAPHQL_DEPTH = 7;

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
 * Rate limiting middleware wrapper
 * Checks rate limit before processing the request
 */
async function withRateLimit(
  request: NextRequest,
  eventHandler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  const identifier = getClientIdentifier(request);

  // Check rate limit
  const { success, limit, remaining, reset } = await checkRateLimit(identifier, graphqlRateLimiter);

  if (!success) {
    logger.warn(`Rate limit exceeded for ${identifier}`);
    const errorsTranslations = getServerTranslations("ar").errorsTranslations;

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
    const errorsTranslations = getServerTranslations("ar").errorsTranslations;
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
    const errorsTranslations = getServerTranslations("ar").errorsTranslations;
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
