import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import logger from "@/backend/lib/logger";

const DRIZZLE_DIR = "./backend/drizzle";

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
 * Transforms a single SQL statement to be idempotent if needed.
 */
export function transformStatementIdempotent(stmt: string): string {
  const trimmed = stmt.trim();
  if (!trimmed) return stmt;

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
 * Transforms an entire migration SQL string (containing statement breakpoints) into idempotent SQL.
 */
export function makeMigrationSqlIdempotent(sql: string): string {
  const parts = sql.split(/--> statement-breakpoint\r?\n?/g);
  const transformedParts = parts.map(part => transformStatementIdempotent(part));
  return transformedParts.join("--> statement-breakpoint\n");
}

/**
 * Scans backend/drizzle and makes all migration.sql files idempotent.
 * Returns the list of migration files that were updated.
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
      writeFileSync(sqlPath, idempotentSql);
      updatedFiles.push(`${folder}/migration.sql`);
    }
  }

  if (updatedFiles.length > 0) {
    logger.log(
      `Ensure Idempotent Migrations: Updated ${updatedFiles.length} migration file(s):\n  ${updatedFiles.join("\n  ")}`
    );
  }

  return updatedFiles;
}
