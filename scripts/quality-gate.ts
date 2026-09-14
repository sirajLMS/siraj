// cspell:disable
/**
 * QUALITY GATE AUTOMATION SCRIPT
 *
 * This script automates the project's quality assurance loop with stage persistence.
 * It runs sequential checks and saves progress to resume from the last failed stage.
 */

import { spawn } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withProcessLock } from "@/scripts/lib/process-lock";

const STATE_FILE = join(process.cwd(), ".quality-gate-state.json");

type QualityStage = "BASIC_CHECKS" | "DUPLICATES" | "UNUSED" | "CODESCENE";
type QualityLifecycle = "FRESH" | "NEED_CONFIRM" | "DONE";

interface QualityState {
  stage: QualityStage;
  owner: "quality-gate" | "duplicates" | "unused" | "codescene";
  lifecycle: QualityLifecycle;
  lastRun: string;
}

const DUPLICATES_INSTRUCTIONS = `
/**
 * DUPLICATES REMEDIATION PROMPT:
 * jscpd has detected code duplication (cross-file clones).
 *
 * Fix options:
 *   1. Extract a shared scaffold — see docs/frontend/ui-shared-scaffold-pattern.md
 *   2. Extract a shared utility — see docs/frontend/duplication-elimination-patterns.md
 *   3. If the duplication is intentional (e.g. Drizzle schema column helpers,
 *      shared/locale ar/en i18n parallel translations, thin passthrough wrappers),
 *      remove the clone by restructuring, NOT by adding jscpd:ignore comments.
 *
 * Hard rules:
 *   - NEVER add jscpd:ignore comments — fix the root cause instead.
 *   - NEVER modify .jscpd.json configuration.
 *   - Zero jscpd:ignore and zero .jscpd.json changes is enforced across all phases.
 *
 * After fixing, rerun: bun quality-gate
 */
`;

const CODESCENE_INSTRUCTIONS = `
/**
 * CODESCENE REMEDIATION PROMPT:
 * CodeScene has identified code health warnings. Fix them before rerunning quality-gate.
 */
`;

const UNUSED_INSTRUCTIONS = `
/**
 * UNUSED CODE REMEDIATION PROMPT:
 * knip (check:unused) detected unused code, unused dependencies, or configuration hints.
 * Hints are treated as errors (exit 1) — the gate must pass with zero knip findings.
 *
 * Fix options:
 *   1. Unused files — delete the file, or add knip entry/ignore coverage if the file is
 *      loaded by side effect (see existing entry/ignore comment blocks in knip.config.ts).
 *   2. Unused exports / exported types — delete them, or wire them back into a consumer.
 *      For tooling scripts, verify the symbol isn't invoked via "bun run" before deleting.
 *   3. Unused/unlisted dependencies — remove from package.json, or move to the correct
 *      dependency group (e.g. devDependencies) if a tool loads it at runtime.
 *   4. Duplicate exports — a symbol is exported from two modules; keep one canonical
 *      source and re-export through the barrel.
 *   5. Configuration hints (".mdx excluded by project", stale entry/ignore patterns) —
 *      update knip.config.ts to match reality. Adding an ignore that hides real
 *      findings is not a fix.
 *
 * Deep-dive tooling (optional):
 *   bun run scripts/unused/knip-categorize.ts   # categorized JSON report into .unused/
 *   bun run scripts/unused/knip-analyze.ts      # analysis insights from that report
 *
 * Hard rules:
 *   - NEVER add knip.config.ts ignore/entry entries just to silence findings — ignores
 *     must only cover genuine analysis blind spots (side-effect imports, dynamic string
 *     imports, tool-loaded files), each with a comment explaining why it exists.
 *   - Fix the code first; treat knip.config.ts changes as the documented exception.
 *
 * After fixing, rerun: bun quality-gate
 */
`;

async function runCommand(command: string, args: string[]): Promise<{ success: boolean; output: string }> {
  console.log(`\n> Running: ${command} ${args.join(" ")}`);

  return new Promise(resolve => {
    const child = spawn(command, args, { shell: false, stdio: ["inherit", "pipe", "pipe"] });
    let output = "";

    child.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      process.stdout.write(chunk);
    });

    child.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      process.stderr.write(chunk);
    });

    child.on("close", code => {
      resolve({ success: code === 0, output });
    });

    child.on("error", err => {
      resolve({ success: false, output: err.message });
    });
  });
}

function isQualityState(val: unknown): val is QualityState {
  return typeof val === "object" && val !== null;
}

function getState(): QualityState {
  if (existsSync(STATE_FILE)) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(STATE_FILE, "utf8"));
      if (isQualityState(parsed)) {
        if (!parsed.lifecycle) parsed.lifecycle = "FRESH";
        return parsed;
      }
    } catch {
      return { stage: "BASIC_CHECKS", owner: "quality-gate", lifecycle: "FRESH", lastRun: new Date().toISOString() };
    }
  }
  return { stage: "BASIC_CHECKS", owner: "quality-gate", lifecycle: "FRESH", lastRun: new Date().toISOString() };
}

function saveState(stage: QualityStage, owner: QualityState["owner"], lifecycle: QualityLifecycle): void {
  writeFileSync(STATE_FILE, JSON.stringify({ stage, owner, lifecycle, lastRun: new Date().toISOString() }, null, 2));
}

/** Clear the quality-gate state file ONLY. Never clear any cache files. */
function clearState(): void {
  if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
}

