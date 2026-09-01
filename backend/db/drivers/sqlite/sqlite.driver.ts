import { type Client, createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import type { AnyRelations } from "drizzle-orm/relations";
import { getStringEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";

/**
 * Resolves the SQLite connection URL.
 *
 * Priority:
 * 1. `DATABASE_URL` when it points at a libsql/SQLite target
 *    (`file:...`, `libsql://...`, `http://...`, `https://...`).
 * 2. `DB_FILE_NAME` env var (convenience: a bare file path) → `file:` URL.
 */
function resolveSqliteUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && /^(file:|libsql:|https?:|wss?:)/i.test(databaseUrl)) {
    return databaseUrl;
  }
  const fileName = getStringEnv("DB_FILE_NAME", "./db/siraj.sqlite") ?? "./db/siraj.sqlite";
  return fileName.startsWith("file:") ? fileName : `file:${fileName}`;
}

let cachedSqliteClient: Client | null = null;

/**
 * Resets the cached SQLite client (useful in test teardown).
 * Closes the underlying libsql client so file handles are released.
 */
function resetSqliteClient(): void {
  const client = cachedSqliteClient;
  cachedSqliteClient = null;
  if (client && !client.closed) {
    try {
      client.close();
    } catch (error) {
      logger.warn(`Failed to close SQLite client during reset: ${String(error)}`);
    }
  }
}

/**
 * Creates or returns the singleton libsql raw client and applies SQLite pragmas for a Next.js
 * server workload: WAL mode, foreign_keys ON, busy_timeout 60s.
 * For remote (Turso / http) targets, pragmas are skipped.
 */
function createSqliteClient(): Client {
  if (cachedSqliteClient) {
    return cachedSqliteClient;
  }

  const url = resolveSqliteUrl();
  const authToken = process.env.DATABASE_AUTH_TOKEN ?? undefined;

  logger.info(`Initializing libsql SQLite connection (${url.replace(/file:/, "file://")})`);

  const client = createClient({ url, authToken });

  if (url.startsWith("file:")) {
    client
      .executeMultiple(
        "PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 60000; PRAGMA foreign_keys = ON; PRAGMA synchronous = NORMAL;"
      )
      .catch(err => {
        logger.error(`Failed to set SQLite pragmas: ${String(err)}`);
        // Drop the broken client so the next createSqliteClient() call can retry
        // instead of running against an uninitialized/un-migrated database.
        resetSqliteClient();
        throw err;
      });
  }

  cachedSqliteClient = client;
  return client;
}

/**
 * The libsql-backed Drizzle database type.
 * `LibSQLDatabase` extends `BaseSQLiteDatabase<'async', ...>` — the `'async`
 * result kind means `db.transaction(async (tx) => ...)` accepts async callbacks
 * and returns `Promise<T>`, mirroring the Postgres driver's signature.
 */
export type SqliteDbType = LibSQLDatabase;

/**
 * Creates the Drizzle database instance backed by libsql.
 * Relations are injected by the caller so this module stays free of schema imports.
 */
export function createSqliteDb(relations?: AnyRelations): SqliteDbType {
  const client = createSqliteClient();
  return drizzle({ client, ...(relations ? { relations } : {}) });
}
