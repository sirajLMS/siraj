import { describe, expect, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { expandStatusesToSql } from "@/backend/services/accounting/session-audit-status-predicate";

const dialect = new PgDialect();

function render(fragment: SQL): { sql: string; params: unknown[] } {
  return dialect.sqlToQuery(fragment);
}

describe("expandStatusesToSql", () => {
  test('"open" is the complement of the completed terminal set', () => {
    const { sql: text, params } = render(expandStatusesToSql(["open"]));

    expect(text).toContain('NOT ("class_instances"."execution_state" = $1');
    expect(text).toContain('"class_instances"."outcome" IN ($2, $3, $4)');
    expect(params).toEqual(["COMPLETED", "TAKEN", "ABSENT", "LEAVE"]);
  });

  test('"end" selects COMPLETED + TAKEN', () => {
    const { sql: text, params } = render(expandStatusesToSql(["end"]));

    expect(text).toBe('("class_instances"."execution_state" = $1 AND "class_instances"."outcome" = $2)');
    expect(params).toEqual(["COMPLETED", "TAKEN"]);
  });

  test('"Absent" selects COMPLETED + ABSENT with no room entry', () => {
    const { sql: text, params } = render(expandStatusesToSql(["Absent"]));

    expect(text).toBe(
      '("class_instances"."execution_state" = $1 AND "class_instances"."outcome" = $2 AND "class_instances"."actual_start_at" IS NULL)'
    );
    expect(params).toEqual(["COMPLETED", "ABSENT"]);
  });

  test('"absent_student" covers LEAVE and ABSENT with room entry', () => {
    const { sql: text, params } = render(expandStatusesToSql(["absent_student"]));

    expect(text).toBe(
      '("class_instances"."execution_state" = $1 AND ("class_instances"."outcome" = $2 OR ("class_instances"."outcome" = $3 AND "class_instances"."actual_start_at" IS NOT NULL)))'
    );
    expect(params).toEqual(["COMPLETED", "LEAVE", "ABSENT"]);
  });

  test("multiple statuses are combined with OR", () => {
    const { sql: text, params } = render(expandStatusesToSql(["end", "Absent"]));

    expect(text).toBe(
      '("class_instances"."execution_state" = $1 AND "class_instances"."outcome" = $2) OR ("class_instances"."execution_state" = $3 AND "class_instances"."outcome" = $4 AND "class_instances"."actual_start_at" IS NULL)'
    );
    expect(params).toEqual(["COMPLETED", "TAKEN", "COMPLETED", "ABSENT"]);
  });

  test("duplicate statuses expand only once", () => {
    expect(render(expandStatusesToSql(["end", "end"]))).toEqual(render(expandStatusesToSql(["end"])));
  });

  test("empty list matches every row", () => {
    expect(render(expandStatusesToSql([])).sql).toBe("true");
  });

  test("unrecognized statuses fall back to the open predicate", () => {
    expect(render(expandStatusesToSql(["CANCELLED"]))).toEqual(render(expandStatusesToSql(["open"])));
  });

  test("unrecognized statuses collapse into a single open predicate when combined", () => {
    expect(render(expandStatusesToSql(["RESCHEDULED", "RESCHEDULED"]))).toEqual(render(expandStatusesToSql(["open"])));
  });
});
