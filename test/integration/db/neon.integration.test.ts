/**
 * Neon database — single live smoke test (one HTTP query).
 * Run: `bun run test:integration` (requires NEON_TEST_DATABASE_URL in .env.test)
 */
import { describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { relations } from "@/backend/db/drizzleRelations";
import { testLogger } from "@/shared/lib/logger/testlogger";

const neonUrl = process.env.NEON_TEST_DATABASE_URL;
const skipNeon = !neonUrl || neonUrl.includes("ep-example");

describe("Neon @integration", () => {
  test.skipIf(skipNeon)("neon-http client executes SELECT 1 against NEON_TEST_DATABASE_URL", async () => {
    const { drizzle: drizzleNeonHttp } = await import("drizzle-orm/neon-http");
    const { neon } = await import("@neondatabase/serverless");

    if (!neonUrl) return;
    const client = neon(neonUrl);
    const httpDb = drizzleNeonHttp({ client, relations });
    const result = await httpDb.execute(sql`SELECT 1 as test`);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].test).toBe(1);
    testLogger.info("Neon HTTP integration smoke passed");
  });
});
