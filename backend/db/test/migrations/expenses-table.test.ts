import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { isSqlite } from "@/backend/db";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { DBTransaction } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

// The expense ledger migration unit: the two custom SQL files (permission
// grants + table), bundled into drizzle folders by the custom-migrations
// auto-bundler. All statements are idempotent (IF NOT EXISTS / DO-guard).
const MIGRATION_SQL_PATHS = [
  "backend/drizzle/20260906091745_custom_44-accounting-expenses-permissions/migration.sql",
  "backend/drizzle/20260906091746_custom_45-expenses-table/migration.sql",
] as const;

const EXPENSE_COLUMNS = [
  "id",
  "teacher_id",
  "teacher_name",
  "title",
  "type",
  "expense_value",
  "expense_currency",
  "payment_date",
  "expense_date",
  "note",
  "source_entity",
  "source_entity_id",
  "created_by_user_id",
  "deleted_at",
  "deleted_by_user_id",
  "deleted_reason",
  "created_at",
  "updated_at",
] as const;

const NEW_INDEXES: ReadonlyArray<readonly [table: string, name: string]> = [
  ["expenses", "expenses_teacher_id_idx"],
  ["expenses", "expenses_type_idx"],
  ["expenses", "expenses_payment_date_idx"],
  ["expenses", "expenses_expense_date_idx"],
  ["expenses", "expenses_source_entity_idx"],
  ["expenses", "expenses_source_entity_id_idx"],
  ["expenses", "expenses_created_by_user_id_idx"],
  ["expenses", "expenses_deleted_at_idx"],
  ["expenses", "expenses_type_expense_date_idx"],
];

const EXPENSE_PERMISSION_KEYS = ["accounting.expenses_view", "accounting.expenses_manage"] as const;
const EXPENSE_TYPE_VALUES = ["Salaries", "Marketing", "Logistics", "Technology"] as const;

const sortAlpha = (values: string[]) => values.toSorted((a, b) => a.localeCompare(b));

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

interface ConstraintRow {
  conname: string;
  contype: string;
  confdeltype: string | null;
  definition: string;
}

async function getConstraints(tx: DBTransaction, table: string, contypes: string[]): Promise<ConstraintRow[]> {
  const result = await tx.execute(sql`
    SELECT conname, contype, confdeltype, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = ${table}::regclass
      AND contype IN (${sql.join(
        contypes.map(c => sql`${c}`),
        sql`, `
      )})
  `);
  return getResultRows(result).map(row => ({
    conname: String(row.conname),
    contype: String(row.contype),
    confdeltype: typeof row.confdeltype === "string" ? row.confdeltype : null,
    definition: String(row.definition),
  }));
}

function expectFk(fks: ConstraintRow[], definitionPart: string, expectedDeleteBehavior: string): void {
  const fk = fks.find(row => row.definition.includes(definitionPart));
  expect(fk, `missing FK referencing ${definitionPart}`).toBeDefined();
  expect(fk?.confdeltype).toBe(expectedDeleteBehavior);
}

function readMigrationStatements(path: string): string[] {
  const content = readFileSync(path, "utf8");
  return content
    .split("--> statement-breakpoint")
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
}

function assertExpenseColumns(columns: Map<string, Record<string, unknown>>): void {
  expect(columns.size).toBe(EXPENSE_COLUMNS.length);

  expect(columns.get("title")?.data_type).toBe("character varying");
  expect(columns.get("title")?.is_nullable).toBe("NO");

  expect(columns.get("type")?.udt_name).toBe("expense_type");
  expect(columns.get("type")?.is_nullable).toBe("NO");

  // Monetary value: exact-decimal text, never NULL.
  expect(columns.get("expense_value")?.data_type).toBe("text");
  expect(columns.get("expense_value")?.is_nullable).toBe("NO");

  expect(columns.get("expense_currency")?.udt_name).toBe("currency_code");
  expect(columns.get("expense_currency")?.is_nullable).toBe("NO");

  expect(columns.get("payment_date")?.data_type).toBe("text");
  expect(columns.get("payment_date")?.is_nullable).toBe("NO");

  expect(columns.get("expense_date")?.data_type).toBe("character varying");
  expect(columns.get("expense_date")?.is_nullable).toBe("NO");

  expect(columns.get("created_by_user_id")?.data_type).toBe("uuid");
  expect(columns.get("created_by_user_id")?.is_nullable).toBe("NO");

  for (const name of ["teacher_id", "source_entity_id", "deleted_by_user_id"] as const) {
    expect(columns.get(name)?.data_type).toBe("uuid");
    expect(columns.get(name)?.is_nullable).toBe("YES");
  }
  expect(columns.get("teacher_name")?.data_type).toBe("character varying");
  expect(columns.get("teacher_name")?.is_nullable).toBe("YES");
  expect(columns.get("source_entity")?.data_type).toBe("character varying");
  expect(columns.get("source_entity")?.is_nullable).toBe("YES");
  for (const name of ["note"] as const) {
    expect(columns.get(name)?.data_type).toBe("text");
    expect(columns.get(name)?.is_nullable).toBe("YES");
  }
  for (const name of ["deleted_reason"] as const) {
    expect(columns.get(name)?.data_type).toBe("character varying");
    expect(columns.get(name)?.is_nullable).toBe("YES");
  }

  expect(columns.get("deleted_at")?.data_type).toBe("timestamp with time zone");
  expect(columns.get("deleted_at")?.is_nullable).toBe("YES");
  for (const name of ["created_at", "updated_at"] as const) {
    const column = columns.get(name);
    expect(column?.data_type).toBe("timestamp with time zone");
    expect(column?.is_nullable).toBe("NO");
    expect(column?.column_default).toBe("now()");
  }
}

