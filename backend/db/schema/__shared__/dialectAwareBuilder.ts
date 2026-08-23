import { sql } from "drizzle-orm";
import {
  bigint as pgBigint,
  boolean as pgBoolean,
  check as pgCheck,
  customType as pgCustomType,
  index as pgIndex,
  inet as pgInet,
  integer as pgInteger,
  jsonb as pgJsonb,
  numeric as pgNumeric,
  primaryKey as pgPrimaryKey,
  serial as pgSerial,
  pgEnum,
  pgTable,
  text as pgText,
  timestamp as pgTimestamp,
  uniqueIndex as pgUniqueIndex,
  uuid as pgUuid,
  varchar as pgVarchar,
} from "drizzle-orm/pg-core";
import {
  blob as sqliteBlob,
  check as sqliteCheck,
  customType as sqliteCustomType,
  index as sqliteIndex,
  integer as sqliteInteger,
  primaryKey as sqlitePrimaryKey,
  sqliteTable,
  text as sqliteText,
  uniqueIndex as sqliteUniqueIndex,
} from "drizzle-orm/sqlite-core";
import { isSqlite } from "@/backend/db/dialect";
import { decryptField, encryptField } from "@/backend/lib/field-encryption";

/**
 * ============================================================================
 * DIALECT-AWARE SCHEMA BUILDER
 * ============================================================================
 *
 * Unified table + column builders that produce the correct Drizzle objects for
 * the active database dialect (`pgTable`/`pgEnum` for PostgreSQL, or
 * `sqliteTable`/`text({enum})` for SQLite).
 *
 * TYPE STRATEGY — "type erasure via `never`":
 * Each helper has two branches:
 * - PG branch: returns the real PG column/table → provides the TypeScript type.
 * - SQLite branch: returns the sqlite column/table cast `as never`.
 *
 * In TypeScript, `T | never === T`, so the function's inferred return type is
 * always the PG type. At runtime, when `DB_PROVIDER=sqlite`, the sqlite branch
 * executes and returns a real sqlite object. This means:
 * - The service + repo layers see PG types everywhere (ZERO type changes).
 * - `$inferSelect` / `$inferInsert` inference is unchanged.
 * - At runtime, sqlite objects are structurally compatible with Drizzle's
 *   query API (.select/.insert/.where/eq/inArray/onConflictDoUpdate/.returning).
 * ============================================================================
 */

/**
 * Creates a table for the active dialect.
 * - PostgreSQL: `pgTable(name, columns, extras)`
 * - SQLite: `sqliteTable(name, columns, extras)` (cast to PG type for inference)
 */
export function createTable<TColumns extends Record<string, any>>(
  name: string,
  columns: TColumns,
  extras?: Parameters<typeof pgTable>[2]
) {
  if (isSqlite()) {
    return sqliteTable(name, columns as never, extras as never) as never;
  }
  return pgTable(name, columns, extras);
}

// ---------------------------------------------------------------------------
// COLUMN BUILDERS
// ---------------------------------------------------------------------------

export function uuidColumn(name = "id") {
  if (isSqlite()) {
    return sqliteText(name)
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey() as never;
  }
  return pgUuid(name).defaultRandom().primaryKey();
}

export function uuidDefaultColumn(name: string) {
  if (isSqlite()) {
    return sqliteText(name).$defaultFn(() => crypto.randomUUID()) as never;
  }
  return pgUuid(name).defaultRandom();
}

/**
 * Auto-incrementing integer primary key.
 * - PostgreSQL: `serial` (integer with sequence default).
 * - SQLite: `integer().primaryKey({ autoIncrement: true })` (INTEGER PRIMARY KEY = rowid alias).
 */
export function serialColumn(name = "id") {
  if (isSqlite()) {
    return sqliteInteger(name).primaryKey({ autoIncrement: true }) as never;
  }
  return pgSerial(name).primaryKey();
}

export function timestampColumn(name: string) {
  if (isSqlite()) {
    return sqliteInteger(name, { mode: "timestamp_ms" }) as never;
  }
  return pgTimestamp(name, { withTimezone: true, precision: 3 });
}

export function booleanColumn(name: string) {
  if (isSqlite()) {
    return sqliteInteger(name, { mode: "boolean" }) as never;
  }
  return pgBoolean(name);
}

