import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import {
  ApolloServerPluginLandingPageLocalDefault,
  // ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { createApollo4QueryValidationPlugin } from "graphql-constraint-directive/apollo4";
import depthLimit from "graphql-depth-limit";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createGraphQLContext } from "@/backend/graphql/gqlContextFactory";
import { graphQLSchema } from "@/backend/graphql/gqlSchema";
import { ensureEnvironmentValidated, getEnvironmentConfig } from "@/backend/lib/env";
import logger from "@/backend/lib/logger";
import { checkRateLimit, getClientIdentifier, graphqlRateLimiter } from "@/backend/lib/ratelimit";
import { ApolloCacheAdapter } from "@/backend/services/cache";
import { IdempotencyService } from "@/backend/services/idempotency.service";
import { getServerTranslations } from "@/shared/locale";

ensureEnvironmentValidated();

const envConfig = getEnvironmentConfig();
const isProduction = envConfig.nodeEnv === "production";
const MAX_GRAPHQL_DEPTH = 7;

const cache = new ApolloCacheAdapter();
const server = new ApolloServer({
  schema: graphQLSchema,
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
    cache: cache,
    ttl: null, // Store indefinitely
  },
  cache: new ApolloCacheAdapter(),
});

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: createGraphQLContext,
});

/**
 * Health check handler
 * Lightweight HEAD handler for connectivity checks
 */
export function HEAD() {
  return new Response(null, { status: 204 });
}

/**
 * Rate limiting middleware wrapper
 * Checks rate limit before processing the request
 */
async function withRateLimit(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
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
  const response = await handler(request);

  // Clone response to add headers
  const newResponse = new Response(response.body, response);
  newResponse.headers.set("X-RateLimit-Limit", limit.toString());
  newResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
  newResponse.headers.set("X-RateLimit-Reset", reset.toString());

  return newResponse;
}

/**
 * Idempotency middleware wrapper
 * Prevents duplicate mutations within 24 hours
 */
async function withIdempotency(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  const idempotencyKey = request.headers.get("x-idempotency-key");

  // Only apply to POST requests with an idempotency key
  if (request.method !== "POST" || !idempotencyKey) {
    return handler(request);
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
    return await handler(request);
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
    return await withRateLimit(request, req => withIdempotency(req, handler));
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
