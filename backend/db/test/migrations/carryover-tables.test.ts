import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { isSqlite } from "@/backend/db";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { DBTransaction } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

// The carryover module migration unit: two new tables, one nullable FK column
// on class_instances, eleven indexes, six foreign keys. All statements are
// idempotent (IF NOT EXISTS / DO-guard) after the idempotency rewriter pass.
const MIGRATION_SQL_PATH = "backend/drizzle/20260904235039_mixed_midnight/migration.sql";

const BALANCE_COLUMNS = [
  "id",
  "teacher_id",
  "students_count",
  "students_text",
  "total_duration",
  "payable",
  "teacher_currency",
  "paid",
  "from_date",
  "to_date",
  "payment_date",
  "is_disabled_teacher",
  "is_paid",
  "expense_id",
  "note",
  "created_by_user_id",
  "paid_by_user_id",
  "paid_at",
  "created_at",
  "updated_at",
] as const;

const ITEM_COLUMNS = [
  "id",
  "carryover_id",
  "class_instance_id",
  "original_amount",
  "original_currency",
  "original_status",
  "original_partial_percentage",
  "converted_amount",
  "converted_currency",
  "created_at",
] as const;

const NEW_INDEXES: ReadonlyArray<readonly [table: string, name: string]> = [
  ["class_instances", "class_instances_carryover_balance_id_idx"],
  ["carryover_balance_items", "carryover_balance_items_carryover_id_idx"],
  ["carryover_balance_items", "carryover_balance_items_class_instance_id_idx"],
  ["carryover_balances", "carryover_balances_teacher_id_idx"],
  ["carryover_balances", "carryover_balances_is_paid_idx"],
  ["carryover_balances", "carryover_balances_payment_date_idx"],
  ["carryover_balances", "carryover_balances_from_to_idx"],
  ["carryover_balances", "carryover_balances_is_disabled_teacher_idx"],
  ["carryover_balances", "carryover_balances_expense_id_idx"],
  ["carryover_balances", "carryover_balances_created_by_user_id_idx"],
  ["carryover_balances", "carryover_balances_expense_id_unique_idx"],
];

const PREEXISTING_CHECKS = ["class_instances_state_machine_chk"] as const;

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(item => typeof item === "object" && item !== null);
}

function getResultRows(result: unknown): Record<string, unknown>[] {
  if (typeof result === "object" && result !== null && "rows" in result && isRecordArray(result.rows)) {
    return result.rows;
  }
  if (isRecordArray(result)) return result;
  return [];
}

async function getColumns(
  tx: DBTransaction,
  table: string,
  names: readonly string[]
): Promise<Map<string, Record<string, unknown>>> {
  const result = await tx.execute(sql`
    SELECT column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = ${table}
      AND column_name IN (${sql.join(
        names.map(name => sql`${name}`),
        sql`, `
      )})
  `);
  return new Map(getResultRows(result).map(row => [String(row.column_name), row]));
}

async function getIndexNames(tx: DBTransaction, tables: readonly string[]): Promise<Map<string, string[]>> {
  const result = await tx.execute(sql`
    SELECT tablename, indexname AS name
    FROM pg_indexes
    WHERE tablename IN (${sql.join(
      tables.map(table => sql`${table}`),
      sql`, `
    )})
  `);
  const namesByTable = new Map<string, string[]>();
  for (const row of getResultRows(result)) {
    const table = String(row.tablename);
    namesByTable.set(table, [...(namesByTable.get(table) ?? []), String(row.name)]);
  }
  return namesByTable;
}

interface FkRow {
  conname: string;
  confdeltype: string;
  definition: string;
}

async function getForeignKeys(tx: DBTransaction, table: string): Promise<FkRow[]> {
  const result = await tx.execute(sql`
    SELECT conname, confdeltype, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = ${table}::regclass
      AND contype = 'f'
  `);
  return getResultRows(result).map(row => ({
    conname: String(row.conname),
    confdeltype: String(row.confdeltype),
    definition: String(row.definition),
  }));
}

function expectFk(fks: FkRow[], definitionPart: string, expectedDeleteBehavior: string): void {
  const fk = fks.find(row => row.definition.includes(definitionPart));
  expect(fk, `missing FK referencing ${definitionPart}`).toBeDefined();
  expect(fk?.confdeltype).toBe(expectedDeleteBehavior);
}

