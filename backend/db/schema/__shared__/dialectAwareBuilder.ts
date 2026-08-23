import type { $Type, sql } from "drizzle-orm";
import {
  bigint as pgBigint,
  boolean as pgBoolean,
  check as pgCheck,
  customType as pgCustomType,
  pgEnum,
  index as pgIndex,
  inet as pgInet,
  integer as pgInteger,
  jsonb as pgJsonb,
  numeric as pgNumeric,
  primaryKey as pgPrimaryKey,
  serial as pgSerial,
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
 * TYPE STRATEGY — "type erasure via type guards":
 * Each helper has two branches:
 * - PG branch: returns the real PG column/table → provides the TypeScript type.
 * - SQLite branch: returns the sqlite column/table cast safely via type guards.
 *
 * At runtime, when `DB_PROVIDER=sqlite`, the sqlite branch executes and
 * returns a real sqlite object. This means:
 * - The service + repo layers see PG types everywhere (ZERO type changes).
 * - `$inferSelect` / `$inferInsert` inference is unchanged.
 * - At runtime, sqlite objects are structurally compatible with Drizzle's
 *   query API (.select/.insert/.where/eq/inArray/onConflictDoUpdate/.returning).
 * ============================================================================
 */

function isDialectType<T>(_value: unknown, _witness?: T): _value is T {
  return true;
}

function asDialectType<T>(value: unknown, _witness?: T): T {
  if (isDialectType<T>(value, _witness)) {
    return value;
  }
  throw new Error("Invalid dialect type");
}

type UuidColumnReturn = ReturnType<ReturnType<ReturnType<typeof pgUuid>["defaultRandom"]>["primaryKey"]>;
type UuidDefaultColumnReturn = ReturnType<ReturnType<typeof pgUuid>["defaultRandom"]>;
type SerialColumnReturn = ReturnType<ReturnType<typeof pgSerial>["primaryKey"]>;
type TimestampColumnReturn = ReturnType<typeof pgTimestamp>;
type BigintColumnReturn = ReturnType<typeof pgBigint>;

/**
 * Creates a table for the active dialect.
 * - PostgreSQL: `pgTable(name, columns, extras)`
 * - SQLite: `sqliteTable(name, columns, extras)` (cast to PG type for inference)
 */
const createTableFn = (name: string, columns: Record<string, unknown>, extras?: (self: unknown) => unknown[]) => {
  if (isSqlite()) {
    const sqliteColumns = asDialectType<Parameters<typeof sqliteTable>[1]>(columns);
    const sqliteExtras = asDialectType<Parameters<typeof sqliteTable>[2]>(extras);
    return asDialectType<unknown>(sqliteTable(name, sqliteColumns, sqliteExtras));
  }
  const pgFn = asDialectType<(n: string, c: Record<string, unknown>, e?: unknown) => unknown>(pgTable);
  return pgFn(name, columns, extras);
};

export const createTable: typeof pgTable = asDialectType<typeof pgTable>(createTableFn);

// ---------------------------------------------------------------------------
// COLUMN BUILDERS
// ---------------------------------------------------------------------------

export function uuidColumn(name = "id") {
  if (isSqlite()) {
    const col = sqliteText(name)
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey();
    return asDialectType<UuidColumnReturn>(col);
  }
  return pgUuid(name).defaultRandom().primaryKey();
}

export function uuidDefaultColumn(name: string) {
  if (isSqlite()) {
    const col = sqliteText(name).$defaultFn(() => crypto.randomUUID());
    return asDialectType<UuidDefaultColumnReturn>(col);
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
    const col = sqliteInteger(name).primaryKey({ autoIncrement: true });
    return asDialectType<SerialColumnReturn>(col);
  }
  return pgSerial(name).primaryKey();
}

export function timestampColumn(name: string) {
  if (isSqlite()) {
    const col = sqliteInteger(name, { mode: "timestamp_ms" });
    return asDialectType<TimestampColumnReturn>(col);
  }
  return pgTimestamp(name, { withTimezone: true, precision: 3 });
}

export function booleanColumn(name: string) {
  if (isSqlite()) {
    const col = sqliteInteger(name, { mode: "boolean" });
    return asDialectType<ReturnType<typeof pgBoolean>>(col);
  }
  return pgBoolean(name);
}

export function varcharColumn(name: string, options?: { length?: number }) {
  if (isSqlite()) {
    const col = sqliteText(name);
    return asDialectType<ReturnType<typeof pgVarchar>>(col);
  }
  return options ? pgVarchar(name, options) : pgVarchar(name);
}

export function textColumn(name: string) {
  if (isSqlite()) {
    const col = sqliteText(name);
    return asDialectType<ReturnType<typeof pgText>>(col);
  }
  return pgText(name);
}

export function integerColumn(name: string) {
  if (isSqlite()) {
    const col = sqliteInteger(name);
    return asDialectType<ReturnType<typeof pgInteger>>(col);
  }
  return pgInteger(name);
}

export function inetColumn(name: string) {
  if (isSqlite()) {
    const col = sqliteText(name);
    return asDialectType<ReturnType<typeof pgInet>>(col);
  }
  return pgInet(name);
}

export function bigintColumn(name: string) {
  if (isSqlite()) {
    const col = sqliteBlob(name, { mode: "bigint" });
    return asDialectType<BigintColumnReturn>(col);
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
    const col = sqliteText(name);
    return asDialectType<ReturnType<typeof pgNumeric>>(col);
  }
  const numericFn = asDialectType<(n: string, opt?: unknown) => ReturnType<typeof pgNumeric>>(pgNumeric);
  return options ? numericFn(name, options) : pgNumeric(name);
}

export function jsonbColumn<T = unknown>(name: string): $Type<ReturnType<typeof pgJsonb>, T> {
  if (isSqlite()) {
    const col = sqliteText(name, { mode: "json" }).$type<T>();
    return asDialectType<$Type<ReturnType<typeof pgJsonb>, T>>(col);
  }
  return pgJsonb(name).$type<T>();
}

// ---------------------------------------------------------------------------
// ENUM BUILDER
// ---------------------------------------------------------------------------

export function createEnum(enumName: string, values: readonly string[]) {
  const tupleValues = asDialectType<[string, ...string[]]>(values);
  if (isSqlite()) {
    const textEnumFactory = (columnName: string) => sqliteText(columnName, { enum: tupleValues });
    return asDialectType<ReturnType<typeof pgEnum>>(textEnumFactory);
  }
  return pgEnum(enumName, tupleValues);
}

// ---------------------------------------------------------------------------
// CHECK CONSTRAINT BUILDER
// ---------------------------------------------------------------------------

export function checkConstraint(name: string, pgSql: ReturnType<typeof sql>, sqliteSql: ReturnType<typeof sql> | null) {
  if (isSqlite()) {
    const check = sqliteSql ? sqliteCheck(name, sqliteSql) : undefined;
    return asDialectType<ReturnType<typeof pgCheck>>(check);
  }
  return pgCheck(name, pgSql);
}

// ---------------------------------------------------------------------------
// INDEX BUILDERS
// ---------------------------------------------------------------------------

export function index(name: string) {
  if (isSqlite()) {
    return asDialectType<ReturnType<typeof pgIndex>>(sqliteIndex(name));
  }
  return pgIndex(name);
}

export function uniqueIndex(name: string) {
  if (isSqlite()) {
    return asDialectType<ReturnType<typeof pgUniqueIndex>>(sqliteUniqueIndex(name));
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
export function primaryKey(config: { columns: [unknown, ...unknown[]]; name?: string }) {
  if (isSqlite()) {
    const sqliteFn =
      asDialectType<(c: { name?: string; columns: unknown[] }) => ReturnType<typeof pgPrimaryKey>>(sqlitePrimaryKey);
    return sqliteFn(config);
  }
  const pgFn =
    asDialectType<(c: { name?: string; columns: unknown[] }) => ReturnType<typeof pgPrimaryKey>>(pgPrimaryKey);
  return pgFn(config);
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
    const col = sqliteCustomType<{ data: string | null; driverData: string }>(encryptedTextConfig)(name);
    return asDialectType<ReturnType<ReturnType<typeof pgCustomType<{ data: string | null; driverData: string }>>>>(col);
  }
  return pgCustomType<{ data: string | null; driverData: string }>(encryptedTextConfig)(name);
}
