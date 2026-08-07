/**
 * SUB-LOOP — Per-File Progressive Quality Verification Script
 *
 * This script is called by subagents dispatched by the quality-gate skill. It runs a progressive
 * quality loop on a single file, checking in strict order:
 *
 *   tsgo → biome:check → oxlint → lint:type-aware (via lint service) → codescene --file
 *
 * It SHORT-CIRCUITS at the first failing check — stops and prints the errors for the subagent
 * to fix. The subagent fixes the errors and re-runs this script until it passes all checks.
 *
 * ⚠️  CRITICAL: SonarQube scan is VERY COSTLY to run.
 *    This script NEVER runs `bun sonar-scan` or `bun scripts/sonar-manager.ts`.
 *    Subagents must NEVER run sonar. Only the quality-gate orchestrator handles sonar stages.
 *    This exclusion is HARDCODED — there is no flag to enable it. Do not add one.
 *
 * Usage:
 *   bun run scripts/health/sub-loop.ts <file-path> --lifecycle <stage>
 *
 * Lifecycle stages (controls how deep the loop goes):
 *   tsgo          → only run tsgo (type checking only)
 *   biome         → run tsgo, then biome:check (stop if tsgo fails)
 *   lint          → run tsgo, biome, oxlint, then lint:type-aware via lint service (stop if earlier check fails)
 *   codescene     → run tsgo, biome, oxlint, lint:type-aware, then codescene --file (stop if earlier check fails)
 *   sonar-results → same as codescene (subagents verify file is clean before orchestrator handles sonar)
 *
 * Exit codes:
 *   0 = all checks up to the lifecycle stage passed
 *   1 = stopped at a failing check (errors printed to stdout/stderr)
 *   2 = invalid arguments
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { type LintResult, requestLint } from "@/scripts/lint-service";

// ─── Types ──────────────────────────────────────────────────────────────────

type Lifecycle = "tsgo" | "biome" | "lint" | "codescene" | "sonar-results";

interface CheckResult {
  name: string;
  passed: boolean;
  output: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const PROJECT_ROOT = process.cwd();

const LIFECYCLE_ORDER: Record<Lifecycle, number> = {
  tsgo: 0,
  biome: 1,
  lint: 2,
  codescene: 3,
  "sonar-results": 3, // same depth as codescene — no sonar for subagents
};

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const NC = "\x1b[0m";

// ─── Instruction & AGENTS.md Discovery ──────────────────────────────────────

/**
 * Map a file path to the applicable `.github/instructions/*.instructions.md` file(s).
 * Multiple instruction files can apply (e.g., a backend test file needs both
 * `backend.instructions.md` and `tests.instructions.md`).
 */
function getInstructionFiles(filePath: string): string[] {
  const instructions: string[] = [];
  const normalized = filePath.replace(/\\/g, "/");

  // Test files → tests.instructions.md
  if (
    /\.test\.tsx?$/.exec(normalized) ||
    /\.spec\.tsx?$/.exec(normalized) ||
    normalized.includes("scripts/run-test/")
  ) {
    instructions.push(".github/instructions/tests.instructions.md");
  }

  // Frontend files → frontend.instructions.md
  if (normalized.startsWith("frontend/") || normalized.startsWith("app/")) {
    instructions.push(".github/instructions/frontend.instructions.md");
  }

  // Backend files → backend.instructions.md
  if (normalized.startsWith("backend/")) {
    instructions.push(".github/instructions/backend.instructions.md");
  }

  // De-duplicate (e.g., a backend test file gets both backend + tests instructions)
  return [...new Set(instructions)];
}

/**
 * Map a file path to the applicable layer-specific `AGENTS.md` file(s).
 * Returns the paths to ALL matching AGENTS.md files (a file may match multiple layers).
 */