export function varcharColumn(name: string, options?: { length?: number }) {
  if (isSqlite()) {
    return sqliteText(name) as never;
  }
  return options ? pgVarchar(name, options) : pgVarchar(name);
}

export function textColumn(name: string) {
  if (isSqlite()) {
    return sqliteText(name) as never;
  }
  return pgText(name);
}

export function integerColumn(name: string) {
  if (isSqlite()) {
    return sqliteInteger(name) as never;
  }
  return pgInteger(name);
}

export function inetColumn(name: string) {
  if (isSqlite()) {
    return sqliteText(name) as never;
  }
  return pgInet(name);
}

export function bigintColumn(name: string) {
  if (isSqlite()) {
    return sqliteBlob(name, { mode: "bigint" }) as never;
  }
  return pgBigint(name, { mode: "bigint" });
}

/**
 * Numeric/decimal column.
 * - PostgreSQL: `numeric(precision, scale)` -- exact decimal, returned as string.
 * - SQLite: `text` -- stores the decimal as a string to preserve exact precision.
 *   The app layer is responsible for parsing to number/Decimal where needed.
 */
export function numericColumn(name: string, options?: { precision?: number; scale?: number }) {
  if (isSqlite()) {
    return sqliteText(name) as never;
  }
  return options ? pgNumeric(name, options) : pgNumeric(name);
}

export function jsonbColumn<T = unknown>(name: string) {
  if (isSqlite()) {
    return sqliteText(name, { mode: "json" }).$type<T>() as never;
  }
  return pgJsonb(name).$type<T>();
}

// ---------------------------------------------------------------------------
// ENUM BUILDER
// ---------------------------------------------------------------------------

export function createEnum(enumName: string, values: readonly string[]) {
  if (isSqlite()) {
    const textEnumFactory = (columnName: string) => sqliteText(columnName, { enum: values as [string, ...string[]] });
    return textEnumFactory as never;
  }
  return pgEnum(enumName, values as [string, ...string[]]);
}

// ---------------------------------------------------------------------------
// CHECK CONSTRAINT BUILDER
// ---------------------------------------------------------------------------

export function checkConstraint(
  name: string,
  pgSql: ReturnType<typeof sql>,
  sqliteSql: ReturnType<typeof sql> | null
) {
  if (isSqlite()) {
    return (sqliteSql ? sqliteCheck(name, sqliteSql) : undefined) as never;
  }
  return pgCheck(name, pgSql);
}

// ---------------------------------------------------------------------------
// INDEX BUILDERS
// ---------------------------------------------------------------------------

export function index(name: string) {
  if (isSqlite()) {
    return sqliteIndex(name) as never;
  }
  return pgIndex(name);
}

export function uniqueIndex(name: string) {
  if (isSqlite()) {
    return sqliteUniqueIndex(name) as never;
  }
  return pgUniqueIndex(name);
}

/**
 * Composite (multi-column) primary key builder.
 * - PostgreSQL: `primaryKey({ columns, name? })` from `drizzle-orm/pg-core`.
 * - SQLite: `primaryKey({ columns, name? })` from `drizzle-orm/sqlite-core`.
 *
 * Usage: `primaryKey({ columns: [table.a, table.b] })` — same signature as the
 * underlying Drizzle builders. Both dialects support composite PRIMARY KEY
 * constraints, so the semantics are preserved on SQLite.
 */
export function primaryKey(config: { columns: unknown[]; name?: string }) {
  if (isSqlite()) {
    return sqlitePrimaryKey(config as never) as never;
  }
  return pgPrimaryKey(config as never);
}

// ---------------------------------------------------------------------------
// ENCRYPTED TEXT CUSTOM TYPE (dialect-aware)
// ---------------------------------------------------------------------------

const encryptedTextConfig = {
  dataType() {
    return "text" as const;
  },
  toDriver(value: string | null): string {
    if (value === null) return "";
    return encryptField(value);
  },
  fromDriver(value: string): string | null {
    return decryptField(value);
  },
};

export function encryptedText(name: string) {
  if (isSqlite()) {
    return sqliteCustomType<{ data: string | null; driverData: string }>(encryptedTextConfig)(name) as never;
  }
  return pgCustomType<{ data: string | null; driverData: string }>(encryptedTextConfig)(name);
}
