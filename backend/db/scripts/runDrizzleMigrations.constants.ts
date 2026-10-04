export const DEFAULT_MIGRATIONS_FOLDER = "./backend/drizzle";
export const MIGRATIONS_TABLE = "__drizzle_migrations";
export const MIGRATIONS_SCHEMA = "drizzle";

/**
 * Statements that must never re-run during a drift re-apply. A drift only means the
 * folder file changed after it was applied (in-place idempotency rewrites or direct
 * edits) — re-running destructive or non-idempotent statements against a database
 * whose state has moved on is not safe. The drizzle-generated enum-extend dance is the
 * concrete case: `SET DATA TYPE text` → `DROP TYPE` → `CREATE TYPE` (old value list) →
 * re-cast, which fails or loses values when re-run after later migrations added enum
 * values. Guard-wrapped statements (DO $$ blocks emitted by ensureIdempotentMigrations)
 * are already idempotent and always safe.
 */
export const UNSAFE_REAPPLY_PATTERNS: readonly RegExp[] = [
  /^DROP\s+(TYPE|TABLE|SCHEMA|DATABASE)\b/i,
  /^TRUNCATE\b/i,
  /^DELETE\s+FROM\b/i,
  /^UPDATE\s+\S+\s+SET\b/i,
  /^(COMMIT|BEGIN|SAVEPOINT|RELEASE)\b/i,
  /^ALTER\s+TABLE\s+\S+\s+ALTER\s+COLUMN\s+\S+\s+(SET\s+DATA\s+)?TYPE\b/i,
  /^ALTER\s+TABLE\s+\S+\s+ADD\s+CONSTRAINT\b/i,
  /^CREATE\s+TRIGGER\b/i,
];
