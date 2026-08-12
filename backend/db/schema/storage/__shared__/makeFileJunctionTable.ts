import { type AnyPgColumnBuilder, index, pgTable, uuid, varchar } from "drizzle-orm/pg-core";

import { createdAtColumn, primaryKeyColumn } from "@/backend/db/schema/__shared__/columnHelpers";
import { storageFiles } from "@/backend/db/schema/storage/storage";

/**
 * Shared column shape for file junction tables.
 * Each junction table links one entity to storage_files with a usage type.
 */
interface FileJunctionColumns {
  /** The entity-specific FK column, e.g. a `uuid(...)` column builder. */
  [key: string]: AnyPgColumnBuilder;
}

/**
 * Configuration for a file junction table.
 *
 * Uses a typed config object — the caller provides column definitions as a
 * typed object literal (so TS property names are static string literals) and
 * `entityColumnName` as a keyof the columns object. Drizzle's extraConfig
 * callback maps the same keys, so `table[entityColumnName]` is typed without
 * any `as` casts (avoids no-unsafe-type-assertion).
 */
export interface FileJunctionConfig<TColumns extends FileJunctionColumns = FileJunctionColumns> {
  /** Database table name (snake_case), e.g. "user_files". */
  dbTableName: string;
  /** Entity FK column definition, keyed by the desired TS property name. */
  columns: TColumns;
  /** TS property name of the entity FK column in `columns`, e.g. "userId". */
  entityColumnName: keyof TColumns & string;
  /** Index-name suffix for the entity FK column, e.g. "user_id" or "res_id". */
  entityIndexSuffix: string;
}

/**
 * Factory for the 10 file junction tables in `storage.ts`.
 *
 * All junction tables share the same column shape:
 * - `id` (uuid primary key, default random)
 * - `fileId` (FK to storage_files, cascade delete)
 * - Entity-specific FK column (passed via config)
 * - `usageType` (varchar 100, not null)
 * - `createdAt` (timestamp with timezone, default now)
 * - Two indexes: one on fileId, one on the entity FK column
 *
 * The helper returns a fully typed `pgTable` — Drizzle infers the column types
 * from the merged columns object. Callers provide the entity column as a typed
 * object literal so the TS property name is a static string literal.
 */
export function makeFileJunctionTable<TColumns extends FileJunctionColumns>(config: FileJunctionConfig<TColumns>) {
  return pgTable(
    config.dbTableName,
    {
      ...primaryKeyColumn(),
      fileId: uuid("file_id")
        .notNull()
        .references(() => storageFiles.id, { onDelete: "cascade" }),
      ...config.columns,
      usageType: varchar("usage_type", { length: 100 }).notNull(),
      ...createdAtColumn({ withDefaultNow: true }),
    },
    table => [
      index(`${config.dbTableName}_file_id_idx`).on(table.fileId),
      index(`${config.dbTableName}_${config.entityIndexSuffix}_idx`).on(table[config.entityColumnName]),
    ]
  );
}
