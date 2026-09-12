import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SCRIPT_PATH = join(process.cwd(), "scripts/build/sanitize-prebuilt-refs.ts");
const FIXTURE_ROOT = join(process.cwd(), "scratch/sanitize-prebuilt-refs-fixture");

interface FixtureOptions {
  /** Repo-root-relative refs: true = file exists on disk, false = missing (simulates CI checkout). */
  refs: Record<string, boolean>;
  /** Trace entries relative to the trace dir; true = exists, false = missing. */
  traceFiles?: Record<string, boolean>;
}

function runScript(cwd: string): { stderr: string; exitCode: number } {
  const proc = Bun.spawnSync(["bun", "run", SCRIPT_PATH], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    stderr: proc.stderr.toString(),
    exitCode: proc.exitCode ?? 1,
  };
}

function buildFixture({ refs, traceFiles = {} }: FixtureOptions): string {
  const functionsDir = join(FIXTURE_ROOT, ".vercel/output/functions/login.func");
  const nextServerDir = join(functionsDir, ".next/server");
  mkdirSync(nextServerDir, { recursive: true });

  const repoRoot = FIXTURE_ROOT;
  const filePathMap: Record<string, string> = {};
  for (const [rel, exists] of Object.entries(refs)) {
    const abs = join(repoRoot, rel);
    if (exists) {
      mkdirSync(join(abs, ".."), { recursive: true });
      writeFileSync(abs, "export {}");
    }
    filePathMap[rel] = rel;
  }
  writeFileSync(
    join(functionsDir, ".vc-config.json"),
    `${JSON.stringify({ operationType: "Page", handler: "___next_launcher.cjs", filePathMap }, null, 2)}\n`
  );

  // Trace dir sits 6 levels below the fixture root: .vercel/output/functions/login.func/.next/server
  const files: string[] = [];
  const fileHashes: string[] = [];
  for (const [relFromRoot, exists] of Object.entries(traceFiles)) {
    if (exists) {
      const abs = join(repoRoot, relFromRoot);
      mkdirSync(join(abs, ".."), { recursive: true });
      writeFileSync(abs, "export {}");
    }
    files.push(`../../../../../../${relFromRoot}`);
    fileHashes.push(`hash-${relFromRoot}`);
  }
  writeFileSync(
    join(nextServerDir, "instrumentation.js.nft.json"),
    JSON.stringify({ version: 1, files, fileHashes, entryHash: "entry" })
  );

  return repoRoot;
}

function readVcConfig(): { filePathMap?: Record<string, string> } {
  const path = join(FIXTURE_ROOT, ".vercel/output/functions/login.func/.vc-config.json");
  return JSON.parse(readFileSync(path, "utf-8"));
}

function readNftJson(): { files: string[]; fileHashes: string[] } {
  const path = join(FIXTURE_ROOT, ".vercel/output/functions/login.func/.next/server/instrumentation.js.nft.json");
  return JSON.parse(readFileSync(path, "utf-8"));
}

describe("sanitize-prebuilt-refs", () => {
  beforeEach(() => {
    rmSync(FIXTURE_ROOT, { recursive: true, force: true });
  });

  afterEach(() => {
    rmSync(FIXTURE_ROOT, { recursive: true, force: true });
  });

  test("prunes filePathMap refs whose target does not exist and keeps existing ones", () => {
    buildFixture({
      refs: {
        "backend/storage/disk/local/utils.ts": true,
        "backend/storage/disk/local/gone.ts": false,
        "logs/2026-09-11T13-23-59/utils.test.ts.log": false,
      },
    });

    const result = runScript(FIXTURE_ROOT);
    expect(result.exitCode).toBe(0);

    const config = readVcConfig();
    expect(config.filePathMap).toEqual({
      "backend/storage/disk/local/utils.ts": "backend/storage/disk/local/utils.ts",
    });
    expect(result.stderr).toContain("Pruned 2 filePathMap refs");
  });

  test("keeps all refs when every target exists (idempotent no-op)", () => {
    buildFixture({
      refs: { "backend/storage/disk/local/utils.ts": true, "backend/storage/disk/local/shared.ts": true },
    });

    const result = runScript(FIXTURE_ROOT);
    expect(result.exitCode).toBe(0);

    const config = readVcConfig();
    expect(Object.keys(config.filePathMap ?? {})).toHaveLength(2);
    expect(result.stderr).toContain("Pruned 0 filePathMap refs");
  });

  test("prunes missing nft.json trace entries and keeps fileHashes aligned with files", () => {
    buildFixture({
      refs: { "backend/storage/disk/local/utils.ts": true },
      traceFiles: {
        "backend/storage/disk/local/utils.ts": true,
        "backend/storage/disk/local/gone.ts": false,
      },
    });

    const result = runScript(FIXTURE_ROOT);
    expect(result.exitCode).toBe(0);

    const trace = readNftJson();
    expect(trace.files).toEqual(["../../../../../../backend/storage/disk/local/utils.ts"]);
    expect(trace.fileHashes).toEqual(["hash-backend/storage/disk/local/utils.ts"]);
    expect(result.stderr).toContain("1 trace entries");
  });

  test("exits cleanly when .vercel/output is absent", () => {
    mkdirSync(FIXTURE_ROOT, { recursive: true });

    const result = runScript(FIXTURE_ROOT);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("No .vercel/output");
  });
});
