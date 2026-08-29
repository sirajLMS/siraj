import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { isSqlite } from "@/backend/db";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { DBTransaction } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

const MIGRATION_SQL_PATH = "backend/drizzle/20260828222827_fair_justice/migration.sql";

const NEW_COLUMNS = [
  "adjustment_type",
  "carryover_teacher_id",
  "carryover_from_date",
  "carryover_to_date",
  "carryover_payment_date",
] as const;

const ADJUSTMENT_TYPE_LABELS = ["ADD", "SUBTRACT", "SUBTRACT_WITH_CARRYOVER"] as const;
const NEW_CREDIT_REASONS = [
  "CREDIT_ADJUSTMENT_ADD",
  "CREDIT_ADJUSTMENT_SUBTRACT",
  "CREDIT_ADJUSTMENT_CARRYOVER",
] as const;

const NEW_INDEXES = [
  "credit_transactions_adjustment_type_idx",
  "credit_transactions_carryover_teacher_id_idx",
] as const;

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

async function getEnumLabels(tx: DBTransaction, typeName: string): Promise<string[]> {
  const result = await tx.execute(sql`
    SELECT e.enumlabel AS label
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = ${typeName}
    ORDER BY e.enumsortorder
  `);
  return getResultRows(result).map(row => String(row.label));
}

async function getSnapshotOfNewColumns(tx: DBTransaction): Promise<Map<string, Record<string, unknown>>> {
  const result = await tx.execute(sql`
    SELECT column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'credit_transactions'
      AND column_name IN (${sql.join(
        NEW_COLUMNS.map(name => sql`${name}`),
        sql`, `
      )})
  `);
  return new Map(getResultRows(result).map(row => [String(row.column_name), row]));
}

describe("credit-adjustment migration", () => {
  test.skipIf(isSqlite())("adds the five credit-adjustment columns with expected types and defaults", async () => {
    await runInRollback(async tx => {
      const columns = await getSnapshotOfNewColumns(tx);
      expect(columns.size).toBe(NEW_COLUMNS.length);

      const adjustmentType = columns.get("adjustment_type");
      expect(adjustmentType?.udt_name).toBe("credit_adjustment_type");
      expect(adjustmentType?.is_nullable).toBe("NO");
      expect(adjustmentType?.column_default).toBe("'ADD'::credit_adjustment_type");

      for (const name of ["carryover_from_date", "carryover_to_date", "carryover_payment_date"] as const) {
        const column = columns.get(name);
        expect(column?.data_type).toBe("text");
        expect(column?.is_nullable).toBe("YES");
      }

      const teacherId = columns.get("carryover_teacher_id");
      expect(teacherId?.data_type).toBe("uuid");
      expect(teacherId?.is_nullable).toBe("YES");
      testLogger.info("Verified all five credit-adjustment columns.");
    });
  });

  test.skipIf(isSqlite())("creates credit_adjustment_type enum and adds the three credit_reason values", async () => {
    await runInRollback(async tx => {
      const adjustmentLabels = await getEnumLabels(tx, "credit_adjustment_type");
      expect(adjustmentLabels).toEqual([...ADJUSTMENT_TYPE_LABELS]);

      const reasonLabels = await getEnumLabels(tx, "credit_reason");
      for (const reason of NEW_CREDIT_REASONS) {
        expect(reasonLabels).toContain(reason);
      }
      testLogger.info("Verified credit-adjustment enum values.");
    });
  });

  test.skipIf(isSqlite())("creates the two indexes and the ON DELETE SET NULL carryover FK", async () => {
    await runInRollback(async tx => {
      const indexResult = await tx.execute(sql`
        SELECT indexname AS name
        FROM pg_indexes
        WHERE tablename = 'credit_transactions'
      `);
      const indexNames = getResultRows(indexResult).map(row => String(row.name));
      for (const index of NEW_INDEXES) {
        expect(indexNames).toContain(index);
      }

      const fkResult = await tx.execute(sql`
        SELECT conname, confdeltype
        FROM pg_constraint
        WHERE conrelid = 'credit_transactions'::regclass
          AND conname = 'credit_transactions_carryover_teacher_id_teachers_id_fkey'
      `);
      const fkRows = getResultRows(fkResult);
      expect(fkRows).toHaveLength(1);
      expect(fkRows[0]?.confdeltype).toBe("n"); // 'n' = ON DELETE SET NULL
      testLogger.info("Verified credit-adjustment indexes and FK constraint.");
    });
  });

  test.skipIf(isSqlite())("re-running the migration SQL is idempotent and additive-only", async () => {
    const content = readFileSync(MIGRATION_SQL_PATH, "utf8");

    // Additive-only guard: no destructive DDL anywhere in the migration file.
    expect(content).not.toMatch(/\bDROP\s+(TABLE|COLUMN|CONSTRAINT|INDEX|TYPE)\b/i);
    expect(content).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(content).not.toMatch(/\bTRUNCATE\b/i);

    const statements = content
      .split("--> statement-breakpoint")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    expect(statements.length).toBeGreaterThan(0);

    await runInRollback(async tx => {
      // Statements must execute sequentially — DDL order matters (columns/indexes depend on the enum).
      // Every statement is idempotent (IF NOT EXISTS / DO-guard); re-applying must not error.
      await statements.reduce<Promise<unknown>>(
        (sequence, stmt) => sequence.then(() => tx.execute(sql.raw(stmt))),
        Promise.resolve()
      );
      const columns = await getSnapshotOfNewColumns(tx);
      expect(columns.size).toBe(NEW_COLUMNS.length);
      testLogger.info("Migration re-applied inside rollback without errors.");
    });
  });
});
