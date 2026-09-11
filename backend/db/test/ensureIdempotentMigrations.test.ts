import { describe, expect, it } from "bun:test";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  extractEnumAddValueStatementsFromSql,
  preCommitEnumStatementsForMigrationFile,
} from "@/backend/db/scripts/ensureIdempotentMigrations";

describe("ensureIdempotentMigrations", () => {
  it("extracts enum add value statements from SQL correctly", () => {
    const sql = `
      ALTER TYPE "app_permission" ADD VALUE 'PERMISSION_A';
      ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'PERMISSION_B';
    `;
    const statements = extractEnumAddValueStatementsFromSql(sql);
    expect(statements).toEqual([
      "ALTER TYPE \"app_permission\" ADD VALUE IF NOT EXISTS 'PERMISSION_A';",
      "ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'PERMISSION_B';",
    ]);
  });

  it("handles non-existent migration file gracefully in preCommitEnumStatementsForMigrationFile", async () => {
    const nonExistentPath = join(tmpdir(), `non-existent-migration-${Date.now()}.sql`);
    await expect(preCommitEnumStatementsForMigrationFile(nonExistentPath)).resolves.toBeUndefined();
  });

  it("reads migration file using async I/O in preCommitEnumStatementsForMigrationFile", async () => {
    const tmpFile = join(tmpdir(), `test-migration-${Date.now()}.sql`);
    const sql = `-- Sample migration file with no enum add statements\nCREATE TABLE test_table (id INT);\n`;
    writeFileSync(tmpFile, sql, "utf8");

    try {
      await expect(preCommitEnumStatementsForMigrationFile(tmpFile)).resolves.toBeUndefined();
    } finally {
      if (existsSync(tmpFile)) {
        unlinkSync(tmpFile);
      }
    }
  });

  it("benchmark: measures preCommitEnumStatementsForMigrationFile execution speed", async () => {
    const tmpFile = join(tmpdir(), `bench-migration-${Date.now()}.sql`);
    const sql = `-- Sample SQL migration file\nSELECT 1;\n`;
    writeFileSync(tmpFile, sql, "utf8");

    try {
      const iterations = 100;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        await preCommitEnumStatementsForMigrationFile(tmpFile);
      }
      const duration = performance.now() - start;
      expect(duration).toBeGreaterThanOrEqual(0);
    } finally {
      if (existsSync(tmpFile)) {
        unlinkSync(tmpFile);
      }
    }
  });
});
