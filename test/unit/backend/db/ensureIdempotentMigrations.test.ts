import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ensureIdempotentMigrations,
  extractEnumAddValueStatementsFromSql,
  makeMigrationSqlIdempotent,
  transformStatementIdempotent,
} from "@/backend/db/scripts/ensureIdempotentMigrations";

const TEST_TEMP_DIR = join(process.cwd(), "test/temp_drizzle_unit_test");

describe("ensureIdempotentMigrations unit tests", () => {
  beforeEach(() => {
    rmSync(TEST_TEMP_DIR, { recursive: true, force: true });
    mkdirSync(TEST_TEMP_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_TEMP_DIR, { recursive: true, force: true });
  });

  test("transformStatementIdempotent correctly transforms DDL statements", () => {
    expect(transformStatementIdempotent('CREATE TABLE "users" ("id" serial PRIMARY KEY);')).toBe(
      'CREATE TABLE IF NOT EXISTS "users" ("id" serial PRIMARY KEY);'
    );

    expect(transformStatementIdempotent('CREATE INDEX "users_email_idx" ON "users" ("email");')).toBe(
      'CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");'
    );

    expect(transformStatementIdempotent('ALTER TABLE "users" ADD COLUMN "age" integer;')).toBe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "age" integer;'
    );

    expect(transformStatementIdempotent('DROP INDEX "users_email_idx";')).toBe(
      'DROP INDEX IF EXISTS "users_email_idx";'
    );
  });

  test("makeMigrationSqlIdempotent preserves breakpoints while transforming statements", () => {
    const rawSql = [
      'CREATE TABLE "posts" ("id" serial PRIMARY KEY);',
      "--> statement-breakpoint",
      'ALTER TABLE "posts" ADD COLUMN "title" varchar;',
    ].join("\n");

    const expected =
      'CREATE TABLE IF NOT EXISTS "posts" ("id" serial PRIMARY KEY);--> statement-breakpoint\nALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "title" varchar;';

    expect(makeMigrationSqlIdempotent(rawSql)).toBe(expected);
  });

  test("extractEnumAddValueStatementsFromSql extracts enum add value statements", () => {
    const sql = `ALTER TYPE "user_role" ADD VALUE 'admin';\nALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'superadmin';`;
    const extracted = extractEnumAddValueStatementsFromSql(sql);
    expect(extracted).toEqual([
      `ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'admin';`,
      `ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'superadmin';`,
    ]);
  });

  test("ensureIdempotentMigrations rewrites non-idempotent files asynchronously", async () => {
    const folder1 = join(TEST_TEMP_DIR, "20260101000000_init");
    const folder2 = join(TEST_TEMP_DIR, "20260101000001_add_col");
    mkdirSync(folder1, { recursive: true });
    mkdirSync(folder2, { recursive: true });

    const rawSql1 = 'CREATE TABLE "demo" ("id" serial PRIMARY KEY);';
    const rawSql2 = 'CREATE TABLE IF NOT EXISTS "demo" ("id" serial PRIMARY KEY);';

    writeFileSync(join(folder1, "migration.sql"), rawSql1, "utf8");
    writeFileSync(join(folder2, "migration.sql"), rawSql2, "utf8");

    const updated = await ensureIdempotentMigrations(TEST_TEMP_DIR);
    expect(updated).toEqual(["20260101000000_init/migration.sql"]);

    const newContent1 = readFileSync(join(folder1, "migration.sql"), "utf8");
    expect(newContent1).toBe('CREATE TABLE IF NOT EXISTS "demo" ("id" serial PRIMARY KEY);');

    // Second run should return empty list since everything is now idempotent
    const secondUpdated = await ensureIdempotentMigrations(TEST_TEMP_DIR);
    expect(secondUpdated).toEqual([]);
  });
});
