import { ensureEnvironmentValidated, getEnvironmentConfig } from "@/backend/lib/env";

ensureEnvironmentValidated();

const envConfig = getEnvironmentConfig();

export const isProduction = envConfig.nodeEnv === "production";

export const MAX_GRAPHQL_DEPTH = 7;

/**
 * Maximum AST nodes (fields incl. aliases, inline fragments, fragment spreads)
 * allowed in one GraphQL request document. A cheap static budget enforced
 * BEFORE execution; stops alias-amplification abuse while staying far above
 * any real dashboard query. See `nodeCountLimit` in `backend/graphql/shared`.
 */
export const MAX_GRAPHQL_NODE_COUNT = 2000;

/**
 * Maximum GraphQL operations allowed inside a single batched HTTP request
 * (JSON array body). Hard reject happens in `withRateLimit` BEFORE Apollo sees
 * the payload. The cap bounds request amplification to 10x and matches the
 * client default (`BatchHttpLink` `batchMax`), so legitimate traffic never
 * trips it.
 */
export const MAX_BATCHED_OPERATIONS = 10;

/**
 * Maximum POST body size (bytes) accepted for GraphQL operations. Hard reject
 * happens in `withRateLimit` BEFORE Apollo parses the body. Content-Length is
 * used as a cheap pre-read filter; chunked bodies without Content-Length are
 * measured after the read, so oversized payloads never reach full parsing.
 */
export const MAX_GRAPHQL_BODY_BYTES = 256 * 1024;
