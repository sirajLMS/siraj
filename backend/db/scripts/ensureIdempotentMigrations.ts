import { existsSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import logger from "@/backend/lib/logger";

const DRIZZLE_DIR = resolve("backend/drizzle");

function transformCreateType(trimmed: string): string | null {
  if (/\bCREATE\s+TYPE\b/i.test(trimmed) && !/DO\s+\$\$/i.test(trimmed) && !/IF\s+NOT\s+EXISTS/i.test(trimmed)) {
    const match = /\bCREATE\s+TYPE\s+("?(\w+)"?)\s+AS\s+ENUM/i.exec(trimmed);
    if (match) {
      const typeName = match[2];
      const body = trimmed.endsWith(";") ? trimmed : `${trimmed};`;
      return `DO $$ BEGIN\n    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}') THEN\n        ${body}\n    END IF;\nEND $$;`;
    }
  }
  return null;
}

function transformAddColumn(trimmed: string): string {
  if (/\bADD\s+COLUMN\b/i.test(trimmed) && !/\bADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\b/i.test(trimmed)) {
    return trimmed.replace(/\bADD\s+COLUMN\b/gi, "ADD COLUMN IF NOT EXISTS");
  }
  return trimmed;
}

function transformAddConstraint(trimmed: string): string | null {
  if (/\bADD\s+CONSTRAINT\b/i.test(trimmed) && !/DO\s+\$\$/i.test(trimmed)) {
    const body = trimmed.endsWith(";") ? trimmed : `${trimmed};`;
    return `DO $$ BEGIN\n    ${body}\nEXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;\nEND $$;`;
  }
  return null;
}

/**
 * Wraps `ALTER TYPE <type> ADD VALUE '<val>'` in a `DO $$` PL/pgSQL block that checks `pg_enum`
 * before attempting the addition.
 *
 * This prevents PostgreSQL from marking an active transaction as modifying the enum type when the
 * value is already present in `pg_enum` (which would trigger error 55P04 on subsequent queries).
 */
function transformAlterTypeAddValue(trimmed: string): string | null {
  if (/\bALTER\s+TYPE\b/i.test(trimmed) && /\bADD\s+VALUE\b/i.test(trimmed) && !/DO\s+\$\$/i.test(trimmed)) {
    const match = /\bALTER\s+TYPE\s+("?(\w+)"?)\s+ADD\s+VALUE\s+(?:IF\s+NOT\s+EXISTS\s+)?('[^']+')/i.exec(trimmed);
    if (match) {
      const fullType = match[1];
      const typeName = match[2];
      const enumVal = match[3];
      return `DO $$ BEGIN\n    IF NOT EXISTS (\n        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = '${typeName}' AND e.enumlabel = ${enumVal}\n    ) THEN\n        ALTER TYPE ${fullType} ADD VALUE ${enumVal};\n    END IF;\nEND $$;`;
    }
  }
  return null;
}

function transformInsertGroupPermissions(trimmed: string): string | null {
  if (
    /\bINSERT\s+INTO\s+(group_permissions|user_permission_groups)\b/i.test(trimmed) &&
    !/ON\s+CONFLICT/i.test(trimmed)
  ) {
    const body = trimmed.endsWith(";") ? trimmed.slice(0, -1) : trimmed;
    return `${body} ON CONFLICT DO NOTHING;`;
  }
  return null;
}

/**
 * Transforms a single SQL statement to be idempotent for PostgreSQL.
 * Handles `CREATE TYPE`, `ADD COLUMN`, `ADD CONSTRAINT`, `ALTER TYPE ... ADD VALUE`, and join-table `INSERT`s.
 *
 * @param stmt The SQL statement string to transform.
 * @returns The transformed, idempotent SQL statement.
 */
export function transformStatementIdempotent(stmt: string): string {
  const trimmed = stmt.trim();
  if (!trimmed) return stmt;

  const alterTypeAddValue = transformAlterTypeAddValue(trimmed);
  if (alterTypeAddValue) return alterTypeAddValue;

  const createType = transformCreateType(trimmed);
  if (createType) return createType;

  const withColumn = transformAddColumn(trimmed);

  const addConstraint = transformAddConstraint(withColumn);
  if (addConstraint) return addConstraint;

  const insertPermissions = transformInsertGroupPermissions(withColumn);
  if (insertPermissions) return insertPermissions;

  return withColumn;
}

/**
 * Transforms an entire migration SQL string (containing Drizzle `--> statement-breakpoint` markers) into idempotent SQL.
 *
 * @param sql The full raw SQL file content.
 * @returns The transformed SQL string with breakpoints preserved.
 */
export function makeMigrationSqlIdempotent(sql: string): string {
  const parts = sql.split(/--> statement-breakpoint\r?\n?/g);
  const transformedParts = parts.map(part => transformStatementIdempotent(part));
  return transformedParts.join("--> statement-breakpoint\n");
}

/**
 * Scans `backend/drizzle/` and rewrites all `migration.sql` files to be fully idempotent for PostgreSQL.
 *
 * @returns The list of relative migration file paths that were modified.
 */
export function ensureIdempotentMigrations(): string[] {
  if (!existsSync(DRIZZLE_DIR)) return [];

  const updatedFiles: string[] = [];
  const folders = readdirSync(DRIZZLE_DIR).filter(f => {
    try {
      return statSync(join(DRIZZLE_DIR, f)).isDirectory();
    } catch {
      return false;
    }
  });

  for (const folder of folders) {
    const sqlPath = join(DRIZZLE_DIR, folder, "migration.sql");
    if (!existsSync(sqlPath)) continue;

    const originalSql = readFileSync(sqlPath, "utf8");
    const idempotentSql = makeMigrationSqlIdempotent(originalSql);

    if (originalSql !== idempotentSql) {
      const tmpPath = `${sqlPath}.tmp`;
      writeFileSync(tmpPath, idempotentSql);
      try {
        renameSync(tmpPath, sqlPath);
      } catch (err) {
        try {
          unlinkSync(tmpPath);
        } catch {
          // best-effort cleanup of the orphaned temp file; ignore errors
        }
        throw err;
      }
      updatedFiles.push(`${folder}/migration.sql`);
    }
  }

  if (updatedFiles.length > 0) {
    logger.log(
      `Ensure Idempotent Migrations: Updated ${updatedFiles.length} migration file(s):\n  ${updatedFiles.join("\n  ")}`
    );
  } else {
    logger.log("Ensure Idempotent Migrations: All migration files already idempotent — no changes needed.");
  }

  return updatedFiles;
}

/**
 * Scans all migration SQL files in `backend/drizzle/` and pre-executes any `ALTER TYPE ... ADD VALUE`
 * statements individually outside Drizzle's transaction block.
 *
 * Required because PostgreSQL forbids using newly added enum values within the same transaction
 * block that created them (error 55P04: `unsafe use of new value ... of enum type`).
 * Pre-executing and committing enum values before Drizzle's transaction guarantees that
 * subsequent `INSERT` queries can cast/coerce to those enum values without error.
 */
export async function ensureEnumValuesCommitted(): Promise<void> {
  if (!existsSync(DRIZZLE_DIR)) return;

  const enumStatements: string[] = [];
  const folders = readdirSync(DRIZZLE_DIR).filter(f => {
    try {
      return statSync(join(DRIZZLE_DIR, f)).isDirectory();
    } catch {
      return false;
    }
  });

  for (const folder of folders) {
    const sqlPath = join(DRIZZLE_DIR, folder, "migration.sql");
    if (!existsSync(sqlPath)) continue;

    const content = readFileSync(sqlPath, "utf8");
    const matches = content.matchAll(/\bALTER\s+TYPE\s+("?\w+"?)\s+ADD\s+VALUE\s+(?:IF\s+NOT\s+EXISTS\s+)?('[^']+')/gi);
    for (const match of matches) {
      const fullType = match[1];
      const enumVal = match[2];
      enumStatements.push(`ALTER TYPE ${fullType} ADD VALUE IF NOT EXISTS ${enumVal};`);
    }
  }

  if (enumStatements.length === 0) return;

  const { db } = await import("@/backend/db/drizzleDb");
  const { sql } = await import("drizzle-orm");

  logger.log(`Ensure Enum Values Committed: Pre-executing ${enumStatements.length} enum addition(s)...`);
  for (const stmt of enumStatements) {
    try {
      await db.execute(sql.raw(stmt));
    } catch (err) {
      logger.warn(`Failed to pre-commit enum statement "${stmt}":`, err);
    }
  }
}
