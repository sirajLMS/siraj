import { getStringEnv } from "@/backend/lib/env";

/**
 * Supported database dialects.
 *
 * - `"postgres"` — PostgreSQL (Neon serverless OR node-postgres pooled).
 *   Activated by `DB_PROVIDER=postgres` (or any value that is not `sqlite`).
 * - `"sqlite"` — SQLite via the `libsql` driver (`@libsql/client`).
 *   Activated by `DB_PROVIDER=sqlite`.
 *
 * The dialect is resolved **once** at process start and is immutable for the
 * lifetime of the process. All schema definitions, the `db` singleton, and the
 * repo factory read this value so every layer agrees on the active driver.
 */
export type DbDialect = "postgres" | "sqlite";

/**
 * Resolves the active database dialect from the `DB_PROVIDER` env var.
 *
 * Defaults to `"postgres"` when unset, preserving the project's historical
 * behavior — existing deployments that do not set `DB_PROVIDER` continue to
 * use PostgreSQL with zero behavior change.
 */
export function getDbDialect(): DbDialect {
  const provider = (getStringEnv("DB_PROVIDER", "postgres") ?? "postgres").toLowerCase();
  if (provider === "sqlite") return "sqlite";
  return "postgres";
}

/** True when the active dialect is PostgreSQL. */
export const isPostgres = (): boolean => getDbDialect() === "postgres";

/** True when the active dialect is SQLite (libsql). */
export const isSqlite = (): boolean => getDbDialect() === "sqlite";
