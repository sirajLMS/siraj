import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ensureIdempotentMigrations } from "@/backend/db/scripts/ensureIdempotentMigrations";

const TEST_DIR = join(process.cwd(), "test/temp_drizzle_bench");

function setupMockMigrations(count: number) {
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DIR, { recursive: true });

  for (let i = 0; i < count; i++) {
    const folderName = `folder_${i.toString().padStart(4, "0")}`;
    const folderPath = join(TEST_DIR, folderName);
    mkdirSync(folderPath, { recursive: true });

    // Half of the files need idempotency rewriting, half are already idempotent
    const sql =
      i % 2 === 0
        ? `CREATE TABLE "table_${i}" ("id" serial PRIMARY KEY, "name" varchar);\n--> statement-breakpoint\nALTER TABLE "table_${i}" ADD COLUMN "created_at" timestamp;`
        : `CREATE TABLE IF NOT EXISTS "table_${i}" ("id" serial PRIMARY KEY, "name" varchar);\n--> statement-breakpoint\nALTER TABLE "table_${i}" ADD COLUMN IF NOT EXISTS "created_at" timestamp;`;

    writeFileSync(join(folderPath, "migration.sql"), sql, "utf8");
  }
}

async function benchmark() {
  const FOLDER_COUNT = 100;
  console.log(`Setting up ${FOLDER_COUNT} migration folders for benchmark...`);

  const iterations = 5;
  const timings: number[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    setupMockMigrations(FOLDER_COUNT);
    const iterStart = performance.now();
    const res = await ensureIdempotentMigrations(TEST_DIR);
    const duration = performance.now() - iterStart;
    timings.push(duration);
    console.log(`Iteration ${iter + 1}: ${duration.toFixed(2)} ms (updated ${res.length} files)`);
  }

  const avgMs = timings.reduce((a, b) => a + b, 0) / timings.length;
  console.log(`\nAverage async execution time for ${FOLDER_COUNT} migration folders: ${avgMs.toFixed(2)} ms`);

  rmSync(TEST_DIR, { recursive: true, force: true });
}

benchmark().catch(console.error);
