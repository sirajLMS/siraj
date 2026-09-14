import { join } from "node:path";
import { sql } from "drizzle-orm";
import { type MigrationMeta, readMigrationFiles } from "drizzle-orm/migrator";
import { getMigrationsToRun } from "drizzle-orm/migrator.utils";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { upgradeIfNeeded } from "drizzle-orm/up-migrations/pg";
import {
  ensureEnumValuesCommitted,
  preCommitEnumStatementsForMigrationFile,
} from "@/backend/db/scripts/ensureIdempotentMigrations";
import { logger } from "@/backend/lib/logger";

const DEFAULT_MIGRATIONS_FOLDER = "./backend/drizzle";
const MIGRATIONS_TABLE = "__drizzle_migrations";
const MIGRATIONS_SCHEMA = "drizzle";

interface DrizzleMigrationConfig {
  migrationsFolder?: string;
  migrationsTable?: string;
  migrationsSchema?: string;
}

interface DbMigrationRow {
  id: number;
  hash: string;
  created_at: number | string;
  name: string | null;
}

type PgMigratorDatabase = NodePgDatabase | NeonDatabase;

/** How the journal records an applied folder: new row (pending) vs hash refresh (drifted). */
type JournalWriteMode = "insert" | "update";

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
const UNSAFE_REAPPLY_PATTERNS: readonly RegExp[] = [
  /^DROP\s+(TYPE|TABLE|SCHEMA|DATABASE)\b/i,
  /^TRUNCATE\b/i,
  /^DELETE\s+FROM\b/i,
  /^UPDATE\s+\S+\s+SET\b/i,
  /^(COMMIT|BEGIN|SAVEPOINT|RELEASE)\b/i,
  /^ALTER\s+TABLE\s+\S+\s+ALTER\s+COLUMN\s+\S+\s+(SET\s+DATA\s+)?TYPE\b/i,
  /^ALTER\s+TABLE\s+\S+\s+ADD\s+CONSTRAINT\b/i,
  /^CREATE\s+TRIGGER\b/i,
];

function isUnsafeReApplyStatement(statement: string): boolean {
  const trimmed = statement.trim();
  if (!trimmed) {
    return false;
  }
  if (/^DO\s+\$\$/i.test(trimmed)) {
    return false;
  }
  if (/^INSERT\s+INTO\b/i.test(trimmed)) {
    return !/\bON\s+CONFLICT\b/i.test(trimmed);
  }
  if (/^CREATE\s+(TYPE|TABLE)\b/i.test(trimmed)) {
    return !/\bIF\s+NOT\s+EXISTS\b/i.test(trimmed);
  }
  if (/^CREATE\s+(UNIQUE\s+)?INDEX\b/i.test(trimmed)) {
    return !/\bIF\s+NOT\s+EXISTS\b/i.test(trimmed);
  }
  if (/^ALTER\s+TABLE\s+\S+\s+ADD\s+COLUMN\b/i.test(trimmed)) {
    return !/\bIF\s+NOT\s+EXISTS\b/i.test(trimmed);
  }
  return UNSAFE_REAPPLY_PATTERNS.some(pattern => pattern.test(trimmed));
}

/** Returns the first statement of a folder that must not re-run, or null when the folder is safe. */
function findUnsafeReApplyStatement(statements: readonly string[]): string | null {
  return statements.find(statement => isUnsafeReApplyStatement(statement)) ?? null;
}

/** Short single-line excerpt of a statement for log output. */
function excerptStatement(statement: string): string {
  const flat = statement.trim().replace(/\s+/g, " ");
  if (flat.length <= 80) {
    return flat;
  }
  return `${flat.slice(0, 77)}...`;
}

function isDbMigrationRow(value: unknown): value is DbMigrationRow {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "id" in value &&
    typeof value.id === "number" &&
    "hash" in value &&
    typeof value.hash === "string"
  );
}

/**
 * Runs pending Drizzle migrations one folder at a time (separate transactions).
 *
 * Drizzle's built-in migrator wraps **all** pending folders in a single transaction.
 * That breaks PostgreSQL enum rules (55P04) when a migration adds an enum value and
 * uses it in the same transaction. We pre-commit enum additions per folder, then apply
 * each migration in its own transaction.
 *
 * Beyond name-based pending detection, already-applied folders whose content changed
 * since they ran (in-place idempotency rewrites, direct file edits) are re-applied and
 * their journal hash refreshed — but only when every statement in the folder is safe to
 * re-run (see {@link findUnsafeReApplyStatement}). Folders carrying destructive or
 * non-idempotent statements (e.g. the drizzle-generated enum drop/recreate dance) are
 * skipped with a warning; their journal hash is left untouched so the drift stays visible.
 */
