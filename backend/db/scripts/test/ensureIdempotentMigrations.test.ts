import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ensureIdempotentMigrations,
  makeMigrationSqlIdempotent,
} from "@/backend/db/scripts/ensureIdempotentMigrations";

const TEST_DIR = join(process.cwd(), "temp_test_drizzle_unit");

describe("ensureIdempotentMigrations async", () => {
  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("returns empty array if target directory does not exist", async () => {
    const nonExistent = join(process.cwd(), "temp_non_existent_dir_9999");
    const result = await ensureIdempotentMigrations(nonExistent);
    expect(result).toEqual([]);
  });

  it("rewrites non-idempotent migration SQL files asynchronously and returns modified file paths", async () => {
    const folder1 = join(TEST_DIR, "20260101000000_init");
    mkdirSync(folder1, { recursive: true });
    const rawSql1 = `CREATE TABLE "users" ("id" serial PRIMARY KEY);\n--> statement-breakpoint\nALTER TABLE "users" ADD COLUMN "email" text;`;
    writeFileSync(join(folder1, "migration.sql"), rawSql1);

    const folder2 = join(TEST_DIR, "20260102000000_already_idempotent");
    mkdirSync(folder2, { recursive: true });
    const rawSql2 = `CREATE TABLE IF NOT EXISTS "posts" ("id" serial PRIMARY KEY);--> statement-breakpoint\nALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "title" text;`;
    writeFileSync(join(folder2, "migration.sql"), rawSql2);

    const updated = await ensureIdempotentMigrations(TEST_DIR);

    expect(updated).toEqual(["20260101000000_init/migration.sql"]);

    const newContent1 = readFileSync(join(folder1, "migration.sql"), "utf8");
    expect(newContent1).toContain("CREATE TABLE IF NOT EXISTS");
    expect(newContent1).toContain("ADD COLUMN IF NOT EXISTS");

    const newContent2 = readFileSync(join(folder2, "migration.sql"), "utf8");
    expect(newContent2).toBe(rawSql2);
  });

  it("correctly handles empty directories or folders without migration.sql", async () => {
    const folder1 = join(TEST_DIR, "empty_folder");
    mkdirSync(folder1, { recursive: true });

    const updated = await ensureIdempotentMigrations(TEST_DIR);
    expect(updated).toEqual([]);
  });

  it("transforms statements correctly via makeMigrationSqlIdempotent", () => {
    const sql = `ALTER TABLE "test" ADD COLUMN "name" varchar(255);`;
    const result = makeMigrationSqlIdempotent(sql);
    expect(result).toBe(`ALTER TABLE "test" ADD COLUMN IF NOT EXISTS "name" varchar(255);`);
  });
});
