/**
 * queryDb HTTP Provider Integration Smoke Test
 *
 * Runs a single live HTTP query over queryDb against NEON_TEST_DATABASE_URL.
 * Skipped cleanly via describeLiveWhen if NEON_TEST_DATABASE_URL is not set or is a placeholder.
 *
 * @module test/integration/db/query-db.integration.test.ts
 */
import { expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { clearDbConnectionSingleton, queryDb } from "@/backend/db";
import { resetEnvironmentCache } from "@/backend/lib/env";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const neonTestUrl = process.env.NEON_TEST_DATABASE_URL;
const hasNeonTestUrl = (() => {
  if (!neonTestUrl || neonTestUrl.includes("ep-example")) return false;
  try {
    return new URL(neonTestUrl).hostname.endsWith('.neon.tech');
  } catch {
    return false;
  }
})();

const describeLive = describeLiveWhen(hasNeonTestUrl, "queryDb HTTP integration @db");

describeLive("queryDb HTTP integration @db", () => {
  test("queryDb executes live HTTP SELECT 1 query against NEON_TEST_DATABASE_URL", async () => {
    const { drizzle: drizzleNeonHttp } = await import("drizzle-orm/neon-http");
    const { neon } = await import("@neondatabase/serverless");
    const { relations } = await import("@/backend/db/drizzleRelations");

    const client = neon(neonTestUrl as string);
    const httpDb = drizzleNeonHttp({ client, relations });
    const result = await httpDb.execute(sql`SELECT 1 as test`);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].test).toBe(1);

    // Verify queryDb() factory handle routing when pointing to Neon URL
    const prevDbUrl = process.env.DATABASE_URL;
    const prevDbProvider = process.env.DB_PROVIDER;
    const prevMode = process.env.DB_CONNECTION_MODE;
    const prevEnabled = process.env.DB_NEON_HTTP_ENABLED;
    try {
      process.env.DATABASE_URL = neonTestUrl ?? "";
      process.env.DB_PROVIDER = "neon";
      process.env.DB_CONNECTION_MODE = "auto";
      process.env.DB_NEON_HTTP_ENABLED = "true";
      resetEnvironmentCache();
      clearDbConnectionSingleton();

      const handle = queryDb() as typeof httpDb;
      const queryDbResult = await handle.execute(sql`SELECT 1 as test`);
      expect(queryDbResult.rows).toHaveLength(1);
      expect(queryDbResult.rows[0].test).toBe(1);
    } finally {
      process.env.DATABASE_URL = prevDbUrl;
      process.env.DB_PROVIDER = prevDbProvider;
      process.env.DB_CONNECTION_MODE = prevMode;
      process.env.DB_NEON_HTTP_ENABLED = prevEnabled;
      resetEnvironmentCache();
      clearDbConnectionSingleton();
    }

    testLogger.info("queryDb live HTTP integration smoke passed");
  });
});
