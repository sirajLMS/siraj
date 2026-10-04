import { spawn } from "node:child_process";
import * as readline from "node:readline/promises";
import { c } from "@/scripts/sonar-interactive-fixer.constants";
import {
  clearScreen,
  type FileIssues,
  generateChatPrompt,
  isTestFile,
  type RunnerMode,
  severityBadge,
  typeBadge,
} from "@/scripts/sonar-interactive-fixer.helpers";

export function launchSession(fileIssues: FileIssues, runner: RunnerMode, isDryRun: boolean): void {
  const { filePath, relatedFiles } = fileIssues;
  const prompt = generateChatPrompt(fileIssues);
  const isTest = isTestFile(filePath);

  const contextFiles = [
    filePath,
    "scripts/health/sub-loop.ts",
    "scripts/sonar-manager.ts",
    ...(isTest ? ["scripts/run-test/run-test.ts"] : []),
    ...relatedFiles,
  ];

  if (runner === "copilot") {
    launchCopilotSession(filePath, prompt, contextFiles, isDryRun);
    return;
  }

  launchVsCodeSession(filePath, prompt, contextFiles, isDryRun);
}

function launchBackgroundSession(
  filePath: string,
  prompt: string,
  command: string,
  args: string[],
  isDryRun: boolean,
  dryRunHeader: string,
  successHeader: string
): void {
  if (isDryRun) {
    console.log(
      `\n${c.yellow}${c.bold}[DRY RUN]${c.reset} ${dryRunHeader}: ${c.cyan}${command} ${args.join(" ")}${c.reset}\n`
    );
    console.log(`${c.gray}Generated Prompt:${c.reset}\n${prompt}\n`);
    return;
  }

  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
  });

  child.unref();

  console.log(`\n${c.green}${c.bold}${successHeader}${c.reset} for ${c.cyan}${c.underline}${filePath}${c.reset}`);
}

function launchCopilotSession(filePath: string, prompt: string, contextFiles: string[], isDryRun: boolean): void {
  // Copilot CLI background execution:
  // Uses non-interactive mode (-p/--prompt) with --yolo and detached background process
  const args = ["-p", prompt, "--yolo", ...contextFiles.flatMap(f => ["--add-dir", f])];
  launchBackgroundSession(
    filePath,
    prompt,
    "copilot",
    args,
    isDryRun,
    "Executing background copilot",
    "🚀 Launched Copilot CLI in background (Yolo Mode)"
  );
}

function launchVsCodeSession(filePath: string, prompt: string, contextFiles: string[], isDryRun: boolean): void {
  // VS Code Insiders Chat:
  // Uses code-insiders chat --mode agent --add-file <path> <prompt>
  const args = ["chat", "--mode", "agent", ...contextFiles.flatMap(f => ["--add-file", f]), prompt];
  launchBackgroundSession(filePath, prompt, "code-insiders", args, isDryRun, "Executing", "🚀 Launched VS Code Chat");
}

// ── Interactive Menu Rendering ──────────────────────────────────────────────

