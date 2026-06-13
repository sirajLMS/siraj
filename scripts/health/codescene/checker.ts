import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { join, relative } from "node:path";
import { glob } from "glob";
import { ensureCacheDir, getCachedMtime, getCachedResult, getFileMtime, saveResult, updateCachedMtime } from "./cache";
import { COLORS, logError, logInfo, logSuccess, PROJECT_ROOT, resolveCodesceneBin } from "./config";

interface CheckResults {
  perfectCount: number;
  warningCount: number;
  errorCount: number;
  cachedCount: number;
  warningFiles: string[];
  errorFiles: string[];
}

function getTsConfigIgnores(): string[] {
  try {
    const tsConfigPath = join(PROJECT_ROOT, "tsconfig.json");
    if (fs.existsSync(tsConfigPath)) {
      const content = fs.readFileSync(tsConfigPath, "utf8");
      // Extract exclude array using regex to bypass JSON strictness (comments, trailing commas)
      const regex = /"exclude"\s*:\s*\[(.*?)\]/s;
      const excludeMatch = regex.exec(content);
      if (excludeMatch?.[1]) {
        const excludeItems = excludeMatch[1]
          .split(",")
          .map(item => item.replace(/["'\s]/g, ""))
          .filter(Boolean);
        return excludeItems.map((e: string) => `**/${e}/**`);
      }
    }
  } catch (error) {
    logError(`Failed to parse tsconfig.json: ${error}`);
  }
  return [];
}

export function checkSingleFile(filePath: string): void {
  const absolutePath =
    filePath.startsWith("/") || /^[A-Za-z]:\\/.test(filePath) ? filePath : join(PROJECT_ROOT, filePath);
  // Ensure we use relative path for CodeScene matching
  const relPath = relative(PROJECT_ROOT, absolutePath);

  const csBin = resolveCodesceneBin();
  const result = spawnSync(csBin, ["check", relPath], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    env: process.env,
  });
  const output = (result.stdout || "") + (result.stderr || "");
  globalThis.console.log(output);

  if (result.error) {
    logError(`Failed to run CodeScene CLI: ${result.error.message}`);
    process.exit(1);
  }

  const issues = output
    .split("\n")
    .map(l => l.trim())
    .filter(line => {
      if (/info:.*Code health score:/i.test(line)) return false;
      return /^(warn|error|info|arn|err|nfo):/i.test(line) || /License check failed|unauthorized/i.test(line);
    });

  const hasError = result.status !== 0 || issues.some(i => /^(error|err|license|unauthorized)/i.test(i));
  const hasWarning = issues.some(i => /^(warn|arn|info|nfo)/i.test(i));

  if (hasError) {
    logError(`${relPath}: errors found`);
    process.exit(1);
  } else if (hasWarning) {
    globalThis.console.log(`${COLORS.YELLOW}⚠️  ${relPath}: warnings found${COLORS.NC}`);
    process.exit(1);
  } else {
    logSuccess(`${relPath}: perfect health ✨`);
  }
}

export async function runHealthCheck(forceFull = false): Promise<void> {
  ensureCacheDir();

  const tsConfigIgnores = getTsConfigIgnores();
  const baseIgnores = ["**/node_modules/**", "**/dist/**", "**/.next/**"];
  const allIgnores = [...new Set([...baseIgnores, ...tsConfigIgnores])];

  logInfo("Finding all TypeScript files...");
  const files = await glob("**/*.{ts,tsx}", {
    cwd: PROJECT_ROOT,
    ignore: allIgnores,
  });

  if (files.length === 0) {
    logError("No TypeScript files found");
    return;
  }

  logInfo(`📊 Found ${files.length} TypeScript files`);

  const filesToCheck = files.filter(file => {
    if (forceFull) return true;
    const currentMtime = getFileMtime(join(PROJECT_ROOT, file));
    const cachedMtime = getCachedMtime(file);
    return currentMtime !== cachedMtime;
  });

  if (filesToCheck.length === 0) {
    logSuccess("✨ All files are up to date (no changes detected)");
  } else {
    logInfo(`🔄 Checking ${filesToCheck.length} changed file(s)`);
    logInfo(`⚡ Skipping ${files.length - filesToCheck.length} unchanged file(s)`);
  }

  const results: CheckResults = {
    perfectCount: 0,
    warningCount: 0,
    errorCount: 0,
    cachedCount: 0,
    warningFiles: [],
    errorFiles: [],
  };

  for (const file of files) {
    const isChanged = filesToCheck.includes(file);
    if (isChanged) {
      processChangedFile(file, results);
    } else {
      processCachedFile(file, results);
    }
  }

  printSummary(results);

  if (results.errorCount > 0 || results.warningCount > 0) {
    process.exit(1);
  }
}

function processChangedFile(file: string, results: CheckResults): void {
  const filePath = join(PROJECT_ROOT, file);
  const csBin = resolveCodesceneBin();
  const result = spawnSync(csBin, ["check", file], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    env: process.env,
  });
  const output = (result.stdout || "") + (result.stderr || "");


  if (result.error) {
    results.errorCount++;
    results.errorFiles.push(file);
    globalThis.console.log(`${COLORS.RED}❌ ${file}${COLORS.NC}`);
    globalThis.console.log(`    Failed to run CodeScene CLI: ${result.error.message}`);
    saveResult(file, "error", result.error.message);
    return;
  }

  const lines = output
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  // Filter for actual issues, ignoring the informational "Code health score" lines
  const issues = lines.filter(line => {
    const isScoreLine = /info:.*Code health score:/i.test(line);
    if (isScoreLine) return false;
    return (
      /^(warn|error|info|arn|err|nfo):/i.test(line) ||
      line.includes("License check failed") ||
      line.includes("unauthorized")
    );
  });

  const hasError = result.status !== 0 || issues.some(i => /^(error|err|license|unauthorized)/i.test(i));
  const hasWarning = issues.some(i => /^(warn|arn|info|nfo)/i.test(i));

  if (hasError) {
    results.errorCount++;
    results.errorFiles.push(file);
    globalThis.console.log(`${COLORS.RED}❌ ${file}${COLORS.NC}`);
    if (issues.length > 0) {
      issues.forEach(i => {
        globalThis.console.log(`    ${i}`);
      });
      saveResult(file, "error", issues.join("\n"));
    } else if (result.status !== 0) {
      globalThis.console.log(`    Command failed with exit code ${result.status}`);
      globalThis.console.log(`    Output: ${output.slice(0, 200)}${output.length > 200 ? "..." : ""}`);
      saveResult(file, "error", output);
    }
  } else if (hasWarning) {
    results.warningCount++;
    results.warningFiles.push(file);
    globalThis.console.log(`${COLORS.YELLOW}⚠️  ${file}${COLORS.NC}`);
    issues.forEach(i => {
      globalThis.console.log(`    ${i}`);
    });
    saveResult(file, "warning", issues.join("\n"));
  } else {
    results.perfectCount++;
    globalThis.console.log(`${COLORS.GREEN}✅ ${file}${COLORS.NC}`);
    saveResult(file, "perfect", "");
  }
  updateCachedMtime(file, getFileMtime(filePath));
}

function processCachedFile(file: string, results: CheckResults): void {
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

function printSummary(results: CheckResults): void {
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
