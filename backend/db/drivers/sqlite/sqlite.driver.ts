import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
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
export function resolveSqliteUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && /^(file:|libsql:|https?:|wss?:)/i.test(databaseUrl)) {
    return databaseUrl;
  }
  const fileName = getStringEnv("DB_FILE_NAME", "./siraj.sqlite");
  return fileName.startsWith("file:") ? fileName : `file:${fileName}`;
}

/**
 * Creates the libsql raw client and applies SQLite pragmas for a Next.js
 * server workload: WAL mode, foreign_keys ON, busy_timeout 5s.
 * For remote (Turso / http) targets, pragmas are skipped.
 */
export function createSqliteClient(): Client {
  const url = resolveSqliteUrl();
  const authToken = process.env.DATABASE_AUTH_TOKEN ?? undefined;

  logger.log(`Initializing libsql SQLite connection (${url.replace(/file:/, "file://")})`);

  const client = createClient({ url, authToken });

  if (url.startsWith("file:")) {
    client.execute("PRAGMA journal_mode = WAL;").catch(err => {
      logger.error(`Failed to set SQLite WAL journal mode: ${String(err)}`);
    });
    client.execute("PRAGMA foreign_keys = ON;").catch(() => {});
    client.execute("PRAGMA busy_timeout = 5000;").catch(() => {});
  }

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
export function createSqliteDb<TRelations>(relations: TRelations): SqliteDbType {
  const client = createSqliteClient();
  return drizzle({ client, relations: relations as never });
}
