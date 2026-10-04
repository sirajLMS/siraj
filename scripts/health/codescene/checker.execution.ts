import fs from "node:fs";
import { join } from "node:path";
import { getFileMtime, saveResult, updateCachedMtime } from "@/scripts/health/codescene/cache";
import {
  type CheckResults,
  handleFileErrorResult,
  handleFilePerfectResult,
  handleFileWarningResult,
} from "@/scripts/health/codescene/checker.results";
import { COLORS, logError, PROJECT_ROOT, resolveCodesceneBin } from "@/scripts/health/codescene/config";

export function getTsConfigIgnores(): string[] {
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
  } catch (error: unknown) {
    logError(`Failed to parse tsconfig.json: ${error instanceof Error ? error.message : String(error)}`);
  }
  return [];
}

// Concurrency pool handler
export async function pool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  const workerCount = Math.min(concurrency, items.length);
  if (workerCount === 0) {
    return;
  }

  let nextIndex = 0;
  const schedule = async (): Promise<void> => {
    const index = nextIndex;
    nextIndex += 1;
    if (index >= items.length) {
      return undefined;
    }
    await fn(items[index]);
    return schedule();
  };

  await Promise.all(Array.from({ length: workerCount }, () => schedule()));
}

function isLicenseOrNetworkError(output: string, errorMsg: string): boolean {
  const combined = `${output} ${errorMsg}`;
  return /GOAWAY|License check failed|java\.io\.IOException|socket closed|ECONNRESET|ETIMEDOUT/i.test(combined);
}

async function runSingleCodeSceneExecution(
  csBin: string,
  file: string
): Promise<{ output: string; exitCode: number; errorMsg: string }> {
  let output = "";
  let exitCode: number;
  let errorMsg = "";

  try {
    if (typeof Bun === "undefined") {
      const { spawn } = await import("node:child_process");
      const proc = spawn(csBin, ["check", file], {
        cwd: PROJECT_ROOT,
        env: { ...process.env, CS_DISABLE_VERSION_CHECK: "true" },
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      proc.stdout.on("data", data => stdoutChunks.push(data));
      proc.stderr.on("data", data => stderrChunks.push(data));

      exitCode = await new Promise<number>(resolve => {
        proc.on("close", (code: number) => resolve(code));
        proc.on("error", (err: Error) => {
          errorMsg = err.message;
          resolve(1);
        });
      });

      output = Buffer.concat(stdoutChunks).toString() + Buffer.concat(stderrChunks).toString();
    } else {
      const proc = Bun.spawn([csBin, "check", file], {
        cwd: PROJECT_ROOT,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, CS_DISABLE_VERSION_CHECK: "true" },
      });
      output = await new Response(proc.stdout).text();
      const stderrOutput = await new Response(proc.stderr).text();
      output += stderrOutput;
      exitCode = await proc.exited;
    }
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : String(err);
    exitCode = 1;
  }

  return { output, exitCode, errorMsg };
}

async function executeCodeScene(
  csBin: string,
  file: string,
  maxRetries = 3,
  attempt = 1
): Promise<{ output: string; exitCode: number; errorMsg: string }> {
  const result = await runSingleCodeSceneExecution(csBin, file);
  if (isLicenseOrNetworkError(result.output, result.errorMsg) && attempt < maxRetries) {
    await new Promise(res => setTimeout(res, attempt * 400));
    return executeCodeScene(csBin, file, maxRetries, attempt + 1);
  }
  return result;
}

export function parseCodeSceneIssues(output: string): string[] {
  const lines = output
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  return lines.filter(line => {
    const isScoreLine = /info:.*Code health score:/i.test(line);
    if (isScoreLine) return false;
    return (
      /^(warn|error|info|arn|err|nfo):/i.test(line) ||
      line.includes("License check failed") ||
      line.includes("unauthorized")
    );
  });
}

export async function processChangedFile(file: string, results: CheckResults): Promise<void> {
  const filePath = join(PROJECT_ROOT, file);
  const csBin = resolveCodesceneBin();

  const { output, exitCode, errorMsg } = await executeCodeScene(csBin, file);

  if (errorMsg) {
    results.errorCount++;
    results.errorFiles.push(file);
    globalThis.console.log(`${COLORS.RED}❌ ${file}${COLORS.NC}`);
    globalThis.console.log(`    Failed to run CodeScene CLI: ${errorMsg}`);
    saveResult(file, "error", errorMsg);
    return;
  }

  const issues = parseCodeSceneIssues(output);
  const hasError = exitCode !== 0 || issues.some(i => /^(error|err|license|unauthorized)/i.test(i));
  const hasWarning = issues.some(i => /^(warn|arn|info|nfo)/i.test(i));
  const isLicenseError = isLicenseOrNetworkError(output, errorMsg);

  if (hasError) {
    handleFileErrorResult(file, results, issues, exitCode, output, isLicenseError);
  } else if (hasWarning) {
    handleFileWarningResult(file, results, issues);
  } else {
    handleFilePerfectResult(file, results);
  }

  if (!isLicenseError) {
    updateCachedMtime(file, getFileMtime(filePath));
  }
}
