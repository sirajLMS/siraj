/**
 * @module backend/db/http-client
 * @description Neon HTTP Single-Fetch Client Helper
 *
 * Provides lightweight, zero-pool HTTP single-fetch query execution via `@neondatabase/serverless` (`neon(url)`)
 * and Drizzle ORM (`drizzle-orm/neon-http`).
 *
 * ### Performance Characteristics:
 * - **Zero WebSocket Overhead:** Sends HTTPS POST requests directly to Neon's `/sql` proxy endpoint without establishing
 *   or maintaining a persistent WebSocket or TCP connection pool.
 * - **Fast Cold Starts:** Reduces cold-start latency on Vercel Serverless Lambdas (~15ms–30ms response times).
 * - **Connection Limit Protection:** Does not consume PostgreSQL connection pool slots (`max_connections`), avoiding
 *   connection limit exhaustion during traffic spikes.
 *
 * ### Best Practices & Usage Guidelines:
 * - **Use for:** Stateless, isolated, single-roundtrip read operations (e.g. user session validation, system settings lookup).
 * - **DO NOT use for:** Multi-statement transactions (`db.transaction()`), interactive writes, or sequential multi-query pipelines.
 *   Transactions MUST use stateful WebSocket/pooled clients (`drizzleNeon` / `drizzlePostgres`).
 *
 * @example
 * ```typescript
 * import { getNeonHttpDb } from "@/backend/db";
 * import { sql } from "drizzle-orm";

 * const httpDb = getNeonHttpDb();
 * const result = await httpDb.execute(sql`SELECT 1 as val`);
 * ```
 */

import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeonHttp, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { isNeonHttpEligible } from "@/backend/db/connection-strategy";
import { relations } from "@/backend/db/drizzleRelations";
import { getEnvironmentConfig } from "@/backend/lib/env";

/** Singleton instance for raw Neon HTTP query function. */
let httpClient: NeonQueryFunction<boolean, boolean> | null = null;

/** Singleton instance for Drizzle ORM HTTP database interface. */
let httpDbInstance: NeonHttpDatabase<typeof relations> | null = null;

/**
 * Returns the module-level singleton instance of the raw `@neondatabase/serverless` HTTP query function.
 * Initialized lazily using `DATABASE_URL` from environment configuration.
 *
 * @returns {NeonQueryFunction<boolean, boolean>} Neon HTTP query function instance for raw SQL fetch calls.
 */
export function getNeonHttpClient(): NeonQueryFunction<boolean, boolean> {
  if (!httpClient) {
    if (!isNeonHttpEligible()) {
      throw new Error(
        "Neon HTTP client is not eligible for the current environment. " +
          "Set DB_PROVIDER=neon, ensure DATABASE_URL hostname matches *.neon.tech, " +
          'DB_CONNECTION_MODE != "pg", and DB_NEON_HTTP_ENABLED != "false".'
      );
    }
    httpClient = neon(getEnvironmentConfig().databaseUrl);
  }
  return httpClient;
}

/**
 * Returns the module-level singleton instance of the Drizzle ORM HTTP database client (`drizzle-orm/neon-http`).
 * Pre-configured with Siraj relation definitions for full Drizzle schema query builder support.
 *
 * @returns {NeonHttpDatabase<typeof relations>} Drizzle ORM database client operating over Neon HTTP fetch.
 */
export function getNeonHttpDb(): NeonHttpDatabase<typeof relations> {
  if (!httpDbInstance) {
    const client = getNeonHttpClient();
    httpDbInstance = drizzleNeonHttp({ client, relations });
  }
  return httpDbInstance;
}

export function clearHttpClientSingleton(): void {
  httpClient = null;
  httpDbInstance = null;
}