function getAgentsMdFiles(filePath: string): string[] {
  const agentsFiles: string[] = [];
  const normalized = filePath.replace(/\\/g, "/");

  const layerMap: Array<[string, string]> = [
    ["app/", "app/AGENTS.md"],
    ["frontend/views/", "frontend/views/AGENTS.md"],
    ["frontend/stores/", "frontend/stores/AGENTS.md"],
    ["frontend/common/graphql/sharedDocuments/", "frontend/common/graphql/sharedDocuments/AGENTS.md"],
    ["frontend/common/graphql/test/", "frontend/common/graphql/test/AGENTS.md"],
    ["frontend/common/graphql/", "frontend/common/graphql/AGENTS.md"],
    ["frontend/", "frontend/AGENTS.md"],
    ["backend/services/", "backend/services/AGENTS.md"],
    ["backend/graphql/", "backend/graphql/AGENTS.md"],
    ["backend/db/repo/", "backend/db/repo/AGENTS.md"],
    ["backend/db/seeds/", "backend/db/seeds/AGENTS.md"],
    ["backend/db/test/", "backend/db/test/AGENTS.md"],
    ["backend/types/", "backend/types/AGENTS.md"],
    ["backend/", "backend/AGENTS.md"],
    ["scripts/run-test/", "scripts/run-test/AGENTS.md"],
  ];

  // Always include root AGENTS.md
  agentsFiles.push("AGENTS.md");

  for (const [prefix, agentsPath] of layerMap) {
    if (normalized.startsWith(prefix)) {
      agentsFiles.push(agentsPath);
    }
  }

  return [...new Set(agentsFiles)];
}

/**
 * Print the instruction files and AGENTS.md files that apply to the target file.
 * This tells the subagent exactly which rule files to read before fixing.
 */
function printApplicableRuleFiles(filePath: string): void {
  const instructionFiles = getInstructionFiles(filePath);
  const agentsMdFiles = getAgentsMdFiles(filePath);

  console.log(`${BOLD}━━━ Applicable Rule Files ━━━${NC}`);
  console.log("");

  if (instructionFiles.length > 0) {
    console.log(`${CYAN}Instruction files (read before fixing):${NC}`);
    for (const f of instructionFiles) {
      const exists = existsSync(resolve(PROJECT_ROOT, f));
      const mark = exists ? `${GREEN}✓${NC}` : `${YELLOW}⚠${NC}`;
      console.log(`  ${mark}  ${f}`);
    }
  } else {
    console.log(`${YELLOW}⚠  No applicable instruction files found for this file.${NC}`);
  }

  console.log("");
  console.log(`${CYAN}AGENTS.md files (read before fixing):${NC}`);
  for (const f of agentsMdFiles) {
    const exists = existsSync(resolve(PROJECT_ROOT, f));
    const mark = exists ? `${GREEN}✓${NC}` : `${YELLOW}⚠${NC}`;
    console.log(`  ${mark}  ${f}`);
  }

  console.log("");
  console.log(`${BOLD}Fix-Or-Report Rule:${NC}`);
  console.log(`  • If a rule violation can be fixed within THIS file: fix it.`);
  console.log(`  • If fixing requires modifying ANOTHER file: do NOT modify that file.`);
  console.log(`    Report the cross-file dependency to the orchestrator instead.`);
  console.log("");
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function logInfo(msg: string): void {
  console.log(`${CYAN}ℹ${NC}  ${msg}`);
}

function logPass(msg: string): void {
  console.log(`${GREEN}✅${NC} ${msg}`);
}

function logFail(msg: string): void {
  console.error(`${RED}❌${NC} ${BOLD}${msg}${NC}`);
}

/**
 * Run a command synchronously and capture its output.
 */
function runCommand(command: string, args: string[]): CheckResult {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    cwd: PROJECT_ROOT,
    stdio: ["pipe", "pipe", "pipe"],
  });

  const output = (result.stdout || "") + (result.stderr || "");
  return {
    name: `${command} ${args.join(" ")}`,
    passed: result.status === 0,
    output,
  };
}

/**
 * Submit a lint request to the in-process lint service.
 */
async function lintViaQueue(filePath: string): Promise<CheckResult> {
  const relPath = relative(PROJECT_ROOT, resolve(PROJECT_ROOT, filePath));
  try {
    const r: LintResult = await requestLint("sub-loop", [relPath], { typeAware: true });
    return { name: "lint:type-aware", passed: r.success, output: r.output };
  } catch (err) {
    return {
      name: "lint:type-aware",
      passed: false,
      output: `In-process lint service (type-aware) failed: ${(err as Error).message}`,
    };
  }
}

/**
 * Check if a line mentions the target file.
 */
function lineMentionsFile(line: string, relPath: string, filePath: string): boolean {
  return line.includes(relPath) || line.includes(filePath);
}

/**
 * Collect an error block: the header line plus subsequent continuation lines.
 */
function collectErrorBlock(lines: string[], startIndex: number, errorBlockRegex: RegExp): string[] {
  const block: string[] = [lines[startIndex]];
  for (let j = startIndex + 1; j < lines.length; j++) {
    if (errorBlockRegex.exec(lines[j]) || lines[j].trim() === "") break;
    block.push(lines[j]);
  }
  return block;
}

