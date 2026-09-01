import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { isSqlite } from "@/backend/db";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { DBTransaction } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

// The payroll schema lands in three sequential migration units:
//   1. types  — CREATE TYPE calculation_status + system_setting_category 'payroll'
//   2. columns — the 8 class_instances payroll columns, 4 indexes, FK + 2 CHECKs
//   3. data   — the three grace-period system_settings rows (ON CONFLICT DO NOTHING)
const TYPES_MIGRATION_SQL_PATH = "backend/drizzle/20260829031638_payroll_calculation_types/migration.sql";
const COLUMNS_MIGRATION_SQL_PATH = "backend/drizzle/20260829031639_payroll_class_instances_columns/migration.sql";
const SETTINGS_MIGRATION_SQL_PATH = "backend/drizzle/20260829031931_custom_37-payroll-grace-settings/migration.sql";

const NEW_COLUMNS = [
  "calculated_duration",
  "teacher_paid_amount",
  "teacher_paid_currency",
  "calculation_status",
  "is_partial_percentage",
  "payroll_note",
  "payroll_calculated_at",
  "payroll_calculated_by",
] as const;

const CALCULATION_STATUS_LABELS = [
  "NOT_CALCULATED",
  "CALCULATED",
  "PARTIALLY",
  "REFUND",
  "WAITING_PAID",
  "PAID",
] as const;

const NEW_INDEXES = [
  "class_instances_calculation_status_idx",
  "class_instances_teacher_paid_amount_idx",
  "class_instances_payroll_calculated_at_idx",
  "class_instances_teacher_status_scheduled_idx",
] as const;

const NEW_CHECKS = ["class_instances_partial_percentage_chk", "class_instances_calculated_status_amount_chk"] as const;

const PREEXISTING_CHECKS = ["class_instances_state_machine_chk"] as const;

