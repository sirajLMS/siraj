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
import { isProduction, MAX_GRAPHQL_DEPTH, MAX_GRAPHQL_NODE_COUNT } from "@/app/api/graphql/shared/constants";
import { createGraphQLContext } from "@/backend/graphql/gqlContextFactory";
import { graphQLSchema } from "@/backend/graphql/gqlSchema";
import { nodeCountLimit } from "@/backend/graphql/shared";
import { logger } from "@/backend/lib/logger";
import { ApolloCacheAdapter } from "@/backend/services";

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
    validationRules: [depthLimit(MAX_GRAPHQL_DEPTH), nodeCountLimit(MAX_GRAPHQL_NODE_COUNT)],
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

export function getHandler() {
  // After Turbopack HMR rebuilds the Pothos schema, swap Apollo onto the new schema.
  if (!isProduction && graphQLSchema !== activeSchema) {
    activeSchema = graphQLSchema;
    server = createApolloServer(activeSchema);
    handler = createGraphqlHandler(server);
  }
  return handler;
}
