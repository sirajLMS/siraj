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

const STATE_FILE = join(process.cwd(), ".quality-gate-state.json");
const SONAR_MANAGER = "scripts/sonar-manager.ts";

type QualityStage = "BASIC_CHECKS" | "CODESCENE" | "SONAR_SCAN" | "SONAR_RESULTS";
type QualityLifecycle = "FRESH" | "NEED_CONFIRM" | "DONE";

interface QualityState {
  stage: QualityStage;
  owner: "quality-gate" | "codescene" | "sonar-manager";
  lifecycle: QualityLifecycle;
  lastRun: string;
}

const SONAR_INSTRUCTIONS = `
/**
 * AI AGENT PROMPT:
 * Use this script to manage Sonar results found in .scannerwork/sonar-result.json.
 * **Do NOT run a new Sonar analysis command.** Work ONLY with existing results.
 *
 * RESOLUTION ORDER:
 * 1. FIX DUPLICATIONS: Run \`bun scripts/sonar-manager.ts list-duplicates\`.
 * 2. FIX ISSUES: Once duplicates are empty, run \`bun scripts/sonar-manager.ts list-files\`.
 */
`;

const CODESCENE_INSTRUCTIONS = `
/**
 * CODESCENE REMEDIATION PROMPT:
 * CodeScene has identified code health warnings. Fix them before rerunning quality-gate.
 */
`;

async function runCommand(command: string, args: string[]): Promise<{ success: boolean; output: string }> {
  console.log(`\n> Running: ${command} ${args.join(" ")}`);

  return new Promise(resolve => {
    // eslint-disable-next-line sonarjs/os-command
    const child = spawn(command, args, { shell: true, stdio: ["inherit", "pipe", "pipe"] });
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

function getState(): QualityState {
  if (existsSync(STATE_FILE)) {
    try {
      const state = JSON.parse(readFileSync(STATE_FILE, "utf8")) as QualityState;
      if (!state.lifecycle) state.lifecycle = "FRESH";
      return state;
    } catch {
      return { stage: "BASIC_CHECKS", owner: "quality-gate", lifecycle: "FRESH", lastRun: new Date().toISOString() };
    }
  }
  return { stage: "BASIC_CHECKS", owner: "quality-gate", lifecycle: "FRESH", lastRun: new Date().toISOString() };
}

function saveState(stage: QualityStage, owner: QualityState["owner"], lifecycle: QualityLifecycle): void {
  writeFileSync(STATE_FILE, JSON.stringify({ stage, owner, lifecycle, lastRun: new Date().toISOString() }, null, 2));
}

function clearState(): void {
  if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
}

async function checkSonarResults(): Promise<boolean> {
  const duplicates = await runCommand("bun", [SONAR_MANAGER, "list-duplicates"]);
  const filesWithIssues = await runCommand("bun", [SONAR_MANAGER, "list-files"]);

  const hasDuplicates = !duplicates.output.includes("No duplications found");
  const hasIssues = !filesWithIssues.output.includes("No files with issues found");

  if (hasDuplicates || hasIssues) {
    console.warn("\n⚠️ SonarQube quality gate failed.");
    console.log("\x1b[35m%s\x1b[0m", SONAR_INSTRUCTIONS);
    return false;
  }

  console.log("✅ Sonar results are clean.");
  return true;
}

async function performStage(stage: QualityStage): Promise<boolean> {
  switch (stage) {
    case "BASIC_CHECKS": {
      const tsgo = await runCommand("bun", ["tsgo"]);
      const biome = await runCommand("bun", ["biome:check"]);
      const lint = await runCommand("bun", ["lint"]);
      return tsgo.success && biome.success && lint.success;
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
    case "SONAR_SCAN": {
      console.log("\n📡 Running SonarQube Scan...");
      const scan = await runCommand("bun", ["sonar-scan"]);
      return scan.success;
    }
    case "SONAR_RESULTS": {
      return await checkSonarResults();
    }
  }
}

const STAGES: QualityStage[] = ["BASIC_CHECKS", "CODESCENE", "SONAR_SCAN", "SONAR_RESULTS"];

async function recoverOwnership(state: QualityState): Promise<void> {
  console.log(`\n🔍 Checking if "${state.owner}" issues are resolved...`);
  let resolved = false;

  if (state.owner === "codescene") {
    const check = await runCommand("bun", ["codescene"]);
    if (check.success) resolved = true;
  } else if (state.owner === "sonar-manager") {
    // Check if results exist first
    const sonarResultPath = join(process.cwd(), ".scannerwork", "sonar-result.json");
    if (!existsSync(sonarResultPath)) {
      console.log("ℹ️ No Sonar results found. Forcing a re-scan...");
      state.stage = "SONAR_SCAN";
      resolved = true;
    } else if (await checkSonarResults()) {
      resolved = true;
    } else {
      console.log(
        "ℹ️ Sonar issues still present. If you have applied fixes, you can run 'bun quality-gate --fresh' to force a re-scan."
      );
    }
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
  for (let i = startIndex; i < STAGES.length; i++) {
    const currentStage = STAGES[i];
    saveState(currentStage, "quality-gate", lifecycle);

    const success = await performStage(currentStage);
    if (!success) {
      let owner: QualityState["owner"] = "quality-gate";
      if (currentStage === "CODESCENE") owner = "codescene";
      if (currentStage === "SONAR_RESULTS" || currentStage === "SONAR_SCAN") owner = "sonar-manager";

      saveState(currentStage, owner, "NEED_CONFIRM");
      console.error(`\n❌ Stage ${currentStage} failed. Fix the issues and rerun.`);
      process.exit(1);
    }
  }
}

async function runQualityGate(): Promise<void> {
  const isFresh = process.argv.includes("--fresh");
  if (isFresh) {
    console.log("🧹 Fresh start requested. Clearing state and stale results...");
    clearState();
    if (existsSync(join(process.cwd(), ".scannerwork", "sonar-result.json"))) {
      unlinkSync(join(process.cwd(), ".scannerwork", "sonar-result.json"));
    }
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
  await runQualityGate();
  if (timeoutId) clearTimeout(timeoutId);
  process.exit(0);
} catch (err: unknown) {
  if (timeoutId) clearTimeout(timeoutId);
  console.error(err);
  process.exit(1);
}
