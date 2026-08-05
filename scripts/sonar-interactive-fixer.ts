#!/usr/bin/env bun

/**
 * Interactive SonarQube Issue Fixer
 *
 * Reads .scannerwork/sonar-result.json and provides a rich, interactive CLI
 * to inspect SonarQube issues per file and launch VS Code chat prompts.
 *
 * Usage:
 *   bun run scripts/sonar-interactive-fixer.ts
 *   bun run scripts/sonar-interactive-fixer.ts --dry-run
 */

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as readline from "node:readline/promises";
import { logger } from "@/backend/lib/logger";

interface SonarIssue {
  key: string;
  rule: string;
  severity: string;
  component: string;
  line?: number;
  message: string;
  status: string;
  type: string;
}

interface SonarResult {
  issues: SonarIssue[];
}

interface FileIssues {
  filePath: string;
  relatedFiles: string[];
  issues: SonarIssue[];
}

const SONAR_RESULT_PATH = ".scannerwork/sonar-result.json";
const PROJECT_ROOT = process.cwd();

// --- ANSI Colors & Utilities ---
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",

  // Foreground Colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",
  gray: "\x1b[90m",

  // Background Colors
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgCyan: "\x1b[46m",
};

function severityBadge(severity?: string): string {
  const sev = (severity ?? "UNKNOWN").toUpperCase();
  switch (sev) {
    case "BLOCKER":
      return `${c.bgRed}${c.brightWhite}${c.bold} BLOCKER ${c.reset}`;
    case "CRITICAL":
      return `${c.red}${c.bold}CRITICAL${c.reset}`;
    case "MAJOR":
      return `${c.yellow}${c.bold}MAJOR${c.reset}`;
    case "MINOR":
      return `${c.blue}MINOR${c.reset}`;
    case "INFO":
      return `${c.cyan}INFO${c.reset}`;
    default:
      return `${c.gray}${sev}${c.reset}`;
  }
}

function typeBadge(type?: string): string {
  const t = (type ?? "UNKNOWN").toUpperCase();
  switch (t) {
    case "BUG":
      return `${c.brightRed}🐛 BUG${c.reset}`;
    case "VULNERABILITY":
      return `${c.brightMagenta}🛡️ VULNERABILITY${c.reset}`;
    case "CODE_SMELL":
      return `${c.yellow}☣️ CODE SMELL${c.reset}`;
    default:
      return `${c.gray}${t}${c.reset}`;
  }
}

function clearScreen(): void {
  process.stdout.write("\x1Bc");
}

/**
 * Load and parse sonar-result.json
 */
function loadSonarResults(): SonarResult | null {
  const fullPath = join(PROJECT_ROOT, SONAR_RESULT_PATH);

  if (!existsSync(fullPath)) {
    logger.error(`SonarQube result file not found: ${fullPath}`);
    console.log(
      `\n${c.red}${c.bold}✖ Error:${c.reset} SonarQube result file not found at ${c.cyan}${fullPath}${c.reset}`
    );
    console.log(`${c.yellow}💡 Hint:${c.reset} Run ${c.bold}bun sonar-scan${c.reset} first to generate results.\n`);
    return null;
  }

  try {
    const content = readFileSync(fullPath, "utf-8");
    return JSON.parse(content) as SonarResult;
  } catch (error) {
    logger.error("Failed to parse sonar-result.json", { error });
    console.log(`\n${c.red}${c.bold}✖ Error:${c.reset} Failed to parse ${c.cyan}${SONAR_RESULT_PATH}${c.reset}\n`);
    return null;
  }
}

/**
 * Group issues by file path
 */
function groupIssuesByFile(result: SonarResult): Map<string, SonarIssue[]> {
  const fileIssuesMap = new Map<string, SonarIssue[]>();

  for (const issue of result.issues) {
    const filePath = issue.component;

    let issues = fileIssuesMap.get(filePath);
    if (!issues) {
      issues = [];
      fileIssuesMap.set(filePath, issues);
    }

    issues.push(issue);
  }

  return fileIssuesMap;
}

function findRelatedFiles(_filePath: string): string[] {
  return [];
}

