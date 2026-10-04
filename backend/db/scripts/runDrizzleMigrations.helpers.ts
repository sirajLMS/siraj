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
import {
  DEFAULT_MIGRATIONS_FOLDER,
  MIGRATIONS_SCHEMA,
  MIGRATIONS_TABLE,
  UNSAFE_REAPPLY_PATTERNS,
} from "@/backend/db/scripts/runDrizzleMigrations.constants";
import { logger } from "@/backend/lib/logger";

export interface DrizzleMigrationConfig {
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

interface MappedDbMigration {
  id: number;
  hash: string;
  created_at: string;
  name: string | null;
}

export type PgMigratorDatabase = NodePgDatabase | NeonDatabase;

/** How the journal records an applied folder: new row (pending) vs hash refresh (drifted). */
export type JournalWriteMode = "insert" | "update";

export interface MigrationRunContext {
  db: PgMigratorDatabase;
  migrationsFolder: string;
  migrationsTable: string;
  migrationsSchema: string;
}

export interface MigrationState {
  migrationsFolder: string;
  migrationsTable: string;
  migrationsSchema: string;
  migrationsToRun: MigrationMeta[];
  driftedMigrations: MigrationMeta[];
  reApplicableMigrations: MigrationMeta[];
}

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

function mapDbMigrationRows(rows: readonly unknown[]): MappedDbMigration[] {
  return rows.filter(isDbMigrationRow).map(row => ({
    id: row.id,
    hash: row.hash,
    created_at: String(row.created_at),
    name: row.name,
  }));
}

/**
 * Content-drift detection: folders whose name is already in the journal but whose
 * recorded hash no longer matches the current file content. ensureIdempotentMigrations
 * rewrites folder SQL in place (and files may be edited directly), so an already-applied
 * folder can carry updated statements that a name-only matcher would silently skip.
 */
function collectDriftedMigrations(
  migrations: readonly MigrationMeta[],
  dbMigrations: readonly MappedDbMigration[]
): MigrationMeta[] {
  const dbMigrationsByName = new Map(dbMigrations.map(migration => [migration.name, migration]));
  return migrations.filter(localMigration => {
    if (!localMigration.name) {
      return false;
    }
    const dbRow = dbMigrationsByName.get(localMigration.name);
    return dbRow !== undefined && dbRow.hash !== localMigration.hash;
  });
}

/**
 * Only re-apply drifted folders whose every statement is safe to re-run. A folder
 * carrying destructive or non-idempotent statements (enum drop/recreate, column type
 * conversion, transaction control) is skipped: its journal hash stays untouched so the
 * drift remains visible instead of silently claiming the content was applied.
 */
function collectReApplicableMigrations(driftedMigrations: readonly MigrationMeta[]): MigrationMeta[] {
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
  return reApplicableMigrations;
}

async function createJournalTable(
  db: PgMigratorDatabase,
  migrationsSchema: string,
  migrationsTable: string
): Promise<void> {
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

export async function loadMigrationState(
  db: PgMigratorDatabase,
  config: DrizzleMigrationConfig
): Promise<MigrationState> {
  const migrationsFolder = config.migrationsFolder ?? DEFAULT_MIGRATIONS_FOLDER;
  const migrationsTable = config.migrationsTable ?? MIGRATIONS_TABLE;
  const migrationsSchema = config.migrationsSchema ?? MIGRATIONS_SCHEMA;

  const migrations = readMigrationFiles({ migrationsFolder, migrationsTable, migrationsSchema });

  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(migrationsSchema)}`);

  const { newDb } = await upgradeIfNeeded(migrationsSchema, migrationsTable, db, migrations);

  if (newDb) {
    await createJournalTable(db, migrationsSchema, migrationsTable);
  }

  const dbMigrationResult = await db.execute(
    sql`select id, hash, created_at, name from ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)}`
  );
  const dbMigrations = mapDbMigrationRows(dbMigrationResult.rows);

  const migrationsToRun = getMigrationsToRun({ localMigrations: migrations, dbMigrations });
  const driftedMigrations = collectDriftedMigrations(migrations, dbMigrations);
  const reApplicableMigrations = collectReApplicableMigrations(driftedMigrations);

  return {
    migrationsFolder,
    migrationsTable,
    migrationsSchema,
    migrationsToRun,
    driftedMigrations,
    reApplicableMigrations,
  };
}

export function logPendingSummary(pendingCount: number, driftedCount: number): void {
  logger.log(`Applying ${pendingCount} pending Drizzle migration folder(s)...`);
  if (driftedCount > 0) {
    logger.warn(
      `${driftedCount} already-applied folder(s) changed on disk since they ran — re-applying the ones that are safe to re-run and refreshing journal hashes.`
    );
  }
}

function logAppliedMigration(migrationName: string, journalWrite: JournalWriteMode): void {
  if (journalWrite === "insert") {
    logger.log(`Applied migration: ${migrationName}`);
  } else {
    logger.log(`Re-applied migration (content changed): ${migrationName}`);
  }
}

export async function applyMigrationFolder(
  context: MigrationRunContext,
  migration: MigrationMeta,
  journalWrite: JournalWriteMode
): Promise<void> {
  const migrationName = migration.name;
  if (!migrationName) {
    throw new Error("Migration is missing a folder name.");
  }

  const { db, migrationsFolder, migrationsSchema, migrationsTable } = context;
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

  logAppliedMigration(migrationName, journalWrite);

  // On a fresh database, enum types do not exist yet when ensureEnumValuesCommitted()
  // runs before migrations start. When a migration creates an enum type, re-run
  // ensureEnumValuesCommitted() so that any future enum values across all migration
  // folders are pre-committed for that newly created type.
  if (migration.sql.some(stmt => /\bCREATE\s+TYPE\b/i.test(stmt))) {
    await ensureEnumValuesCommitted();
  }
}

export async function runMigrationsSequentially(
  context: MigrationRunContext,
  migrations: readonly MigrationMeta[],
  journalWrite: JournalWriteMode
): Promise<void> {
  await migrations.reduce<Promise<unknown>>(
    (sequence, migration) => sequence.then(() => applyMigrationFolder(context, migration, journalWrite)),
    Promise.resolve()
  );
}