async function performStage(stage: QualityStage): Promise<boolean> {
  switch (stage) {
    case "BASIC_CHECKS": {
      const tsgo = await runCommand("bun", ["tsgo"]);
      if (!tsgo.success) return false;
      const oxlint = await runCommand("bun", ["oxlint"]);
      if (!oxlint.success) return false;
      const biome = await runCommand("bun", ["biome:check"]);
      if (!biome.success) return false;
      const lint = await runCommand("bun", ["lint:type-aware"]);
      return lint.success;
    }
    case "DUPLICATES": {
      const check = await runCommand("bun", ["check:duplicates"]);
      if (!check.success) {
        console.warn("⚠️ Code duplication (cross-file clones) detected by jscpd.");
        console.log("\x1b[36m%s\x1b[0m", DUPLICATES_INSTRUCTIONS);
        return false;
      }
      return true;
    }
    case "UNUSED": {
      const check = await runCommand("bun", ["check:unused"]);
      if (!check.success) {
        console.warn("⚠️ Unused code/dependencies or knip configuration hints detected (check:unused).");
        console.log("\x1b[36m%s\x1b[0m", UNUSED_INSTRUCTIONS);
        return false;
      }
      return true;
    }
    case "CODESCENE": {
      const check = await runCommand("bun", ["codescene"]);
      if (!check.success) {
        console.warn("⚠️ CodeScene Health Warnings detected.");
        console.log("\x1b[36m%s\x1b[0m", CODESCENE_INSTRUCTIONS);
        return false;
      }
      return true;
    }
  }
  throw new Error(`Unhandled case in performStage`);
}

const STAGES: QualityStage[] = ["BASIC_CHECKS", "DUPLICATES", "UNUSED", "CODESCENE"];

async function recoverOwnership(state: QualityState): Promise<void> {
  console.log(`\n🔍 Checking if "${state.owner}" issues are resolved...`);
  let resolved = false;

  if (state.owner === "duplicates") {
    const check = await runCommand("bun", ["check:duplicates"]);
    if (check.success) resolved = true;
  }

  if (state.owner === "unused") {
    const check = await runCommand("bun", ["check:unused"]);
    if (check.success) resolved = true;
  }

  if (state.owner === "codescene") {
    const check = await runCommand("bun", ["codescene"]);
    if (check.success) resolved = true;
  }

  if (resolved) {
    console.log(`✅ Recovery check passed. Reclaiming ownership for "quality-gate".`);
    state.owner = "quality-gate";
    saveState(state.stage, "quality-gate", "NEED_CONFIRM");
  } else {
    console.error(`\n🛑 State is still owned by "${state.owner}". Resolve issues in that tool first.`);
    process.exit(1);
  }
}

async function executeStages(startIndex: number, lifecycle: QualityLifecycle): Promise<void> {
  async function executeFromIndex(index: number): Promise<void> {
    if (index >= STAGES.length) return;

    const currentStage = STAGES[index];
    saveState(currentStage, "quality-gate", lifecycle);

    const success = await performStage(currentStage);
    if (!success) {
      let owner: QualityState["owner"] = "quality-gate";
      if (currentStage === "DUPLICATES") owner = "duplicates";
      if (currentStage === "UNUSED") owner = "unused";
      if (currentStage === "CODESCENE") owner = "codescene";

      saveState(currentStage, owner, "NEED_CONFIRM");
      console.error(`\n❌ Stage ${currentStage} failed. Fix the issues and rerun.`);
      process.exit(1);
    }

    return executeFromIndex(index + 1);
  }

  await executeFromIndex(startIndex);
}

async function runQualityGate(): Promise<void> {
  const isFresh = process.argv.includes("--fresh");
  if (isFresh) {
    console.log("🧹 Fresh start requested. Clearing state (caches are preserved)...");
    clearState();
  }

  let state = getState();

  if (state.lifecycle === "DONE" && !isFresh) {
    console.log("🔄 Quality gate was previously DONE. Starting a new FRESH round...");
    state = { stage: "BASIC_CHECKS", owner: "quality-gate", lifecycle: "FRESH", lastRun: new Date().toISOString() };
    saveState("BASIC_CHECKS", "quality-gate", "FRESH");
  }

  console.log(`🚀 Quality Gate: Stage=${state.stage}, Owner=${state.owner}, Lifecycle=${state.lifecycle}`);

  if (state.owner !== "quality-gate") {
    await recoverOwnership(state);
  }

  const startIndex = STAGES.indexOf(state.stage);
  await executeStages(startIndex, state.lifecycle);

  saveState("BASIC_CHECKS", "quality-gate", "DONE");
  console.log("\n✨✨ ALL QUALITY GATES PASSED! ✨✨");
  console.log("Lifecycle state: DONE (Empirically verified)");
}
// Timeout logic
const timeoutArg = process.argv.find(arg => arg.startsWith("--timeout="));
const timeoutMs = timeoutArg ? Number.parseInt(timeoutArg.split("=")[1], 10) : 0;

let timeoutId: NodeJS.Timeout | undefined;
if (timeoutMs > 0) {
  timeoutId = setTimeout(() => {
    console.error(`\n🛑 Quality gate timed out after ${timeoutMs}ms.`);
    process.exit(1);
  }, timeoutMs);
}

try {
  await withProcessLock("quality-gate", async () => {
    await runQualityGate();
  });
  if (timeoutId) clearTimeout(timeoutId);
  process.exit(0);
} catch (err: unknown) {
  if (timeoutId) clearTimeout(timeoutId);
  console.error(err);
  process.exit(1);
}