export async function runDrizzleMigrations(db: PgMigratorDatabase, config: DrizzleMigrationConfig = {}): Promise<void> {
  const migrationsFolder = config.migrationsFolder ?? DEFAULT_MIGRATIONS_FOLDER;
  const migrationsTable = config.migrationsTable ?? MIGRATIONS_TABLE;
  const migrationsSchema = config.migrationsSchema ?? MIGRATIONS_SCHEMA;

  const migratorConfig = { migrationsFolder, migrationsTable, migrationsSchema };
  const migrations = readMigrationFiles(migratorConfig);

  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(migrationsSchema)}`);

  const { newDb } = await upgradeIfNeeded(migrationsSchema, migrationsTable, db, migrations);

  if (newDb) {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint,
        name text,
        applied_at timestamp with time zone DEFAULT now()
      )
    `);
  }

  const dbMigrationResult = await db.execute(
    sql`select id, hash, created_at, name from ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)}`
  );
  const dbMigrations = (dbMigrationResult.rows as readonly unknown[]).filter(isDbMigrationRow).map(row => ({
    id: row.id,
    hash: row.hash,
    created_at: String(row.created_at),
    name: row.name,
  }));

  const migrationsToRun = getMigrationsToRun({
    localMigrations: migrations,
    dbMigrations,
  });

  // Content-drift detection: folders whose name is already in the journal but whose
  // recorded hash no longer matches the current file content. ensureIdempotentMigrations
  // rewrites folder SQL in place (and files may be edited directly), so an already-applied
  // folder can carry updated statements that a name-only matcher would silently skip.
  const dbMigrationsByName = new Map(dbMigrations.map(migration => [migration.name, migration]));
  const driftedMigrations = migrations.filter(lm => {
    if (!lm.name) {
      return false;
    }
    const dbRow = dbMigrationsByName.get(lm.name);
    return dbRow !== undefined && dbRow.hash !== lm.hash;
  });

  if (migrationsToRun.length === 0 && driftedMigrations.length === 0) {
    logger.log("No pending Drizzle migrations.");
    return;
  }

  logger.log(`Applying ${migrationsToRun.length} pending Drizzle migration folder(s)...`);
  if (driftedMigrations.length > 0) {
    logger.warn(
      `${driftedMigrations.length} already-applied folder(s) changed on disk since they ran — re-applying the ones that are safe to re-run and refreshing journal hashes.`
    );
  }

  // Only re-apply drifted folders whose every statement is safe to re-run. A folder
  // carrying destructive or non-idempotent statements (enum drop/recreate, column type
  // conversion, transaction control) is skipped: its journal hash stays untouched so the
  // drift remains visible instead of silently claiming the content was applied.
  const reApplicableMigrations: MigrationMeta[] = [];
  for (const migration of driftedMigrations) {
    const unsafeStatement = findUnsafeReApplyStatement(migration.sql);
    if (unsafeStatement) {
      logger.warn(
        `Skipping re-apply of "${migration.name}" — statement not safe to re-run: ${excerptStatement(unsafeStatement)}`
      );
      continue;
    }
    reApplicableMigrations.push(migration);
  }

  // Pre-commit ALL enum additions from ALL migration folders before running any
  // migration. This ensures enum values referenced by earlier migrations (e.g.
  // INSERT statements casting to app_permission) are available even when the
  // ALTER TYPE ... ADD VALUE migration folder runs later in the sequence.
  await ensureEnumValuesCommitted();

  const applyMigration = async (migration: MigrationMeta, journalWrite: JournalWriteMode): Promise<void> => {
    const migrationName = migration.name;
    if (!migrationName) {
      throw new Error("Migration is missing a folder name.");
    }

    const migrationPath = join(migrationsFolder, migrationName, "migration.sql");
    await preCommitEnumStatementsForMigrationFile(migrationPath);

    await db.transaction(async tx => {
      await migration.sql.reduce<Promise<unknown>>(
        (sequence, stmt) => sequence.then(() => tx.execute(sql.raw(stmt))),
        Promise.resolve()
      );
      if (journalWrite === "insert") {
        await tx.execute(
          sql`insert into ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} ("hash", "created_at", "name") values(${migration.hash}, ${migration.folderMillis}, ${migrationName})`
        );
      } else {
        await tx.execute(
          sql`update ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} set "hash" = ${migration.hash}, "applied_at" = now() where "name" = ${migrationName}`
        );
      }
    });

    if (journalWrite === "insert") {
      logger.log(`Applied migration: ${migrationName}`);
    } else {
      logger.log(`Re-applied migration (content changed): ${migrationName}`);
    }
  };

  await migrationsToRun.reduce<Promise<unknown>>(
    (sequence, migration) => sequence.then(() => applyMigration(migration, "insert")),
    Promise.resolve()
  );

  await reApplicableMigrations.reduce<Promise<unknown>>(
    (sequence, migration) => sequence.then(() => applyMigration(migration, "update")),
    Promise.resolve()
  );
}