const PAYROLL_SETTINGS = [
  { key: "payroll.grace_short_minutes", value: "3" },
  { key: "payroll.grace_long_minutes", value: "6" },
  { key: "payroll.grace_threshold_minutes", value: "30" },
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
    WHERE table_name = 'class_instances'
      AND column_name IN (${sql.join(
        NEW_COLUMNS.map(name => sql`${name}`),
        sql`, `
      )})
  `);
  return new Map(getResultRows(result).map(row => [String(row.column_name), row]));
}

async function getPayrollSettings(tx: DBTransaction): Promise<Map<string, Record<string, unknown>>> {
  const result = await tx.execute(sql`
    SELECT key, value, data_type, category
    FROM system_settings
    WHERE key LIKE 'payroll.%'
  `);
  return new Map(getResultRows(result).map(row => [String(row.key), row]));
}

function readMigrationStatements(path: string): string[] {
  const content = readFileSync(path, "utf8");
  return content
    .split("--> statement-breakpoint")
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
}

describe("payroll migration", () => {
  test.skipIf(isSqlite())("adds the eight payroll calculation columns with expected types and defaults", async () => {
    await runInRollback(async tx => {
      const columns = await getSnapshotOfNewColumns(tx);
      expect(columns.size).toBe(NEW_COLUMNS.length);

      const calculationStatus = columns.get("calculation_status");
      expect(calculationStatus?.udt_name).toBe("calculation_status");
      expect(calculationStatus?.is_nullable).toBe("NO");
      expect(calculationStatus?.column_default).toBe("'NOT_CALCULATED'::calculation_status");

      for (const name of ["calculated_duration", "is_partial_percentage"] as const) {
        const column = columns.get(name);
        expect(column?.data_type).toBe("integer");
        expect(column?.is_nullable).toBe("YES");
      }

      const paidAmount = columns.get("teacher_paid_amount");
      expect(paidAmount?.data_type).toBe("text");
      expect(paidAmount?.is_nullable).toBe("YES");

      const paidCurrency = columns.get("teacher_paid_currency");
      expect(paidCurrency?.udt_name).toBe("currency_code");
      expect(paidCurrency?.is_nullable).toBe("YES");

      const payrollNote = columns.get("payroll_note");
      expect(payrollNote?.data_type).toBe("character varying");
      expect(payrollNote?.is_nullable).toBe("YES");

      const calculatedAt = columns.get("payroll_calculated_at");
      expect(calculatedAt?.data_type).toBe("timestamp with time zone");
      expect(calculatedAt?.is_nullable).toBe("YES");

      const calculatedBy = columns.get("payroll_calculated_by");
      expect(calculatedBy?.data_type).toBe("uuid");
      expect(calculatedBy?.is_nullable).toBe("YES");
      testLogger.info("Verified all eight payroll calculation columns.");
    });
  });

  test.skipIf(isSqlite())("creates calculation_status enum and adds the payroll settings category", async () => {
    await runInRollback(async tx => {
      const statusLabels = await getEnumLabels(tx, "calculation_status");
      expect(statusLabels).toEqual([...CALCULATION_STATUS_LABELS]);

      const categoryLabels = await getEnumLabels(tx, "system_setting_category");
      expect(categoryLabels).toContain("payroll");
      testLogger.info("Verified calculation_status values and the payroll settings category.");
    });
  });

  test.skipIf(isSqlite())("creates the indexes, FK, and CHECKs while keeping existing constraints intact", async () => {
    await runInRollback(async tx => {
      const indexResult = await tx.execute(sql`
        SELECT indexname AS name
        FROM pg_indexes
        WHERE tablename = 'class_instances'
      `);
      const indexNames = getResultRows(indexResult).map(row => String(row.name));
      for (const index of NEW_INDEXES) {
        expect(indexNames).toContain(index);
      }

      const fkResult = await tx.execute(sql`
        SELECT conname, confdeltype
        FROM pg_constraint
        WHERE conrelid = 'class_instances'::regclass
          AND conname = 'class_instances_payroll_calculated_by_users_id_fkey'
      `);
      const fkRows = getResultRows(fkResult);
      expect(fkRows).toHaveLength(1);
      expect(fkRows[0]?.confdeltype).toBe("n"); // 'n' = ON DELETE SET NULL

      const checkResult = await tx.execute(sql`
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'class_instances'::regclass
          AND contype = 'c'
      `);
      const checkNames = getResultRows(checkResult).map(row => String(row.conname));
      for (const check of NEW_CHECKS) {
        expect(checkNames).toContain(check);
      }
      for (const check of PREEXISTING_CHECKS) {
        expect(checkNames).toContain(check);
      }
      testLogger.info("Verified payroll indexes, FK, and CHECK constraints (existing checks intact).");
    });
  });

  test.skipIf(isSqlite())("backfills existing rows to NOT_CALCULATED and seeds the grace-period settings", async () => {
    await runInRollback(async tx => {
      const backfillResult = await tx.execute(sql`
        SELECT count(*) AS not_calculated
        FROM class_instances
        WHERE calculation_status = 'NOT_CALCULATED'
      `);
      const backfillRows = getResultRows(backfillResult);
      expect(backfillRows).toHaveLength(1);
      expect(Number(backfillRows[0]?.not_calculated)).toBeGreaterThan(0);

      const settings = await getPayrollSettings(tx);
      expect(settings.size).toBe(PAYROLL_SETTINGS.length);
      for (const setting of PAYROLL_SETTINGS) {
        const row = settings.get(setting.key);
        expect(row?.value).toBe(setting.value);
        expect(row?.data_type).toBe("integer");
        expect(row?.category).toBe("payroll");
      }
      testLogger.info("Verified the NOT_CALCULATED backfill and the three grace-period settings.");
    });
  });

  test.skipIf(isSqlite())("re-running all three migration units is idempotent and additive-only", async () => {
    for (const path of [TYPES_MIGRATION_SQL_PATH, COLUMNS_MIGRATION_SQL_PATH, SETTINGS_MIGRATION_SQL_PATH]) {
      const content = readFileSync(path, "utf8");

      // Additive-only guard: no destructive DDL/DML anywhere in the migration files.
      expect(content).not.toMatch(/\bDROP\s+(TABLE|COLUMN|CONSTRAINT|INDEX|TYPE)\b/i);
      expect(content).not.toMatch(/\bDELETE\s+FROM\b/i);
      expect(content).not.toMatch(/\bTRUNCATE\b/i);
    }

    const statements = [
      ...readMigrationStatements(TYPES_MIGRATION_SQL_PATH),
      ...readMigrationStatements(COLUMNS_MIGRATION_SQL_PATH),
      ...readMigrationStatements(SETTINGS_MIGRATION_SQL_PATH),
    ];
    expect(statements.length).toBeGreaterThan(0);

    await runInRollback(async tx => {
      // Statements must execute sequentially — DDL order matters (columns depend on the enum,
      // settings depend on the payroll category). Every statement is idempotent
      // (IF NOT EXISTS / DO-guard / ON CONFLICT); re-applying must not error.
      await statements.reduce<Promise<unknown>>(
        (sequence, stmt) => sequence.then(() => tx.execute(sql.raw(stmt))),
        Promise.resolve()
      );

      const columns = await getSnapshotOfNewColumns(tx);
      expect(columns.size).toBe(NEW_COLUMNS.length);

      // The re-run INSERT ... ON CONFLICT (key) DO NOTHING must not duplicate rows.
      const settingsResult = await tx.execute(sql`
        SELECT key, count(*) AS occurrences
        FROM system_settings
        WHERE key LIKE 'payroll.%'
        GROUP BY key
      `);
      const settingsRows = getResultRows(settingsResult);
      expect(settingsRows).toHaveLength(PAYROLL_SETTINGS.length);
      for (const row of settingsRows) {
        expect(Number(row.occurrences)).toBe(1);
      }
      testLogger.info("All three payroll migration units re-applied inside rollback without errors.");
    });
  });
});
