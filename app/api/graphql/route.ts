import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import {
  ApolloServerPluginLandingPageLocalDefault,
  // ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createGraphQLContext } from "@/backend/graphql/gqlContextFactory";
import { graphQLSchema } from "@/backend/graphql/gqlSchema";
import logger from "@/backend/lib/logger";
import { checkRateLimit, getClientIdentifier, graphqlRateLimiter } from "@/backend/lib/ratelimit";
import { ApolloCacheAdapter } from "@/backend/services/cache";

const isProduction = process.env.NODE_ENV === "production";

const cache = new ApolloCacheAdapter();
const server = new ApolloServer({
  schema: graphQLSchema,
  plugins: [
    // Install a landing page plugin based on NODE_ENV
    process.env.NODE_ENV === "production"
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
  ],
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

    return NextResponse.json(
      {
        errors: [
          {
            message: "Too many requests. Please try again later.",
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
 * POST handler for GraphQL mutations
 * Applies rate limiting
 */
export async function POST(request: NextRequest) {
  return withRateLimit(request, handler);
}

/**
 * GET handler for GraphQL queries
 * Applies rate limiting
 */
export async function GET(request: NextRequest) {
  return withRateLimit(request, handler);
}
