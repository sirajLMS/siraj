import { type AnyPgColumn, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Shared column helpers that eliminate the structural duplication of the
 * `uuid("id").defaultRandom().primaryKey()` primary-key column and the
 * `timestamp("created_at"/"updated_at", { withTimezone, precision })`
 * audit columns repeated across every domain table in `backend/db/schema`.
 *
 * Spread the returned object into a `pgTable` column config:
 * ```ts
 * pgTable("example", {
 *   ...primaryKeyColumn(),
 *   // domain columns ...
 *   ...timestampColumns({ withDefaultNow: true }),
 * })
 * ```
 * The spread matches direct column definitions exactly — Drizzle infers the
 * same `$inferSelect` / `$inferInsert` types — so database type signatures and
 * the generated migration are unchanged.
 *
 * NOTE: the `id` key returned by `primaryKeyColumn()` is intentionally a
 * single-property object (not merged via a default-arg call elsewhere) so
 * every table inherits the identical `id` column shape.
 */

const timestampColumnOptions = { withTimezone: true, precision: 3 } as const;

/**
 * Returns the `id` primary-key column.
 *
 * Equivalent to `uuid("id").defaultRandom().primaryKey()` — the default
 * column name can be overridden for tables whose primary-key column is
 * renamed (rare but supported).
 */
export function primaryKeyColumn(name = "id") {
  return {
    id: uuid(name).defaultRandom().primaryKey(),
  };
}

/**
 * Shape of the options bag accepted by {@link timestampColumns}.
 */
interface TimestampColumnsOptions {
  /**
   * When true, both columns emit `.defaultNow()`, matching the
   * `timestamp("xxx_at", { withTimezone, precision }).notNull().defaultNow()`
   * pattern used by tables whose audit timestamps are DB-populated.
   *
   * When false (default), columns are emitted as `.notNull()` only —
   * the repository or service must supply the value on insert.
   */
  withDefaultNow?: boolean;

  /**
   * When true, `updatedAt` additionally emits `.$onUpdate(() => new Date())`
   * so the repository need not set it on every update. Currently used by
   * the WhatsApp accounts table.
   */
  withOnUpdate?: boolean;
}

/**
 * Returns the `createdAt` and `updatedAt` audit columns.
 *
 * Both columns use the uniform shape:
 * `timestamp(columnName, { withTimezone: true, precision: 3 })`.
 * `.notNull()` is always applied; `.defaultNow()` and `.$onUpdate()` are
 * applied per the options so the inferred `InsertType` matches each table's
 * existing declaration exactly.
 */
export function timestampColumns(options: TimestampColumnsOptions = {}) {
  const { withDefaultNow = false, withOnUpdate = false } = options;

  const createdAt = withDefaultNow
    ? timestamp("created_at", timestampColumnOptions).notNull().defaultNow()
    : timestamp("created_at", timestampColumnOptions).notNull();

  const updatedAtBase = withDefaultNow
    ? timestamp("updated_at", timestampColumnOptions).notNull().defaultNow()
    : timestamp("updated_at", timestampColumnOptions).notNull();

  const updatedAt = withOnUpdate ? updatedAtBase.$onUpdate(() => new Date()) : updatedAtBase;

  return { createdAt, updatedAt };
}

/**
 * Returns only the `createdAt` column without `updatedAt`.
 *
 * For tables that are append-only (audit logs, ledger entries, file junctions)
 * and never expose `updatedAt`, this avoids an unused column without paying the
 * ergonomics cost of inlining the `timestamp(...)` call at every call-site.
 */
export function createdAtColumn(options: Pick<TimestampColumnsOptions, "withDefaultNow"> = {}) {
  const { withDefaultNow = false } = options;
  const createdAt = withDefaultNow
    ? timestamp("created_at", timestampColumnOptions).notNull().defaultNow()
    : timestamp("created_at", timestampColumnOptions).notNull();
  return { createdAt };
}

/**
 * Shape of the table-reference bag accepted by {@link coreScheduleColumns}.
 *
 * Each property is a **getter function** returning the Drizzle table whose
 * `id` column the FK references. Using getters (rather than direct table
 * objects) defers dereference until the `.references()` callback fires at
 * query time, breaking the circular dependency between `scheduling.ts` and
 * `students.ts`.
 */
interface CoreScheduleColumnsRefs {
  students: () => { id: AnyPgColumn };
  teachers: () => { id: AnyPgColumn };
  classSubjects: () => { id: AnyPgColumn };
}

/**
 * Returns the shared FK columns (`studentId`, `teacherId`, `subjectId`) used
 * by both `recurringSchedules` and `classInstances`.
 *
 * All three are non-nullable UUIDs with `onDelete: "restrict"` references.
 * The target tables are passed in via getter functions (rather than imported
 * directly) to avoid the circular dependency: `students.ts` imports from
 * `scheduling.ts`, and `scheduling.ts` would import from this module.
 *
 * Spread the returned object into a `pgTable` column config:
 * ```ts
 * pgTable("example", {
 *   ...coreScheduleColumns({ students: () => students, teachers: () => teachers, classSubjects: () => classSubjects }),
 *   // ...
 * })
 * ```
 */
export function coreScheduleColumns(refs: CoreScheduleColumnsRefs) {
  return {
    studentId: uuid("student_id")
      .notNull()
      .references(() => refs.students().id, { onDelete: "restrict" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => refs.teachers().id, { onDelete: "restrict" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => refs.classSubjects().id, { onDelete: "restrict" }),
  };
}