function printHeader(totalIssues: number, totalFiles: number, runner: RunnerMode): void {
  const runnerBadge =
    runner === "copilot"
      ? `${c.brightMagenta}${c.bold}GitHub Copilot CLI${c.reset}`
      : `${c.brightBlue}${c.bold}VS Code Insiders${c.reset}`;

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
    ` ${c.gray}Found ${c.brightYellow}${c.bold}${totalIssues}${c.gray} issues across ${c.brightYellow}${c.bold}${totalFiles}${c.gray} files  |  Runner: ${runnerBadge}${c.reset}\n`
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

function printMenuOptions(fileIssuesList: FileIssues[], runner: RunnerMode): void {
  console.log(`${c.bold}${c.white}Options:${c.reset}`);
  console.log(
    `  ${c.brightGreen}[Enter/f]${c.reset} Launch ${runner === "vscode" ? "VS Code Chat" : "Copilot CLI"} for current file`
  );
  console.log(`  ${c.brightBlue}[r]${c.reset} Toggle runner mode (current: ${runner})`);
  console.log(`  ${c.brightYellow}[n]${c.reset} Next file  |  ${c.brightYellow}[p]${c.reset} Previous file`);
  console.log(`  ${c.brightCyan}[<number>]${c.reset} Select specific file number (1-${fileIssuesList.length})`);
  console.log(`  ${c.brightRed}[q]${c.reset} Quit`);
}

function printCurrentSelection(fileIssuesList: FileIssues[], currentIndex: number): void {
  const currentFile = fileIssuesList[currentIndex];
  if (!currentFile) return;

  console.log(
    `${c.brightMagenta}${c.bold}Current Selection [${currentIndex + 1}/${fileIssuesList.length}]:${c.reset} ` +
      `${c.brightCyan}${c.bold}${currentFile.filePath}${c.reset}`
  );
  printFileIssuesDetail(currentFile);
}

// ── Menu Interaction ────────────────────────────────────────────────────────

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

async function handleLaunchStep(
  rl: readline.Interface,
  currentFile: FileIssues,
  runner: RunnerMode,
  isDryRun: boolean
): Promise<boolean> {
  launchSession(currentFile, runner, isDryRun);
  const nextAns = (
    await rl.question(`\n${c.gray}Press Enter to move to next file, or 'stay' to remain here: ${c.reset}`)
  )
    .trim()
    .toLowerCase();
  return nextAns !== "stay";
}

async function handleMenuAction(
  answer: string,
  rl: readline.Interface,
  currentFile: FileIssues,
  runner: RunnerMode,
  currentIndex: number,
  totalFiles: number,
  isDryRun: boolean
): Promise<{ newIndex: number; newRunner: RunnerMode; shouldBreak: boolean }> {
  if (answer === "q") {
    console.log(`\n${c.gray}Exiting interactive fixer. Goodbye!${c.reset}\n`);
    return { newIndex: currentIndex, newRunner: runner, shouldBreak: true };
  }

  if (answer === "r") {
    const nextRunner = runner === "vscode" ? "copilot" : "vscode";
    return { newIndex: currentIndex, newRunner: nextRunner, shouldBreak: false };
  }

  if (answer === "" || answer === "f" || answer === "launch") {
    const shouldAdvance = await handleLaunchStep(rl, currentFile, runner, isDryRun);
    return {
      newIndex: shouldAdvance ? currentIndex + 1 : currentIndex,
      newRunner: runner,
      shouldBreak: false,
    };
  }

  const nav = handleNavChoice(answer, currentIndex, totalFiles);
  return { newIndex: nav.handeled ? nav.newIndex : currentIndex, newRunner: runner, shouldBreak: false };
}

async function runMenuStep(
  rl: readline.Interface,
  fileIssuesList: FileIssues[],
  currentIndex: number,
  runner: RunnerMode,
  isDryRun: boolean
): Promise<void> {
  if (currentIndex >= fileIssuesList.length) {
    clearScreen();
    console.log(`\n${c.brightGreen}${c.bold}🎉 All files processed!${c.reset}\n`);
    return;
  }

  clearScreen();
  const totalIssues = fileIssuesList.reduce((acc, f) => acc + f.issues.length, 0);
  printHeader(totalIssues, fileIssuesList.length, runner);
  printFileSummary(fileIssuesList);

  printCurrentSelection(fileIssuesList, currentIndex);
  printMenuOptions(fileIssuesList, runner);

  const answer = (await rl.question(`\n${c.bold}${c.brightGreen}Action > ${c.reset}`)).trim().toLowerCase();

  const currentFile = fileIssuesList[currentIndex];
  if (!currentFile) return;

  const result = await handleMenuAction(answer, rl, currentFile, runner, currentIndex, fileIssuesList.length, isDryRun);

  if (result.shouldBreak) return;
  return runMenuStep(rl, fileIssuesList, result.newIndex, result.newRunner, isDryRun);
}

export async function interactiveMenu(
  fileIssuesList: FileIssues[],
  initialRunner: RunnerMode,
  isDryRun: boolean
): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    await runMenuStep(rl, fileIssuesList, 0, initialRunner, isDryRun);
  } finally {
    rl.close();
  }
}