async function expectExpenseDateCheckRejects(tx: DBTransaction, badDate: string): Promise<void> {
  const actorId = "00000000-0000-4000-8000-000000000001";
  let captured: unknown = null;
  try {
    await tx.execute(sql`
      INSERT INTO expenses (title, type, expense_value, expense_currency, payment_date, expense_date, created_by_user_id)
      VALUES ('bad month', 'Marketing', '10.00', 'SAR', '2026-01-15', ${badDate}, ${actorId})
      ON CONFLICT DO NOTHING
    `);
  } catch (error) {
    captured = error;
  }
  expect(captured).not.toBeNull();
  const baseMessage = captured instanceof Error ? captured.message : String(captured);
  const causeMessage = captured instanceof Error && captured.cause instanceof Error ? captured.cause.message : "";
  expect(`${baseMessage} ${causeMessage}`).toContain("expenses_expense_date_format_chk");
}

async function resetCheckActor(tx: DBTransaction): Promise<void> {
  await tx.execute(sql`
    INSERT INTO users (id, name, email, password, timezone, created_at, updated_at)
    VALUES ('00000000-0000-4000-8000-000000000001', 'expense chk actor', 'expense-chk@example.com', 'x', 'UTC', now(), now())
    ON CONFLICT (id) DO NOTHING
  `);
}

