/**
 * SUB-LOOP-UNCOMMITTED — Batch Quality Verification for Uncommitted Files
 *
 * This is an extension of sub-loop.ts that runs the progressive quality loop
 * on ALL uncommitted (staged + unstaged) files, sequentially (NOT in parallel).
 *
 * It uses the SAME project-wide commands as sub-loop.ts (tsgo, biome:check, oxlint)
 * but runs them ONCE globally and filters results for all uncommitted files,
 * rather than running per-file. This is much faster than calling sub-loop.ts
 * once per file, because the per-file overhead is eliminated.
 *
 * Workflow:
 *   1. Get the list of uncommitted files (git status --porcelain)
 *   2. Run EVERY check across ALL files (no short-circuit on failure):
 *      - tsgo (project-wide, filter for uncommitted files)
 *      - oxlint (on uncommitted files only)
 *      - biome:check (on uncommitted files only)
 *      - lint:type-aware (via lint service, on uncommitted files only)
 *   3. Derive "clean files" — files that appear in ZERO failedFiles sets
 *   4. Stage clean files with `git add --` (enabled by default; pass --no-stage for dry run)
 *   5. Report per-file pass/fail status
 *   6. Exit non-zero if ANY file fails ANY check
 *
 * Safe Staging (Enabled by default):
 *   Files with zero issues across ALL checks are automatically staged with
 *   `git add --` after checks complete. Files that failed ANY check are left
 *   untouched. No commits are ever made.
 *
 *   Safety guarantees:
 *     - A file is only staged if it appears in ZERO failedFiles sets
 *     - git add is called with `--` to prevent path/flag ambiguity
 *     - All checks always run to completion before any staging occurs
 *     - Nothing is ever committed (git add only)
 *
 * Usage:
 *   bun run scripts/health/sub-loop-uncommitted.ts [--lifecycle <stage>] [--no-stage]
 *
 * Lifecycle stages (same as sub-loop.ts):
 *   tsgo          → only run tsgo
 *   biome         → run tsgo, then oxlint, then biome:check
 *   lint          → run tsgo, oxlint, biome, then lint:type-aware (default)
 *   duplicates    → run tsgo, oxlint, biome, lint:type-aware, then check:duplicates
 *   codescene     → run tsgo, oxlint, biome, lint:type-aware, check:duplicates, codescene
 *   sonar-results → same as codescene
 *
 * Exit codes:
 *   0 = all uncommitted files passed all checks
 *   1 = at least one file failed at least one check
 *   2 = invalid arguments or no uncommitted files
 *
 * Implementation is split across sibling modules:
 *   • `sub-loop-uncommitted-checks.ts` — project-wide batch check implementations
 *   • `sub-loop-uncommitted-report.ts` — clean-file derivation, staging, summary
 *   • `sub-loop-uncommitted-cli.ts`    — argument parsing, check collection, run loop
 */

import { logWarn } from "@/scripts/health/__shared__/sub-loop-types";
import { getUncommittedFiles } from "@/scripts/health/sub-loop-uncommitted-checks";
import { parseCLIArgs, runChecks } from "@/scripts/health/sub-loop-uncommitted-cli";
import { withProcessLock } from "@/scripts/lib/process-lock";

// ─── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { lifecycle, stageEnabled } = parseCLIArgs(args);

  const files = getUncommittedFiles();
  if (files.length === 0) {
    logWarn("No uncommitted TypeScript/JavaScript files found.");
    process.exit(0);
  }

  const exitCode = await withProcessLock("sub-loop-uncommitted", async () => runChecks(lifecycle, stageEnabled, files));

  process.exit(exitCode);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