function generateChatPrompt(fileIssues: FileIssues): string {
  const { filePath, issues } = fileIssues;

  const issuesJsonStr = JSON.stringify(
    issues.map((i) => ({
      key: i.key,
      rule: i.rule,
      severity: i.severity,
      line: i.line,
      message: i.message,
      type: i.type,
    })),
    null,
    2
  );

  return [
    `Please fix all SonarQube issues in file '${filePath}'.`,
    ``,
    `Target File: ${filePath}`,
    ``,
    `Issues to resolve (from SonarQube results):`,
    `\`\`\`json`,
    issuesJsonStr,
    `\`\`\``,
    ``,
    `Workflow & Verification Instructions:`,
    `1. Fix the issues in '${filePath}' according to the rules and messages listed above.`,
    `2. Run the sub-loop verification script to ensure progressive quality checks pass (tsgo -> biome -> lint -> codescene):`,
    `   bun run scripts/health/sub-loop.ts ${filePath} --lifecycle codescene`,
    `3. Once verification passes clean, clear the resolved file entries from Sonar results using sonar-manager:`,
    `   bun scripts/sonar-manager.ts delete --file ${filePath}`,
  ].join("\n");
}

function runVSCodeCommand(fileIssues: FileIssues, isDryRun: boolean): void {
  const { filePath, relatedFiles } = fileIssues;
  const prompt = generateChatPrompt(fileIssues);

  const addFileFlags = [
    filePath,
    "scripts/health/sub-loop.ts",
    "scripts/sonar-manager.ts",
    ...relatedFiles,
  ];

  const args = [
    "chat",
    "--mode",
    "agent",
    ...addFileFlags.flatMap((f) => ["--add-file", f]),
    prompt,
  ];

  if (isDryRun) {
    console.log(
      `\n${c.yellow}${c.bold}[DRY RUN]${c.reset} Executing: ${c.cyan}code-insiders ${args.join(" ")}${c.reset}\n`
    );
    console.log(`${c.gray}Generated Prompt:${c.reset}\n${prompt}\n`);
    return;
  }

  const child = spawn("code-insiders", args, {
    detached: true,
    stdio: "ignore",
  });

  child.unref();

  console.log(
    `\n${c.green}${c.bold}🚀 Launched VS Code Chat${c.reset} for ${c.cyan}${c.underline}${filePath}${c.reset}`
  );
}

function printHeader(totalIssues: number, totalFiles: number): void {
  console.log(
    `${c.brightCyan}${c.bold}┌──────────────────────────────────────────────────────────────────────────┐${c.reset}`
  );
  console.log(
    `${c.brightCyan}${c.bold}│                🔍 Interactive SonarQube Issue Fixer                      │${c.reset}`
  );
  console.log(
    `${c.brightCyan}${c.bold}└──────────────────────────────────────────────────────────────────────────┘${c.reset}`
  );
  console.log(
    ` ${c.gray}Found ${c.brightYellow}${c.bold}${totalIssues}${c.gray} issues across ${c.brightYellow}${c.bold}${totalFiles}${c.gray} files${c.reset}\n`
  );
}

function printFileSummary(fileIssuesList: FileIssues[]): void {
  console.log(`${c.bold}${c.white}FileList Summary:${c.reset}`);
  fileIssuesList.forEach((item, index) => {
    const numIssues = item.issues.length;
    const issueBadge =
      numIssues > 5
        ? `${c.brightRed}${c.bold}${numIssues} issues${c.reset}`
        : `${c.yellow}${numIssues} issues${c.reset}`;

    // Severity breakdown
    const blockers = item.issues.filter(i => i.severity.toUpperCase() === "BLOCKER").length;
    const criticals = item.issues.filter(i => i.severity.toUpperCase() === "CRITICAL").length;
    const majors = item.issues.filter(i => i.severity.toUpperCase() === "MAJOR").length;

    let sevSummary = "";
    if (blockers > 0) sevSummary += ` ${c.bgRed}${c.brightWhite} ${blockers} B ${c.reset}`;
    if (criticals > 0) sevSummary += ` ${c.red} ${criticals} C${c.reset}`;
    if (majors > 0) sevSummary += ` ${c.yellow} ${majors} M${c.reset}`;

    console.log(
      `  ${c.gray}[${(index + 1).toString().padStart(2, " ")}]${c.reset} ` +
        `${c.brightCyan}${item.filePath}${c.reset} (${issueBadge})${sevSummary}`
    );
  });
  console.log("");
}

