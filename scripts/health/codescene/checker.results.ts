import fs from "node:fs";
import { join } from "node:path";
import { getCachedResult, removeCachedResult, saveResult } from "@/scripts/health/codescene/cache";
import { COLORS, logSuccess, PROJECT_ROOT } from "@/scripts/health/codescene/config";

const STATE_FILE = join(PROJECT_ROOT, ".quality-gate-state.json");

interface QualityState {
  stage: string;
  owner: string;
  lifecycle: string;
  lastRun: string;
}

function isQualityState(value: unknown): value is QualityState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    "stage" in value &&
    typeof value.stage === "string" &&
    "owner" in value &&
    typeof value.owner === "string" &&
    "lifecycle" in value &&
    typeof value.lifecycle === "string" &&
    "lastRun" in value &&
    typeof value.lastRun === "string"
  );
}

/** Hand quality-gate ownership back once CodeScene reports zero warnings/errors. */
export function updateQualityStateIfOwned(results: CheckResults) {
  if (results.warningCount === 0 && results.errorCount === 0 && fs.existsSync(STATE_FILE)) {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      if (!isQualityState(parsed)) {
        return;
      }
      const state = parsed;
      if (state.owner === "codescene") {
        state.owner = "quality-gate";
        state.stage = "CODESCENE";
        state.lifecycle = "NEED_CONFIRM";
        state.lastRun = new Date().toISOString();
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
        logSuccess("\n✅ Code health perfected. Ownership transferred back to quality-gate.");
        globalThis.console.log("ℹ️ Rerun 'bun quality-gate' to confirm perfect health.");
      }
    } catch {
      // Ignore state update errors
    }
  }
}

export interface CheckResults {
  perfectCount: number;
  warningCount: number;
  errorCount: number;
  cachedCount: number;
  warningFiles: string[];
  errorFiles: string[];
}

export function handleFileErrorResult(
  file: string,
  results: CheckResults,
  issues: string[],
  exitCode: number,
  output: string,
  _isLicenseError: boolean
): void {
  results.errorCount++;
  results.errorFiles.push(file);
  globalThis.console.log(`${COLORS.RED}❌ ${file}${COLORS.NC}`);

  if (issues.length > 0) {
    issues.forEach(i => {
      globalThis.console.log(`    ${i}`);
    });
  } else if (exitCode !== 0) {
    globalThis.console.log(`    Command failed with exit code ${exitCode}`);
    globalThis.console.log(`    Output: ${output.slice(0, 200)}${output.length > 200 ? "..." : ""}`);
  }
  removeCachedResult(file);
}

export function handleFileWarningResult(file: string, results: CheckResults, issues: string[]): void {
  results.warningCount++;
  results.warningFiles.push(file);
  globalThis.console.log(`${COLORS.YELLOW}⚠️  ${file}${COLORS.NC}`);
  issues.forEach(i => {
    globalThis.console.log(`    ${i}`);
  });
  saveResult(file, "warning", issues.join("\n"));
}

export function handleFilePerfectResult(file: string, results: CheckResults): void {
  results.perfectCount++;
  globalThis.console.log(`${COLORS.GREEN}✅ ${file}${COLORS.NC}`);
  saveResult(file, "perfect", "");
}

export function processCachedFile(file: string, results: CheckResults): void {
  const cached = getCachedResult(file);
  if (cached) {
    if (cached.status === "perfect") {
      results.perfectCount++;
    } else if (cached.status === "warning") {
      results.warningCount++;
      results.warningFiles.push(file);
      globalThis.console.log(`${COLORS.YELLOW}⚠️  ${file}${COLORS.NC}`);
      if (cached.details) globalThis.console.log(cached.details);
    } else if (cached.status === "error") {
      results.errorCount++;
      results.errorFiles.push(file);
      globalThis.console.log(`${COLORS.RED}❌ ${file}${COLORS.NC}`);
      if (cached.details) globalThis.console.log(cached.details);
    }
  }
  results.cachedCount++;
}

export function printSummary(results: CheckResults): void {
  const {
    perfectCount: perfect,
    warningCount: warning,
    errorCount: error,
    cachedCount: cached,
    warningFiles,
    errorFiles,
  } = results;

  globalThis.console.log("");
  globalThis.console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  globalThis.console.log("📈 Code Health Summary");
  globalThis.console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  globalThis.console.log(`${COLORS.GREEN}✅ Perfect health: ${perfect} files${COLORS.NC}`);
  globalThis.console.log(`${COLORS.YELLOW}⚠️  With warnings: ${warning} files${COLORS.NC}`);
  globalThis.console.log(`${COLORS.RED}❌ With errors: ${error} files${COLORS.NC}`);
  if (cached > 0) {
    globalThis.console.log(`${COLORS.BLUE}⚡ Cached results: ${cached} files${COLORS.NC}`);
  }
  globalThis.console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (warningFiles.length > 0) {
    globalThis.console.log(`\n${COLORS.YELLOW}Files with warnings:${COLORS.NC}`);
    warningFiles.forEach(f => {
      globalThis.console.log(`  - ${f}`);
    });
  }

  if (errorFiles.length > 0) {
    globalThis.console.log(`\n${COLORS.RED}Files with errors:${COLORS.NC}`);
    errorFiles.forEach(f => {
      globalThis.console.log(`  - ${f}`);
    });
  }

  if (warning > 0 || error > 0) {
    globalThis.console.log(
      `\n${COLORS.YELLOW}💡 Run 'bun run codescene --file <file>' for detailed analysis${COLORS.NC}`
    );
    globalThis.console.log(`${COLORS.YELLOW}💡 Run 'bun run codescene --scan --full' to force full check${COLORS.NC}`);
  }
}