function expectNullableUuid(column: Record<string, unknown> | undefined, name: string): void {
  expect(column, `missing column ${name}`).toBeDefined();
  expect(column?.data_type).toBe("uuid");
  expect(column?.is_nullable).toBe("YES");
}

function assertBalancesColumns(columns: Map<string, Record<string, unknown>>): void {
  expect(columns.size).toBe(BALANCE_COLUMNS.length);

  const teacherId = columns.get("teacher_id");
  expect(teacherId?.data_type).toBe("uuid");
  expect(teacherId?.is_nullable).toBe("NO");

  const payable = columns.get("payable");
  expect(payable?.data_type).toBe("text");
  expect(payable?.is_nullable).toBe("NO");

  const paid = columns.get("paid");
  expect(paid?.data_type).toBe("text");
  expect(paid?.is_nullable).toBe("NO");
  expect(paid?.column_default).toBe("'0'::text");

  const teacherCurrency = columns.get("teacher_currency");
  expect(teacherCurrency?.udt_name).toBe("currency_code");
  expect(teacherCurrency?.is_nullable).toBe("NO");

  for (const name of ["students_count"] as const) {
    expect(columns.get(name)?.data_type).toBe("integer");
    expect(columns.get(name)?.is_nullable).toBe("YES");
  }
  for (const name of ["students_text"] as const) {
    expect(columns.get(name)?.data_type).toBe("character varying");
    expect(columns.get(name)?.is_nullable).toBe("YES");
  }
  for (const name of ["total_duration", "from_date", "to_date", "payment_date", "note"] as const) {
    const column = columns.get(name);
    expect(column?.data_type).toBe("text");
    expect(column?.is_nullable).toBe("YES");
  }
  for (const name of ["is_disabled_teacher", "is_paid"] as const) {
    const column = columns.get(name);
    expect(column?.data_type).toBe("boolean");
    expect(column?.is_nullable).toBe("NO");
    expect(column?.column_default).toBe("false");
  }
  expectNullableUuid(columns.get("expense_id"), "expense_id");
  expectNullableUuid(columns.get("paid_by_user_id"), "paid_by_user_id");

  const createdBy = columns.get("created_by_user_id");
  expect(createdBy?.data_type).toBe("uuid");
  expect(createdBy?.is_nullable).toBe("NO");

  const paidAt = columns.get("paid_at");
  expect(paidAt?.data_type).toBe("timestamp with time zone");
  expect(paidAt?.is_nullable).toBe("YES");
}

function assertItemColumns(columns: Map<string, Record<string, unknown>>): void {
  expect(columns.size).toBe(ITEM_COLUMNS.length);

  for (const name of ["carryover_id", "class_instance_id"] as const) {
    const column = columns.get(name);
    expect(column?.data_type).toBe("uuid");
    expect(column?.is_nullable).toBe("NO");
  }

  const originalAmount = columns.get("original_amount");
  expect(originalAmount?.data_type).toBe("text");
  expect(originalAmount?.is_nullable).toBe("NO");

  const originalCurrency = columns.get("original_currency");
  expect(originalCurrency?.udt_name).toBe("currency_code");
  expect(originalCurrency?.is_nullable).toBe("NO");

  const originalStatus = columns.get("original_status");
  expect(originalStatus?.data_type).toBe("character varying");
  expect(originalStatus?.is_nullable).toBe("NO");

  const originalPartialPercentage = columns.get("original_partial_percentage");
  expect(originalPartialPercentage?.data_type).toBe("integer");
  expect(originalPartialPercentage?.is_nullable).toBe("YES");

  const convertedAmount = columns.get("converted_amount");
  expect(convertedAmount?.data_type).toBe("text");
  expect(convertedAmount?.is_nullable).toBe("YES");

  const convertedCurrency = columns.get("converted_currency");
  expect(convertedCurrency?.udt_name).toBe("currency_code");
  expect(convertedCurrency?.is_nullable).toBe("YES");
}

function readMigrationStatements(path: string): string[] {
  const content = readFileSync(path, "utf8");
  return content
    .split("--> statement-breakpoint")
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
}

