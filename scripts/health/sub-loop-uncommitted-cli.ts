/**
 * Sub-loop-uncommitted CLI — argument parsing, check collection, run loop.
 *
 * Extracted from `scripts/health/sub-loop-uncommitted.ts`. The `main` entry
 * point and the module path `scripts/health/sub-loop-uncommitted.ts` stay
 * unchanged.
 *
 * `console.*` is allowed in `scripts/**`.
 */

import { isLifecycle, LIFECYCLE_ORDER, type Lifecycle } from "@/scripts/health/__shared__/sub-loop-types";
import {
  type BatchCheckResult,
  checkBiomeAll,
  checkCodesceneAll,
  checkDuplicatesAll,
  checkLintTypeAwareAll,
  checkOxlintAll,
  checkTsgoAll,
} from "@/scripts/health/sub-loop-uncommitted-checks";
import {
  computeCleanFiles,
  printHeader,
  printStagingPreview,
  printSummary,
  stageCleanFiles,
} from "@/scripts/health/sub-loop-uncommitted-report";

// ─── Argument Parsing ──────────────────────────────────────────────────────

/** Parse CLI flags: --lifecycle <stage> and --no-stage / --dry-run / --stage. */
export function parseCLIArgs(args: string[]): { lifecycle: Lifecycle; stageEnabled: boolean } {
  let lifecycle: Lifecycle = "lint";
  let stageEnabled = true;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lifecycle" && i + 1 < args.length) {
      const val = args[i + 1];
      if (isLifecycle(val)) {
        lifecycle = val;
      } else {
        console.error(`Invalid lifecycle: ${val}`);
        console.error(`Valid values: ${Object.keys(LIFECYCLE_ORDER).join(", ")}`);
        process.exit(2);
      }
      i++;
    } else if (args[i] === "--no-stage" || args[i] === "--dry-run") {
      stageEnabled = false;
    } else if (args[i] === "--stage") {
      stageEnabled = true;
    }
  }

  return { lifecycle, stageEnabled };
}

// ─── Check Collection ──────────────────────────────────────────────────────

/** Collect BatchCheckResults for all lifecycle stages up to `depth`. */
async function collectResults(depth: number, files: string[]): Promise<BatchCheckResult[]> {
  const results: BatchCheckResult[] = [];

  // tsgo (depth 0+)
  results.push(checkTsgoAll(files));

  // oxlint + biome (depth 1+)
  if (depth >= 1) {
    results.push(checkOxlintAll(files));
    results.push(checkBiomeAll(files));
  }

  // lint:type-aware (depth 2+)
  if (depth >= 2) {
    results.push(await checkLintTypeAwareAll(files));
  }

  // check:duplicates (depth 3+)
  if (depth >= 3) {
    results.push(checkDuplicatesAll(files));
  }

  // codescene (depth 4+)
  if (depth >= 4) {
    results.push(checkCodesceneAll(files));
  }

  return results;
}

// ─── Run Loop ──────────────────────────────────────────────────────────────

/**
 * Run all quality checks and return the exit code.
 * All checks run to completion (no short-circuit) so we can derive the
 * complete per-file pass/fail picture needed for safe staging.
 */
export async function runChecks(lifecycle: Lifecycle, stageEnabled: boolean, files: string[]): Promise<number> {
  printHeader(lifecycle, stageEnabled, files);

  const results = await collectResults(LIFECYCLE_ORDER[lifecycle], files);

  // Derive zero-issue files from the union of all failedFiles sets.
  const cleanFiles = computeCleanFiles(files, results);

  printStagingPreview(cleanFiles, stageEnabled);

  if (stageEnabled) {
    stageCleanFiles(cleanFiles);
  }

  printSummary(results, files, cleanFiles, stageEnabled);

  const anyFailed = results.some(r => !r.passed) || cleanFiles.length < files.length;
  return anyFailed ? 1 : 0;
}
