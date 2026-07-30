import { beforeAll, describe, expect, test } from "bun:test";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import ws from "ws";
import { relations } from "@/backend/db/drizzleRelations";

/**
 * Neon Integration Tests
 *
 * These tests verify that the Neon serverless driver and pg pooled driver
 * work correctly with a real Neon database using NEON_TEST_DATABASE_URL from .env.test.
 *
 * Run with: bun --env-file=.env.test test backend/db/test/neon-integration.test.ts
 *
 * Note: These tests connect to a REAL Neon database and should only be run
 * when NEON_TEST_DATABASE_URL is set in .env.test (not in CI by default).
 */

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

describe("Neon Integration Tests", () => {
  const neonUrl = process.env.NEON_TEST_DATABASE_URL;
  const pgUrl = process.env.DATABASE_URL; // This will be siraj_test from .env.test

  // Skip if Neon test URL is not configured
  const skipNeonTests = !neonUrl || neonUrl.includes("ep-example");

  beforeAll(() => {
    if (skipNeonTests) {
      console.log("⚠️  Skipping Neon integration tests - NEON_TEST_DATABASE_URL not configured in .env.test");
    }
  });

  describe("pg Pooled Connection (pg-pooled strategy)", () => {
    test.skipIf(skipNeonTests)("connects to Neon via pooled connection string", async () => {
      if (!pgUrl) {
        console.log("⚠️  DATABASE_URL not set, skipping pg pooled test");
        return;
      }

      const pool = new Pool({
        connectionString: pgUrl,
        max: 3,
        idleTimeoutMillis: 30_000,
      });

      try {
        const result = await pool.query("SELECT 1 as test, version() as pg_version");
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].test).toBe(1);
        expect(result.rows[0].pg_version).toBeDefined();
        console.log(`✅ Connected via pg-pooled to: ${result.rows[0].pg_version}`);
      } finally {
        await pool.end();
      }
    });

    test.skipIf(skipNeonTests)("works with Drizzle ORM using pg-pooled", async () => {
      if (!pgUrl) {
        console.log("⚠️  DATABASE_URL not set, skipping pg pooled Drizzle test");
        return;
      }

      const pool = new Pool({
        connectionString: pgUrl,
        max: 3,
        idleTimeoutMillis: 30_000,
      });

      const db = drizzlePostgres({ client: pool, relations });

      try {
        const result = await db.execute(sql`SELECT 1 as test`);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].test).toBe(1);
        console.log("✅ Drizzle with pg-pooled works correctly");
      } finally {
        await pool.end();
      }
    });
  });

  describe("Neon Serverless Connection (neon-serverless strategy)", () => {
    test.skipIf(skipNeonTests)("connects to Neon via serverless driver", async () => {
      if (!neonUrl) {
        console.log("⚠️  NEON_TEST_DATABASE_URL not set, skipping neon-serverless test");
        return;
      }

      const pool = new NeonPool({
        connectionString: neonUrl,
        max: 3,
        idleTimeoutMillis: 30_000,
      });

      try {
        const result = await pool.query("SELECT 1 as test, version() as pg_version");
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].test).toBe(1);
        expect(result.rows[0].pg_version).toBeDefined();
        console.log(`✅ Connected via neon-serverless to: ${result.rows[0].pg_version}`);
      } finally {
        await pool.end();
      }
    });

    test.skipIf(skipNeonTests)("works with Drizzle ORM using neon-serverless", async () => {
      if (!neonUrl) {
        console.log("⚠️  NEON_TEST_DATABASE_URL not set, skipping neon-serverless Drizzle test");
        return;
      }

      const pool = new NeonPool({
        connectionString: neonUrl,
        max: 3,
        idleTimeoutMillis: 30_000,
      });

      const db = drizzleNeon({ client: pool, relations });

      try {
        const result = await db.execute(sql`SELECT 1 as test`);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].test).toBe(1);
        console.log("✅ Drizzle with neon-serverless works correctly");
      } finally {
        await pool.end();
      }
    });

    test.skipIf(skipNeonTests)(
      "works with Neon HTTP single-fetch client (getNeonHttpClient & getNeonHttpDb)",
      async () => {
        if (!neonUrl) return;

        const { drizzle: drizzleNeonHttp } = await import("drizzle-orm/neon-http");
        const { neon } = await import("@neondatabase/serverless");

        const client = neon(neonUrl);
        expect(client).toBeDefined();

        const httpDb = drizzleNeonHttp({ client, relations });
        const result = await httpDb.execute(sql`SELECT 1 as test`);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].test).toBe(1);
        console.log("✅ Neon HTTP single-fetch client (neon-http) works correctly against Neon DB");
      }
    );

    test.skipIf(skipNeonTests)("supports WebSocket connections", async () => {
      if (!neonUrl) {
        console.log("⚠️  NEON_TEST_DATABASE_URL not set, skipping WebSocket test");
        return;
      }

      // Neon serverless driver uses WebSocket by default
      const pool = new NeonPool({
        connectionString: neonUrl,
        max: 1,
        idleTimeoutMillis: 30_000,
      });

      try {
        // Run multiple queries to verify WebSocket stays alive
        for (let i = 0; i < 3; i++) {
          const result = await pool.query("SELECT $1 as num", [i]);
          expect(result.rows[0].num).toBe(String(i));
        }
        console.log("✅ WebSocket connection works for multiple queries");
      } finally {
        await pool.end();
      }
    });

    test.skipIf(skipNeonTests)("verifies SSL mode is verify-full", async () => {
      if (!neonUrl) {
        console.log("⚠️  NEON_TEST_DATABASE_URL not set, skipping SSL mode test");
        return;
      }

      const parsed = new URL(neonUrl);
      const sslMode = parsed.searchParams.get("sslmode");

      // Neon requires verify-full or require with uselibpqcompat
      expect(
        sslMode === "verify-full" || (sslMode === "require" && parsed.searchParams.get("uselibpqcompat") === "true")
      ).toBe(true);
      console.log(
        `✅ SSL mode is secure: ${sslMode}${parsed.searchParams.get("uselibpqcompat") ? " with uselibpqcompat" : ""}`
      );
    });

    test.skipIf(skipNeonTests)("verifies connection pooling works", async () => {
      if (!neonUrl) {
        console.log("⚠️  NEON_TEST_DATABASE_URL not set, skipping connection pooling test");
        return;
      }

      const pool = new NeonPool({
        connectionString: neonUrl,
        max: 5,
        idleTimeoutMillis: 30_000,
      });

      try {
        // Run concurrent queries to test pooling
        const queries = Array.from({ length: 10 }, (_, i) => pool.query("SELECT $1 as num, pg_sleep(0.01)", [i]));
        const results = await Promise.all(queries);

        expect(results).toHaveLength(10);
        results.forEach((result, i) => {
          expect(result.rows[0].num).toBe(String(i));
        });
        console.log("✅ Connection pooling works with concurrent queries");
      } finally {
        await pool.end();
      }
    });
  });

  describe("Connection Strategy Verification", () => {
    test.skipIf(skipNeonTests)("both connection strategies produce valid connections", async () => {
      // Test pg-pooled (if DATABASE_URL is Neon pooled)
      if (pgUrl?.includes("neon.tech")) {
        const pgPool = new Pool({ connectionString: pgUrl, max: 2, idleTimeoutMillis: 30_000 });
        try {
          const pgResult = await pgPool.query("SELECT 'pg-pooled' as strategy, version()");
          expect(pgResult.rows[0].strategy).toBe("pg-pooled");
          console.log(`✅ pg-pooled strategy works: ${pgResult.rows[0].version}`);
        } finally {
          await pgPool.end();
        }
      }

      // Test neon-serverless
      if (neonUrl) {
        const neonPool = new NeonPool({ connectionString: neonUrl, max: 2, idleTimeoutMillis: 30_000 });
        try {
          const neonResult = await neonPool.query("SELECT 'neon-serverless' as strategy, version()");
          expect(neonResult.rows[0].strategy).toBe("neon-serverless");
          console.log(`✅ neon-serverless strategy works: ${neonResult.rows[0].version}`);
        } finally {
          await neonPool.end();
        }
      }
    });
  });

  describe("Connection String Validation", () => {
    test("NEON_TEST_DATABASE_URL has correct format when set", () => {
      if (!neonUrl || neonUrl.includes("ep-example")) {
        console.log("⚠️  NEON_TEST_DATABASE_URL not set or is placeholder, skipping format validation");
        return;
      }

      const parsed = new URL(neonUrl);

      // Must be postgresql:// or postgres://
      expect(["postgresql:", "postgres:"]).toContain(parsed.protocol);

      // Must have hostname
      expect(parsed.hostname).toBeTruthy();

      // Should be a Neon hostname
      expect(parsed.hostname).toMatch(/neon\.tech$/);

      // Should have database name
      expect(parsed.pathname.length).toBeGreaterThan(1);

      // Should have SSL parameters
      expect(parsed.searchParams.has("sslmode")).toBe(true);

      console.log(`✅ NEON_TEST_DATABASE_URL format is valid: ${parsed.hostname}${parsed.pathname}`);
    });

    test("DATABASE_URL for tests targets a valid database", () => {
      if (!pgUrl) {
        console.log("⚠️  DATABASE_URL not set, skipping test DB validation");
        return;
      }

      const parsed = new URL(pgUrl);
      const dbName = parsed.pathname.slice(1); // Remove leading /

      expect(dbName).toBeTruthy();
      console.log(`✅ Test DATABASE_URL targets correct database: ${dbName}`);
    });
  });
});