describe("expense ledger migration", () => {
  test.skipIf(isSqlite())("creates the expenses table with expected columns and defaults", async () => {
    await runInRollback(async tx => {
      const columns = await getColumns(tx, "expenses", EXPENSE_COLUMNS);
      assertExpenseColumns(columns);
      testLogger.info("Verified all eighteen expenses columns.");
    });
  });

  test.skipIf(isSqlite())("creates the expense_type enum with the four values", async () => {
    await runInRollback(async tx => {
      const result = await tx.execute(sql`
        SELECT e.enumlabel
        FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'expense_type'
        ORDER BY e.enumsortorder
      `);
      expect(getResultRows(result).map(row => String(row.enumlabel))).toEqual([...EXPENSE_TYPE_VALUES]);
    });
  });

  test.skipIf(isSqlite())("creates the nine indexes, three foreign keys, and the expense_date check", async () => {
    await runInRollback(async tx => {
      const indexResult = await tx.execute(sql`
        SELECT indexname AS name FROM pg_indexes WHERE tablename = 'expenses'
      `);
      const indexNames = getResultRows(indexResult).map(row => String(row.name));
      for (const [, name] of NEW_INDEXES) {
        expect(indexNames).toContain(name);
      }

      const fks = await getConstraints(tx, "expenses", ["f"]);
      expectFk(fks, "REFERENCES teachers(id)", "n");
      expect(fks.filter(row => row.definition.includes("REFERENCES users(id)"))).toHaveLength(2);
      for (const fk of fks.filter(row => row.definition.includes("REFERENCES users(id)"))) {
        expect(fk.confdeltype).toBe("n");
      }

      const checks = await getConstraints(tx, "expenses", ["c"]);
      const formatCheck = checks.find(row => row.conname === "expenses_expense_date_format_chk");
      expect(formatCheck, "missing expense_date format check").toBeDefined();
      expect(formatCheck?.definition).toContain("expense_date");
      expect(formatCheck?.definition).toContain("\\d{4}");
      testLogger.info("Verified expense indexes, FK delete behavior, and the format check.");
    });
  });

  test.skipIf(isSqlite())("the expense_date format check rejects malformed months and accepts YYYY-MM", async () => {
    await runInRollback(async tx => {
      await resetCheckActor(tx);
      await expectExpenseDateCheckRejects(tx, "2026-1");
      testLogger.info("Rejected malformed expense_date; re-checking actor row for the insert path.");
    });
    await runInRollback(async tx => {
      await resetCheckActor(tx);
      const result = await tx.execute(sql`
          INSERT INTO expenses (title, type, expense_value, expense_currency, payment_date, expense_date, created_by_user_id)
          VALUES ('ok month', 'Marketing', '10.00', 'SAR', '2026-01-15', '2026-01', '00000000-0000-4000-8000-000000000001')
          RETURNING id
        `);
      expect(getResultRows(result)).toHaveLength(1);
      testLogger.info("Accepted a well-formed expense_date.");
    });
  });

  test.skipIf(isSqlite())("grants the accounting expenses permissions to the default accounting groups", async () => {
    await runInRollback(async tx => {
      const permissionResult = await tx.execute(sql`
        SELECT key FROM permissions
        WHERE key IN (${sql.join(
          EXPENSE_PERMISSION_KEYS.map(key => sql`${key}`),
          sql`, `
        )})
      `);
      const keys = getResultRows(permissionResult).map(row => String(row.key));
      for (const key of EXPENSE_PERMISSION_KEYS) {
        expect(keys).toContain(key);
      }

      const grantResult = await tx.execute(sql`
        SELECT g.slug AS group_slug, p.key AS permission_key
        FROM group_permissions gp
        JOIN permission_groups g ON g.id = gp.group_id
        JOIN permissions p ON p.id = gp.permission_id
        WHERE g.slug IN ('super_admin', 'academy_admin')
          AND p.key IN (${sql.join(
            EXPENSE_PERMISSION_KEYS.map(key => sql`${key}`),
            sql`, `
          )})
      `);
      const grants = getResultRows(grantResult).map(row => `${String(row.group_slug)}:${String(row.permission_key)}`);
      const expectedGrants = [
        "academy_admin:accounting.expenses_manage",
        "academy_admin:accounting.expenses_view",
        "super_admin:accounting.expenses_manage",
        "super_admin:accounting.expenses_view",
      ];
      expect(sortAlpha([...new Set(grants)])).toEqual(sortAlpha(expectedGrants));
      testLogger.info("Verified expense permission rows and group grants.");
    });
  });

  test.skipIf(isSqlite())("re-running the migration SQL is idempotent and additive-only", async () => {
    for (const path of MIGRATION_SQL_PATHS) {
      const content = readFileSync(path, "utf8");
      // Additive-only guard: no destructive DDL/DML and no NOT NULL hardening
      // of pre-existing tables anywhere in the migration files.
      expect(content).not.toMatch(/\bDROP\s+(TABLE|COLUMN|CONSTRAINT|INDEX|TYPE)\b/i);
      expect(content).not.toMatch(/\bDELETE\s+FROM\b/i);
      expect(content).not.toMatch(/\bTRUNCATE\b/i);
      expect(content).not.toMatch(/\bALTER\s+COLUMN\b/i);
      expect(content).not.toMatch(/\bSET\s+NOT\s+NULL\b/i);
    }

    const statements = MIGRATION_SQL_PATHS.flatMap(path => readMigrationStatements(path));

    await runInRollback(async tx => {
      expect(statements.length).toBeGreaterThan(0);
      // Statements must execute sequentially — DDL order matters (the enum
      // type must exist before the table, the table before its indexes). Every
      // statement is idempotent (IF NOT EXISTS / DO-guard); re-applying must not error.
      await statements.reduce<Promise<unknown>>(
        (sequence, stmt) => sequence.then(() => tx.execute(sql.raw(stmt))),
        Promise.resolve()
      );

      const columns = await getColumns(tx, "expenses", EXPENSE_COLUMNS);
      expect(columns.size).toBe(EXPENSE_COLUMNS.length);
      testLogger.info("Migration re-applied inside rollback without errors.");
    });
  });

  test.skipIf(isSqlite())("keeps existing ledger constraints intact", async () => {
    await runInRollback(async tx => {
      const checks = await getConstraints(tx, "class_instances", ["c"]);
      expect(checks.map(row => row.conname)).toContain("class_instances_state_machine_chk");
      testLogger.info("Pre-existing scheduling CHECK constraints still present.");
    });
  });
});
