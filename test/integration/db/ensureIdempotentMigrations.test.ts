import { describe, expect, it } from "bun:test";
import {
  ensureIdempotentMigrations,
  extractEnumAddValueStatementsFromSql,
  makeMigrationSqlIdempotent,
  transformStatementIdempotent,
} from "@/backend/db/scripts/ensureIdempotentMigrations";

describe("ensureIdempotentMigrations", () => {
  describe("transformStatementIdempotent", () => {
    it("transforms CREATE TABLE to CREATE TABLE IF NOT EXISTS", () => {
      const sql = 'CREATE TABLE "users" ("id" serial PRIMARY KEY);';
      const transformed = transformStatementIdempotent(sql);
      expect(transformed).toBe('CREATE TABLE IF NOT EXISTS "users" ("id" serial PRIMARY KEY);');
    });

    it("transforms CREATE INDEX to CREATE INDEX IF NOT EXISTS", () => {
      const sql = 'CREATE INDEX "idx_user_email" ON "users" ("email");';
      const transformed = transformStatementIdempotent(sql);
      expect(transformed).toBe('CREATE INDEX IF NOT EXISTS "idx_user_email" ON "users" ("email");');
    });

    it("transforms ADD COLUMN to ADD COLUMN IF NOT EXISTS", () => {
      const sql = 'ALTER TABLE "users" ADD COLUMN "role" text;';
      const transformed = transformStatementIdempotent(sql);
      expect(transformed).toBe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" text;');
    });

    it("does not re-transform already idempotent statements", () => {
      const sql = 'CREATE TABLE IF NOT EXISTS "users" ("id" serial PRIMARY KEY);';
      const transformed = transformStatementIdempotent(sql);
      expect(transformed).toBe('CREATE TABLE IF NOT EXISTS "users" ("id" serial PRIMARY KEY);');
    });
  });

  describe("makeMigrationSqlIdempotent", () => {
    it("transforms multi-statement migration SQL across breakpoints", () => {
      const original = [
        'CREATE TABLE "posts" ("id" serial PRIMARY KEY);',
        "--> statement-breakpoint",
        'CREATE INDEX "idx_post_title" ON "posts" ("title");',
      ].join("\n");

      const transformed = makeMigrationSqlIdempotent(original);
      expect(transformed).toContain("CREATE TABLE IF NOT EXISTS");
      expect(transformed).toContain("CREATE INDEX IF NOT EXISTS");
      expect(transformed).toContain("--> statement-breakpoint");
    });
  });

  describe("extractEnumAddValueStatementsFromSql", () => {
    it("extracts ALTER TYPE ADD VALUE statements", () => {
      const sql = `
        ALTER TYPE "user_role" ADD VALUE 'admin';
        ALTER TYPE "user_role" ADD VALUE 'guest';
      `;
      const statements = extractEnumAddValueStatementsFromSql(sql);
      expect(statements).toHaveLength(2);
      expect(statements[0]).toBe(`ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'admin';`);
      expect(statements[1]).toBe(`ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'guest';`);
    });
  });

  describe("ensureIdempotentMigrations async execution", () => {
    it("runs asynchronously and returns array of updated files or empty array", async () => {
      const result = await ensureIdempotentMigrations();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
