import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { timestampColumn, uuidColumn, uuidDefaultColumn } from "@/backend/db/schema/__shared__/dialectAwareBuilder";

/**
 * Shared column helpers that eliminate the the structural duplication of the
 * `uuid("id").defaultRandom().primaryKey()` primary-key column and the
 * `timestamp("created_at"/"updated_at", { withTimezone, precision })`
 * audit columns repeated across every domain table in `backend/db/schema`.
 *
 * These helpers are now dialect-aware: `uuidColumn` and `timestampColumn`
 * (from `dialectAwareBuilder.ts`) produce the correct Drizzle column for the
 * active dialect (PG `uuid`/`timestamp(withTimezone)` or SQLite
 * `text.$defaultFn(crypto.randomUUID)`/`integer({mode:'timestamp_ms'})`).
 *
 * Spread the returned object into a `createTable` column config.
 */

export function primaryKeyColumn(name = "id") {
  return {
    id: uuidColumn(name),
  };
}

interface TimestampColumnsOptions {
  withDefaultNow?: boolean;
  withOnUpdate?: boolean;
}

export function timestampColumns(options: TimestampColumnsOptions = {}) {
  const { withDefaultNow = false, withOnUpdate = false } = options;

  const createdAt = withDefaultNow
    ? timestampColumn("created_at").notNull().defaultNow()
    : timestampColumn("created_at").notNull();

  const updatedAtBase = withDefaultNow
    ? timestampColumn("updated_at").notNull().defaultNow()
    : timestampColumn("updated_at").notNull();

  const updatedAt = withOnUpdate ? updatedAtBase.$onUpdate(() => new Date()) : updatedAtBase;

  return { createdAt, updatedAt };
}

export function createdAtColumn(options: Pick<TimestampColumnsOptions, "withDefaultNow"> = {}) {
  const { withDefaultNow = false } = options;
  const createdAt = withDefaultNow
    ? timestampColumn("created_at").notNull().defaultNow()
    : timestampColumn("created_at").notNull();
  return { createdAt };
}

interface CoreScheduleColumnsRefs {
  students: () => { id: AnyPgColumn };
  teachers: () => { id: AnyPgColumn };
  classSubjects: () => { id: AnyPgColumn };
}

export function coreScheduleColumns(refs: CoreScheduleColumnsRefs) {
  return {
    studentId: uuidDefaultColumn("student_id")
      .notNull()
      .references(() => refs.students().id, { onDelete: "restrict" }),
    teacherId: uuidDefaultColumn("teacher_id")
      .notNull()
      .references(() => refs.teachers().id, { onDelete: "restrict" }),
    subjectId: uuidDefaultColumn("subject_id")
      .notNull()
      .references(() => refs.classSubjects().id, { onDelete: "restrict" }),
  };
}
