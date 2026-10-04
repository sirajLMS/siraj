/**
 * SUB-LOOP — Per-File Progressive Quality Verification Script
 *
 * This script is called by subagents dispatched by the quality-gate skill. It runs a progressive
 * quality loop on a single file, checking in strict order:
 *
 *   tsgo → oxlint → biome:check → lint:type-aware (via lint service) → check:duplicates → codescene --file
 *
 * It SHORT-CIRCUITS at the first failing check — stops and prints the errors for the subagent
 * to fix. The subagent fixes the errors and re-runs this script until it passes all checks.
 *
 * ⚠️  SINGLE-FILE ONLY: Every check is scoped to the target file. Cross-file issues (including
 *    cross-file duplication) are out of scope — report those to the orchestrator instead.
 *
 * ⚠️  CRITICAL: SonarQube scan is VERY COSTLY to run.
 *    This script NEVER runs `bun sonar-scan` or `bun scripts/sonar-manager.ts`.
 *    Subagents must NEVER run sonar. Only the quality-gate orchestrator handles sonar stages.
 *    This exclusion is HARDCODED — there is no flag to enable it. Do not add one.
 *
 * Implementation is split across sibling modules:
 *   • `sub-loop-checks.ts` — file-level check implementations
 *   • `sub-loop-rules.ts`  — instruction & AGENTS.md discovery/printing
 *   • `sub-loop-cli.ts`    — argument parsing, validation, progressive runner, help
 *
 * Usage:
 *   bun run scripts/health/sub-loop.ts <file-path> --lifecycle <stage>
 *
 * Lifecycle stages (controls how deep the loop goes):
 *   tsgo          → only run tsgo (type checking only)
 *   biome         → run tsgo, then oxlint, then biome:check (stop if tsgo or oxlint fails)
 *   lint          → run tsgo, oxlint, biome, then lint:type-aware via lint service (stop if earlier check fails)
 *   duplicates    → run tsgo, oxlint, biome, lint:type-aware, then check:duplicates (stop if earlier check fails)
 *   codescene     → run tsgo, oxlint, biome, lint:type-aware, check:duplicates, then codescene --file
 *
 * Exit codes:
 *   0 = all checks up to the lifecycle stage passed
 *   1 = stopped at a failing check (errors printed to stdout/stderr)
 *   2 = invalid arguments
 */

import { relative, resolve } from "node:path";
import { LIFECYCLE_ORDER, logInfo } from "@/scripts/health/__shared__/sub-loop-types";
import { parseArgs, printHelp, runProgressiveChecks, validateArgs } from "@/scripts/health/sub-loop-cli";
import { printApplicableRuleFiles } from "@/scripts/health/sub-loop-rules";
import { withProcessLock } from "@/scripts/lib/process-lock";

// ─── Constants ──────────────────────────────────────────────────────────────
const PROJECT_ROOT = process.cwd();

// ─── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const { filePath, lifecycle } = parseArgs(args);
  const { filePath: filePathSafe, lifecycle: lifecycleSafe } = validateArgs(filePath, lifecycle);

  const absPath = resolve(PROJECT_ROOT, filePathSafe);
  const relPath = relative(PROJECT_ROOT, absPath);
  const targetDepth = LIFECYCLE_ORDER[lifecycleSafe];

  logInfo(`File: ${relPath}`);
  logInfo(`Lifecycle: ${lifecycleSafe} (depth: ${targetDepth})`);
  console.log("");

  printApplicableRuleFiles(filePathSafe);

  const exitCode = await withProcessLock(`sub-loop: ${relPath}`, async () => {
    return await runProgressiveChecks(filePathSafe, relPath, lifecycleSafe, targetDepth);
  });

  process.exit(exitCode);
}

void main();
