/**
 * Sub-loop CLI plumbing — argument parsing, validation and the progressive
 * check runner.
 *
 * Extracted from `scripts/health/sub-loop.ts`. The strict check order is
 * preserved byte-for-byte:
 *
 *   tsgo → oxlint → biome:check → lint:type-aware → check:duplicates → codescene --file
 *
 * with short-circuit behaviour at the first failing check. The `main` entry
 * point and the module path `scripts/health/sub-loop.ts` stay unchanged.
 *
 * `console.*` is allowed in `scripts/**`.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  BOLD,
  type CheckResult,
  CYAN,
  GREEN,
  isLifecycle,
  LIFECYCLE_ORDER,
  type Lifecycle,
  logFail,
  logPass,
  NC,
} from "@/scripts/health/__shared__/sub-loop-types";
import {
  checkBiome,
  checkCodescene,
  checkDuplicates,
  checkLint,
  checkOxlint,
  checkTsgo,
} from "@/scripts/health/sub-loop-checks";

// ─── Constants ──────────────────────────────────────────────────────────────
const PROJECT_ROOT = process.cwd();

// ─── Argument Parsing ──────────────────────────────────────────────────────

interface ParsedArgs {
  filePath: string | null;
  lifecycle: string | null;
}

export function parseArgs(args: string[]): ParsedArgs {
  let filePath: string | null = null;
  let lifecycle: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lifecycle") {
      lifecycle = args[i + 1] ?? null;
      i++;
    } else if (!args[i].startsWith("--")) {
      filePath = args[i];
    }
  }

  return { filePath, lifecycle };
}

// ─── Validation ────────────────────────────────────────────────────────────

interface ValidatedArgs {
  filePath: string;
  lifecycle: Lifecycle;
}

export function validateArgs(filePath: string | null, lifecycle: string | null): ValidatedArgs {
  if (!filePath) {
    logFail("Missing <file-path> argument.");
    console.error("Usage: bun run scripts/health/sub-loop.ts <file-path> --lifecycle <stage>");
    process.exit(2);
  }

  const validLifecycles = Object.keys(LIFECYCLE_ORDER).join(", ");
  if (!lifecycle || !isLifecycle(lifecycle)) {
    logFail(`Invalid or missing --lifecycle argument.`);
    console.error(`Valid stages: ${validLifecycles}`);
    process.exit(2);
  }

  const absPath = resolve(PROJECT_ROOT, filePath);
  if (!existsSync(absPath)) {
    logFail(`File not found: ${filePath}`);
    process.exit(2);
  }

  return { filePath, lifecycle };
}

// ─── Progressive Check Runner ───────────────────────────────────────────────

function failOnResult(result: CheckResult, failMsg: string): boolean {
  if (!result.passed) {
    logFail(failMsg);
    console.log("\n" + result.output);
    return true;
  }
  return false;
}

export async function runProgressiveChecks(
  filePath: string,
  relPath: string,
  lifecycle: Lifecycle,
  targetDepth: number
): Promise<number> {
  // Step 1: tsgo (always runs first, project-wide, filtered for this file)
  const tsgoResult = checkTsgo(filePath);
  if (failOnResult(tsgoResult, "tsgo FAILED — stopping here. Fix type errors before proceeding.")) return 1;
  logPass(`tsgo passed (no errors for ${relPath})`);

  if (targetDepth <= LIFECYCLE_ORDER.tsgo) {
    console.log(`\n${GREEN}✅ All checks for lifecycle "tsgo" passed.${NC}`);
    return 0;
  }

  // Step 2: oxlint (file-level)
  const oxlintResult = checkOxlint(filePath);
  if (failOnResult(oxlintResult, "oxlint FAILED — stopping here. Fix oxlint errors before proceeding.")) return 1;
  logPass("oxlint passed");

  // Step 3: biome:check (file-level)
  const biomeResult = checkBiome(filePath);
  if (failOnResult(biomeResult, "biome:check FAILED — stopping here. Fix formatting/biome issues before proceeding."))
    return 1;
  logPass("biome:check passed");

  if (targetDepth <= LIFECYCLE_ORDER.biome) {
    console.log(`\n${GREEN}✅ All checks for lifecycle "biome" passed.${NC}`);
    return 0;
  }

  // Step 4: lint:type-aware via lint service (file-level)
  const lintResult = await checkLint(filePath);
  if (failOnResult(lintResult, "lint:type-aware FAILED — stopping here. Fix lint errors before proceeding.")) return 1;
  logPass("lint:type-aware passed");

  if (targetDepth <= LIFECYCLE_ORDER.lint) {
    console.log(`\n${GREEN}✅ All checks for lifecycle "lint" passed.${NC}`);
    return 0;
  }

  // Step 5: check:duplicates via jscpd (intra-file clones only)
  const duplicatesResult = checkDuplicates(filePath);
  if (
    failOnResult(
      duplicatesResult,
      "check:duplicates FAILED — stopping here. Remove intra-file duplicated code before proceeding."
    )
  )
    return 1;
  logPass("check:duplicates passed");

  if (targetDepth <= LIFECYCLE_ORDER.duplicates) {
    console.log(`\n${GREEN}✅ All checks for lifecycle "duplicates" passed.${NC}`);
    return 0;
  }

  // Step 6: codescene --file (file-level)
  const codesceneResult = checkCodescene(filePath);
  if (failOnResult(codesceneResult, "codescene FAILED — stopping here. Fix CodeScene health warnings.")) return 1;
  logPass("codescene passed");

  // All checks passed for this lifecycle
  console.log(`\n${GREEN}✅ All checks for lifecycle "${lifecycle}" passed for ${relPath}${NC}`);
  return 0;
}

// ─── Help ──────────────────────────────────────────────────────────────────

export function printHelp(): void {
  console.log(`
${CYAN}Sub-Loop — Per-File Progressive Quality Verification${NC}

${BOLD}Usage:${NC}
  bun run scripts/health/sub-loop.ts <file-path> --lifecycle <stage>

${BOLD}Lifecycle stages (controls depth of checks):${NC}
  tsgo          Only run tsgo (type checking)
  biome         Run tsgo, then oxlint, then biome:check
  lint          Run tsgo, oxlint, biome, then lint:type-aware via lint service
  duplicates    Run tsgo, oxlint, biome, lint:type-aware, then check:duplicates
  codescene     Run tsgo, oxlint, biome, lint:type-aware, check:duplicates, then codescene --file
  sonar-results Same as codescene (no sonar for subagents — EVER)

${BOLD}Check order (always strict, no skipping):${NC}
  1. tsgo (project-wide, filtered for this file)
  2. oxlint (file-level)
  3. biome:check (file-level)
  4. lint:type-aware via lint service (file-level)
  5. check:duplicates via jscpd (intra-file clones only)
  6. codescene --file (file-level)

${BOLD}Exit codes:${NC}
  0 = all checks up to lifecycle stage passed
  1 = stopped at a failing check (errors printed)
  2 = invalid arguments
`);
}
