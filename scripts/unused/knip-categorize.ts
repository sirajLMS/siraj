#!/usr/bin/env bun

/**
 * KNIP CATEGORIZE — Run `knip` (check:unused), capture JSON output, and categorize results.
 *
 * Mirrors the pattern of scripts/oxlint-categorize.ts:
 *   1. Spawn `knip --reporter json` and capture stdout to a `.log` file (raw output is very large).
 *   2. Parse the JSON and bucket issues by type, layer, directory, and file.
 *   3. Write categorized JSON files to `.unused/` (gitignored, same convention as `.oxlint/`).
 *   4. Write a `summary.json` with counts and top-N lists.
 *
 * Usage:
 *   bun run scripts/unused/knip-categorize.ts
 *
 * Output directory: `.unused/`
 *   - knip-results.log          (raw JSON from knip — kept as .log for easy viewing)
 *   - by-type-<type>.json       (one file per issue type)
 *   - by-layer-<layer>.json    (one file per architectural layer)
 *   - by-directory-<dir>.json   (one file per top-level directory)
 *   - by-file-<slug>.json      (top 50 files by issue count)
 *   - summary.json              (global summary with top-N stats)
 */

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withProcessLock } from "@/scripts/lib/process-lock";
import { buildSummary, categorize, isKnipReport } from "@/scripts/unused/knip-categorize.helpers";
import { OUTPUT_DIR, PROJECT_ROOT, RAW_OUTPUT_FILE } from "@/scripts/unused/knip-categorize.types";
import {
  writeByDirectory,
  writeByFileTop50,
  writeByLayer,
  writeByType,
  writeJSON,
} from "@/scripts/unused/knip-categorize.writers";

export type { Layer } from "@/scripts/unused/knip-categorize.types";

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  await withProcessLock("knip-categorize", async () => {
    // Wipe and recreate output directory
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
    mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log("Running knip --reporter json ...");

    // Spawn knip with JSON reporter, capture stdout.
    // knip exits with code 1 when issues are found — this is expected and not an error.
    const proc = Bun.spawn(["bun", "run", "check:unused", "--reporter", "json", "--no-progress"], {
      stdout: "pipe",
      stderr: "pipe",
      cwd: PROJECT_ROOT,
    });

    const stdoutPromise = new Response(proc.stdout).text();
    const stderrPromise = new Response(proc.stderr).text();
    const exitCode = await proc.exited;
    const stdout = await stdoutPromise;
    const stderr = await stderrPromise;

    // Write raw output to .log file (even on error, for debugging)
    writeFileSync(RAW_OUTPUT_FILE, stdout || stderr);

    if (exitCode !== 0 && exitCode !== 1) {
      console.error(`knip exited with code ${exitCode}`);
      console.error(stderr);
      process.exit(exitCode);
    }

    console.log(`Raw output saved to ${RAW_OUTPUT_FILE} (${(stdout.length / 1024).toFixed(1)} KB)`);

    // Parse JSON
    const rawData: unknown = JSON.parse(stdout);
    if (!isKnipReport(rawData)) {
      throw new Error("Invalid knip JSON output format — expected { issues: [{ file: string, ... }] }");
    }

    const report = rawData;

    // Categorize
    console.log("Categorizing issues...");
    const data = categorize(report);

    // Write categorized files
    writeByType(data);
    const typeKeys = Object.keys(data.byType);
    console.log(`  by-type: ${typeKeys.length} files (${typeKeys.join(", ")})`);

    writeByLayer(data);
    console.log(`  by-layer: ${Object.keys(data.byLayer).length} layers`);

    writeByDirectory(data);
    console.log(`  by-directory: top ${Math.min(50, Object.keys(data.byDirectory).length)} directories`);

    writeByFileTop50(data);
    console.log(`  by-file: top 50 files`);

    // Summary
    const summary = buildSummary(report, data);
    const summaryFile = join(OUTPUT_DIR, "summary.json");
    writeJSON(summaryFile, summary);
    console.log(`  summary.json written`);

    console.log("\n✅ Done! Categorized output in .unused/:");
    const dirList = Bun.spawnSync(["ls", "-1", OUTPUT_DIR]);
    console.log(dirList.stdout.toString().trim());
  });
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