function printFileIssuesDetail(fileIssue: FileIssues): void {
  console.log(
    `\n${c.brightWhite}${c.bold}--- File: ${c.cyan}${fileIssue.filePath}${c.brightWhite} (${fileIssue.issues.length} issues) ---${c.reset}`
  );
  fileIssue.issues.forEach((issue, i) => {
    const lineStr = issue.line ? `${c.gray}L${issue.line}:${c.reset} ` : "";
    console.log(
      `  ${c.gray}${i + 1}.${c.reset} ${severityBadge(issue.severity)} ${typeBadge(issue.type)} ${lineStr}${c.white}${issue.message}${c.reset}`
    );
    console.log(`     ${c.gray}Rule: ${issue.rule} | Key: ${issue.key}${c.reset}`);
  });
  console.log("");
}

function handleNavChoice(
  answer: string,
  currentIndex: number,
  totalFiles: number
): { newIndex: number; handeled: boolean } {
  if (answer === "n") {
    return { newIndex: Math.min(currentIndex + 1, totalFiles - 1), handeled: true };
  }
  if (answer === "p") {
    return { newIndex: Math.max(currentIndex - 1, 0), handeled: true };
  }
  const num = parseInt(answer, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= totalFiles) {
    return { newIndex: num - 1, handeled: true };
  }
  return { newIndex: currentIndex, handeled: false };
}

async function interactiveMenu(fileIssuesList: FileIssues[], isDryRun: boolean): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let currentIndex = 0;

  try {
    while (currentIndex < fileIssuesList.length) {
      clearScreen();
      const totalIssues = fileIssuesList.reduce((acc, f) => acc + f.issues.length, 0);
      printHeader(totalIssues, fileIssuesList.length);
      printFileSummary(fileIssuesList);

      const currentFile = fileIssuesList[currentIndex];
      if (!currentFile) break;

      console.log(
        `${c.brightMagenta}${c.bold}Current Selection [${currentIndex + 1}/${fileIssuesList.length}]:${c.reset} ` +
          `${c.brightCyan}${c.bold}${currentFile.filePath}${c.reset}`
      );
      printFileIssuesDetail(currentFile);

      console.log(`${c.bold}${c.white}Options:${c.reset}`);
      console.log(`  ${c.brightGreen}[Enter/f]${c.reset} Launch VS Code Chat for current file`);
      console.log(`  ${c.brightYellow}[n]${c.reset} Next file  |  ${c.brightYellow}[p]${c.reset} Previous file`);
      console.log(`  ${c.brightCyan}[<number>]${c.reset} Select specific file number (1-${fileIssuesList.length})`);
      console.log(`  ${c.brightRed}[q]${c.reset} Quit`);

      const answer = (await rl.question(`\n${c.bold}${c.brightGreen}Action > ${c.reset}`)).trim().toLowerCase();

      if (answer === "q") {
        console.log(`\n${c.gray}Exiting interactive fixer. Goodbye!${c.reset}\n`);
        break;
      }

      if (answer === "" || answer === "f" || answer === "launch") {
        runVSCodeCommand(currentFile, isDryRun);
        const nextAns = (
          await rl.question(`\n${c.gray}Press Enter to move to next file, or 'stay' to remain here: ${c.reset}`)
        )
          .trim()
          .toLowerCase();
        if (nextAns !== "stay") {
          currentIndex++;
        }
        continue;
      }

      const nav = handleNavChoice(answer, currentIndex, fileIssuesList.length);
      if (nav.handeled) {
        currentIndex = nav.newIndex;
      }
    }

    if (currentIndex >= fileIssuesList.length) {
      clearScreen();
      console.log(`\n${c.brightGreen}${c.bold}🎉 All files processed!${c.reset}\n`);
    }
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const isDryRun = process.argv.includes("--dry-run");

  const sonarResult = loadSonarResults();
  if (!sonarResult) {
    process.exit(1);
  }

  const fileIssuesMap = groupIssuesByFile(sonarResult);

  if (fileIssuesMap.size === 0) {
    console.log(`\n${c.brightGreen}${c.bold}✨ No issues found in ${SONAR_RESULT_PATH}! Great job!${c.reset}\n`);
    process.exit(0);
  }

  const fileIssuesList: FileIssues[] = Array.from(fileIssuesMap.entries())
    .map(([filePath, issues]) => ({
      filePath,
      relatedFiles: findRelatedFiles(filePath),
      issues,
    }))
    .sort((a, b) => b.issues.length - a.issues.length);

  await interactiveMenu(fileIssuesList, isDryRun);
}

if (import.meta.main) {
  main().catch(error => {
    logger.error("Fatal error in sonar-interactive-fixer", { error });
    console.error(`\n${c.red}${c.bold}Fatal Error:${c.reset}`, error);
    process.exit(1);
  });
}