/**
 * Filter tsgo output for lines mentioning the target file.
 * tsgo runs project-wide, so we need to extract only relevant errors.
 */
function filterTsgoForFile(tsgoOutput: string, filePath: string): string {
  const relPath = relative(PROJECT_ROOT, resolve(PROJECT_ROOT, filePath));
  const lines = tsgoOutput.split("\n");
  const matchingLines: string[] = [];
  const errorBlockRegex = /^(.+\.t sx?)\(\d+,\d+\):/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isErrorBlock = errorBlockRegex.exec(line);

    if (isErrorBlock && lineMentionsFile(line, relPath, filePath)) {
      matchingLines.push(...collectErrorBlock(lines, i, errorBlockRegex));
    } else if (!isErrorBlock && lineMentionsFile(line, relPath, filePath)) {
      matchingLines.push(line);
    }
  }

  return matchingLines.length > 0 ? matchingLines.join("\n") : "";
}

// ─── Checks ────────────────────────────────────────────────────────────────

function checkTsgo(filePath: string): CheckResult {
  logInfo(`Running tsgo (project-wide, filtering for ${filePath})...`);
  const result = runCommand("bun", ["tsgo"]);

  if (result.passed) {
    return { name: "tsgo", passed: true, output: "" };
  }

  const relevantErrors = filterTsgoForFile(result.output, filePath);
  if (relevantErrors) {
    return { name: "tsgo", passed: false, output: relevantErrors };
  }

  // tsgo had errors but none for THIS file — pass for this file
  return { name: "tsgo", passed: true, output: "" };
}

function checkBiome(filePath: string): CheckResult {
  const relPath = relative(PROJECT_ROOT, resolve(PROJECT_ROOT, filePath));
  logInfo(`Running biome:check on ${relPath}...`);
  // Run biome directly on the file, not via package.json script (which checks all files)
  const result = runCommand("bunx", ["@biomejs/biome", "check", "--write", "--unsafe", relPath]);
  return { name: "biome:check", passed: result.passed, output: result.output };
}

function checkOxlint(filePath: string): CheckResult {
  const relPath = relative(PROJECT_ROOT, resolve(PROJECT_ROOT, filePath));
  logInfo(`Running oxlint on ${relPath}...`);
  const result = runCommand("bun", ["oxlint", relPath]);
  return { name: "oxlint", passed: result.passed, output: result.output };
}

async function checkLint(filePath: string): Promise<CheckResult> {
  logInfo(`Submitting lint:type-aware via in-process service for ${filePath}...`);
  const result = await lintViaQueue(filePath);
  return result;
}

function checkCodescene(filePath: string): CheckResult {
  const relPath = relative(PROJECT_ROOT, resolve(PROJECT_ROOT, filePath));
  logInfo(`Running codescene --file ${relPath}...`);
  const result = runCommand("bun", ["codescene", "--file", relPath]);
  return { name: "codescene --file", passed: result.passed, output: result.output };
}

// ─── Argument Parsing ──────────────────────────────────────────────────────

interface ParsedArgs {
  filePath: string | null;
  lifecycle: Lifecycle | null;
}

function parseArgs(args: string[]): ParsedArgs {
  let filePath: string | null = null;
  let lifecycle: Lifecycle | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lifecycle") {
      lifecycle = args[i + 1] as Lifecycle;
      i++;
    } else if (!args[i].startsWith("--")) {
      filePath = args[i];
    }
  }

  return { filePath, lifecycle };
}

// ─── Validation ────────────────────────────────────────────────────────────

function validateArgs(filePath: string | null, lifecycle: Lifecycle | null): void {
  if (!filePath) {
    logFail("Missing <file-path> argument.");
    console.error("Usage: bun run scripts/health/sub-loop.ts <file-path> --lifecycle <stage>");
    process.exit(2);
  }

  const validLifecycles: Lifecycle[] = ["tsgo", "biome", "lint", "codescene", "sonar-results"];
  if (!lifecycle || !validLifecycles.includes(lifecycle)) {
    logFail(`Invalid or missing --lifecycle argument.`);
    console.error(`Valid stages: ${validLifecycles.join(", ")}`);
    process.exit(2);
  }

  const absPath = resolve(PROJECT_ROOT, filePath);
  if (!existsSync(absPath)) {
    logFail(`File not found: ${filePath}`);
    process.exit(2);
  }
}

// ─── Progressive Check Runner ───────────────────────────────────────────────