describe("carryover tables migration", () => {
  test.skipIf(isSqlite())("creates carryover_balances with expected columns and defaults", async () => {
    await runInRollback(async tx => {
      const columns = await getColumns(tx, "carryover_balances", BALANCE_COLUMNS);
      assertBalancesColumns(columns);
      testLogger.info("Verified all twenty carryover_balances columns.");
    });
  });

  test.skipIf(isSqlite())("creates carryover_balance_items with expected columns and defaults", async () => {
    await runInRollback(async tx => {
      const columns = await getColumns(tx, "carryover_balance_items", ITEM_COLUMNS);
      assertItemColumns(columns);
      testLogger.info("Verified all ten carryover_balance_items columns.");
    });
  });

  test.skipIf(isSqlite())(
    "adds nullable class_instances.carryover_balance_id and keeps the state machine check intact",
    async () => {
      await runInRollback(async tx => {
        const columns = await getColumns(tx, "class_instances", ["carryover_balance_id"]);
        expectNullableUuid(columns.get("carryover_balance_id"), "carryover_balance_id");

        const checkResult = await tx.execute(sql`
        SELECT conname, pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = 'class_instances'::regclass
          AND contype = 'c'
      `);
        const checkNames = getResultRows(checkResult).map(row => String(row.conname));
        for (const check of PREEXISTING_CHECKS) {
          expect(checkNames).toContain(check);
        }
        testLogger.info("Verified carryover_balance_id column and pre-existing class_instances CHECK constraint.");
      });
    }
  );

  test.skipIf(isSqlite())("creates the eleven indexes and six foreign keys with expected delete behavior", async () => {
    await runInRollback(async tx => {
      const tables = [...new Set(NEW_INDEXES.map(([table]) => table))];
      const indexNamesByTable = await getIndexNames(tx, tables);
      for (const [table, index] of NEW_INDEXES) {
        expect(indexNamesByTable.get(table)).toContain(index);
      }

      const balanceFks = await getForeignKeys(tx, "carryover_balances");
      expectFk(balanceFks, "REFERENCES teachers(id)", "r"); // RESTRICT
      expectFk(balanceFks, "REFERENCES users(id)", "n"); // both user FKs are SET NULL
      expect(balanceFks.filter(row => row.definition.includes("REFERENCES users(id)"))).toHaveLength(2);

      const itemFks = await getForeignKeys(tx, "carryover_balance_items");
      expectFk(itemFks, "REFERENCES carryover_balances(id)", "c"); // CASCADE
      expectFk(itemFks, "REFERENCES class_instances(id)", "c"); // CASCADE

      const instanceFks = await getForeignKeys(tx, "class_instances");
      expectFk(instanceFks, "REFERENCES carryover_balances(id)", "n"); // SET NULL
      testLogger.info("Verified carryover indexes and FK delete behavior.");
    });
  });

  test.skipIf(isSqlite())("re-running the migration SQL is idempotent and additive-only", async () => {
    const content = readFileSync(MIGRATION_SQL_PATH, "utf8");

    // Additive-only guard: no destructive DDL/DML and no NOT NULL hardening
    // of pre-existing tables anywhere in the migration file.
    expect(content).not.toMatch(/\bDROP\s+(TABLE|COLUMN|CONSTRAINT|INDEX|TYPE)\b/i);
    expect(content).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(content).not.toMatch(/\bTRUNCATE\b/i);
    expect(content).not.toMatch(/\bALTER\s+COLUMN\b/i);
    expect(content).not.toMatch(/\bSET\s+NOT\s+NULL\b/i);

    const statements = readMigrationStatements(MIGRATION_SQL_PATH);
    expect(statements.length).toBeGreaterThan(0);

    await runInRollback(async tx => {
      // Statements must execute sequentially — DDL order matters (tables and the
      // class_instances column must exist before their indexes and FKs). Every
      // statement is idempotent (IF NOT EXISTS / DO-guard); re-applying must not error.
      await statements.reduce<Promise<unknown>>(
        (sequence, stmt) => sequence.then(() => tx.execute(sql.raw(stmt))),
        Promise.resolve()
      );

      const balanceColumns = await getColumns(tx, "carryover_balances", BALANCE_COLUMNS);
      expect(balanceColumns.size).toBe(BALANCE_COLUMNS.length);

      const itemColumns = await getColumns(tx, "carryover_balance_items", ITEM_COLUMNS);
      expect(itemColumns.size).toBe(ITEM_COLUMNS.length);

      const linkColumns = await getColumns(tx, "class_instances", ["carryover_balance_id"]);
      expect(linkColumns.size).toBe(1);
      testLogger.info("Migration re-applied inside rollback without errors.");
    });
  });
});