function failOnResult(result: CheckResult, failMsg: string): void {
  if (!result.passed) {
    logFail(failMsg);
    console.log("\n" + result.output);
    process.exit(1);
  }
}

async function runProgressiveChecks(
  filePath: string,
  relPath: string,
  lifecycle: Lifecycle,
  targetDepth: number
): Promise<void> {
  // Step 1: tsgo (always runs first, project-wide, filtered for this file)
  const tsgoResult = checkTsgo(filePath);
  failOnResult(tsgoResult, "tsgo FAILED — stopping here. Fix type errors before proceeding.");
  logPass(`tsgo passed (no errors for ${relPath})`);

  if (targetDepth <= LIFECYCLE_ORDER.tsgo) {
    console.log(`\n${GREEN}✅ All checks for lifecycle "tsgo" passed.${NC}`);
    process.exit(0);
  }

  // Step 2: biome:check (file-level)
  const biomeResult = checkBiome(filePath);
  failOnResult(biomeResult, "biome:check FAILED — stopping here. Fix formatting/biome issues before proceeding.");
  logPass("biome:check passed");

  if (targetDepth <= LIFECYCLE_ORDER.biome) {
    console.log(`\n${GREEN}✅ All checks for lifecycle "biome" passed.${NC}`);
    process.exit(0);
  }

  // Step 3: oxlint (file-level)
  const oxlintResult = checkOxlint(filePath);
  failOnResult(oxlintResult, "oxlint FAILED — stopping here. Fix oxlint errors before proceeding.");
  logPass("oxlint passed");

  // Step 4: lint:type-aware via lint service (file-level)
  const lintResult = await checkLint(filePath);
  failOnResult(lintResult, "lint:type-aware FAILED — stopping here. Fix lint errors before proceeding.");
  logPass("lint:type-aware passed");

  if (targetDepth <= LIFECYCLE_ORDER.lint) {
    console.log(`\n${GREEN}✅ All checks for lifecycle "lint" passed.${NC}`);
    process.exit(0);
  }

  // Step 5: codescene --file (file-level)
  const codesceneResult = checkCodescene(filePath);
  failOnResult(codesceneResult, "codescene FAILED — stopping here. Fix CodeScene health warnings.");
  logPass("codescene passed");

  // All checks passed for this lifecycle
  console.log(`\n${GREEN}✅ All checks for lifecycle "${lifecycle}" passed for ${relPath}${NC}`);
  process.exit(0);
}

// ─── Main ──────────────────────────────────────────────────────────────────

function printHelp(): void {
  console.log(`
${CYAN}Sub-Loop — Per-File Progressive Quality Verification${NC}

${BOLD}Usage:${NC}
  bun run scripts/health/sub-loop.ts <file-path> --lifecycle <stage>

${BOLD}Lifecycle stages (controls depth of checks):${NC}
  tsgo          Only run tsgo (type checking)
  biome         Run tsgo, then biome:check
  lint          Run tsgo, biome, oxlint, then lint:type-aware via lint service
  codescene     Run tsgo, biome, oxlint, lint:type-aware, then codescene --file
  sonar-results Same as codescene (no sonar for subagents — EVER)

${BOLD}Check order (always strict, no skipping):${NC}
  1. tsgo (project-wide, filtered for this file)
  2. biome:check (file-level)
  3. oxlint (file-level)
  4. lint:type-aware via lint service (file-level)
  5. codescene --file (file-level)

${BOLD}Exit codes:${NC}
  0 = all checks up to lifecycle stage passed
  1 = stopped at a failing check (errors printed)
  2 = invalid arguments

${BOLD}⚠️  IMPORTANT:${NC} This script NEVER runs sonar-scan or sonar-manager.
   SonarQube scan is very costly. Only the quality-gate orchestrator runs it.
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const { filePath, lifecycle } = parseArgs(args);
  validateArgs(filePath, lifecycle);

  // After validation, both are guaranteed non-null
  const filePathSafe = filePath as string;
  const lifecycleSafe = lifecycle as Lifecycle;

  const absPath = resolve(PROJECT_ROOT, filePathSafe);
  const relPath = relative(PROJECT_ROOT, absPath);
  const targetDepth = LIFECYCLE_ORDER[lifecycleSafe];

  logInfo(`File: ${relPath}`);
  logInfo(`Lifecycle: ${lifecycleSafe} (depth: ${targetDepth})`);
  console.log("");

  printApplicableRuleFiles(filePathSafe);

  await runProgressiveChecks(filePathSafe, relPath, lifecycleSafe, targetDepth);
}

void main();
